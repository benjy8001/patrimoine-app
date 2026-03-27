<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class IncomeEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'asset_id', 'income_type', 'amount', 'currency',
        'fiscal_year', 'received_at', 'is_taxable', 'tax_category', 'notes',
    ];

    protected $casts = [
        'amount'      => 'decimal:2',
        'fiscal_year' => 'integer',
        'received_at' => 'date',
        'is_taxable'  => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    public static function incomeTypeLabel(string $type): string
    {
        return match ($type) {
            'interest'     => 'Intérêts',
            'dividend'     => 'Dividendes',
            'rental'       => 'Revenus fonciers',
            'capital_gain' => 'Plus-values',
            'scpi'         => 'Revenus SCPI',
            'crowdlending' => 'Revenus crowdlending',
            'crypto'       => 'Revenus crypto',
            default        => 'Autres',
        };
    }
}
