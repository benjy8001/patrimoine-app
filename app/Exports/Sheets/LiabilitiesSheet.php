<?php

namespace App\Exports\Sheets;

use App\Models\Asset;
use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Collection;

class LiabilitiesSheet implements FromCollection, WithTitle, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithColumnFormatting
{
    public function __construct(private readonly User $user)
    {
    }

    public function title(): string
    {
        return 'Passifs';
    }

    public function collection(): Collection
    {
        return $this->user->assets()
            ->with(['category', 'platform'])
            ->where('is_liability', true)
            ->orderBy('asset_category_id')
            ->orderBy('name')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Nom',
            'Catégorie',
            'Plateforme',
            'Devise',
            'Montant restant',
            'Capital emprunté',
            'Taux estimé (%)',
            'Date acquisition',
            'Statut',
            'Dernière MAJ',
        ];
    }

    public function map($asset): array
    {
        /** @var Asset $asset */
        return [
            $asset->name,
            $asset->category?->name ?? '',
            $asset->platform?->name ?? '',
            $asset->currency,
            (float) $asset->current_value,
            $asset->initial_value ? (float) $asset->initial_value : null,
            $asset->estimated_yield ? (float) $asset->estimated_yield : null,
            $asset->acquisition_date?->format('d/m/Y') ?? '',
            $asset->status,
            $asset->last_updated_at?->format('d/m/Y') ?? '',
        ];
    }

    public function columnFormats(): array
    {
        return [
            'E' => '#,##0.00',
            'F' => '#,##0.00',
            'G' => '0.00',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF7F1D1D'],
                ],
            ],
        ];
    }
}
