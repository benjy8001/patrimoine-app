# Projections de Patrimoine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une section "Projections" dans la page Reports permettant de simuler la croissance future du patrimoine selon des taux de croissance et d'épargne configurables par catégorie d'actif.

**Architecture:** Nouveau `ProjectionService` (logique de calcul) + `ProjectionController` (3 endpoints REST) côté backend. Côté frontend : hook `useProjection` + 3 composants React intégrés dans la page Reports existante. Pas de nouvelle table DB — les paramètres persistent dans la table `settings` sous la clé `projection_settings`.

**Tech Stack:** Laravel 12 / Pest PHP (backend), React 18 / TypeScript / Recharts / Vitest (frontend), Docker (`docker compose exec -w /var/www/html phpfpm`).

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `app/Services/ProjectionService.php` | Créer |
| `app/Http/Controllers/Api/V1/ProjectionController.php` | Créer |
| `app/Http/Requests/ProjectionRequest.php` | Créer |
| `routes/api.php` | Modifier (3 routes) |
| `tests/Feature/ProjectionTest.php` | Créer |
| `resources/js/types/index.ts` | Modifier (nouveaux types) |
| `resources/js/api/projections.ts` | Créer |
| `resources/js/hooks/useProjection.ts` | Créer |
| `resources/js/pages/Reports/ProjectionParams.tsx` | Créer |
| `resources/js/pages/Reports/ProjectionChart.tsx` | Créer |
| `resources/js/pages/Reports/ProjectionsSection.tsx` | Créer |
| `resources/js/pages/Reports.tsx` | Modifier (importer la section) |

---

## Task 1 : ProjectionService — logique de calcul (TDD)

**Files:**
- Create: `app/Services/ProjectionService.php`
- Test: `tests/Feature/ProjectionTest.php` (partie service)

- [ ] **Étape 1 : Écrire les tests qui échouent**

Créer `tests/Feature/ProjectionTest.php` :

```php
<?php

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\User;
use App\Services\ProjectionService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'currency' => 'EUR',
        'locale'   => 'fr',
        'timezone' => 'Europe/Paris',
    ]);

    $this->category = AssetCategory::create([
        'name'      => 'Livrets',
        'slug'      => 'livrets',
        'type'      => 'bank',
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
        'name' => 'ETF', 'slug' => 'etf', 'type' => 'stock',
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
```

- [ ] **Étape 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/ProjectionTest.php
```

Résultat attendu : erreur `Class "App\Services\ProjectionService" not found`.

- [ ] **Étape 3 : Implémenter ProjectionService**

Créer `app/Services/ProjectionService.php` :

```php
<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\ExchangeRate;
use App\Models\User;

class ProjectionService
{
    public function __construct(private readonly User $user) {}

    /**
     * Simulate future patrimony growth.
     *
     * @param  array{
     *   horizon_years: int,
     *   inflation_rate: float|null,
     *   category_rates: array<string, array{growth_rate: float, monthly_savings: float}>
     * } $params
     */
    public function simulate(array $params): array
    {
        $horizonYears   = (int) $params['horizon_years'];
        $inflationRate  = (float) ($params['inflation_rate'] ?? 0) / 100;
        $categoryRates  = $params['category_rates'] ?? [];

        $initialByCategory = $this->getInitialValuesByCategory();

        if (empty($initialByCategory)) {
            return [
                'current_value'      => 0.0,
                'projected_value'    => 0.0,
                'data_points'        => [],
                'cumulative_savings' => 0.0,
                'inflation_adjusted' => $inflationRate > 0,
            ];
        }

        $dataPoints = [];

        for ($n = 1; $n <= $horizonYears; $n++) {
            $total     = 0.0;
            $breakdown = [];

            foreach ($initialByCategory as $categoryId => $initialValue) {
                $rates         = $categoryRates[(string) $categoryId] ?? ['growth_rate' => 0, 'monthly_savings' => 0];
                $annualRate    = (float) $rates['growth_rate'] / 100;
                $monthlySav    = (float) ($rates['monthly_savings'] ?? 0);

                // Capital compound growth: V₀ × (1 + r)ⁿ
                $capital = $initialValue * pow(1 + $annualRate, $n);

                // Savings future value (ordinary annuity)
                if ($annualRate > 0) {
                    $monthlyRate = $annualRate / 12;
                    $savings = $monthlySav * (pow(1 + $monthlyRate, 12 * $n) - 1) / $monthlyRate;
                } else {
                    $savings = $monthlySav * 12 * $n;
                }

                $nominal = $capital + $savings;

                // Inflation-adjusted real value
                $real = $inflationRate > 0
                    ? $nominal / pow(1 + $inflationRate, $n)
                    : $nominal;

                $breakdown[(string) $categoryId] = round($real, 2);
                $total += $real;
            }

            $dataPoints[] = [
                'year'      => $n,
                'total'     => round($total, 2),
                'breakdown' => $breakdown,
            ];
        }

        // Cumulative savings = raw contributions (no compounding)
        $cumulativeSavings = array_sum(array_map(
            fn($rates) => (float) ($rates['monthly_savings'] ?? 0) * 12 * $horizonYears,
            $categoryRates
        ));

        $currentValue    = round((float) array_sum($initialByCategory), 2);
        $projectedValue  = !empty($dataPoints) ? end($dataPoints)['total'] : $currentValue;

        return [
            'current_value'      => $currentValue,
            'projected_value'    => round($projectedValue, 2),
            'data_points'        => $dataPoints,
            'cumulative_savings' => round($cumulativeSavings, 2),
            'inflation_adjusted' => $inflationRate > 0,
        ];
    }

