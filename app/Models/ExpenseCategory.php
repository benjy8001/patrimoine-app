<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseCategory extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'name', 'icon', 'color', 'is_system', 'order'];

    protected $casts = ['is_system' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function budgets(): HasMany
    {
        return $this->hasMany(Budget::class);
    }

    /** Retourne les catégories visibles pour un user : système + ses customs */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where(fn ($q) =>
            $q->whereNull('user_id')->orWhere('user_id', $userId)
        );
    }
}
