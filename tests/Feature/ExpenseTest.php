<?php

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