    /**
     * Returns current EUR-converted value of active non-liability assets, keyed by category_id (string).
     *
     * @return array<string, float>
     */
    private function getInitialValuesByCategory(): array
    {
        return $this->user->assets()
            ->active()
            ->assets()   // scopeAssets: where is_liability = false
            ->with('category')
            ->get()
            ->groupBy('asset_category_id')
            ->map(fn($assets) => round(
                $assets->sum(fn(Asset $a) => (float) $a->current_value * ExchangeRate::getRate($a->currency, 'EUR')),
                2
            ))
            ->toArray();
    }
}
```

- [ ] **Étape 4 : Lancer les tests — vérifier qu'ils passent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/ProjectionTest.php --filter="projects|aggregates|returns empty|excludes"
```

Résultat attendu : 7 tests PASS.

- [ ] **Étape 5 : Commit**

```bash
git add app/Services/ProjectionService.php tests/Feature/ProjectionTest.php
git commit -m "feat: add ProjectionService with compound growth and savings annuity formulas"
```

---

## Task 2 : ProjectionController + FormRequest + Routes (TDD)

**Files:**
- Create: `app/Http/Controllers/Api/V1/ProjectionController.php`
- Create: `app/Http/Requests/ProjectionRequest.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/ProjectionTest.php` (ajouter les tests controller)

- [ ] **Étape 1 : Ajouter les tests controller**

Ajouter à la fin de `tests/Feature/ProjectionTest.php` :

```php
// --- Tests ProjectionController ---

test('GET /projections/settings returns defaults when no settings saved', function () {
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
```

- [ ] **Étape 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/ProjectionTest.php --filter="GET /projections|PUT /projections|POST /projections|require auth"
```

Résultat attendu : erreur 404 (routes inexistantes).

- [ ] **Étape 3 : Créer la FormRequest**

Créer `app/Http/Requests/ProjectionRequest.php` :

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProjectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'horizon_years'                       => 'required|integer|min:1|max:50',
            'target_age'                          => 'nullable|integer|min:1|max:120',
            'current_age'                         => 'nullable|integer|min:1|max:120',
            'inflation_rate'                      => 'nullable|numeric|min:0|max:20',
            'category_rates'                      => 'required|array',
            'category_rates.*.growth_rate'        => 'required|numeric|min:0|max:100',
            'category_rates.*.monthly_savings'    => 'required|numeric|min:0',
        ];
    }
}
```

- [ ] **Étape 4 : Créer le controller**

