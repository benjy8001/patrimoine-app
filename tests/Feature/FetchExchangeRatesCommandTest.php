<?php

use App\Services\ExchangeRateService;

test('exchange-rates:fetch command reports success', function () {
    $mockService = $this->mock(ExchangeRateService::class)
        ->shouldReceive('fetchAndStore')
        ->andReturn(['updated' => 2, 'date' => '2026-03-27'])
        ->getMock();

    $this->app->instance(ExchangeRateService::class, $mockService);

    $this->artisan('exchange-rates:fetch')
        ->expectsOutputToContain('2 taux mis à jour')
        ->assertExitCode(0);
});

test('exchange-rates:fetch command returns exit code 1 on API failure', function () {
    $mockService = $this->mock(ExchangeRateService::class)
        ->shouldReceive('fetchAndStore')
        ->andThrow(new \RuntimeException('Service unavailable'))
        ->getMock();

    $this->app->instance(ExchangeRateService::class, $mockService);

    $this->artisan('exchange-rates:fetch')
        ->expectsOutputToContain('Échec')
        ->assertExitCode(1);
});

test('exchange-rates:fetch command handles malformed response exception', function () {
    $mockService = $this->mock(ExchangeRateService::class)
        ->shouldReceive('fetchAndStore')
        ->andThrow(new \RuntimeException('Réponse Frankfurter malformée'))
        ->getMock();

    $this->app->instance(ExchangeRateService::class, $mockService);

    $this->artisan('exchange-rates:fetch')
        ->expectsOutputToContain('Échec')
        ->assertExitCode(1);
});
