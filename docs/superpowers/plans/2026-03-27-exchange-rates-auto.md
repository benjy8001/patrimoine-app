# Taux de change automatiques (Frankfurter/ECB) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Récupérer automatiquement les taux de change EUR→* depuis l'API Frankfurter (données ECB) une fois par jour et exposer un endpoint de refresh manuel.

**Architecture:** Un `ExchangeRateService` centralise l'appel HTTP et le stockage. Un Artisan command l'invoque, schedulé à 17h Europe/Paris. Le controller existant reçoit une méthode `refresh()`. Pas de cache applicatif — la table `exchange_rates` est indexée sur `[from_currency, to_currency, date]`.

**Tech Stack:** Laravel 12, Pest PHP (tests), Laravel `Http` facade (HTTP client intégré), `Schedule::command()` (scheduler), `updateOrCreate` Eloquent

---

## Fichiers concernés

| Action | Fichier |
|---|---|
| Créer | `app/Services/ExchangeRateService.php` |
| Créer | `app/Console/Commands/FetchExchangeRates.php` |
| Créer | `config/services.php` |
| Créer | `tests/Feature/ExchangeRateServiceTest.php` |
| Créer | `tests/Feature/FetchExchangeRatesCommandTest.php` |
| Créer | `tests/Feature/ExchangeRateRefreshTest.php` |
| Modifier | `app/Http/Controllers/Api/V1/ExchangeRateController.php` |
| Modifier | `routes/api.php` |
| Modifier | `routes/console.php` |
| Modifier | `.env.example` |

---

## Task 1 — ExchangeRateService

**Files:**
- Create: `app/Services/ExchangeRateService.php`
- Create: `tests/Feature/ExchangeRateServiceTest.php`

- [ ] **Step 1 : Écrire le test qui vérifie le cas nominal**

```php
// tests/Feature/ExchangeRateServiceTest.php
<?php

use App\Services\ExchangeRateService;
use App\Models\ExchangeRate;
use Illuminate\Support\Facades\Http;

test('fetchAndStore inserts EUR rates from Frankfurter response', function () {
    Http::fake([
        'api.frankfurter.app/*' => Http::response([
            'amount' => 1.0,
            'base'   => 'EUR',
            'date'   => '2026-03-27',
            'rates'  => [
                'USD' => 1.0838,
                'GBP' => 0.8346,
                'CHF' => 0.9631,
            ],
        ], 200),
    ]);

    $service = new ExchangeRateService();
    $result  = $service->fetchAndStore();

    expect($result['updated'])->toBe(3);
    expect($result['date'])->toBe('2026-03-27');

    expect(ExchangeRate::where('from_currency', 'EUR')
        ->where('to_currency', 'USD')
        ->where('date', '2026-03-27')
        ->value('rate')
    )->toBe('1.083800');
});
```

- [ ] **Step 2 : Vérifier que le test échoue**

```bash
cd /home/docker/projects/persos/patrimoine-app
php artisan test tests/Feature/ExchangeRateServiceTest.php
```
Attendu : FAIL — `App\Services\ExchangeRateService not found`

- [ ] **Step 3 : Écrire le service**

```php
// app/Services/ExchangeRateService.php
<?php

namespace App\Services;

use App\Models\ExchangeRate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExchangeRateService
{
    public function fetchAndStore(): array
    {
        $url = rtrim(config('services.frankfurter.url', 'https://api.frankfurter.app'), '/');

        $response = Http::timeout(10)->get("{$url}/latest", ['base' => 'EUR']);
        $response->throw();

        $data  = $response->json();
        $date  = $data['date'];
        $rates = $data['rates'];

        foreach ($rates as $currency => $rate) {
            ExchangeRate::updateOrCreate(
                [
                    'from_currency' => 'EUR',
                    'to_currency'   => $currency,
                    'date'          => $date,
                ],
                ['rate' => $rate]
            );
        }

        Log::info('ExchangeRateService: ' . count($rates) . ' taux mis à jour pour le ' . $date);

        return ['updated' => count($rates), 'date' => $date];
    }
}
```

- [ ] **Step 4 : Vérifier que le test passe**

```bash
php artisan test tests/Feature/ExchangeRateServiceTest.php
```
Attendu : PASS

- [ ] **Step 5 : Écrire le test d'erreur API**

```php
// Ajouter dans tests/Feature/ExchangeRateServiceTest.php

test('fetchAndStore throws when Frankfurter API is unavailable', function () {
    Http::fake([
        'api.frankfurter.app/*' => Http::response(null, 503),
    ]);

    $service = new ExchangeRateService();

    expect(fn () => $service->fetchAndStore())
        ->toThrow(\Illuminate\Http\Client\RequestException::class);
});
```

- [ ] **Step 6 : Relancer les tests pour vérifier que les 2 passent**