Créer `app/Http/Controllers/Api/V1/ProjectionController.php` :

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProjectionRequest;
use App\Models\Asset;
use App\Models\Setting;
use App\Services\ProjectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectionController extends Controller
{
    public function getSettings(Request $request): JsonResponse
    {
        $user     = $request->user();
        $settings = $user->getSetting('projection_settings');

        $categories = $user->assets()
            ->active()
            ->assets()
            ->with('category')
            ->get()
            ->pluck('category')
            ->unique('id')
            ->filter()
            ->map(fn($cat) => [
                'id'    => $cat->id,
                'name'  => $cat->name,
                'color' => $cat->color,
                'icon'  => $cat->icon,
            ])
            ->values();

        return response()->json([
            'settings'   => $settings,
            'categories' => $categories,
        ]);
    }

    public function saveSettings(ProjectionRequest $request): JsonResponse
    {
        Setting::updateOrCreate(
            ['user_id' => $request->user()->id, 'key' => 'projection_settings'],
            ['value'   => $request->validated()]
        );

        return response()->json(['message' => 'Paramètres sauvegardés.']);
    }

    public function simulate(ProjectionRequest $request): JsonResponse
    {
        $service = new ProjectionService($request->user());
        $result  = $service->simulate($request->validated());

        return response()->json($result);
    }
}
```

- [ ] **Étape 5 : Ajouter les routes**

Dans `routes/api.php`, ajouter dans le groupe `auth:sanctum` (après le bloc settings) :

```php
// Projections
Route::get('/projections/settings', [ProjectionController::class, 'getSettings']);
Route::put('/projections/settings', [ProjectionController::class, 'saveSettings']);
Route::post('/projections/simulate', [ProjectionController::class, 'simulate']);
```

Ajouter l'import en haut du fichier avec les autres use :
```php
use App\Http\Controllers\Api\V1\ProjectionController;
```

- [ ] **Étape 6 : Lancer tous les tests**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/ProjectionTest.php
```

Résultat attendu : tous les tests PASS.

- [ ] **Étape 7 : Commit**

```bash
git add app/Http/Controllers/Api/V1/ProjectionController.php \
        app/Http/Requests/ProjectionRequest.php \
        routes/api.php \
        tests/Feature/ProjectionTest.php
git commit -m "feat: add ProjectionController with simulate and settings endpoints"
```

---

## Task 3 : Types TypeScript + couche API frontend

**Files:**
- Modify: `resources/js/types/index.ts`
- Create: `resources/js/api/projections.ts`

- [ ] **Étape 1 : Ajouter les types**

Dans `resources/js/types/index.ts`, ajouter à la fin du fichier :

```typescript
// --- Projections ---

export interface CategoryProjectionRate {
  growth_rate: number
  monthly_savings: number
}

export interface ProjectionSettings {
  horizon_years: number
  target_age: number | null
  current_age: number | null
  inflation_rate: number
  category_rates: Record<string, CategoryProjectionRate>
}

export interface ProjectionDataPoint {
  year: number
  total: number
  breakdown: Record<string, number>
}

export interface ProjectionResult {
  current_value: number
  projected_value: number
  data_points: ProjectionDataPoint[]
  cumulative_savings: number
  inflation_adjusted: boolean
}

export interface ProjectionCategory {
  id: number
  name: string
  color: string
  icon: string
}

export interface ProjectionSettingsResponse {
  settings: ProjectionSettings | null
  categories: ProjectionCategory[]
}
```

- [ ] **Étape 2 : Créer la couche API**

Créer `resources/js/api/projections.ts` :

```typescript
import api from './axios'
import type {
  ProjectionSettings,
  ProjectionSettingsResponse,
  ProjectionResult,
} from '../types'

export const projectionsApi = {
  async getSettings(): Promise<ProjectionSettingsResponse> {
    const res = await api.get<ProjectionSettingsResponse>('/projections/settings')
    return res.data
  },

  async saveSettings(settings: ProjectionSettings): Promise<void> {
    await api.put('/projections/settings', settings)
  },

  async simulate(params: ProjectionSettings): Promise<ProjectionResult> {
    const res = await api.post<ProjectionResult>('/projections/simulate', params)
    return res.data
  },
}
```

- [ ] **Étape 3 : Commit**

```bash
git add resources/js/types/index.ts resources/js/api/projections.ts
git commit -m "feat: add projection TypeScript types and API layer"
```

---

## Task 4 : Hook useProjection

**Files:**
- Create: `resources/js/hooks/useProjection.ts`

- [ ] **Étape 1 : Créer le hook**

Créer `resources/js/hooks/useProjection.ts` :

