<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reminder extends Model
{
    protected $fillable = [
        'user_id', 'asset_id', 'title', 'message', 'due_date',
        'frequency', 'is_active', 'last_triggered_at', 'next_due_at',
    ];

    protected $casts = [
        'due_date'          => 'date',
        'is_active'         => 'boolean',
        'last_triggered_at' => 'datetime',
        'next_due_at'       => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function isOverdue(): bool
    {
        return $this->next_due_at && $this->next_due_at->isPast();
    }

    public function calculateNextDueDate(): Carbon
    {
        $base = ($this->next_due_at ?? Carbon::today())->copy();

        return match ($this->frequency) {
            'weekly'    => $base->addWeek(),
            'monthly'   => $base->addMonth(),
            'quarterly' => $base->addMonths(3),
            'yearly'    => $base->addYear(),
            default     => $base,
        };
    }
}
