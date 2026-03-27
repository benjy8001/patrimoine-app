<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'asset_category_id', 'platform_id', 'name', 'description',
        'currency', 'current_value', 'initial_value', 'acquisition_date',
        'last_updated_at', 'status', 'update_frequency', 'estimated_yield',
        'notes', 'meta', 'is_liability', 'sort_order',
    ];

    protected $casts = [
        'current_value' => 'decimal:2',
        'initial_value' => 'decimal:2',
        'estimated_yield' => 'decimal:4',
        'acquisition_date' => 'date',
        'last_updated_at' => 'datetime',
        'meta' => 'array',
        'is_liability' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function valuations(): HasMany
    {
        return $this->hasMany(AssetValuation::class)->orderByDesc('recorded_at');
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    /**
     * @deprecated Use loans() instead. Kept for backward compatibility.
     */
    public function loan(): HasMany
    {
        return $this->loans();
    }

    public function incomeEntries(): HasMany
    {
        return $this->hasMany(IncomeEntry::class);
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    public function isOverdue(): bool
    {
        if (!$this->last_updated_at || $this->update_frequency === 'manual') {
            return false;
        }
        $threshold = match($this->update_frequency) {
            'weekly' => now()->subWeek(),
            'monthly' => now()->subMonth(),
            'quarterly' => now()->subMonths(3),
            'yearly' => now()->subYear(),
            default => null,
        };
        return $threshold && $this->last_updated_at->lt($threshold);
    }

    public function gainLoss(): float
    {
        if (!$this->initial_value || $this->initial_value == 0) return 0;
        return (float)$this->current_value - (float)$this->initial_value;
    }

    public function gainLossPercent(): float
    {
        if (!$this->initial_value || $this->initial_value == 0) return 0;
        return (($this->current_value - $this->initial_value) / $this->initial_value) * 100;
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeAssets($query)
    {
        return $query->where('is_liability', false);
    }

    public function scopeLiabilities($query)
    {
        return $query->where('is_liability', true);
    }

    public function scopeOverdue($query)
    {
        return $query->where('update_frequency', '!=', 'manual')
            ->where(function ($q) {
                $q->whereNull('last_updated_at')
                    ->orWhere(function ($q2) {
                        $q2->where('update_frequency', 'weekly')->where('last_updated_at', '<', now()->subWeek());
                    })
                    ->orWhere(function ($q2) {
                        $q2->where('update_frequency', 'monthly')->where('last_updated_at', '<', now()->subMonth());
                    })
                    ->orWhere(function ($q2) {
                        $q2->where('update_frequency', 'quarterly')->where('last_updated_at', '<', now()->subMonths(3));
                    })
                    ->orWhere(function ($q2) {
                        $q2->where('update_frequency', 'yearly')->where('last_updated_at', '<', now()->subYear());
                    });
            });
    }
}
