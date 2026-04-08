<?php

namespace App\Services;

use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class BudgetService
{
    /**
     * Return budget vs. spent summary for a given month/year.
     *
     * For each category that has either a budget or expenses in the month:
     *  - Use the month-specific budget if one exists, otherwise fall back to the
     *    recurring (month = null) budget.
     *
     * @return array{
     *   month: int,
     *   year: int,
     *   total_budget: float,
     *   total_spent: float,
     *   total_remaining: float,
     *   categories: list<array{category: array, budget: float, spent: float, remaining: float}>
     * }
     */
    public function getSummary(User $user, int $month, int $year): array
    {
        // All categories visible to this user (system + their custom ones)
        $categories = ExpenseCategory::forUser($user->id)->get()->keyBy('id');

        // Recurring budgets (month = null) for this user
        $recurringBudgets = $user->budgets()
            ->whereNull('month')
            ->get()
            ->keyBy('expense_category_id');

        // Month-specific budgets for this user
        $overrideBudgets = $user->budgets()
            ->where('month', $month)
            ->where('year', $year)
            ->get()
            ->keyBy('expense_category_id');

        // Expenses summed per category for the target month
        $spentPerCategory = $user->expenses()
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->select('expense_category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('expense_category_id')
            ->pluck('total', 'expense_category_id');

        // Union of category IDs that have either a budget or expenses this month
        $categoryIds = $recurringBudgets->keys()
            ->merge($overrideBudgets->keys())
            ->merge($spentPerCategory->keys())
            ->unique();

        $rows = [];
        $totalBudget = 0.0;
        $totalSpent = 0.0;

        foreach ($categoryIds as $catId) {
            $category = $categories->get($catId);
            if (! $category) {
                continue;
            }

            $budget = $overrideBudgets->has($catId)
                ? (float) $overrideBudgets[$catId]->amount
                : (float) ($recurringBudgets[$catId]->amount ?? 0.0);

            $spent = (float) ($spentPerCategory[$catId] ?? 0.0);
            $remaining = $budget - $spent;

            $totalBudget += $budget;
            $totalSpent  += $spent;

            $rows[] = [
                'category'  => $category->toArray(),
                'budget'    => $budget,
                'spent'     => $spent,
                'remaining' => $remaining,
            ];
        }

        return [
            'month'           => $month,
            'year'            => $year,
            'total_budget'    => $totalBudget,
            'total_spent'     => $totalSpent,
            'total_remaining' => $totalBudget - $totalSpent,
            'categories'      => $rows,
        ];
    }

    /**
     * Return total spent per month for a given year (only months with data).
     *
     * @return array{
     *   year: int,
     *   months: list<array{month: int, total: float}>
     * }
     */
    public function getEvolution(User $user, int $year): array
    {
        $rows = $user->expenses()
            ->whereYear('date', $year)
            ->select(
                DB::raw('MONTH(date) as month'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy(DB::raw('MONTH(date)'))
            ->orderBy(DB::raw('MONTH(date)'))
            ->get()
            ->map(fn ($row) => [
                'month' => (int) $row->month,
                'total' => (float) $row->total,
            ])
            ->values()
            ->all();

        return [
            'year'   => $year,
            'months' => $rows,
        ];
    }
}
