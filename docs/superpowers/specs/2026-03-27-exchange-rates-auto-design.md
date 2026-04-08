# Taux de change automatiques — Design Spec

**Date :** 2026-03-27
**Feature :** Récupération automatique des taux de change via Frankfurter API (ECB)
**Contrainte :** Solution 100% gratuite, sans dépendance Redis obligatoire

---

## Contexte

L'application gère un patrimoine multi-devises. La table `exchange_rates` et la méthode
`ExchangeRate::getRate()` existent déjà, mais les taux sont saisis manuellement via
`PUT /api/v1/exchange-rates`. L'objectif est d'automatiser cette mise à jour quotidiennement
en consommant l'API Frankfurter (wrapper JSON des données officielles ECB), sans clé API,
sans inscription, sans coût.

L'utilisateur n'utilise actuellement que l'EUR comme devise de base (cohérent avec
`convertToEur()` dans `PatrimonyCalculator`). Les ~30 devises majeures couvertes par
l'ECB sont suffisantes.

---

## Architecture

```
Frankfurter API (ECB)
        ↓  HTTP GET (Laravel Http facade)
ExchangeRateService::fetchAndStore()
        ↓  updateOrCreate()
  exchange_rates table (déjà indexée)
        ↑
ExchangeRate::getRate()  ←  PatrimonyCalculator (inchangé)
```

**Pas de cache applicatif** : la table est indexée sur `[from_currency, to_currency, date]`
(~30 lignes), la requête DB est négligeable. Pas de dépendance Redis/infra.

---

## Composants

### Nouveaux fichiers

#### `app/Services/ExchangeRateService.php`
- Méthode `fetchAndStore(): array` — seul point d'entrée
- Appel HTTP : `GET https://api.frankfurter.app/latest?base=EUR`
- Parsing JSON : `{ "date": "2026-03-27", "rates": { "USD": 1.08, ... } }`
- Pour chaque devise : `ExchangeRate::updateOrCreate(['from_currency' => 'EUR', 'to_currency' => $code, 'date' => $date], ['rate' => $rate])`
- Retourne `['updated' => N, 'date' => '...']`
- Exception catchée → log `error`, re-throw pour signaler l'échec à l'appelant

#### `app/Console/Commands/FetchExchangeRates.php`
- Signature : `exchange-rates:fetch`
- Instancie et appelle `ExchangeRateService::fetchAndStore()`
- Succès : `$this->info("X taux mis à jour pour le YYYY-MM-DD")`
- Erreur : `$this->error("Échec de la récupération : {message}")`, exit code 1

### Fichiers modifiés

#### `config/services.php`
Ajout :
```php
'frankfurter' => [
    'url' => env('FRANKFURTER_URL', 'https://api.frankfurter.app'),
],
```

#### `.env.example`
Ajout :
```
FRANKFURTER_URL=https://api.frankfurter.app
```

#### `routes/console.php`
Schedule quotidien à 17h00 (Europe/Paris, après mise à jour ECB ~16h CET) :
```php
Schedule::command('exchange-rates:fetch')
    ->dailyAt('17:00')
    ->timezone('Europe/Paris')
    ->onFailure(function () { /* log déjà dans la commande */ });
```

#### `app/Http/Controllers/Api/V1/ExchangeRateController.php`
Ajout méthode `refresh()` :
- `POST /api/v1/exchange-rates/refresh`
- Appelle `ExchangeRateService::fetchAndStore()`
- Succès : `200 { updated: N, date: "..." }`
- Erreur API externe : `503 { message: "Service de taux indisponible" }`

#### `routes/api.php`
```php
Route::post('/exchange-rates/refresh', [ExchangeRateController::class, 'refresh']);
```

---

## Gestion d'erreurs

| Situation | Comportement |
|---|---|
| API Frankfurter down | Exception catchée, log `error`, taux existants conservés en DB |
| Réponse JSON malformée | Validation avant insert, log `warning`, aucun taux écrasé |
| Week-end / jour férié | Frankfurter retourne le dernier taux disponible — transparent |
| Refresh manuel (API down) | HTTP 503 avec message explicite |
| Timeout HTTP | Laravel `Http::timeout(10)` — fail rapide, log erreur |

---

## Vérification

```bash
# Lancer manuellement
php artisan exchange-rates:fetch

# Vérifier en base
php artisan tinker --execute="DB::table('exchange_rates')->orderByDesc('date')->limit(5)->get()"

# Tester le refresh via API
curl -X POST http://localhost/api/v1/exchange-rates/refresh \
  -H "Authorization: Bearer {token}"

# Vérifier le schedule (dry-run)
php artisan schedule:list
```

---

## Fichiers critiques

| Fichier | Action |
|---|---|
| `app/Services/ExchangeRateService.php` | **Créer** |
| `app/Console/Commands/FetchExchangeRates.php` | **Créer** |
| `app/Http/Controllers/Api/V1/ExchangeRateController.php` | **Modifier** (ajout `refresh()`) |
| `routes/api.php` | **Modifier** (ajout route POST refresh) |
| `routes/console.php` | **Modifier** (ajout schedule) |
| `config/services.php` | **Modifier** (ajout frankfurter config) |
| `.env.example` | **Modifier** (ajout `FRANKFURTER_URL`) |

---

## Ce qui n'est PAS dans le scope

- Cache Redis / applicatif (ajout ultérieur si besoin perf)
- Notification email en cas d'échec (peut s'ajouter sur `->onFailure()`)
- Support d'autres bases que EUR
- Migration DB (table existante suffisante)
