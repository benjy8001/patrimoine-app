# Budget & Dépenses Mensuelles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Budget & Monthly Expenses module — manual transaction entry per category, per-category budget configuration (recurring + monthly override), monthly summary table, and annual evolution chart.

**Architecture:** Three new DB tables (`expense_categories`, `expenses`, `budgets`). `BudgetService` handles aggregation for summary and evolution endpoints. Four thin controllers. New `/budget` page with two tabs. Completely independent from the patrimoine asset/income tracking.

**Tech Stack:** Laravel 12 + Pest (backend, TDD), React 18 + TypeScript + Radix UI Dialog + Recharts (frontend).

---

## File Map

### Backend — new
| File | Role |
|------|------|
| `database/migrations/2026_04_07_100000_create_expense_categories_table.php` | Table expense_categories |
| `database/migrations/2026_04_07_100001_create_expenses_table.php` | Table expenses |
| `database/migrations/2026_04_07_100002_create_budgets_table.php` | Table budgets |
| `database/seeders/ExpenseCategorySeeder.php` | 11 catégories système |
| `app/Models/ExpenseCategory.php` | Modèle (system + custom) |
| `app/Models/Expense.php` | Modèle transaction |
| `app/Models/Budget.php` | Modèle budget (récurrent/ponctuel) |
| `app/Policies/ExpenseCategoryPolicy.php` | Accès catégories |
| `app/Policies/ExpensePolicy.php` | Accès dépenses |
| `app/Policies/BudgetPolicy.php` | Accès budgets |
| `app/Services/BudgetService.php` | Logique summary + evolution |
| `app/Http/Controllers/Api/V1/ExpenseCategoryController.php` | CRUD catégories |
| `app/Http/Controllers/Api/V1/ExpenseController.php` | CRUD dépenses |
| `app/Http/Controllers/Api/V1/BudgetController.php` | Upsert + delete budgets |
| `app/Http/Controllers/Api/V1/BudgetSummaryController.php` | summary + evolution |
| `tests/Feature/ExpenseCategoryTest.php` | Tests catégories |
| `tests/Feature/ExpenseTest.php` | Tests dépenses |
| `tests/Feature/BudgetTest.php` | Tests budgets |
| `tests/Feature/BudgetSummaryTest.php` | Tests summary + evolution |

### Backend — modified
| File | Change |
|------|--------|
| `database/seeders/DatabaseSeeder.php` | Appel ExpenseCategorySeeder |
| `app/Models/User.php` | Relations expenses(), budgets(), expenseCategories() |
| `app/Providers/AppServiceProvider.php` | Enregistrement 3 policies |
| `routes/api.php` | Routes budget |

### Frontend — new
| File | Role |
|------|------|
| `resources/js/types/budget.ts` | Types TypeScript |
| `resources/js/api/budget.ts` | Wrappers API |
| `resources/js/hooks/useBudget.ts` | Hook summary + navigation mois |
| `resources/js/hooks/useExpenses.ts` | Hook CRUD dépenses |
| `resources/js/utils/budgetColor.ts` | Couleur selon taux consommation |
| `resources/js/utils/budgetColor.test.ts` | Tests couleur |
| `resources/js/pages/Budget/index.tsx` | Page Budget (2 onglets) |
| `resources/js/pages/Budget/BudgetTable.tsx` | Tableau catégorie/budget/dépensé |
| `resources/js/pages/Budget/ExpenseForm.tsx` | Formulaire ajout dépense (Dialog) |
| `resources/js/pages/Budget/BudgetConfig.tsx` | Configuration budgets |
| `resources/js/pages/Budget/BudgetChart.tsx` | Stacked bar chart évolution |

### Frontend — modified
| File | Change |
|------|--------|
| `resources/js/App.tsx` | Route `/budget` |
| `resources/js/components/layout/Sidebar.tsx` | Entrée "Budget" dans le menu |

---

## Task 1: Migrations

**Files:**
- Create: `database/migrations/2026_04_07_100000_create_expense_categories_table.php`
- Create: `database/migrations/2026_04_07_100001_create_expenses_table.php`
- Create: `database/migrations/2026_04_07_100002_create_budgets_table.php`

- [ ] **Step 1: Créer la migration expense_categories**

```php
<?php
// database/migrations/2026_04_07_100000_create_expense_categories_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 100);
            $table->string('icon', 50)->nullable();
            $table->string('color', 7)->default('#94A3B8');
            $table->boolean('is_system')->default(false);
            $table->unsignedSmallInteger('order')->default(99);
            $table->timestamps();
            $table->index(['user_id', 'is_system']);
        });
    }
    public function down(): void { Schema::dropIfExists('expense_categories'); }
};
```

- [ ] **Step 2: Créer la migration expenses**

```php
<?php
// database/migrations/2026_04_07_100001_create_expenses_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('expense_category_id')->constrained('expense_categories')->restrictOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('EUR');
            $table->string('description', 255);
            $table->date('date');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'date']);
            $table->index(['user_id', 'expense_category_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('expenses'); }
};
```

- [ ] **Step 3: Créer la migration budgets**

```php
<?php
// database/migrations/2026_04_07_100002_create_budgets_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('expense_category_id')->constrained('expense_categories')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('EUR');
            $table->tinyInteger('month')->unsigned()->nullable()->comment('1-12, null=récurrent');
            $table->smallInteger('year')->unsigned()->nullable()->comment('null=récurrent');
            $table->timestamps();
            $table->index(['user_id', 'expense_category_id', 'month', 'year']);
        });
    }
    public function down(): void { Schema::dropIfExists('budgets'); }
};
```

- [ ] **Step 4: Lancer les migrations**

```bash
docker compose exec -w /var/www/html phpfpm php artisan migrate
```

Expected: `Migrating: 2026_04_07_100000_create_expense_categories_table` … `Migrated` (x3)

- [ ] **Step 5: Commit**

```bash
git add database/migrations/2026_04_07_100000_create_expense_categories_table.php \
        database/migrations/2026_04_07_100001_create_expenses_table.php \
        database/migrations/2026_04_07_100002_create_budgets_table.php
git commit -m "feat: add expense_categories, expenses, budgets migrations"
```

---

## Task 2: Models + User relationships

**Files:**
- Create: `app/Models/ExpenseCategory.php`
- Create: `app/Models/Expense.php`
- Create: `app/Models/Budget.php`
- Modify: `app/Models/User.php`

- [ ] **Step 1: Créer ExpenseCategory**

```php
<?php
// app/Models/ExpenseCategory.php
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
```

- [ ] **Step 2: Créer Expense**

```php
<?php
// app/Models/Expense.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'expense_category_id', 'amount', 'currency', 'description', 'date', 'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date'   => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }
}
```

- [ ] **Step 3: Créer Budget**

```php
<?php
// app/Models/Budget.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'expense_category_id', 'amount', 'currency', 'month', 'year',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'month'  => 'integer',
        'year'   => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }
}
```

- [ ] **Step 4: Ajouter les relations dans User** (`app/Models/User.php`)

Ajouter après la relation `reminders()` :

```php
public function expenses(): HasMany
{
    return $this->hasMany(Expense::class);
}

public function budgets(): HasMany
{
    return $this->hasMany(Budget::class);
}

public function expenseCategories(): HasMany
{
    return $this->hasMany(ExpenseCategory::class);
}
```

Ajouter les imports manquants en tête de fichier :

```php
use App\Models\Expense;
use App\Models\Budget;
use App\Models\ExpenseCategory;
```

- [ ] **Step 5: Commit**

```bash
git add app/Models/ExpenseCategory.php app/Models/Expense.php app/Models/Budget.php app/Models/User.php
git commit -m "feat: add ExpenseCategory, Expense, Budget models with User relationships"
```

---

## Task 3: Seeder + AppServiceProvider + Policies

**Files:**
- Create: `database/seeders/ExpenseCategorySeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`
- Create: `app/Policies/ExpenseCategoryPolicy.php`
- Create: `app/Policies/ExpensePolicy.php`
- Create: `app/Policies/BudgetPolicy.php`
- Modify: `app/Providers/AppServiceProvider.php`

- [ ] **Step 1: Créer ExpenseCategorySeeder**

