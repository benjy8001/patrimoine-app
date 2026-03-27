<?php

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create([
        'currency' => 'EUR',
        'locale'   => 'fr',
        'timezone' => 'Europe/Paris',
    ]);

    $this->category = AssetCategory::create([
        'name'       => 'Test Category',
        'slug'       => 'test-category',
        'type'       => 'asset',
        'is_system'  => false,
        'sort_order' => 99,
    ]);

    $this->actingAs($this->user);
});

test('user can list their assets', function () {
    Asset::factory()->count(3)->create([
        'user_id'           => $this->user->id,
        'asset_category_id' => $this->category->id,
    ]);

    $response = $this->getJson('/api/v1/assets?all=true');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(3);
});

test('user can create an asset', function () {
    $response = $this->postJson('/api/v1/assets', [
        'name'              => 'Mon Livret A',
        'asset_category_id' => $this->category->id,
        'currency'          => 'EUR',
        'current_value'     => 10000,
        'initial_value'     => 8000,
        'status'            => 'active',
        'update_frequency'  => 'monthly',
    ]);

    $response->assertCreated();
    expect($response->json('data.name'))->toBe('Mon Livret A');
    expect($response->json('data.current_value'))->toBe(10000.0);
});

test('user cannot access another user\'s assets', function () {
    $otherUser = User::factory()->create();
    $asset = Asset::factory()->create([
        'user_id'           => $otherUser->id,
        'asset_category_id' => $this->category->id,
    ]);

    $this->getJson("/api/v1/assets/{$asset->id}")->assertForbidden();
});

test('user can update their asset', function () {
    $asset = Asset::factory()->create([
        'user_id'           => $this->user->id,
        'asset_category_id' => $this->category->id,
        'current_value'     => 5000,
    ]);

    $response = $this->putJson("/api/v1/assets/{$asset->id}", [
        'current_value' => 5500,
    ]);

    $response->assertOk();
    expect($response->json('data.current_value'))->toBe(5500.0);
});

test('user can delete their asset', function () {
    $asset = Asset::factory()->create([
        'user_id'           => $this->user->id,
        'asset_category_id' => $this->category->id,
    ]);

    $this->deleteJson("/api/v1/assets/{$asset->id}")->assertOk();
    $this->assertDatabaseMissing('assets', ['id' => $asset->id]);
});

test('dashboard returns correct structure', function () {
    $response = $this->getJson('/api/v1/dashboard');
    $response->assertOk();
    $response->assertJsonStructure([
        'total_assets', 'total_liabilities', 'net_worth',
        'monthly_variation', 'yearly_variation',
        'allocation_category', 'overdue_assets',
    ]);
});
