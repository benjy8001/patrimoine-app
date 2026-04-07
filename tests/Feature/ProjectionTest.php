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
