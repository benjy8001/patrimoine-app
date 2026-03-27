<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxReport extends Model
{
    protected $fillable = ['user_id', 'fiscal_year', 'status', 'data', 'generated_at', 'notes', 'exported_at'];

    protected $casts = [
        'fiscal_year'  => 'integer',
        'data'         => 'array',
        'generated_at' => 'datetime',
        'exported_at'  => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