```php
<?php
// database/seeders/ExpenseCategorySeeder.php
namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Logement',      'icon' => 'home',          'color' => '#3B82F6', 'order' => 1],
            ['name' => 'Alimentation',  'icon' => 'shopping-cart', 'color' => '#10B981', 'order' => 2],
            ['name' => 'Transport',     'icon' => 'car',           'color' => '#F59E0B', 'order' => 3],
            ['name' => 'Santé',         'icon' => 'heart-pulse',   'color' => '#EF4444', 'order' => 4],
            ['name' => 'Loisirs',       'icon' => 'gamepad-2',     'color' => '#8B5CF6', 'order' => 5],
            ['name' => 'Vêtements',     'icon' => 'shirt',         'color' => '#EC4899', 'order' => 6],
            ['name' => 'Abonnements',   'icon' => 'repeat',        'color' => '#06B6D4', 'order' => 7],
            ['name' => 'Restauration',  'icon' => 'utensils',      'color' => '#F97316', 'order' => 8],
            ['name' => 'Voyages',       'icon' => 'plane',         'color' => '#84CC16', 'order' => 9],
            ['name' => 'Éducation',     'icon' => 'graduation-cap','color' => '#A78BFA', 'order' => 10],
            ['name' => 'Autres',        'icon' => 'more-horizontal','color' => '#64748B', 'order' => 11],
        ];

        foreach ($categories as $data) {
            ExpenseCategory::updateOrCreate(
                ['user_id' => null, 'name' => $data['name']],
                array_merge($data, ['is_system' => true, 'user_id' => null])
            );
        }
    }
}
```

- [ ] **Step 2: Ajouter dans DatabaseSeeder** (`database/seeders/DatabaseSeeder.php`)

```php
// Ajouter ExpenseCategorySeeder::class dans le tableau $this->call([...])
$this->call([
    AssetCategorySeeder::class,
    ExpenseCategorySeeder::class,  // ← ajouter
    DemoDataSeeder::class,
]);
```

- [ ] **Step 3: Lancer le seeder**

```bash
docker compose exec -w /var/www/html phpfpm php artisan db:seed --class=ExpenseCategorySeeder
```

Expected: no errors, 11 rows in `expense_categories`.

- [ ] **Step 4: Créer les trois policies**

```php
<?php
// app/Policies/ExpenseCategoryPolicy.php
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
```

```php
<?php
// app/Policies/ExpensePolicy.php
namespace App\Policies;

use App\Models\Expense;
use App\Models\User;

class ExpensePolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, Expense $expense): bool { return $user->id === $expense->user_id; }
    public function create(User $user): bool { return true; }
    public function update(User $user, Expense $expense): bool { return $user->id === $expense->user_id; }
    public function delete(User $user, Expense $expense): bool { return $user->id === $expense->user_id; }
}
```

```php
<?php
// app/Policies/BudgetPolicy.php
namespace App\Policies;

use App\Models\Budget;
use App\Models\User;

class BudgetPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, Budget $budget): bool { return $user->id === $budget->user_id; }
    public function create(User $user): bool { return true; }
    public function update(User $user, Budget $budget): bool { return $user->id === $budget->user_id; }
    public function delete(User $user, Budget $budget): bool { return $user->id === $budget->user_id; }
}
```

- [ ] **Step 5: Enregistrer les policies dans AppServiceProvider** (`app/Providers/AppServiceProvider.php`)

Ajouter les imports :

```php
use App\Models\ExpenseCategory;
use App\Models\Expense;
use App\Models\Budget;
use App\Policies\ExpenseCategoryPolicy;
use App\Policies\ExpensePolicy;
use App\Policies\BudgetPolicy;
```

Ajouter dans `boot()` après les policies existantes :

```php
Gate::policy(ExpenseCategory::class, ExpenseCategoryPolicy::class);
Gate::policy(Expense::class, ExpensePolicy::class);
Gate::policy(Budget::class, BudgetPolicy::class);
```

- [ ] **Step 6: Commit**

```bash
git add database/seeders/ExpenseCategorySeeder.php database/seeders/DatabaseSeeder.php \
        app/Policies/ExpenseCategoryPolicy.php app/Policies/ExpensePolicy.php \
        app/Policies/BudgetPolicy.php app/Providers/AppServiceProvider.php
git commit -m "feat: add expense category seeder, policies, AppServiceProvider registration"
```

---

## Task 4: BudgetService (TDD)

**Files:**
- Create: `tests/Feature/BudgetSummaryTest.php` (partie service)
- Create: `app/Services/BudgetService.php`

- [ ] **Step 1: Écrire les tests du service**

```php
<?php
// tests/Feature/BudgetSummaryTest.php
use App\Models\Budget;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use App\Services\BudgetService;

beforeEach(function () {
    $this->user = User::factory()->create(['currency' => 'EUR']);

    // Catégorie système disponible pour tous les tests
    $this->cat = ExpenseCategory::create([
        'user_id'   => null,
        'name'      => 'Logement',
        'icon'      => 'home',
        'color'     => '#3B82F6',
        'is_system' => true,
        'order'     => 1,
    ]);

    $this->service = new BudgetService();
});

// --- BudgetService::getSummary ---

test('summary returns zero totals when no budget and no expenses', function () {
    $result = $this->service->getSummary($this->user, 4, 2026);

    expect($result['total_budget'])->toBe(0.0)
        ->and($result['total_spent'])->toBe(0.0)
        ->and($result['total_remaining'])->toBe(0.0)
        ->and($result['month'])->toBe(4)
        ->and($result['year'])->toBe(2026);
});

test('summary uses recurring budget when no override exists', function () {
    Budget::create([
        'user_id'             => $this->user->id,
        'expense_category_id' => $this->cat->id,
        'amount'              => 800.00,
        'currency'            => 'EUR',
        'month'               => null,
        'year'                => null,
    ]);

    $result = $this->service->getSummary($this->user, 4, 2026);

    $catRow = collect($result['categories'])->firstWhere('category.id', $this->cat->id);
    expect($catRow['budget'])->toBe(800.0)
        ->and($result['total_budget'])->toBe(800.0);
});

test('summary prefers specific month override over recurring', function () {
    // Budget récurrent
    Budget::create([
        'user_id'             => $this->user->id,
        'expense_category_id' => $this->cat->id,
        'amount'              => 800.00,
        'currency'            => 'EUR',
        'month'               => null,
        'year'                => null,
    ]);
    // Override ponctuel
    Budget::create([
        'user_id'             => $this->user->id,
        'expense_category_id' => $this->cat->id,
        'amount'              => 1200.00,
        'currency'            => 'EUR',
        'month'               => 4,
        'year'                => 2026,
    ]);

    $result = $this->service->getSummary($this->user, 4, 2026);

    $catRow = collect($result['categories'])->firstWhere('category.id', $this->cat->id);
    expect($catRow['budget'])->toBe(1200.0);
});

test('summary aggregates expenses for the month correctly', function () {
    Expense::create([
        'user_id'             => $this->user->id,
        'expense_category_id' => $this->cat->id,
        'amount'              => 350.00,
        'currency'            => 'EUR',
        'description'         => 'Loyer',
        'date'                => '2026-04-05',
    ]);
    Expense::create([
        'user_id'             => $this->user->id,
        'expense_category_id' => $this->cat->id,
        'amount'              => 50.00,
        'currency'            => 'EUR',
        'description'         => 'Charges',
        'date'                => '2026-04-10',
    ]);
    // Dépense d'un autre mois (ne doit pas apparaître)
    Expense::create([
        'user_id'             => $this->user->id,
        'expense_category_id' => $this->cat->id,
        'amount'              => 999.00,
        'currency'            => 'EUR',
        'description'         => 'Mars',
        'date'                => '2026-03-15',
    ]);

    $result = $this->service->getSummary($this->user, 4, 2026);

    $catRow = collect($result['categories'])->firstWhere('category.id', $this->cat->id);
    expect($catRow['spent'])->toBe(400.0)
        ->and($result['total_spent'])->toBe(400.0);
});

test('summary does not expose another user expenses', function () {
    $other = User::factory()->create();
    Expense::create([
        'user_id'             => $other->id,
        'expense_category_id' => $this->cat->id,
        'amount'              => 999.00,
        'currency'            => 'EUR',
        'description'         => 'Autre',
        'date'                => '2026-04-01',
    ]);

    $result = $this->service->getSummary($this->user, 4, 2026);

    expect($result['total_spent'])->toBe(0.0);
});

// --- BudgetService::getEvolution ---

test('evolution groups expenses by month', function () {
    Expense::create([
        'user_id'             => $this->user->id,
        'expense_category_id' => $this->cat->id,
        'amount'              => 800.00,
        'currency'            => 'EUR',
        'description'         => 'Loyer jan',
        'date'                => '2026-01-05',
    ]);
    Expense::create([
        'user_id'             => $this->user->id,
        'expense_category_id' => $this->cat->id,
        'amount'              => 800.00,
        'currency'            => 'EUR',
        'description'         => 'Loyer fev',
        'date'                => '2026-02-05',
    ]);

    $result = $this->service->getEvolution($this->user, 2026);

    $jan = collect($result['months'])->firstWhere('month', 1);
    $fev = collect($result['months'])->firstWhere('month', 2);

    expect($jan['total'])->toBe(800.0)
        ->and($fev['total'])->toBe(800.0)
        ->and(count($result['months']))->toBeGreaterThanOrEqual(2);
});

test('evolution only returns months with expenses', function () {
    // Aucune dépense → months vide
    $result = $this->service->getEvolution($this->user, 2026);
    expect($result['months'])->toBeEmpty();
});
```