```typescript
import { useCallback, useEffect, useRef, useState } from 'react'
import { projectionsApi } from '../api/projections'
import type {
  CategoryProjectionRate,
  ProjectionCategory,
  ProjectionResult,
  ProjectionSettings,
} from '../types'

const DEFAULT_SETTINGS: ProjectionSettings = {
  horizon_years:  20,
  target_age:     null,
  current_age:    null,
  inflation_rate: 0,
  category_rates: {},
}

export function useProjection() {
  const [settings, setSettings]       = useState<ProjectionSettings>(DEFAULT_SETTINGS)
  const [categories, setCategories]   = useState<ProjectionCategory[]>([])
  const [result, setResult]           = useState<ProjectionResult | null>(null)
  const [isLoading, setIsLoading]     = useState(false)
  const [isSaving, setIsSaving]       = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const debounceRef                   = useRef<ReturnType<typeof setTimeout>>()

  // Load saved settings and categories on mount
  useEffect(() => {
    projectionsApi.getSettings().then(({ settings: saved, categories: cats }) => {
      setCategories(cats)
      if (saved) setSettings(saved)
    })
  }, [])

  // Auto-simulate on settings change (debounced 500ms)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (Object.keys(settings.category_rates).length === 0 && categories.length === 0) return
      setIsLoading(true)
      setError(null)
      projectionsApi.simulate(settings)
        .then(setResult)
        .catch(() => setError('Erreur lors de la simulation'))
        .finally(() => setIsLoading(false))
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [settings])

  const saveSettings = useCallback(async () => {
    setIsSaving(true)
    try {
      await projectionsApi.saveSettings(settings)
    } finally {
      setIsSaving(false)
    }
  }, [settings])

  const updateCategoryRate = useCallback((
    categoryId: number,
    field: keyof CategoryProjectionRate,
    value: number,
  ) => {
    setSettings(prev => ({
      ...prev,
      category_rates: {
        ...prev.category_rates,
        [String(categoryId)]: {
          growth_rate:    prev.category_rates[String(categoryId)]?.growth_rate    ?? 0,
          monthly_savings: prev.category_rates[String(categoryId)]?.monthly_savings ?? 0,
          [field]: value,
        },
      },
    }))
  }, [])

  const updateHorizon = useCallback((years: number) => {
    setSettings(prev => ({
      ...prev,
      horizon_years: years,
      target_age: prev.current_age != null ? prev.current_age + years : prev.target_age,
    }))
  }, [])

  const updateTargetAge = useCallback((age: number) => {
    setSettings(prev => ({
      ...prev,
      target_age: age,
      horizon_years: prev.current_age != null
        ? Math.max(1, age - prev.current_age)
        : prev.horizon_years,
    }))
  }, [])

  const updateInflation = useCallback((rate: number) => {
    setSettings(prev => ({ ...prev, inflation_rate: rate }))
  }, [])

  const updateCurrentAge = useCallback((age: number | null) => {
    setSettings(prev => ({ ...prev, current_age: age }))
  }, [])

  return {
    settings,
    categories,
    result,
    isLoading,
    isSaving,
    error,
    saveSettings,
    updateCategoryRate,
    updateHorizon,
    updateTargetAge,
    updateInflation,
    updateCurrentAge,
  }
}
```

- [ ] **Étape 2 : Commit**

```bash
git add resources/js/hooks/useProjection.ts
git commit -m "feat: add useProjection hook with debounced simulation and settings persistence"
```

---

## Task 5 : Composant ProjectionParams

**Files:**
- Create: `resources/js/pages/Reports/ProjectionParams.tsx`

- [ ] **Étape 1 : Créer le composant**

Créer `resources/js/pages/Reports/ProjectionParams.tsx` :

