<?php

use App\Models\Budget;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use App\Services\BudgetService;

beforeEach(function () {
    $this->user = User::factory()->create(['currency' => 'EUR']);

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
    Budget::create([
        'user_id'             => $this->user->id,
        'expense_category_id' => $this->cat->id,
        'amount'              => 800.00,
        'currency'            => 'EUR',
        'month'               => null,
        'year'                => null,
    ]);
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
        ->and(count($result['months']))->toBe(2);
});

test('evolution only returns months with expenses', function () {
    $result = $this->service->getEvolution($this->user, 2026);
    expect($result['months'])->toBeEmpty();
});

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
        'user_id'             => $this->user->id,
        'expense_category_id' => $this->cat->id,
        'amount'              => 500,
        'currency'            => 'EUR',
        'description'         => 'Test',
        'date'                => '2026-04-01',
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
