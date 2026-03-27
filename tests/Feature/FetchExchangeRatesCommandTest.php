<?php

use App\Services\ExchangeRateService;
use Illuminate\Support\Facades\Http;

test('exchange-rates:fetch command reports success', function () {
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
