<?php

namespace App\Console\Commands;

use App\Models\Reminder;
use App\Services\ReminderService;
use Illuminate\Console\Command;

class SendReminderNotifications extends Command
{
    protected $signature   = 'reminders:send';
    protected $description = 'Process due reminders and mark them as triggered';

    public function handle(ReminderService $reminderService): int
    {
        $dueReminders = Reminder::where('is_active', true)
            ->where('next_due_at', '<=', today())
            ->with('user')
            ->get();

        if ($dueReminders->isEmpty()) {
            $this->info('No due reminders.');
            return self::SUCCESS;
        }

        $this->info("Processing {$dueReminders->count()} due reminder(s)...");

        foreach ($dueReminders as $reminder) {
            try {
                $reminderService->markTriggered($reminder);
                $this->line("  ✓ Reminder #{$reminder->id}: {$reminder->title}");
            } catch (\Exception $e) {
                $this->error("  ✗ Reminder #{$reminder->id} failed: {$e->getMessage()}");
            }
        }

        $this->info('Done.');
        return self::SUCCESS;
    }
}
