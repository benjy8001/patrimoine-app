<?php

namespace App\Exports;

use App\Exports\Sheets\AssetsSheet;
use App\Exports\Sheets\LiabilitiesSheet;
use App\Exports\Sheets\SummarySheet;
use App\Models\User;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AssetsExport implements WithMultipleSheets
{
    public function __construct(private readonly User $user)
    {
    }

    public function sheets(): array
    {
        return [
            new SummarySheet($this->user),
            new AssetsSheet($this->user),
            new LiabilitiesSheet($this->user),
        ];
    }
}
