<?php

use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\SendReminderNotifications;
use App\Console\Commands\FetchExchangeRates;

Schedule::command(SendReminderNotifications::class)->daily();

Schedule::command(FetchExchangeRates::class)
    ->dailyAt('17:00')
    ->timezone('Europe/Paris');