- [ ] **Step 2: Lancer les tests — vérifier qu'ils échouent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/BudgetSummaryTest.php
```

Expected: FAIL — `App\Services\BudgetService not found`

- [ ] **Step 3: Implémenter BudgetService**

```php
<?php
// app/Services/BudgetService.php
namespace App\Services;

use App\Models\Budget;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\ExchangeRate;
use App\Models\User;

class BudgetService
{
    /**
     * Retourne le résumé budget vs réel pour un mois/année donnés.
     * Toutes les valeurs sont converties dans la devise de l'utilisateur.
     */
    public function getSummary(User $user, int $month, int $year): array
    {
        $currency = $user->currency ?? 'EUR';

        // Toutes les catégories visibles pour cet user
        $categories = ExpenseCategory::forUser($user->id)
            ->orderBy('order')
            ->get();

        // Budgets effectifs : override ponctuel > récurrent
        $effectiveBudgets = [];
        $recurringBudgets = Budget::where('user_id', $user->id)
            ->whereNull('month')
            ->whereNull('year')
            ->get()
            ->keyBy('expense_category_id');

        $overrideBudgets = Budget::where('user_id', $user->id)
            ->where('month', $month)
            ->where('year', $year)
            ->get()
            ->keyBy('expense_category_id');

        foreach ($categories as $cat) {
            $budget = $overrideBudgets->get($cat->id) ?? $recurringBudgets->get($cat->id);
            $effectiveBudgets[$cat->id] = $budget;
        }

        // Dépenses du mois groupées par catégorie
        $spentByCategory = Expense::where('user_id', $user->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get()
            ->groupBy('expense_category_id')
            ->map(function ($expenses) use ($currency) {
                return round($expenses->sum(fn ($e) =>
                    (float) $e->amount * ExchangeRate::getRate($e->currency, $currency)
                ), 2);
            });

        $rows = [];
        $totalBudget = 0.0;
        $totalSpent  = 0.0;

        foreach ($categories as $cat) {
            $budget = $effectiveBudgets[$cat->id] ?? null;
            $budgetAmount = $budget
                ? round((float) $budget->amount * ExchangeRate::getRate($budget->currency, $currency), 2)
                : 0.0;
            $spent    = (float) ($spentByCategory->get($cat->id) ?? 0.0);
            $remaining = round($budgetAmount - $spent, 2);
            $rate      = $budgetAmount > 0 ? round($spent / $budgetAmount * 100, 1) : null;

            $rows[] = [
                'category'  => [
                    'id'        => $cat->id,
                    'name'      => $cat->name,
                    'color'     => $cat->color,
                    'icon'      => $cat->icon,
                    'is_system' => $cat->is_system,
                ],
                'budget'    => $budgetAmount,
                'spent'     => $spent,
                'remaining' => $remaining,
                'rate'      => $rate,
            ];

            $totalBudget += $budgetAmount;
            $totalSpent  += $spent;
        }

        return [
            'month'           => $month,
            'year'            => $year,
            'currency'        => $currency,
            'total_budget'    => round($totalBudget, 2),
            'total_spent'     => round($totalSpent, 2),
            'total_remaining' => round($totalBudget - $totalSpent, 2),
            'categories'      => $rows,
        ];
    }

    /**
     * Retourne les totaux de dépenses par mois sur une année.
     * Seuls les mois avec des dépenses sont inclus.
     */
    public function getEvolution(User $user, int $year): array
    {
        $currency = $user->currency ?? 'EUR';

        $expenses = Expense::where('user_id', $user->id)
            ->whereYear('date', $year)
            ->with('category')
            ->get();

        $byMonth = $expenses->groupBy(fn ($e) => (int) $e->date->format('n'));

        $months = [];
        foreach ($byMonth->sortKeys() as $month => $monthExpenses) {
            $byCategory = $monthExpenses->groupBy('expense_category_id')
                ->map(function ($catExpenses, $catId) use ($currency) {
                    $cat = $catExpenses->first()->category;
                    return [
                        'category_id' => $catId,
                        'name'        => $cat?->name ?? 'Inconnu',
                        'color'       => $cat?->color ?? '#94A3B8',
                        'amount'      => round($catExpenses->sum(fn ($e) =>
                            (float) $e->amount * ExchangeRate::getRate($e->currency, $currency)
                        ), 2),
                    ];
                })
                ->values()
                ->toArray();

            $months[] = [
                'month'       => $month,
                'total'       => round(array_sum(array_column($byCategory, 'amount')), 2),
                'by_category' => $byCategory,
            ];
        }

        return [
            'year'     => $year,
            'currency' => $currency,
            'months'   => $months,
        ];
    }
}
```

- [ ] **Step 4: Lancer les tests — vérifier qu'ils passent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/BudgetSummaryTest.php
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add tests/Feature/BudgetSummaryTest.php app/Services/BudgetService.php
git commit -m "feat: add BudgetService with getSummary and getEvolution (TDD)"
```

---

## Task 5: ExpenseCategory API (TDD)

**Files:**
- Create: `tests/Feature/ExpenseCategoryTest.php`
- Create: `app/Http/Controllers/Api/V1/ExpenseCategoryController.php`
- Modify: `routes/api.php`

- [ ] **Step 1: Écrire les tests**

```php
<?php
// tests/Feature/ExpenseCategoryTest.php
use App\Models\ExpenseCategory;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();

    // Catégorie système
    $this->system = ExpenseCategory::create([
        'user_id' => null, 'name' => 'Logement', 'icon' => 'home',
        'color' => '#3B82F6', 'is_system' => true, 'order' => 1,
    ]);
});

test('GET /expense-categories returns system + user custom categories', function () {
    $custom = ExpenseCategory::create([
        'user_id' => $this->user->id, 'name' => 'Perso', 'icon' => null,
        'color' => '#aaaaaa', 'is_system' => false, 'order' => 99,
    ]);

    $this->actingAs($this->user);
    $response = $this->getJson('/api/v1/expense-categories');

    $response->assertOk();
    $ids = collect($response->json())->pluck('id');
    expect($ids->contains($this->system->id))->toBeTrue()
        ->and($ids->contains($custom->id))->toBeTrue();
});

test('GET /expense-categories does not return other user custom categories', function () {
    $other = User::factory()->create();
    $otherCustom = ExpenseCategory::create([
        'user_id' => $other->id, 'name' => 'AutrePerso', 'icon' => null,
        'color' => '#bbbbbb', 'is_system' => false, 'order' => 99,
    ]);

    $this->actingAs($this->user);
    $response = $this->getJson('/api/v1/expense-categories');

    $response->assertOk();
    $ids = collect($response->json())->pluck('id');
    expect($ids->contains($otherCustom->id))->toBeFalse();
});

test('POST /expense-categories creates a custom category', function () {
    $this->actingAs($this->user);
    $response = $this->postJson('/api/v1/expense-categories', [
        'name' => 'Animaux', 'color' => '#ff0000', 'icon' => 'paw-print',
    ]);

    $response->assertStatus(201);
    expect($response->json('name'))->toBe('Animaux')
        ->and($response->json('is_system'))->toBeFalse()
        ->and($response->json('user_id'))->toBe($this->user->id);

    $this->assertDatabaseHas('expense_categories', [
        'user_id' => $this->user->id, 'name' => 'Animaux',
    ]);
});

test('PUT /expense-categories/{id} updates a custom category', function () {
    $this->actingAs($this->user);
    $custom = ExpenseCategory::create([
        'user_id' => $this->user->id, 'name' => 'Test', 'icon' => null,
        'color' => '#aaaaaa', 'is_system' => false, 'order' => 99,
    ]);

    $response = $this->putJson("/api/v1/expense-categories/{$custom->id}", [
        'name' => 'Modifié', 'color' => '#00ff00',
    ]);

    $response->assertOk();
    expect($response->json('name'))->toBe('Modifié');
});

test('PUT /expense-categories/{id} cannot update system category', function () {
    $this->actingAs($this->user);
    $response = $this->putJson("/api/v1/expense-categories/{$this->system->id}", [
        'name' => 'Hack',
    ]);
    $response->assertForbidden();
});

test('DELETE /expense-categories/{id} removes a custom category', function () {
    $this->actingAs($this->user);
    $custom = ExpenseCategory::create([
        'user_id' => $this->user->id, 'name' => 'Temp', 'icon' => null,
        'color' => '#aaaaaa', 'is_system' => false, 'order' => 99,
    ]);

    $this->deleteJson("/api/v1/expense-categories/{$custom->id}")->assertOk();
    $this->assertDatabaseMissing('expense_categories', ['id' => $custom->id]);
});

test('DELETE /expense-categories/{id} cannot delete system category', function () {
    $this->actingAs($this->user);
    $this->deleteJson("/api/v1/expense-categories/{$this->system->id}")->assertForbidden();
});

test('expense-categories endpoints require authentication', function () {
    $this->getJson('/api/v1/expense-categories')->assertUnauthorized();
    $this->postJson('/api/v1/expense-categories', [])->assertUnauthorized();
});
```

- [ ] **Step 2: Lancer les tests — vérifier qu'ils échouent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/ExpenseCategoryTest.php
```

Expected: FAIL — route not found (404)

- [ ] **Step 3: Créer le controller**

```php
<?php
// app/Http/Controllers/Api/V1/ExpenseCategoryController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = ExpenseCategory::forUser($request->user()->id)
            ->orderBy('order')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => 'required|string|max:100',
            'color' => 'nullable|string|max:7',
            'icon'  => 'nullable|string|max:50',
            'order' => 'nullable|integer',
        ]);

        $category = $request->user()->expenseCategories()->create(array_merge($data, [
            'is_system' => false,
            'color'     => $data['color'] ?? '#94A3B8',
            'order'     => $data['order'] ?? 99,
        ]));

        return response()->json($category, 201);
    }

    public function update(Request $request, ExpenseCategory $expenseCategory): JsonResponse
    {
        $this->authorize('update', $expenseCategory);

        $data = $request->validate([
            'name'  => 'sometimes|string|max:100',
            'color' => 'nullable|string|max:7',
            'icon'  => 'nullable|string|max:50',
            'order' => 'nullable|integer',
        ]);

        $expenseCategory->update($data);

        return response()->json($expenseCategory);
    }

    public function destroy(Request $request, ExpenseCategory $expenseCategory): JsonResponse
    {
        $this->authorize('delete', $expenseCategory);
        $expenseCategory->delete();

        return response()->json(['message' => 'Catégorie supprimée.']);
    }
}
```

- [ ] **Step 4: Ajouter les routes dans api.php** (`routes/api.php`)

Ajouter les imports en haut du fichier :

```php
use App\Http\Controllers\Api\V1\ExpenseCategoryController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\BudgetController;
use App\Http\Controllers\Api\V1\BudgetSummaryController;
```

Ajouter dans le groupe `auth:sanctum` (après les routes Exchange rates) :

```php
// Budget & Dépenses
Route::get('/expense-categories', [ExpenseCategoryController::class, 'index']);
Route::post('/expense-categories', [ExpenseCategoryController::class, 'store']);
Route::put('/expense-categories/{expenseCategory}', [ExpenseCategoryController::class, 'update']);
Route::delete('/expense-categories/{expenseCategory}', [ExpenseCategoryController::class, 'destroy']);

