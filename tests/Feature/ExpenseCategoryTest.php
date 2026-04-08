<?php

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