```tsx
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { ProjectionCategory, ProjectionSettings } from '../../types'

interface Props {
  settings: ProjectionSettings
  categories: ProjectionCategory[]
  onHorizonChange: (years: number) => void
  onTargetAgeChange: (age: number) => void
  onCurrentAgeChange: (age: number | null) => void
  onInflationChange: (rate: number) => void
  onCategoryRateChange: (categoryId: number, field: 'growth_rate' | 'monthly_savings', value: number) => void
}

export default function ProjectionParams({
  settings,
  categories,
  onHorizonChange,
  onTargetAgeChange,
  onCurrentAgeChange,
  onInflationChange,
  onCategoryRateChange,
}: Props) {
  const [open, setOpen] = useState(!settings.horizon_years || categories.length === 0)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-700">Paramètres de projection</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="p-4 space-y-4">
          {/* Horizon + âge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Horizon ({settings.horizon_years} ans)
              </label>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={settings.horizon_years}
                onChange={e => onHorizonChange(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>1 an</span>
                <span>50 ans</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Âge actuel (optionnel)</label>
              <input
                type="number"
                min={1}
                max={99}
                value={settings.current_age ?? ''}
                placeholder="—"
                onChange={e => onCurrentAgeChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Âge cible (optionnel)</label>
              <input
                type="number"
                min={1}
                max={120}
                value={settings.target_age ?? ''}
                placeholder="—"
                onChange={e => onTargetAgeChange(Number(e.target.value))}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* Inflation */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Inflation annuelle (%)
            </label>
            <input
              type="number"
              min={0}
              max={20}
              step={0.1}
              value={settings.inflation_rate}
              onChange={e => onInflationChange(Number(e.target.value))}
              className="w-24 border border-gray-200 rounded px-2 py-1.5 text-sm"
            />
            {settings.inflation_rate > 0 && (
              <span className="text-xs text-amber-600">Valeurs en euros constants</span>
            )}
          </div>

          {/* Taux par catégorie */}
          {categories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Paramètres par catégorie</p>
              <div className="space-y-2">
                {categories.map(cat => {
                  const rates = settings.category_rates[String(cat.id)] ?? { growth_rate: 0, monthly_savings: 0 }
                  return (
                    <div key={cat.id} className="grid grid-cols-3 items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm text-gray-700 truncate">{cat.name}</span>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Taux (%/an)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={rates.growth_rate}
                          onChange={e => onCategoryRateChange(cat.id, 'growth_rate', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Épargne (€/mois)</label>
                        <input
                          type="number"
                          min={0}
                          step={10}
                          value={rates.monthly_savings}
                          onChange={e => onCategoryRateChange(cat.id, 'monthly_savings', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {categories.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              Ajoutez des actifs pour configurer les paramètres par catégorie.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Étape 2 : Commit**

```bash
git add resources/js/pages/Reports/ProjectionParams.tsx
git commit -m "feat: add ProjectionParams collapsible configuration panel"
```

---

## Task 6 : Composant ProjectionChart

**Files:**
- Create: `resources/js/pages/Reports/ProjectionChart.tsx`

- [ ] **Étape 1 : Créer le composant**

Créer `resources/js/pages/Reports/ProjectionChart.tsx` :

```tsx
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ProjectionCategory, ProjectionResult } from '../../types'

interface Props {
  result: ProjectionResult
  categories: ProjectionCategory[]
  currency?: string
}

function formatEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatEurShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M€`
  if (value >= 1_000)     return `${Math.round(value / 1_000)} k€`
  return `${Math.round(value)} €`
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">Année {label}</p>
      {payload.map(entry => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name} : {formatEur(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function ProjectionChart({ result, categories, currency = 'EUR' }: Props) {
  const { data_points, current_value, projected_value, cumulative_savings, inflation_adjusted } = result

  // Prepend year 0 (current state)
  const chartData = [
    { year: 0, total: current_value },
    ...data_points,
  ]

  return (
    <div className="space-y-4">
      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            tickFormatter={v => v === 0 ? 'Auj.' : `+${v} ans`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
          />
          <YAxis
            tickFormatter={formatEurShort}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            width={64}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            name="Patrimoine total"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-600 font-medium">Valeur actuelle</p>
          <p className="text-base font-bold text-blue-700">{formatEur(current_value)}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-xs text-emerald-600 font-medium">
            Valeur projetée{inflation_adjusted ? ' (réelle)' : ''}
          </p>
          <p className="text-base font-bold text-emerald-700">{formatEur(projected_value)}</p>
        </div>
        {cumulative_savings > 0 && (
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-600 font-medium">Épargne cumulée</p>
            <p className="text-base font-bold text-amber-700">{formatEur(cumulative_savings)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Commit**

```bash
git add resources/js/pages/Reports/ProjectionChart.tsx
git commit -m "feat: add ProjectionChart Recharts component with summary cards"
```

---

## Task 7 : ProjectionsSection + intégration dans Reports

**Files:**
- Create: `resources/js/pages/Reports/ProjectionsSection.tsx`
- Modify: `resources/js/pages/Reports.tsx`

- [ ] **Étape 1 : Créer ProjectionsSection**

Créer `resources/js/pages/Reports/ProjectionsSection.tsx` :

```tsx
import { TrendingUp } from 'lucide-react'
import { useProjection } from '../../hooks/useProjection'
import ProjectionChart from './ProjectionChart'
import ProjectionParams from './ProjectionParams'

