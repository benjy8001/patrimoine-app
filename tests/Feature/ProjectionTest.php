<?php

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\User;
use App\Services\ProjectionService;

beforeEach(function () {
    $this->user = User::factory()->create([
        'currency' => 'EUR',
        'locale'   => 'fr',
        'timezone' => 'Europe/Paris',
    ]);

    $this->category = AssetCategory::create([
        'name'      => 'Livrets',
        'slug'      => 'livrets',
        'type'      => 'asset',
        'icon'      => 'bank',
        'color'     => '#00bcd4',
        'is_system' => true,
        'sort_order' => 1,
    ]);

    // Helper pour créer un asset actif non-passif
    $this->makeAsset = fn(array $attrs = []) => Asset::factory()->create(array_merge([
        'user_id'           => $this->user->id,
        'asset_category_id' => $this->category->id,
        'current_value'     => 100000,
        'currency'          => 'EUR',
        'status'            => 'active',
        'is_liability'      => false,
    ], $attrs));
});

// --- Tests ProjectionService ---

test('projects capital only with zero savings and zero inflation', function () {
    ($this->makeAsset)(['current_value' => 100000]);

    $service = new ProjectionService($this->user);
    $result  = $service->simulate([
        'horizon_years'  => 3,
        'inflation_rate' => 0,
        'category_rates' => [
            (string) $this->category->id => ['growth_rate' => 10, 'monthly_savings' => 0],
        ],
    ]);

    expect($result['current_value'])->toBe(100000.0)
        ->and($result['data_points'])->toHaveCount(3)
        ->and($result['data_points'][0]['total'])->toBe(110000.0)   // 100000 × 1.10^1
        ->and($result['data_points'][1]['total'])->toBe(121000.0)   // 100000 × 1.10^2
        ->and($result['data_points'][2]['total'])->toBe(133100.0)   // 100000 × 1.10^3
        ->and($result['cumulative_savings'])->toBe(0.0)
        ->and($result['inflation_adjusted'])->toBeFalse();
});

test('projects savings only with zero growth rate', function () {
    ($this->makeAsset)(['current_value' => 0]);

    $service = new ProjectionService($this->user);
    $result  = $service->simulate([
        'horizon_years'  => 2,
        'inflation_rate' => 0,
        'category_rates' => [
            (string) $this->category->id => ['growth_rate' => 0, 'monthly_savings' => 1000],
        ],
    ]);

    // Taux = 0 : FV = savings × 12 × n
    expect($result['data_points'][0]['total'])->toBe(12000.0)   // 1000 × 12 × 1
        ->and($result['data_points'][1]['total'])->toBe(24000.0) // 1000 × 12 × 2
        ->and($result['cumulative_savings'])->toBe(24000.0);    // 1000 × 12 × 2
});

test('projects with monthly savings and compound growth', function () {
    ($this->makeAsset)(['current_value' => 0]);

    $service = new ProjectionService($this->user);
    $result  = $service->simulate([
        'horizon_years'  => 1,
        'inflation_rate' => 0,
        'category_rates' => [
            (string) $this->category->id => ['growth_rate' => 12, 'monthly_savings' => 100],
        ],
    ]);

    // FV annuité : 100 × ((1.01)^12 - 1) / 0.01 ≈ 1268.25
    expect($result['data_points'][0]['total'])->toBeGreaterThan(1268.0)
        ->and($result['data_points'][0]['total'])->toBeLessThan(1269.0);
});

test('applies inflation adjustment', function () {
    ($this->makeAsset)(['current_value' => 100000]);

    $service = new ProjectionService($this->user);
    $result  = $service->simulate([
        'horizon_years'  => 1,
        'inflation_rate' => 10,
        'category_rates' => [
            (string) $this->category->id => ['growth_rate' => 10, 'monthly_savings' => 0],
        ],
    ]);

    // nominal = 100000 × 1.10 = 110000; réel = 110000 / 1.10 = 100000
    expect($result['data_points'][0]['total'])->toBe(100000.0)
        ->and($result['inflation_adjusted'])->toBeTrue();
});

test('aggregates multiple categories', function () {
    $cat2 = AssetCategory::create([
        'name' => 'ETF', 'slug' => 'etf', 'type' => 'asset',
        'icon' => 'chart', 'color' => '#4caf50', 'is_system' => true, 'sort_order' => 2,
    ]);

    ($this->makeAsset)(['asset_category_id' => $this->category->id, 'current_value' => 50000]);
    ($this->makeAsset)(['asset_category_id' => $cat2->id, 'current_value' => 50000]);

    $service = new ProjectionService($this->user);
    $result  = $service->simulate([
        'horizon_years'  => 1,
        'inflation_rate' => 0,
        'category_rates' => [
            (string) $this->category->id => ['growth_rate' => 0, 'monthly_savings' => 0],
            (string) $cat2->id           => ['growth_rate' => 0, 'monthly_savings' => 0],
        ],
    ]);

    expect($result['current_value'])->toBe(100000.0)
        ->and($result['data_points'][0]['total'])->toBe(100000.0)
        ->and($result['data_points'][0]['breakdown'])->toHaveKey((string) $this->category->id)
        ->and($result['data_points'][0]['breakdown'])->toHaveKey((string) $cat2->id);
});

