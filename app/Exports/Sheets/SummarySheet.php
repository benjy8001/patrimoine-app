<?php

namespace App\Exports\Sheets;

use App\Models\User;
use App\Services\PatrimonyCalculator;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SummarySheet implements FromArray, WithTitle, WithStyles, WithColumnWidths
{
    public function __construct(private readonly User $user)
    {
    }

    public function title(): string
    {
        return 'Résumé';
    }

    public function array(): array
    {
        $calc       = new PatrimonyCalculator($this->user);
        $assetCount = $this->user->assets()->where('is_liability', false)->where('status', 'active')->count();
        $liabCount  = $this->user->assets()->where('is_liability', true)->where('status', 'active')->count();

        return [
            ['Rapport Patrimonial — ' . $this->user->name],
            ['Généré le ' . now()->format('d/m/Y à H:i')],
            [],
            ['Indicateur', 'Valeur'],
            ['Patrimoine net',    round($calc->netWorth(), 2)],
            ['Total actifs',      round($calc->totalAssets(), 2)],
            ['Total passifs',     round($calc->totalLiabilities(), 2)],
            ['Rendement global',  round($calc->globalYield(), 2)],
            [],
            ['Nombre d\'actifs actifs',  $assetCount],
            ['Nombre de passifs actifs', $liabCount],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 35,
            'B' => 20,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        // Title
        $sheet->mergeCells('A1:B1');
        $sheet->mergeCells('A2:B2');

        return [
            1 => [
                'font'      => ['bold' => true, 'size' => 14],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
            ],
            2 => [
                'font'      => ['color' => ['argb' => 'FF6B7280']],
            ],
            4 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF1E293B'],
                ],
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            ],
            'B5:B8' => [
                'numberFormat' => ['formatCode' => '#,##0.00 "€"'],
            ],
            'B8' => [
                'numberFormat' => ['formatCode' => '0.00 "%"'],
            ],
        ];
    }
}
