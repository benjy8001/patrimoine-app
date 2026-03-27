<?php

namespace App\Services;

use App\Exports\AssetsExport;
use App\Models\Asset;
use App\Models\IncomeEntry;
use App\Models\TaxReport;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportService
{
    // ----------------------------------------------------------------
    // CSV Exports
    // ----------------------------------------------------------------

    public function exportAssetsAsCsv(User $user): string
    {
        $assets = $user->assets()
            ->with(['category', 'platform'])
            ->orderBy('is_liability')
            ->orderBy('asset_category_id')
            ->get();

        $headers = ['Nom', 'Catégorie', 'Plateforme', 'Devise', 'Valeur actuelle', 'Capital investi', 'P/L', 'P/L %', 'Rendement estimé', 'Date acquisition', 'Statut', 'Dernière MAJ', 'Type'];

        $rows = $assets->map(function (Asset $asset) {
            $pl    = $asset->gainLoss();
            $plPct = $asset->gainLossPercent();
            return [
                $asset->name,
                $asset->category?->name ?? '',
                $asset->platform?->name ?? '',
                $asset->currency,
                number_format((float)$asset->current_value, 2, '.', ''),
                $asset->initial_value ? number_format((float)$asset->initial_value, 2, '.', '') : '',
                number_format($pl, 2, '.', ''),
                number_format($plPct, 2, '.', ''),
                $asset->estimated_yield ? number_format((float)$asset->estimated_yield, 2, '.', '') : '',
                $asset->acquisition_date?->format('d/m/Y') ?? '',
                $asset->status,
                $asset->last_updated_at?->format('d/m/Y') ?? '',
                $asset->is_liability ? 'Passif' : 'Actif',
            ];
        });

        return $this->buildCsvContent($headers, $rows);
    }

    public function exportIncomeAsCsv(User $user, int $year): string
    {
        $entries = $user->incomeEntries()
            ->where('fiscal_year', $year)
            ->with('asset')
            ->orderBy('received_at')
            ->get();

        $headers = ['Actif', 'Type de revenu', 'Montant', 'Devise', 'Année fiscale', 'Date réception', 'Imposable', 'Case fiscale', 'Notes'];

        $rows = $entries->map(fn(IncomeEntry $e) => [
            $e->asset?->name ?? 'N/A',
            IncomeEntry::incomeTypeLabel($e->income_type),
            number_format((float)$e->amount, 2, '.', ''),
            $e->currency,
            $e->fiscal_year,
            $e->received_at?->format('d/m/Y') ?? '',
            $e->is_taxable ? 'Oui' : 'Non',
            $e->tax_category ?? '',
            $e->notes ?? '',
        ]);

        return $this->buildCsvContent($headers, $rows);
    }

    public function exportTaxReportAsCsv(TaxReport $report): string
    {
        $data = $report->data ?? [];
        $headers = ['Case fiscale', 'Description', 'Montant (€)', 'Note'];
        $rows = collect($data['tax_lines'] ?? [])->map(fn($line) => [
            $line['box'] ?? '',
            $line['label'] ?? '',
            number_format($line['amount'] ?? 0, 2, '.', ''),
            $line['note'] ?? '',
        ]);

        return $this->buildCsvContent($headers, $rows);
    }

    // ----------------------------------------------------------------
    // Excel Exports
    // ----------------------------------------------------------------

    public function exportAssetsAsXlsx(User $user): BinaryFileResponse
    {
        $filename = 'patrimoine_' . now()->format('Y-m-d') . '.xlsx';
        return Excel::download(new AssetsExport($user), $filename);
    }

    // ----------------------------------------------------------------
    // PDF Exports
    // ----------------------------------------------------------------

    public function exportAssetsPdf(User $user): \Illuminate\Http\Response
    {
        $assets = $user->assets()
            ->with(['category', 'platform'])
            ->where('status', 'active')
            ->orderBy('is_liability')
            ->get();

        $calculator = new PatrimonyCalculator($user);

        $pdf = Pdf::loadView('exports.assets', [
            'assets'       => $assets,
            'user'         => $user,
            'total_assets' => $calculator->totalAssets(),
            'total_liabilities' => $calculator->totalLiabilities(),
            'net_worth'    => $calculator->netWorth(),
            'generated_at' => now()->format('d/m/Y H:i'),
        ]);

        $pdf->setPaper('a4', 'portrait');
        return $pdf->download('patrimoine_' . now()->format('Y-m-d') . '.pdf');
    }

    public function exportTaxReportPdf(TaxReport $report): \Illuminate\Http\Response
    {
        $pdf = Pdf::loadView('exports.tax-report', [
            'report'     => $report,
            'data'       => $report->data,
            'user'       => $report->user,
        ]);

        $pdf->setPaper('a4', 'portrait');
        return $pdf->download('rapport_fiscal_' . $report->fiscal_year . '.pdf');
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    private function buildCsvContent(array $headers, Collection $rows): string
    {
        $output = fopen('php://temp', 'rw');
        // UTF-8 BOM for Excel compatibility
        fwrite($output, "\xEF\xBB\xBF");
        fputcsv($output, $headers, ';');
        foreach ($rows as $row) {
            fputcsv($output, $row, ';');
        }
        rewind($output);
        $content = stream_get_contents($output);
        fclose($output);
        return $content;
    }
}