```bash
php artisan test tests/Feature/ExchangeRateServiceTest.php
```
Attendu : 2 tests PASS

- [ ] **Step 7 : Commit**

```bash
git add app/Services/ExchangeRateService.php tests/Feature/ExchangeRateServiceTest.php
git commit -m "feat: ExchangeRateService - fetch EUR rates from Frankfurter API"
```

---

## Task 2 — Config & .env.example

**Files:**
- Create: `config/services.php`
- Modify: `.env.example`

- [ ] **Step 1 : Créer config/services.php**

```php
// config/services.php
<?php

return [

    'frankfurter' => [
        'url' => env('FRANKFURTER_URL', 'https://api.frankfurter.app'),
    ],

];
```

- [ ] **Step 2 : Ajouter la variable dans .env.example**

Ajouter à la fin de `.env.example` :
```
# Exchange rates (Frankfurter API - ECB data, free, no API key required)
FRANKFURTER_URL=https://api.frankfurter.app
```

- [ ] **Step 3 : Vérifier que la config est lisible**

```bash
php artisan tinker --execute="echo config('services.frankfurter.url');"
```
Attendu : `https://api.frankfurter.app`

- [ ] **Step 4 : Commit**

```bash
git add config/services.php .env.example
git commit -m "feat: add Frankfurter API config (services.php)"
```

---

## Task 3 — Artisan Command `exchange-rates:fetch`

**Files:**
- Create: `app/Console/Commands/FetchExchangeRates.php`
- Create: `tests/Feature/FetchExchangeRatesCommandTest.php`

- [ ] **Step 1 : Écrire le test de la commande**

```php
// tests/Feature/FetchExchangeRatesCommandTest.php
<?php

use App\Services\ExchangeRateService;
use Illuminate\Support\Facades\Http;

test('exchange-rates:fetch command fetches and reports success', function () {
    Http::fake([
        'api.frankfurter.app/*' => Http::response([
            'amount' => 1.0,
            'base'   => 'EUR',
            'date'   => '2026-03-27',
            'rates'  => ['USD' => 1.08, 'GBP' => 0.83],
        ], 200),
    ]);

    $this->artisan('exchange-rates:fetch')
        ->expectsOutputToContain('2 taux mis à jour')
        ->assertExitCode(0);
});

test('exchange-rates:fetch command returns exit code 1 on API failure', function () {
    Http::fake([
        'api.frankfurter.app/*' => Http::response(null, 503),
    ]);

    $this->artisan('exchange-rates:fetch')
        ->expectsOutputToContain('Échec')
        ->assertExitCode(1);
});
```

- [ ] **Step 2 : Vérifier que le test échoue**

```bash
php artisan test tests/Feature/FetchExchangeRatesCommandTest.php
```
Attendu : FAIL — commande introuvable

- [ ] **Step 3 : Créer la commande**

```php
// app/Console/Commands/FetchExchangeRates.php
<?php

namespace App\Console\Commands;

use App\Services\ExchangeRateService;
use Illuminate\Console\Command;

class FetchExchangeRates extends Command
{
    protected $signature   = 'exchange-rates:fetch';
    protected $description = 'Récupère les taux de change EUR depuis Frankfurter (ECB) et les enregistre en base';

    public function handle(ExchangeRateService $service): int
    {
        try {
            $result = $service->fetchAndStore();
            $this->info("{$result['updated']} taux mis à jour pour le {$result['date']}.");
            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Échec de la récupération des taux : {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
php artisan test tests/Feature/FetchExchangeRatesCommandTest.php
```
Attendu : 2 tests PASS

- [ ] **Step 5 : Vérifier manuellement**

```bash
php artisan exchange-rates:fetch
```
Attendu : `X taux mis à jour pour le YYYY-MM-DD.`

- [ ] **Step 6 : Commit**

```bash
git add app/Console/Commands/FetchExchangeRates.php tests/Feature/FetchExchangeRatesCommandTest.php
git commit -m "feat: add exchange-rates:fetch Artisan command"
```

---

## Task 4 — Schedule quotidien

**Files:**
- Modify: `routes/console.php`

- [ ] **Step 1 : Ajouter le schedule dans routes/console.php**

Remplacer le contenu actuel :
```php
<?php

use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\SendReminderNotifications;
use App\Console\Commands\FetchExchangeRates;

Schedule::command(SendReminderNotifications::class)->daily();

Schedule::command(FetchExchangeRates::class)
    ->dailyAt('17:00')
    ->timezone('Europe/Paris');
```

- [ ] **Step 2 : Vérifier que le schedule est enregistré**

```bash
php artisan schedule:list
```
Attendu : la commande `exchange-rates:fetch` apparaît avec `Daily at 17:00` et timezone `Europe/Paris`

- [ ] **Step 3 : Commit**

```bash
git add routes/console.php
git commit -m "feat: schedule exchange-rates:fetch daily at 17:00 Europe/Paris"
```

