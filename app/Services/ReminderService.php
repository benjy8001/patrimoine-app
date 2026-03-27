<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Support\Collection;

class ReminderService
{
    public function getDueReminders(User $user): Collection
    {
        return $user->reminders()
            ->where('is_active', true)
            ->where('next_due_at', '<=', today())
            ->with('asset')
            ->orderBy('next_due_at')
            ->get();
    }

    public function getOverdueAssets(User $user): Collection
    {
        return $user->assets()
            ->active()
            ->overdue()
            ->with(['category', 'platform'])
            ->get();
    }

    public function createAssetReminder(Asset $asset): Reminder
    {
        $nextDue = match ($asset->update_frequency) {
            'weekly'    => today()->addWeek(),
            'monthly'   => today()->addMonth(),
            'quarterly' => today()->addMonths(3),
            'yearly'    => today()->addYear(),
            default     => today()->addMonth(),
        };

        return Reminder::create([
            'user_id'     => $asset->user_id,
            'asset_id'    => $asset->id,
            'title'       => 'Mettre à jour : ' . $asset->name,
            'message'     => 'Fréquence configurée : ' . $asset->update_frequency,
            'due_date'    => $nextDue,
            'frequency'   => $asset->update_frequency === 'manual' ? 'once' : $asset->update_frequency,
            'is_active'   => true,
            'next_due_at' => $nextDue,
        ]);
    }

    public function markTriggered(Reminder $reminder): void
    {
        $isRecurring = $reminder->frequency !== 'once';

        $reminder->update([
            'last_triggered_at' => now(),
            'next_due_at'       => $isRecurring ? $reminder->calculateNextDueDate() : null,
            'is_active'         => $isRecurring,
        ]);
    }

    public function countDue(User $user): int
    {
        return $user->reminders()
            ->where('is_active', true)
            ->where('next_due_at', '<=', today())
            ->count();
    }
}
