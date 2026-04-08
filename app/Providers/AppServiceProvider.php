<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

use App\Models\Asset;
use App\Models\Budget;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\IncomeEntry;
use App\Models\Reminder;
use App\Policies\AssetPolicy;
use App\Policies\BudgetPolicy;
use App\Policies\ExpenseCategoryPolicy;
use App\Policies\ExpensePolicy;
use App\Policies\IncomeEntryPolicy;
use App\Policies\ReminderPolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Asset::class, AssetPolicy::class);
        Gate::policy(IncomeEntry::class, IncomeEntryPolicy::class);
        Gate::policy(Reminder::class, ReminderPolicy::class);
        Gate::policy(ExpenseCategory::class, ExpenseCategoryPolicy::class);
        Gate::policy(Expense::class, ExpensePolicy::class);
        Gate::policy(Budget::class, BudgetPolicy::class);

        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