test('returns empty result when user has no active assets', function () {
    $service = new ProjectionService($this->user);
    $result  = $service->simulate([
        'horizon_years'  => 10,
        'inflation_rate' => 0,
        'category_rates' => [],
    ]);

    expect($result['current_value'])->toBe(0.0)
        ->and($result['data_points'])->toBeEmpty();
});

test('excludes liabilities from projection', function () {
    ($this->makeAsset)(['current_value' => 100000, 'is_liability' => false]);
    ($this->makeAsset)(['current_value' => 20000,  'is_liability' => true]);

    $service = new ProjectionService($this->user);
    $result  = $service->simulate([
        'horizon_years'  => 1,
        'inflation_rate' => 0,
        'category_rates' => [
            (string) $this->category->id => ['growth_rate' => 0, 'monthly_savings' => 0],
        ],
    ]);

    expect($result['current_value'])->toBe(100000.0);
});

test('throws InvalidArgumentException when horizon_years is less than 1', function () {
    $service = new ProjectionService($this->user);
    expect(fn () => $service->simulate([
        'horizon_years'  => 0,
        'inflation_rate' => 0,
        'category_rates' => [],
    ]))->toThrow(\InvalidArgumentException::class, 'horizon_years must be a positive integer.');
});

// --- Tests ProjectionController ---

test('GET /projections/settings returns null settings when none saved', function () {
    $this->actingAs($this->user);

    $response = $this->getJson('/api/v1/projections/settings');

    $response->assertOk();
    expect($response->json('settings'))->toBeNull()
        ->and($response->json('categories'))->toBeArray();
});

test('GET /projections/settings returns saved settings', function () {
    $this->actingAs($this->user);
    ($this->makeAsset)(['current_value' => 50000]);

    // Sauvegarder des paramètres
    $this->putJson('/api/v1/projections/settings', [
        'horizon_years'  => 15,
        'inflation_rate' => 2.5,
        'category_rates' => [
            (string) $this->category->id => ['growth_rate' => 5, 'monthly_savings' => 200],
        ],
    ])->assertOk();

    $response = $this->getJson('/api/v1/projections/settings');

    $response->assertOk();
    expect($response->json('settings.horizon_years'))->toBe(15)
        ->and($response->json('settings.inflation_rate'))->toBe(2.5);
});

test('GET /projections/settings returns categories user has assets in', function () {
    $this->actingAs($this->user);
    ($this->makeAsset)(['current_value' => 50000]);

    $response = $this->getJson('/api/v1/projections/settings');

    $response->assertOk();
    expect($response->json('categories'))->toHaveCount(1)
        ->and($response->json('categories.0.id'))->toBe($this->category->id)
        ->and($response->json('categories.0.name'))->toBe('Livrets');
});

test('PUT /projections/settings persists parameters', function () {
    $this->actingAs($this->user);

    $response = $this->putJson('/api/v1/projections/settings', [
        'horizon_years'  => 20,
        'inflation_rate' => 2.0,
        'category_rates' => [
            (string) $this->category->id => ['growth_rate' => 7, 'monthly_savings' => 500],
        ],
    ]);

    $response->assertOk();
    expect($response->json('message'))->toBe('Paramètres sauvegardés.');

    $this->assertDatabaseHas('settings', [
        'user_id' => $this->user->id,
        'key'     => 'projection_settings',
    ]);
});

test('POST /projections/simulate returns data points', function () {
    $this->actingAs($this->user);
    ($this->makeAsset)(['current_value' => 100000]);

    $response = $this->postJson('/api/v1/projections/simulate', [
        'horizon_years'  => 5,
        'inflation_rate' => 0,
        'category_rates' => [
            (string) $this->category->id => ['growth_rate' => 5, 'monthly_savings' => 0],
        ],
    ]);

    $response->assertOk();
    expect($response->json('data_points'))->toHaveCount(5)
        ->and($response->json('current_value'))->toBe(100000.0)
        ->and($response->json('projected_value'))->toBeGreaterThan(100000.0);
});

test('POST /projections/simulate requires horizon_years', function () {
    $this->actingAs($this->user);

    $this->postJson('/api/v1/projections/simulate', [
        'inflation_rate' => 0,
        'category_rates' => [],
    ])->assertUnprocessable();
});

test('POST /projections/simulate rejects invalid growth rate', function () {
    $this->actingAs($this->user);

    $this->postJson('/api/v1/projections/simulate', [
        'horizon_years'  => 10,
        'inflation_rate' => 0,
        'category_rates' => [
            '1' => ['growth_rate' => 150, 'monthly_savings' => 0],  // > 100
        ],
    ])->assertUnprocessable();
});

test('projection endpoints require authentication', function () {
    $this->getJson('/api/v1/projections/settings')->assertUnauthorized();
    $this->putJson('/api/v1/projections/settings', [])->assertUnauthorized();
    $this->postJson('/api/v1/projections/simulate', [])->assertUnauthorized();
});

test('GET /projections/settings does not expose another user settings', function () {
    $otherUser = User::factory()->create();
    \App\Models\Setting::create([
        'user_id' => $otherUser->id,
        'key'     => 'projection_settings',
        'value'   => ['horizon_years' => 99],
    ]);

    $this->actingAs($this->user);
    $response = $this->getJson('/api/v1/projections/settings');

    $response->assertOk();
    expect($response->json('settings'))->toBeNull();
});