Route::get('/expenses', [ExpenseController::class, 'index']);
Route::post('/expenses', [ExpenseController::class, 'store']);
Route::put('/expenses/{expense}', [ExpenseController::class, 'update']);
Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']);

Route::get('/budgets', [BudgetController::class, 'index']);
Route::post('/budgets', [BudgetController::class, 'store']);
Route::delete('/budgets/{budget}', [BudgetController::class, 'destroy']);

Route::get('/budget/summary', [BudgetSummaryController::class, 'summary']);
Route::get('/budget/evolution', [BudgetSummaryController::class, 'evolution']);
```

- [ ] **Step 5: Lancer les tests — vérifier qu'ils passent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/ExpenseCategoryTest.php
```

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add tests/Feature/ExpenseCategoryTest.php \
        app/Http/Controllers/Api/V1/ExpenseCategoryController.php \
        routes/api.php
git commit -m "feat: add ExpenseCategory CRUD API with tests (TDD)"
```

---

## Task 6: Expense API (TDD)

**Files:**
- Create: `tests/Feature/ExpenseTest.php`
- Create: `app/Http/Controllers/Api/V1/ExpenseController.php`

- [ ] **Step 1: Écrire les tests**

```php
<?php
// tests/Feature/ExpenseTest.php
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->cat  = ExpenseCategory::create([
        'user_id' => null, 'name' => 'Alimentation', 'icon' => 'shopping-cart',
        'color' => '#10B981', 'is_system' => true, 'order' => 2,
    ]);
});

test('GET /expenses returns user expenses filtered by month/year', function () {
    $this->actingAs($this->user);

    Expense::create([
        'user_id' => $this->user->id, 'expense_category_id' => $this->cat->id,
        'amount' => 50, 'currency' => 'EUR', 'description' => 'Courses', 'date' => '2026-04-10',
    ]);
    Expense::create([
        'user_id' => $this->user->id, 'expense_category_id' => $this->cat->id,
        'amount' => 30, 'currency' => 'EUR', 'description' => 'Mars', 'date' => '2026-03-05',
    ]);

    $response = $this->getJson('/api/v1/expenses?month=4&year=2026');

    $response->assertOk();
    expect(count($response->json('data')))->toBe(1)
        ->and($response->json('data.0.description'))->toBe('Courses');
});

test('GET /expenses does not return other user expenses', function () {
    $other = User::factory()->create();
    Expense::create([
        'user_id' => $other->id, 'expense_category_id' => $this->cat->id,
        'amount' => 999, 'currency' => 'EUR', 'description' => 'Autre', 'date' => '2026-04-01',
    ]);

    $this->actingAs($this->user);
    $response = $this->getJson('/api/v1/expenses?month=4&year=2026');

    $response->assertOk();
    expect($response->json('data'))->toBeEmpty();
});

test('POST /expenses creates an expense', function () {
    $this->actingAs($this->user);
    $response = $this->postJson('/api/v1/expenses', [
        'expense_category_id' => $this->cat->id,
        'amount'              => 42.50,
        'currency'            => 'EUR',
        'description'         => 'Supermarché',
        'date'                => '2026-04-15',
        'notes'               => 'Courses hebdo',
    ]);

    $response->assertStatus(201);
    expect($response->json('description'))->toBe('Supermarché')
        ->and($response->json('amount'))->toBe('42.50');

    $this->assertDatabaseHas('expenses', [
        'user_id'     => $this->user->id,
        'description' => 'Supermarché',
    ]);
});

test('POST /expenses validates required fields', function () {
    $this->actingAs($this->user);
    $this->postJson('/api/v1/expenses', [])->assertUnprocessable();
});

test('PUT /expenses/{id} updates an expense', function () {
    $this->actingAs($this->user);
    $expense = Expense::create([
        'user_id' => $this->user->id, 'expense_category_id' => $this->cat->id,
        'amount' => 100, 'currency' => 'EUR', 'description' => 'Test', 'date' => '2026-04-01',
    ]);

    $response = $this->putJson("/api/v1/expenses/{$expense->id}", [
        'amount' => 120.00, 'description' => 'Modifié',
    ]);

    $response->assertOk();
    expect($response->json('amount'))->toBe('120.00');
});

test('PUT /expenses/{id} cannot update another user expense', function () {
    $other   = User::factory()->create();
    $expense = Expense::create([
        'user_id' => $other->id, 'expense_category_id' => $this->cat->id,
        'amount' => 100, 'currency' => 'EUR', 'description' => 'Autre', 'date' => '2026-04-01',
    ]);

    $this->actingAs($this->user);
    $this->putJson("/api/v1/expenses/{$expense->id}", ['amount' => 1])->assertForbidden();
});

test('DELETE /expenses/{id} removes an expense', function () {
    $this->actingAs($this->user);
    $expense = Expense::create([
        'user_id' => $this->user->id, 'expense_category_id' => $this->cat->id,
        'amount' => 100, 'currency' => 'EUR', 'description' => 'Test', 'date' => '2026-04-01',
    ]);

    $this->deleteJson("/api/v1/expenses/{$expense->id}")->assertOk();
    $this->assertDatabaseMissing('expenses', ['id' => $expense->id]);
});

test('expense endpoints require authentication', function () {
    $this->getJson('/api/v1/expenses')->assertUnauthorized();
    $this->postJson('/api/v1/expenses', [])->assertUnauthorized();
});
```

- [ ] **Step 2: Lancer les tests — vérifier qu'ils échouent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/ExpenseTest.php
```

Expected: FAIL (controller class not found or 500)

- [ ] **Step 3: Créer le controller**

