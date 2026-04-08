<?php
namespace App\Policies;

use App\Models\ExpenseCategory;
use App\Models\User;

class ExpenseCategoryPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, ExpenseCategory $cat): bool
    {
        return $cat->user_id === null || $cat->user_id === $user->id;
    }
    public function create(User $user): bool { return true; }
    public function update(User $user, ExpenseCategory $cat): bool
    {
        return !$cat->is_system && $cat->user_id === $user->id;
    }
    public function delete(User $user, ExpenseCategory $cat): bool
    {
        return !$cat->is_system && $cat->user_id === $user->id;
    }
}
