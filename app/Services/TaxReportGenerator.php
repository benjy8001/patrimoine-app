<?php

namespace App\Services;

use App\Models\IncomeEntry;
use App\Models\TaxReport;
use App\Models\User;
use Illuminate\Support\Collection;

class TaxReportGenerator
{
    private const TAX_LINE_MAPPING = [
        'interest'     => ['box' => '2TR', 'label' => 'Intérêts et autres produits de placement à revenu fixe'],
        'dividend'     => ['box' => '2DC', 'label' => 'Dividendes et distributions'],
        'rental'       => ['box' => '4BE', 'label' => 'Revenus fonciers bruts (micro-foncier)'],
        'capital_gain' => ['box' => '3VG', 'label' => 'Plus-values de cession de valeurs mobilières'],
        'crypto'       => ['box' => '3AN', 'label' => "Cessions d'actifs numériques (crypto)"],
        'crowdlending' => ['box' => '2TR', 'label' => 'Intérêts crowdlending', 'note' => 'À ajouter à la case 2TR si elle existe déjà'],
        'scpi'         => ['box' => '4L', 'label' => 'Revenus fonciers SCPI'],
    ];

    public function generate(User $user, int $fiscalYear): TaxReport
    {
        $entries = $user->incomeEntries()
            ->where('fiscal_year', $fiscalYear)
            ->with('asset')
            ->orderBy('received_at')
            ->get();

        $byType = $entries
            ->groupBy('income_type')
            ->map(fn(Collection $group) => [
                'count'       => $group->count(),
                'total'       => round($group->sum('amount'), 2),
                'taxable'     => round($group->where('is_taxable', true)->sum('amount'), 2),
                'non_taxable' => round($group->where('is_taxable', false)->sum('amount'), 2),
                'entries'     => $group->map(fn($e) => [
                    'id'           => $e->id,
                    'asset_name'   => $e->asset?->name ?? 'N/A',
                    'income_type'  => $e->income_type,
                    'label'        => IncomeEntry::incomeTypeLabel($e->income_type),
                    'amount'       => (float) $e->amount,
                    'currency'     => $e->currency,
                    'received_at'  => $e->received_at?->format('Y-m-d'),
                    'is_taxable'   => $e->is_taxable,
                    'tax_category' => $e->tax_category,
                    'notes'        => $e->notes,
                ])->values(),
            ]);

        $data = [
            'fiscal_year'   => $fiscalYear,
            'user_name'     => $user->name,
            'generated_at'  => now()->toIso8601String(),
            'disclaimer'    => 'Ce document est une aide à la préparation de votre déclaration fiscale. Il ne remplace pas les conseils d\'un expert-comptable ou d\'un fiscaliste. Vérifiez les montants avec vos relevés officiels.',
            'summary'       => [
                'total_income'  => round($entries->sum('amount'), 2),
                'total_taxable' => round($entries->where('is_taxable', true)->sum('amount'), 2),
                'by_type'       => $byType,
            ],
            'tax_lines'     => $this->buildTaxLines($entries),
            'entries_count' => $entries->count(),
        ];

        return TaxReport::updateOrCreate(
            ['user_id' => $user->id, 'fiscal_year' => $fiscalYear],
            [
                'status'       => 'draft',
                'data'         => $data,
                'generated_at' => now(),
            ]
        );
    }

    private function buildTaxLines(Collection $entries): array
    {
        $taxableEntries = $entries->where('is_taxable', true);
        $lines = [];

        foreach (self::TAX_LINE_MAPPING as $incomeType => $lineConfig) {
            $filtered = $taxableEntries->where('income_type', $incomeType);

            if ($filtered->isEmpty()) {
                continue;
            }

            $line = [
                'box'    => $lineConfig['box'],
                'label'  => $lineConfig['label'],
                'amount' => round($filtered->sum('amount'), 2),
            ];

            if (isset($lineConfig['note'])) {
                $line['note'] = $lineConfig['note'];
            }

            $lines[] = $line;
        }

        return $lines;
    }
}
