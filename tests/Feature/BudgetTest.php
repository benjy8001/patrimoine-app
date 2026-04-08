<?php

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
