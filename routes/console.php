<?php

use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\SendReminderNotifications;

Schedule::command(SendReminderNotifications::class)->daily();