export default function ProjectionsSection() {
  const {
    settings,
    categories,
    result,
    isLoading,
    isSaving,
    error,
    saveSettings,
    updateCategoryRate,
    updateHorizon,
    updateTargetAge,
    updateCurrentAge,
    updateInflation,
  } = useProjection()

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-600" />
          <h2 className="text-base font-semibold text-gray-800">Projections</h2>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Sauvegarde…' : 'Sauvegarder les paramètres'}
        </button>
      </div>

      {/* Parameters panel */}
      <ProjectionParams
        settings={settings}
        categories={categories}
        onHorizonChange={updateHorizon}
        onTargetAgeChange={updateTargetAge}
        onCurrentAgeChange={updateCurrentAge}
        onInflationChange={updateInflation}
        onCategoryRateChange={updateCategoryRate}
      />

      {/* Chart or states */}
      {error && (
        <p className="text-sm text-red-500 text-center py-4">{error}</p>
      )}

      {!error && isLoading && (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
          Calcul en cours…
        </div>
      )}

      {!error && !isLoading && result && result.data_points.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">
          Ajoutez des actifs pour générer une projection.
        </p>
      )}

      {!error && !isLoading && result && result.data_points.length > 0 && (
        <ProjectionChart
          result={result}
          categories={categories}
        />
      )}
    </div>
  )
}
```

- [ ] **Étape 2 : Intégrer dans Reports.tsx**

Dans `resources/js/pages/Reports.tsx`, ajouter l'import et le composant :

En haut du fichier, ajouter l'import :
```tsx
import ProjectionsSection from './Reports/ProjectionsSection'
```

Dans le JSX de la page Reports, après la dernière section existante (avant le `</div>` fermant) :
```tsx
{/* Projections */}
<div className="bg-white rounded-xl border border-gray-200 p-5">
  <ProjectionsSection />
</div>
```

- [ ] **Étape 3 : Vérifier la compilation TypeScript**

```bash
docker compose exec -w /var/www/html phpfpm sh -c "cd /var/www/html && true"
# Côté frontend (hors Docker) :
npx tsc --noEmit
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Étape 4 : Lancer tous les tests backend**

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest tests/Feature/ProjectionTest.php
```

Résultat attendu : tous les tests PASS.

- [ ] **Étape 5 : Commit final**

```bash
git add resources/js/pages/Reports/ProjectionsSection.tsx \
        resources/js/pages/Reports.tsx \
        resources/js/hooks/useProjection.ts
git commit -m "feat: integrate ProjectionsSection into Reports page"
```

---

## Vérification end-to-end

1. Lancer l'app : `make run` puis `make assets-watch`
2. Se connecter avec le compte demo (`demo@patrimoine.local` / `password`)
3. Naviguer vers `/reports` → section "Projections" visible en bas de page
4. Cliquer "Paramètres" → panneau s'ouvre avec les catégories du portefeuille
5. Modifier un taux → le graphique se met à jour après 500 ms
6. Modifier le slider horizon → la courbe s'étend / se raccourcit
7. Saisir un âge actuel (ex: 35) + âge cible (ex: 60) → horizon passe à 25
8. Activer un taux d'inflation → label "Valeurs en euros constants" apparaît, les projections baissent
9. Cliquer "Sauvegarder" → rechargement de la page conserve tous les paramètres
10. Aucun actif dans le portefeuille → message "Ajoutez des actifs pour générer une projection"

## Tous les tests backend

```bash
docker compose exec -w /var/www/html phpfpm ./vendor/bin/pest
```

Résultat attendu : tous les tests existants + les nouveaux PASS, aucune régression.
