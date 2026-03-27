<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetValuation extends Model
{
    protected $fillable = ['asset_id', 'value', 'currency', 'recorded_at', 'source', 'notes'];

    protected $casts = [
        'value' => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}
