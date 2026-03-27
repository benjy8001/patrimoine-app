<?php

namespace App\Services;

use App\Models\AssetCategory;
use App\Models\AssetValuation;
use App\Models\Platform;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ImportService
{
    private const STATUS_MAP = [
        'active'     => 'active',
        'actif'      => 'active',
        'closed'     => 'closed',
        'clôturé'    => 'closed',
        'cloture'    => 'closed',
        'clôture'    => 'closed',
        'pending'    => 'pending',
        'en attente' => 'pending',
    ];

    private const EXPECTED_HEADERS = [
        'Nom', 'Catégorie', 'Plateforme', 'Devise', 'Valeur actuelle',
        'Capital investi', 'P/L', 'P/L %', 'Rendement estimé',
        'Date acquisition', 'Statut', 'Dernière MAJ', 'Type',
    ];

    public function preview(UploadedFile $file, User $user): array
    {
        [$rows, $parseError] = $this->parseFile($file);

        if ($parseError) {
            return ['error' => $parseError];
        }

        $categoryMaps = $this->buildCategoryMaps();
        $platformMap  = $this->buildPlatformMap($user);

        $parsedRows          = [];
        $errors              = [];
        $willCreatePlatforms = [];

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2; // +1 for header, +1 for 1-based
            $result = $this->parseRow($row, $rowNumber, $categoryMaps, $platformMap);

            if ($result['platform_to_create'] && !in_array($result['platform_to_create'], $willCreatePlatforms)) {
                $willCreatePlatforms[] = $result['platform_to_create'];
            }

            $parsedRows[] = [
                'row'      => $rowNumber,
                'is_valid' => empty($result['errors']),
                'data'     => $result['data'],
                'errors'   => $result['errors'],
                'warnings' => $result['warnings'],
            ];

            foreach ($result['errors'] as $message) {
                $errors[] = [
                    'row'     => $rowNumber,
                    'field'   => $result['error_field'] ?? '',
                    'message' => $message,
                ];
            }
        }

        $validRows = count(array_filter($parsedRows, fn($r) => $r['is_valid']));

        return [
            'total_rows'            => count($parsedRows),
            'valid_rows'            => $validRows,
            'error_rows'            => count($parsedRows) - $validRows,
            'will_create_platforms' => $willCreatePlatforms,
            'rows'                  => $parsedRows,
            'errors'                => $errors,
        ];
    }

    public function import(UploadedFile $file, User $user): array
    {
        [$rows, $parseError] = $this->parseFile($file);

        if ($parseError) {
            abort(422, $parseError);
        }

        $categoryMaps    = $this->buildCategoryMaps();
        $platformMap     = $this->buildPlatformMap($user);
        $importedCount   = 0;
        $skippedCount    = 0;
        $createdPlatforms = [];

        DB::transaction(function () use (
            $rows, $user, $categoryMaps, &$platformMap,
            &$importedCount, &$skippedCount, &$createdPlatforms
        ) {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2;
                $result = $this->parseRow($row, $rowNumber, $categoryMaps, $platformMap);

                if (!empty($result['errors'])) {
                    $skippedCount++;
                    continue;
                }

                $data = $result['data'];

                // Auto-create platform if needed
                if ($result['platform_to_create']) {
                    $platformName = $result['platform_to_create'];
                    $platform = Platform::firstOrCreate(
                        ['user_id' => $user->id, 'name' => $platformName],
                        ['is_active' => true]
                    );
                    $platformMap[mb_strtolower($platformName)] = $platform->id;
                    $data['platform_id'] = $platform->id;

                    if (!in_array($platformName, $createdPlatforms)) {
                        $createdPlatforms[] = $platformName;
                    }
                }

                $asset = $user->assets()->create(
                    array_diff_key($data, array_flip(['category_name', 'platform_name']))
                );

                if ($asset->current_value > 0) {
                    AssetValuation::create([
                        'asset_id'    => $asset->id,
                        'value'       => $asset->current_value,
                        'currency'    => $asset->currency,
                        'recorded_at' => $asset->acquisition_date ?? now(),
                        'source'      => 'import',
                        'notes'       => 'Valeur initiale (import CSV)',
                    ]);
                }

                $importedCount++;
            }
        });

        return [
            'imported'          => $importedCount,
            'skipped'           => $skippedCount,
            'created_platforms' => $createdPlatforms,
            'message'           => "{$importedCount} actif(s) importé(s) avec succès.",
        ];
    }

    private function parseFile(UploadedFile $file): array
    {
        $content = file_get_contents($file->getRealPath());

        // Strip UTF-8 BOM
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            $content = substr($content, 3);
        }

        $handle = fopen('php://temp', 'r+');
        fwrite($handle, $content);
        rewind($handle);

        $header = fgetcsv($handle, 0, ';');

        if (!$header) {
            fclose($handle);
            return [[], 'Le fichier CSV est vide ou illisible.'];
        }

        // Normalize header (trim whitespace)
        $header = array_map('trim', $header);

        // Validate that at minimum the required columns are present
        $requiredHeaders = ['Nom', 'Catégorie', 'Valeur actuelle'];
        foreach ($requiredHeaders as $required) {
            if (!in_array($required, $header)) {
                fclose($handle);
                return [[], "En-tête CSV invalide : colonne \"{$required}\" manquante."];
            }
        }

        $rows = [];
        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            if (count(array_filter($row, fn($v) => trim($v) !== '')) === 0) {
                continue; // skip empty rows
            }
            $rows[] = array_combine($header, array_pad($row, count($header), ''));
        }

        fclose($handle);

        return [$rows, null];
    }

    private function parseRow(array $row, int $rowNumber, array $categoryMaps, array $platformMap): array
    {
        $errors       = [];
        $errorField   = '';
        $warnings     = [];
        $platformToCreate = null;
        $data         = [];

        // Nom (required)
        $nom = trim($row['Nom'] ?? '');
        if ($nom === '') {
            $errors[] = "Ligne {$rowNumber} — Nom : champ requis";
            $errorField = 'Nom';
        } elseif (mb_strlen($nom) > 255) {
            $errors[] = "Ligne {$rowNumber} — Nom : trop long (max 255 caractères)";
            $errorField = 'Nom';
        } else {
            $data['name'] = $nom;
        }

        // Catégorie (required)
        $categorieRaw = trim($row['Catégorie'] ?? '');
        $categoryId   = $this->resolveCategory($categorieRaw, $categoryMaps);
        if ($categoryId === null) {
            $errors[] = "Ligne {$rowNumber} — Catégorie : \"{$categorieRaw}\" inconnue";
            $errorField = 'Catégorie';
        } else {
            $data['asset_category_id'] = $categoryId;
            $data['category_name']     = $categorieRaw;
        }

        // Plateforme (optional)
        $plateformeRaw = trim($row['Plateforme'] ?? '');
        if ($plateformeRaw !== '') {
            $platformId = $platformMap[mb_strtolower($plateformeRaw)] ?? null;
            if ($platformId !== null) {
                $data['platform_id']   = $platformId;
                $data['platform_name'] = $plateformeRaw;
            } else {
                $platformToCreate      = $plateformeRaw;
                $data['platform_name'] = $plateformeRaw;
                $warnings[] = "La plateforme \"{$plateformeRaw}\" sera créée automatiquement.";
                // platform_id will be set after creation in import()
            }
        }

        // Devise (optional, default EUR)
        $devise = strtoupper(trim($row['Devise'] ?? ''));
        if ($devise === '') {
            $devise = 'EUR';
        } elseif (mb_strlen($devise) !== 3) {
            $errors[] = "Ligne {$rowNumber} — Devise : doit être un code ISO à 3 lettres (ex: EUR, USD)";
            $errorField = 'Devise';
        }
        $data['currency'] = $devise;

        // Valeur actuelle (required)
        $valeurRaw = str_replace(',', '.', trim($row['Valeur actuelle'] ?? ''));
        if ($valeurRaw === '') {
            $errors[] = "Ligne {$rowNumber} — Valeur actuelle : champ requis";
            $errorField = 'Valeur actuelle';
        } elseif (!is_numeric($valeurRaw) || (float) $valeurRaw < 0) {
            $errors[] = "Ligne {$rowNumber} — Valeur actuelle : doit être un nombre positif ou nul";
            $errorField = 'Valeur actuelle';
        } else {
            $data['current_value'] = (float) $valeurRaw;
        }

        // Capital investi (optional)
        $capitalRaw = str_replace(',', '.', trim($row['Capital investi'] ?? ''));
        if ($capitalRaw !== '' && $capitalRaw !== '-') {
            if (!is_numeric($capitalRaw)) {
                $errors[] = "Ligne {$rowNumber} — Capital investi : doit être un nombre";
                $errorField = 'Capital investi';
            } else {
                $data['initial_value'] = (float) $capitalRaw;
            }
        }

        // Rendement estimé (optional)
        $rendementRaw = str_replace(',', '.', trim($row['Rendement estimé'] ?? ''));
        if ($rendementRaw !== '') {
            if (!is_numeric($rendementRaw)) {
                $errors[] = "Ligne {$rowNumber} — Rendement estimé : doit être un nombre";
                $errorField = 'Rendement estimé';
            } else {
                $data['estimated_yield'] = (float) $rendementRaw;
            }
        }

        // Date acquisition (optional, DD/MM/YYYY)
        $dateRaw = trim($row['Date acquisition'] ?? '');
        if ($dateRaw !== '') {
            $date = \DateTime::createFromFormat('d/m/Y', $dateRaw);
            if (!$date || $date->format('d/m/Y') !== $dateRaw) {
                $errors[] = "Ligne {$rowNumber} — Date acquisition : format invalide (attendu JJ/MM/AAAA)";
                $errorField = 'Date acquisition';
            } else {
                $data['acquisition_date'] = $date->format('Y-m-d');
            }
        }

        // Statut (optional, default active)
        $statutRaw = mb_strtolower(trim($row['Statut'] ?? ''));
        $statut = self::STATUS_MAP[$statutRaw] ?? null;
        if ($statutRaw !== '' && $statut === null) {
            $errors[] = "Ligne {$rowNumber} — Statut : valeur invalide (actif, clôturé, en attente)";
            $errorField = 'Statut';
        } else {
            $data['status'] = $statut ?? 'active';
        }

        // Type → is_liability (optional, default false)
        $typeRaw = mb_strtolower(trim($row['Type'] ?? ''));
        $data['is_liability'] = in_array($typeRaw, ['passif', 'liability']) ? true : false;

        // Notes (optional, may not be in all CSVs)
        $notes = trim($row['Notes'] ?? '');
        if ($notes !== '') {
            $data['notes'] = $notes;
        }

        return [
            'data'               => $data,
            'errors'             => $errors,
            'error_field'        => $errorField,
            'warnings'           => $warnings,
            'platform_to_create' => $platformToCreate,
        ];
    }

    private function buildCategoryMaps(): array
    {
        $slugMap = [];
        $nameMap = [];

        AssetCategory::all()->each(function ($cat) use (&$slugMap, &$nameMap) {
            $slugMap[$cat->slug]                         = $cat->id;
            $nameMap[mb_strtolower($cat->name)]          = $cat->id;
        });

        return ['slug' => $slugMap, 'name' => $nameMap];
    }

    private function buildPlatformMap(User $user): array
    {
        return $user->platforms()->pluck('id', 'name')
            ->mapWithKeys(fn($id, $name) => [mb_strtolower($name) => $id])
            ->toArray();
    }

    private function resolveCategory(string $value, array $maps): ?int
    {
        if ($value === '') {
            return null;
        }

        $lower = mb_strtolower($value);

        return $maps['slug'][$lower]
            ?? $maps['name'][$lower]
            ?? null;
    }
}