```php
<?php
// app/Http/Controllers/Api/V1/ExpenseController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $expenses = $request->user()->expenses()
            ->with('category')
            ->when($request->filled('month') && $request->filled('year'),
                fn ($q) => $q->whereMonth('date', $request->month)->whereYear('date', $request->year)
            )
            ->when($request->filled('category_id'),
                fn ($q) => $q->where('expense_category_id', $request->category_id)
            )
            ->orderByDesc('date')
            ->paginate(50);

        return response()->json($expenses);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount'              => 'required|numeric|min:0.01',
            'currency'            => 'nullable|string|size:3',
            'description'         => 'required|string|max:255',
            'date'                => 'required|date',
            'notes'               => 'nullable|string|max:2000',
        ]);

        $data['currency'] ??= 'EUR';
        $expense = $request->user()->expenses()->create($data);

        return response()->json($expense->load('category'), 201);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $this->authorize('update', $expense);

        $data = $request->validate([
            'expense_category_id' => 'sometimes|exists:expense_categories,id',
            'amount'              => 'sometimes|numeric|min:0.01',
            'currency'            => 'nullable|string|size:3',
            'description'         => 'sometimes|string|max:255',
            'date'                => 'sometimes|date',
            'notes'               => 'nullable|string|max:2000',
        ]);

        $expense->update($data);

        return response()->json($expense->load('category'));
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $this->authorize('delete', $expense);
        $expense->delete();

        return response()->json(['message' => 'Dépense supprimée.']);
    }
}
```

- [ ] **Step 4: Lancer les tests — vérifier qu'ils passent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/ExpenseTest.php
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add tests/Feature/ExpenseTest.php app/Http/Controllers/Api/V1/ExpenseController.php
git commit -m "feat: add Expense CRUD API with tests (TDD)"
```

---

## Task 7: Budget API (TDD)

**Files:**
- Create: `tests/Feature/BudgetTest.php`
- Create: `app/Http/Controllers/Api/V1/BudgetController.php`

- [ ] **Step 1: Écrire les tests**

```php
<?php
// tests/Feature/BudgetTest.php
use App\Models\Budget;
use App\Models\ExpenseCategory;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->cat  = ExpenseCategory::create([
        'user_id' => null, 'name' => 'Logement', 'icon' => 'home',
        'color' => '#3B82F6', 'is_system' => true, 'order' => 1,
    ]);
});

test('POST /budgets creates a recurring budget', function () {
    $this->actingAs($this->user);
    $response = $this->postJson('/api/v1/budgets', [
        'expense_category_id' => $this->cat->id,
        'amount'              => 900.00,
        'currency'            => 'EUR',
        'month'               => null,
        'year'                => null,
    ]);

    $response->assertStatus(201);
    expect($response->json('amount'))->toBe('900.00')
        ->and($response->json('month'))->toBeNull()
        ->and($response->json('year'))->toBeNull();

    $this->assertDatabaseHas('budgets', [
        'user_id'             => $this->user->id,
        'expense_category_id' => $this->cat->id,
        'month'               => null,
        'year'                => null,
    ]);
});

test('POST /budgets creates a monthly override budget', function () {
    $this->actingAs($this->user);
    $response = $this->postJson('/api/v1/budgets', [
        'expense_category_id' => $this->cat->id,
        'amount'              => 1200.00,
        'currency'            => 'EUR',
        'month'               => 4,
        'year'                => 2026,
    ]);

    $response->assertStatus(201);
    expect($response->json('month'))->toBe(4)
        ->and($response->json('year'))->toBe(2026);
});

test('POST /budgets upserts when same category/month/year exists', function () {
    $this->actingAs($this->user);

    // Premier budget récurrent
    $this->postJson('/api/v1/budgets', [
        'expense_category_id' => $this->cat->id,
        'amount' => 800.00, 'currency' => 'EUR', 'month' => null, 'year' => null,
    ]);

    // Deuxième appel même catégorie récurrente → met à jour
    $this->postJson('/api/v1/budgets', [
        'expense_category_id' => $this->cat->id,
        'amount' => 1000.00, 'currency' => 'EUR', 'month' => null, 'year' => null,
    ]);

    expect(Budget::where('user_id', $this->user->id)
        ->whereNull('month')->whereNull('year')->count()
    )->toBe(1);

    expect(Budget::where('user_id', $this->user->id)
        ->whereNull('month')->whereNull('year')->value('amount')
    )->toBe('1000.00');
});

test('GET /budgets returns effective budgets for a month', function () {
    $this->actingAs($this->user);

    Budget::create([
        'user_id' => $this->user->id, 'expense_category_id' => $this->cat->id,
        'amount' => 800, 'currency' => 'EUR', 'month' => null, 'year' => null,
    ]);

    $response = $this->getJson('/api/v1/budgets?month=4&year=2026');

    $response->assertOk();
    expect($response->json())->not->toBeEmpty();
});

test('DELETE /budgets/{id} removes a budget', function () {
    $this->actingAs($this->user);
    $budget = Budget::create([
        'user_id' => $this->user->id, 'expense_category_id' => $this->cat->id,
        'amount' => 500, 'currency' => 'EUR', 'month' => null, 'year' => null,
    ]);

    $this->deleteJson("/api/v1/budgets/{$budget->id}")->assertOk();
    $this->assertDatabaseMissing('budgets', ['id' => $budget->id]);
});

test('DELETE /budgets/{id} cannot delete another user budget', function () {
    $other  = User::factory()->create();
    $budget = Budget::create([
        'user_id' => $other->id, 'expense_category_id' => $this->cat->id,
        'amount' => 500, 'currency' => 'EUR', 'month' => null, 'year' => null,
    ]);

    $this->actingAs($this->user);
    $this->deleteJson("/api/v1/budgets/{$budget->id}")->assertForbidden();
});

test('budget endpoints require authentication', function () {
    $this->getJson('/api/v1/budgets')->assertUnauthorized();
    $this->postJson('/api/v1/budgets', [])->assertUnauthorized();
});
```

- [ ] **Step 2: Lancer les tests — vérifier qu'ils échouent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/BudgetTest.php
```

Expected: FAIL (controller not found)

- [ ] **Step 3: Créer le controller**

```php
<?php
// app/Http/Controllers/Api/V1/BudgetController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $budgets = $request->user()->budgets()
            ->with('category')
            ->when($request->filled('month') && $request->filled('year'),
                fn ($q) => $q->where(fn ($sub) =>
                    $sub->where(fn ($x) => $x->where('month', $request->month)->where('year', $request->year))
                        ->orWhere(fn ($x) => $x->whereNull('month')->whereNull('year'))
                )
            )
            ->get();

        return response()->json($budgets);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount'              => 'required|numeric|min:0',
            'currency'            => 'nullable|string|size:3',
            'month'               => 'nullable|integer|between:1,12',
            'year'                => 'nullable|integer|min:2000|max:2100',
        ]);

        $data['currency'] ??= 'EUR';

        $budget = Budget::updateOrCreate(
            [
                'user_id'             => $request->user()->id,
                'expense_category_id' => $data['expense_category_id'],
                'month'               => $data['month'] ?? null,
                'year'                => $data['year']  ?? null,
            ],
            [
                'amount'   => $data['amount'],
                'currency' => $data['currency'],
            ]
        );

        $status = $budget->wasRecentlyCreated ? 201 : 200;

        return response()->json($budget->load('category'), $status);
    }

    public function destroy(Budget $budget): JsonResponse
    {
        $this->authorize('delete', $budget);
        $budget->delete();

        return response()->json(['message' => 'Budget supprimé.']);
    }
}
```

- [ ] **Step 4: Lancer les tests — vérifier qu'ils passent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/BudgetTest.php
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add tests/Feature/BudgetTest.php app/Http/Controllers/Api/V1/BudgetController.php
git commit -m "feat: add Budget API with upsert logic and tests (TDD)"
```

---

## Task 8: BudgetSummary API + controller tests

**Files:**
- Modify: `tests/Feature/BudgetSummaryTest.php` (ajouter les tests controller)
- Create: `app/Http/Controllers/Api/V1/BudgetSummaryController.php`

- [ ] **Step 1: Ajouter les tests controller dans BudgetSummaryTest.php**

Ajouter à la fin du fichier existant :

```php
// --- Tests BudgetSummaryController ---

test('GET /budget/summary returns summary structure', function () {
    $this->actingAs($this->user);

    $response = $this->getJson('/api/v1/budget/summary?month=4&year=2026');

    $response->assertOk();
    expect($response->json('month'))->toBe(4)
        ->and($response->json('year'))->toBe(2026)
        ->and($response->json('total_budget'))->toBe(0.0)
        ->and($response->json('total_spent'))->toBe(0.0)
        ->and($response->json('categories'))->toBeArray();
});

test('GET /budget/summary requires month and year', function () {
    $this->actingAs($this->user);
    $this->getJson('/api/v1/budget/summary')->assertUnprocessable();
});