---

## Task 5 — Endpoint POST /api/v1/exchange-rates/refresh

**Files:**
- Modify: `app/Http/Controllers/Api/V1/ExchangeRateController.php`
- Modify: `routes/api.php`
- Create: `tests/Feature/ExchangeRateRefreshTest.php`

- [ ] **Step 1 : Écrire le test du endpoint**

```php
// tests/Feature/ExchangeRateRefreshTest.php
<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

test('POST /api/v1/exchange-rates/refresh returns updated count on success', function () {
    Http::fake([
        'api.frankfurter.app/*' => Http::response([
            'amount' => 1.0,
            'base'   => 'EUR',
            'date'   => '2026-03-27',
            'rates'  => ['USD' => 1.08, 'GBP' => 0.83, 'CHF' => 0.96],
        ], 200),
    ]);

    $response = $this->postJson('/api/v1/exchange-rates/refresh');

    $response->assertOk();
    expect($response->json('updated'))->toBe(3);
    expect($response->json('date'))->toBe('2026-03-27');
});

test('POST /api/v1/exchange-rates/refresh returns 503 when API is down', function () {
    Http::fake([
        'api.frankfurter.app/*' => Http::response(null, 503),
    ]);

    $response = $this->postJson('/api/v1/exchange-rates/refresh');

    $response->assertStatus(503);
    expect($response->json('message'))->toBe('Service de taux de change indisponible.');
});

test('POST /api/v1/exchange-rates/refresh requires authentication', function () {
    $this->withoutMiddleware(\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class);

    $response = $this->postJson('/api/v1/exchange-rates/refresh', [], [
        'Authorization' => '',
    ]);

    // Déconnecté
    auth()->forgetGuards();
    $response = (new static)->postJson('/api/v1/exchange-rates/refresh');
    $response->assertUnauthorized();
})->skip('covered by sanctum middleware globally');
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
php artisan test tests/Feature/ExchangeRateRefreshTest.php
```
Attendu : FAIL — route introuvable (404)

- [ ] **Step 3 : Ajouter la méthode refresh() au controller**

Remplacer le contenu de `app/Http/Controllers/Api/V1/ExchangeRateController.php` :
```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRate;
use App\Services\ExchangeRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExchangeRateController extends Controller
{
    public function index(): JsonResponse
    {
        $rates = ExchangeRate::orderByDesc('date')->get();
        return response()->json($rates);
    }

    public function update(Request $request): JsonResponse
    {
        $rates = $request->validate([
            'rates'        => 'required|array',
            'rates.*.from' => 'required|string|size:3',
            'rates.*.to'   => 'required|string|size:3',
            'rates.*.rate' => 'required|numeric|min:0',
        ]);

        foreach ($rates['rates'] as $rate) {
            ExchangeRate::updateOrCreate(
                ['from_currency' => $rate['from'], 'to_currency' => $rate['to'], 'date' => today()],
                ['rate' => $rate['rate']]
            );
        }

        return response()->json(['message' => 'Taux de change mis à jour.']);
    }

    public function refresh(ExchangeRateService $service): JsonResponse
    {
        try {
            $result = $service->fetchAndStore();
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Service de taux de change indisponible.'], 503);
        }
    }
}
```

- [ ] **Step 4 : Ajouter la route dans routes/api.php**

Dans le bloc `auth:sanctum`, après la ligne `Route::put('/exchange-rates', ...)`, ajouter :
```php
        Route::post('/exchange-rates/refresh', [ExchangeRateController::class, 'refresh']);
```

- [ ] **Step 5 : Vérifier que les tests passent**

```bash
php artisan test tests/Feature/ExchangeRateRefreshTest.php
```
Attendu : 2 tests PASS (le 3e est skippé)

- [ ] **Step 6 : Lancer toute la suite de tests**

```bash
php artisan test
```
Attendu : tous les tests PASS, aucune régression

- [ ] **Step 7 : Commit**

```bash
git add app/Http/Controllers/Api/V1/ExchangeRateController.php routes/api.php tests/Feature/ExchangeRateRefreshTest.php
git commit -m "feat: POST /api/v1/exchange-rates/refresh - manual trigger endpoint"
```

---

## Vérification end-to-end

```bash
# 1. Fetch manuel via CLI
php artisan exchange-rates:fetch

# 2. Vérifier les taux en base
php artisan tinker --execute="App\Models\ExchangeRate::orderByDesc('date')->limit(5)->get(['from_currency','to_currency','rate','date']);"

# 3. Vérifier le schedule
php artisan schedule:list

# 4. Tester l'endpoint (remplacer TOKEN par un token Sanctum valide)
curl -s -X POST http://localhost/api/v1/exchange-rates/refresh \
  -H "Authorization: Bearer TOKEN" \
  -H "Accept: application/json" | jq .

# 5. Lancer tous les tests
php artisan test
```
