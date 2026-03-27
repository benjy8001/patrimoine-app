<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Loan extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id', 'lender_name', 'borrowed_amount', 'remaining_capital',
        'interest_rate', 'monthly_payment', 'start_date', 'end_date', 'loan_type', 'currency',
    ];

    protected $casts = [
        'borrowed_amount'   => 'decimal:2',
        'remaining_capital' => 'decimal:2',
        'interest_rate'     => 'decimal:4',
        'monthly_payment'   => 'decimal:2',
        'start_date'        => 'date',
        'end_date'          => 'date',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function totalInterestCost(): float
    {
        if (!$this->monthly_payment || !$this->start_date || !$this->end_date) {
            return 0;
        }

        $months = $this->start_date->diffInMonths($this->end_date);

        return ($this->monthly_payment * $months) - $this->borrowed_amount;
    }
}