test('GET /budget/evolution returns monthly evolution', function () {
    $this->actingAs($this->user);

    Expense::create([
        'user_id' => $this->user->id, 'expense_category_id' => $this->cat->id,
        'amount' => 500, 'currency' => 'EUR', 'description' => 'Test', 'date' => '2026-04-01',
    ]);

    $response = $this->getJson('/api/v1/budget/evolution?year=2026');

    $response->assertOk();
    expect($response->json('year'))->toBe(2026)
        ->and($response->json('months'))->not->toBeEmpty();
});

test('GET /budget/evolution requires year', function () {
    $this->actingAs($this->user);
    $this->getJson('/api/v1/budget/evolution')->assertUnprocessable();
});

test('budget/summary and budget/evolution require authentication', function () {
    $this->getJson('/api/v1/budget/summary')->assertUnauthorized();
    $this->getJson('/api/v1/budget/evolution')->assertUnauthorized();
});
```

- [ ] **Step 2: Lancer toute la suite BudgetSummaryTest — les nouveaux tests doivent échouer**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/BudgetSummaryTest.php
```

Expected: les tests du service (Task 4) passent, les nouveaux tests controller échouent avec 404 ou 500

- [ ] **Step 3: Créer le controller**

```php
<?php
// app/Http/Controllers/Api/V1/BudgetSummaryController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetSummaryController extends Controller
{
    public function __construct(private readonly BudgetService $service) {}

    public function summary(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year'  => 'required|integer|min:2000|max:2100',
        ]);

        $result = $this->service->getSummary(
            $request->user(),
            (int) $request->month,
            (int) $request->year,
        );

        return response()->json($result);
    }

    public function evolution(Request $request): JsonResponse
    {
        $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        $result = $this->service->getEvolution($request->user(), (int) $request->year);

        return response()->json($result);
    }
}
```

- [ ] **Step 4: Lancer tous les tests budget — vérifier qu'ils passent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/BudgetSummaryTest.php tests/Feature/BudgetTest.php tests/Feature/ExpenseTest.php tests/Feature/ExpenseCategoryTest.php
```

Expected: all PASS

- [ ] **Step 5: Lancer toute la suite de tests pour vérifier la non-régression**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest
```

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add tests/Feature/BudgetSummaryTest.php \
        app/Http/Controllers/Api/V1/BudgetSummaryController.php
git commit -m "feat: add BudgetSummary API (summary + evolution) with tests (TDD)"
```

---

## Task 9: Frontend types + API layer

**Files:**
- Create: `resources/js/types/budget.ts`
- Create: `resources/js/api/budget.ts`

- [ ] **Step 1: Créer les types TypeScript**

```typescript
// resources/js/types/budget.ts

export interface ExpenseCategory {
  id: number
  user_id: number | null
  name: string
  icon: string | null
  color: string
  is_system: boolean
  order: number
}

export interface Expense {
  id: number
  user_id: number
  expense_category_id: number
  amount: string   // decimal string from Laravel
  currency: string
  description: string
  date: string
  notes: string | null
  category?: ExpenseCategory
  created_at: string
}

export interface Budget {
  id: number
  user_id: number
  expense_category_id: number
  amount: string   // decimal string from Laravel
  currency: string
  month: number | null
  year: number | null
  category?: ExpenseCategory
}

export interface BudgetCategoryRow {
  category: {
    id: number
    name: string
    color: string
    icon: string | null
    is_system: boolean
  }
  budget: number
  spent: number
  remaining: number
  rate: number | null
}

export interface BudgetSummary {
  month: number
  year: number
  currency: string
  total_budget: number
  total_spent: number
  total_remaining: number
  categories: BudgetCategoryRow[]
}

export interface BudgetEvolutionMonth {
  month: number
  total: number
  by_category: {
    category_id: number
    name: string
    color: string
    amount: number
  }[]
}

export interface BudgetEvolution {
  year: number
  currency: string
  months: BudgetEvolutionMonth[]
}

export interface PaginatedExpenses {
  data: Expense[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
```

- [ ] **Step 2: Créer la couche API**

```typescript
// resources/js/api/budget.ts
import api from './axios'
import type {
  BudgetEvolution,
  BudgetSummary,
  Budget,
  Expense,
  ExpenseCategory,
  PaginatedExpenses,
} from '../types/budget'

export const expenseCategoriesApi = {
  async list(): Promise<ExpenseCategory[]> {
    const res = await api.get<ExpenseCategory[]>('/expense-categories')
    return res.data
  },
  async create(data: { name: string; color?: string; icon?: string }): Promise<ExpenseCategory> {
    const res = await api.post<ExpenseCategory>('/expense-categories', data)
    return res.data
  },
  async update(id: number, data: Partial<{ name: string; color: string; icon: string }>): Promise<ExpenseCategory> {
    const res = await api.put<ExpenseCategory>(`/expense-categories/${id}`, data)
    return res.data
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/expense-categories/${id}`)
  },
}

export const expensesApi = {
  async list(params?: { month?: number; year?: number; category_id?: number }): Promise<PaginatedExpenses> {
    const res = await api.get<PaginatedExpenses>('/expenses', { params })
    return res.data
  },
  async create(data: {
    expense_category_id: number
    amount: number
    currency?: string
    description: string
    date: string
    notes?: string
  }): Promise<Expense> {
    const res = await api.post<Expense>('/expenses', data)
    return res.data
  },
  async update(id: number, data: Partial<{
    expense_category_id: number
    amount: number
    currency: string
    description: string
    date: string
    notes: string
  }>): Promise<Expense> {
    const res = await api.put<Expense>(`/expenses/${id}`, data)
    return res.data
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/expenses/${id}`)
  },
}

export const budgetsApi = {
  async list(params?: { month?: number; year?: number }): Promise<Budget[]> {
    const res = await api.get<Budget[]>('/budgets', { params })
    return res.data
  },
  async upsert(data: {
    expense_category_id: number
    amount: number
    currency?: string
    month?: number | null
    year?: number | null
  }): Promise<Budget> {
    const res = await api.post<Budget>('/budgets', data)
    return res.data
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/budgets/${id}`)
  },
}

export const budgetSummaryApi = {
  async getSummary(month: number, year: number): Promise<BudgetSummary> {
    const res = await api.get<BudgetSummary>('/budget/summary', { params: { month, year } })
    return res.data
  },
  async getEvolution(year: number): Promise<BudgetEvolution> {
    const res = await api.get<BudgetEvolution>('/budget/evolution', { params: { year } })
    return res.data
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add resources/js/types/budget.ts resources/js/api/budget.ts
git commit -m "feat: add Budget TypeScript types and API layer"
```

---

## Task 10: budgetColor utility (TDD) + hooks

**Files:**
- Create: `resources/js/utils/budgetColor.ts`
- Create: `resources/js/utils/budgetColor.test.ts`
- Create: `resources/js/hooks/useBudget.ts`
- Create: `resources/js/hooks/useExpenses.ts`

- [ ] **Step 1: Écrire le test de la fonction budgetColor**

```typescript
// resources/js/utils/budgetColor.test.ts
import { describe, it, expect } from 'vitest'
import { budgetColor } from './budgetColor'

describe('budgetColor', () => {
  it('returns green when rate is null (no budget set)', () => {
    expect(budgetColor(null).bar).toBe('bg-green-500')
  })

  it('returns green when rate is below 80%', () => {
    expect(budgetColor(50).bar).toBe('bg-green-500')
    expect(budgetColor(79.9).bar).toBe('bg-green-500')
  })

  it('returns orange when rate is between 80% and 99%', () => {
    expect(budgetColor(80).bar).toBe('bg-orange-500')
    expect(budgetColor(99.9).bar).toBe('bg-orange-500')
  })

  it('returns red when rate is 100% or more', () => {
    expect(budgetColor(100).bar).toBe('bg-red-500')
    expect(budgetColor(150).bar).toBe('bg-red-500')
  })

  it('returns correct text color with bar color', () => {
    expect(budgetColor(50).text).toBe('text-green-600')
    expect(budgetColor(90).text).toBe('text-orange-500')
    expect(budgetColor(110).text).toBe('text-red-600')
  })
})
```

- [ ] **Step 2: Lancer le test — vérifier qu'il échoue**

```bash
npm run test
```

Expected: FAIL — `Cannot find module './budgetColor'`

- [ ] **Step 3: Implémenter budgetColor**

```typescript
// resources/js/utils/budgetColor.ts

interface BudgetColorResult {
  bar: string
  text: string
}

export function budgetColor(rate: number | null): BudgetColorResult {
  if (rate === null || rate < 80) return { bar: 'bg-green-500', text: 'text-green-600' }
  if (rate < 100)                  return { bar: 'bg-orange-500', text: 'text-orange-500' }
  return                                  { bar: 'bg-red-500', text: 'text-red-600' }
}
```

- [ ] **Step 4: Lancer le test — vérifier qu'il passe**

```bash
npm run test
```

Expected: all PASS

- [ ] **Step 5: Créer useBudget**

```typescript
// resources/js/hooks/useBudget.ts
import { useState, useEffect, useCallback } from 'react'
import { budgetSummaryApi } from '../api/budget'
import type { BudgetSummary } from '../types/budget'

export function useBudget() {
  const now = new Date()
  const [month, setMonth]       = useState(now.getMonth() + 1)
  const [year, setYear]         = useState(now.getFullYear())
  const [summary, setSummary]   = useState<BudgetSummary | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await budgetSummaryApi.getSummary(month, year)
      setSummary(data)
    } catch {
      setError('Impossible de charger le résumé budgétaire')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { load() }, [load])

  const prevMonth = useCallback(() => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }, [month])

  const nextMonth = useCallback(() => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }, [month])

  return { month, year, summary, isLoading, error, prevMonth, nextMonth, reload: load }
}
```

- [ ] **Step 6: Créer useExpenses**

```typescript
// resources/js/hooks/useExpenses.ts
import { useState, useCallback } from 'react'
import { expensesApi } from '../api/budget'
import type { Expense } from '../types/budget'

export function useExpenses(month: number, year: number) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await expensesApi.list({ month, year })
      setExpenses(res.data)
    } catch {
      setError('Impossible de charger les dépenses')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  const createExpense = useCallback(async (data: {
    expense_category_id: number
    amount: number
    currency?: string
    description: string
    date: string
    notes?: string
  }) => {
    const expense = await expensesApi.create(data)
    setExpenses(prev => [expense, ...prev])
    return expense
  }, [])

  const deleteExpense = useCallback(async (id: number) => {
    await expensesApi.delete(id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }, [])

  return { expenses, isLoading, error, load, createExpense, deleteExpense }
}
```

- [ ] **Step 7: Commit**

```bash
git add resources/js/utils/budgetColor.ts resources/js/utils/budgetColor.test.ts \
        resources/js/hooks/useBudget.ts resources/js/hooks/useExpenses.ts
git commit -m "feat: add budgetColor utility (TDD), useBudget and useExpenses hooks"
```

---

## Task 11: BudgetTable component

**Files:**
- Create: `resources/js/pages/Budget/BudgetTable.tsx`

- [ ] **Step 1: Créer BudgetTable**

```tsx
// resources/js/pages/Budget/BudgetTable.tsx
import { budgetColor } from '../../utils/budgetColor'
import type { BudgetSummary } from '../../types/budget'
import { formatCurrency } from '../../utils/format'

interface BudgetTableProps {
  summary: BudgetSummary
  currency: string
}

export default function BudgetTable({ summary, currency }: BudgetTableProps) {
  return (
    <div className="space-y-3">
      {/* Totaux */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Budget total</p>
          <p className="font-bold text-lg">{formatCurrency(summary.total_budget, currency)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Dépensé</p>
          <p className="font-bold text-lg">{formatCurrency(summary.total_spent, currency)}</p>
        </div>
        <div className={`bg-card border border-border rounded-lg p-4 text-center`}>
          <p className="text-xs text-muted-foreground mb-1">Restant</p>
          <p className={`font-bold text-lg ${summary.total_remaining < 0 ? 'text-red-600' : ''}`}>
            {formatCurrency(summary.total_remaining, currency)}
          </p>
        </div>
      </div>

      {/* Tableau par catégorie */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-medium text-muted-foreground">Catégorie</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Budget</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Dépensé</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Reste</th>
              <th className="p-3 w-32 font-medium text-muted-foreground">Progression</th>
            </tr>
          </thead>
          <tbody>
            {summary.categories.map(row => {
              const colors = budgetColor(row.rate)
              return (
                <tr key={row.category.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.category.color }}
                      />
                      {row.category.name}
                    </div>
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    {row.budget > 0 ? formatCurrency(row.budget, currency) : '—'}
                  </td>
                  <td className={`p-3 text-right font-medium ${row.spent > 0 ? colors.text : 'text-muted-foreground'}`}>
                    {formatCurrency(row.spent, currency)}
                  </td>
                  <td className="p-3 text-right">
                    {row.budget > 0 ? (
                      <span className={row.remaining < 0 ? 'text-red-600 font-medium' : ''}>
                        {formatCurrency(row.remaining, currency)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-3">
                    {row.budget > 0 && row.rate !== null ? (
                      <div className="space-y-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${colors.bar}`}
                            style={{ width: `${Math.min(row.rate, 100)}%` }}
                          />
                        </div>
                        <p className={`text-xs text-right ${colors.text}`}>{row.rate}%</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Non défini</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/Budget/BudgetTable.tsx
git commit -m "feat: add BudgetTable component with progress bars"
```

---

## Task 12: ExpenseForm component

**Files:**
- Create: `resources/js/pages/Budget/ExpenseForm.tsx`

- [ ] **Step 1: Créer ExpenseForm (Dialog Radix UI)**

```tsx
// resources/js/pages/Budget/ExpenseForm.tsx
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ExpenseCategory } from '../../types/budget'

interface ExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ExpenseCategory[]
  defaultDate: string  // format YYYY-MM-DD
  onSubmit: (data: {
    expense_category_id: number
    amount: number
    currency: string
    description: string
    date: string
    notes?: string
  }) => Promise<void>
}

export default function ExpenseForm({ open, onOpenChange, categories, defaultDate, onSubmit }: ExpenseFormProps) {
  const [form, setForm] = useState({
    expense_category_id: categories[0]?.id ?? 0,
    amount:              '',
    currency:            'EUR',
    description:         '',
    date:                defaultDate,
    notes:               '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const inputClass = "w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || !form.description || !form.expense_category_id) {
      setError('Montant, description et catégorie sont requis.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        ...form,
        amount: parseFloat(form.amount),
        notes: form.notes || undefined,
      })
      setForm({ ...form, amount: '', description: '', notes: '' })
      onOpenChange(false)
    } catch {
      setError('Erreur lors de l\'enregistrement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card rounded-lg border border-border shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="font-semibold">Ajouter une dépense</Dialog.Title>
            <Dialog.Close className="p-1 rounded hover:bg-accent">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div>
              <label className="text-sm font-medium mb-1 block">Catégorie</label>
              <select
                value={form.expense_category_id}
                onChange={e => setForm({ ...form, expense_category_id: Number(e.target.value) })}
                className={inputClass}
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Montant</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Devise</label>
                <select
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value })}
                  className={inputClass}
                >
                  {['EUR', 'USD', 'GBP', 'CHF'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
                maxLength={255}
                placeholder="Ex : Courses Carrefour"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes (optionnel)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Ajouter la dépense'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/Budget/ExpenseForm.tsx
git commit -m "feat: add ExpenseForm dialog component"
```

---

## Task 13: BudgetConfig component

**Files:**
- Create: `resources/js/pages/Budget/BudgetConfig.tsx`

- [ ] **Step 1: Créer BudgetConfig**

```tsx
// resources/js/pages/Budget/BudgetConfig.tsx
import { useState, useEffect } from 'react'
import { budgetsApi, expenseCategoriesApi } from '../../api/budget'
import type { Budget, ExpenseCategory } from '../../types/budget'

interface BudgetConfigProps {
  month: number
  year: number
  onUpdated: () => void
}

export default function BudgetConfig({ month, year, onUpdated }: BudgetConfigProps) {
  const [categories, setCategories]   = useState<ExpenseCategory[]>([])
  const [budgets, setBudgets]         = useState<Budget[]>([])
  const [amounts, setAmounts]         = useState<Record<number, string>>({})
  const [overrides, setOverrides]     = useState<Record<number, boolean>>({})
  const [saving, setSaving]           = useState<Record<number, boolean>>({})
  const [isLoading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      expenseCategoriesApi.list(),
      budgetsApi.list({ month, year }),
    ]).then(([cats, buds]) => {
      setCategories(cats)
      setBudgets(buds)

      // Pré-remplir amounts avec valeurs existantes
      const initAmounts: Record<number, string> = {}
      const initOverrides: Record<number, boolean> = {}
      cats.forEach(cat => {
        const override = buds.find(b => b.expense_category_id === cat.id && b.month === month && b.year === year)
        const recurring = buds.find(b => b.expense_category_id === cat.id && b.month === null && b.year === null)
        if (override) {
          initAmounts[cat.id] = String(parseFloat(override.amount))
          initOverrides[cat.id] = true
        } else if (recurring) {
          initAmounts[cat.id] = String(parseFloat(recurring.amount))
          initOverrides[cat.id] = false
        } else {
          initAmounts[cat.id] = ''
          initOverrides[cat.id] = false
        }
      })
      setAmounts(initAmounts)
      setOverrides(initOverrides)
      setLoading(false)
    })
  }, [month, year])

  const handleSave = async (cat: ExpenseCategory) => {
    const val = parseFloat(amounts[cat.id] ?? '')
    if (isNaN(val) || val < 0) return

    setSaving(prev => ({ ...prev, [cat.id]: true }))
    try {
      await budgetsApi.upsert({
        expense_category_id: cat.id,
        amount:   val,
        currency: 'EUR',
        month:    overrides[cat.id] ? month : null,
        year:     overrides[cat.id] ? year  : null,
      })
      onUpdated()
    } finally {
      setSaving(prev => ({ ...prev, [cat.id]: false }))
    }
  }

  const inputClass = "border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-28 text-right"

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Chargement...</p>

  const MONTHS = ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.']

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        Définissez un montant récurrent (appliqué chaque mois) ou cochez pour définir un montant spécifique pour {MONTHS[month - 1]} {year}.
      </p>
      {categories.map(cat => (
        <div key={cat.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
          <span className="text-sm flex-1">{cat.name}</span>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={overrides[cat.id] ?? false}
              onChange={e => setOverrides(prev => ({ ...prev, [cat.id]: e.target.checked }))}
              className="rounded"
            />
            Override {MONTHS[month - 1]}
          </label>

          <input
            type="number"
            value={amounts[cat.id] ?? ''}
            onChange={e => setAmounts(prev => ({ ...prev, [cat.id]: e.target.value }))}
            onBlur={() => handleSave(cat)}
            step="1"
            min="0"
            placeholder="0 €"
            className={inputClass}
          />

          <span className="text-xs text-muted-foreground w-6">€</span>

          {saving[cat.id] && <span className="text-xs text-muted-foreground">...</span>}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/Budget/BudgetConfig.tsx
git commit -m "feat: add BudgetConfig component for per-category budget setup"
```

---

## Task 14: BudgetChart component

**Files:**
- Create: `resources/js/pages/Budget/BudgetChart.tsx`

- [ ] **Step 1: Créer BudgetChart**

```tsx
// resources/js/pages/Budget/BudgetChart.tsx
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { budgetSummaryApi } from '../../api/budget'
import type { BudgetEvolution } from '../../types/budget'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { formatCurrency } from '../../utils/format'

const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function BudgetChart() {
  const currentYear = new Date().getFullYear()
  const [year, setYear]           = useState(currentYear)
  const [data, setData]           = useState<BudgetEvolution | null>(null)
  const [isLoading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    budgetSummaryApi.getEvolution(year)
      .then(setData)
      .finally(() => setLoading(false))
  }, [year])

  if (isLoading) return <LoadingSpinner className="mt-10" />

  if (!data || data.months.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Aucune dépense enregistrée pour {year}.
      </div>
    )
  }

  // Récupérer toutes les catégories uniques présentes
  const allCategories = Array.from(
    new Map(
      data.months.flatMap(m => m.by_category).map(c => [c.category_id, c])
    ).values()
  )

  // Préparer les données pour Recharts
  const chartData = data.months.map(m => {
    const row: Record<string, number | string> = { name: MONTHS_SHORT[m.month - 1] }
    allCategories.forEach(cat => {
      const found = m.by_category.find(c => c.category_id === cat.category_id)
      row[cat.name] = found ? found.amount : 0
    })
    return row
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Évolution des dépenses</h3>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}€`} />
          <Tooltip formatter={(value: number) => formatCurrency(value, data.currency)} />
          <Legend />
          {allCategories.map(cat => (
            <Bar key={cat.category_id} dataKey={cat.name} stackId="a" fill={cat.color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/Budget/BudgetChart.tsx
git commit -m "feat: add BudgetChart stacked bar Recharts component"
```

---

## Task 15: Budget page + routing + sidebar

**Files:**
- Create: `resources/js/pages/Budget/index.tsx`
- Modify: `resources/js/App.tsx`
- Modify: `resources/js/components/layout/Sidebar.tsx`

- [ ] **Step 1: Créer la page Budget**

```tsx
// resources/js/pages/Budget/index.tsx
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react'
import { useBudget } from '../../hooks/useBudget'
import { useExpenses } from '../../hooks/useExpenses'
import BudgetTable from './BudgetTable'
import ExpenseForm from './ExpenseForm'
import BudgetConfig from './BudgetConfig'
import BudgetChart from './BudgetChart'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { Card, CardHeader, CardTitle } from '../../components/shared/Card'
import { useQuery } from '../../hooks/useQuery'
import { expenseCategoriesApi } from '../../api/budget'
import { useAuthStore } from '../../stores/authStore'

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

type Tab = 'summary' | 'evolution'

export default function Budget() {
  const { user } = useAuthStore()
  const { month, year, summary, isLoading, error, prevMonth, nextMonth, reload } = useBudget()
  const { createExpense } = useExpenses(month, year)

  const [tab, setTab]             = useState<Tab>('summary')
  const [showExpenseForm, setExpenseForm]   = useState(false)
  const [showBudgetConfig, setShowConfig]  = useState(false)

  const { data: categories = [] } = useQuery(['expense-categories'], () => expenseCategoriesApi.list())

  const defaultDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`

  const handleAddExpense = async (data: Parameters<typeof createExpense>[0]) => {
    await createExpense(data)
    reload()
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Budget & Dépenses</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showBudgetConfig)}
            className="flex items-center gap-2 border border-border px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          >
            <Settings className="w-4 h-4" /> Configurer les budgets
          </button>
          <button
            onClick={() => setExpenseForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter une dépense
          </button>
        </div>
      </div>

      {/* Budget Config (collapsible) */}
      {showBudgetConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration des budgets</CardTitle>
          </CardHeader>
          <BudgetConfig month={month} year={year} onUpdated={reload} />
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-border flex gap-0">
        <button className={tabClass('summary')} onClick={() => setTab('summary')}>
          Mois en cours
        </button>
        <button className={tabClass('evolution')} onClick={() => setTab('evolution')}>
          Évolution annuelle
        </button>
      </div>

      {tab === 'summary' && (
        <>
          {/* Navigateur mois */}
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-1.5 rounded hover:bg-accent transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium min-w-[160px] text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded hover:bg-accent transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {isLoading && <LoadingSpinner className="mt-10" />}
          {error && <p className="text-destructive text-sm">{error}</p>}
          {!isLoading && summary && (
            <BudgetTable summary={summary} currency={user?.currency ?? 'EUR'} />
          )}
        </>
      )}

      {tab === 'evolution' && (
        <Card>
          <BudgetChart />
        </Card>
      )}

      {/* Modals */}
      <ExpenseForm
        open={showExpenseForm}
        onOpenChange={setExpenseForm}
        categories={categories}
        defaultDate={defaultDate}
        onSubmit={handleAddExpense}
      />
    </div>
  )
}
```

- [ ] **Step 2: Ajouter la route dans App.tsx** (`resources/js/App.tsx`)

Ajouter l'import :

```tsx
import Budget from './pages/Budget'
```

Ajouter la route dans le groupe PrivateRoute :

```tsx
<Route path="budget" element={<Budget />} />
```

- [ ] **Step 3: Ajouter le menu dans Sidebar.tsx** (`resources/js/components/layout/Sidebar.tsx`)

Ajouter l'import de l'icône (PiggyBank ou Wallet) en tête du fichier, dans les imports lucide-react existants :

```tsx
Wallet,
```

Ajouter l'entrée dans `navItems` après `income` :

```tsx
{ to: '/budget', label: 'Budget', icon: Wallet },
```

- [ ] **Step 4: Lancer le build TypeScript pour vérifier qu'il n'y a pas d'erreurs**

```bash
npm run build
```

Expected: Build succeeded, no TypeScript errors

- [ ] **Step 5: Lancer toute la suite de tests backend**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest
```

Expected: all PASS

- [ ] **Step 6: Commit final**

```bash
git add resources/js/pages/Budget/index.tsx \
        resources/js/App.tsx \
        resources/js/components/layout/Sidebar.tsx
git commit -m "feat: add Budget page with two tabs, routing, sidebar nav"
```

---

## Vérification end-to-end

1. Lancer l'application : `docker compose up -d`
2. Ouvrir `http://localhost:5173` → naviguer vers **Budget** dans le menu
3. Cliquer **Configurer les budgets** → saisir un montant pour "Alimentation" (récurrent) → onglet s'enregistre à la perte de focus
4. Cliquer **Ajouter une dépense** → remplir le formulaire → enregistrer → le tableau se met à jour avec le montant dépensé et la barre de progression
5. Naviguer vers le mois précédent → aucune dépense, tout à zéro
6. Revenir au mois courant → données préservées
7. Cliquer **Évolution annuelle** → le graphique stacked bar affiche le mois avec les dépenses saisies
8. Tester que les routes sans authentification retournent 401 :
   ```bash
   curl http://localhost/api/v1/expenses
   # Expected: {"message":"Unauthenticated."}
   ```
