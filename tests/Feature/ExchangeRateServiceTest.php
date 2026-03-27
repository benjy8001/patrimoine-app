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

test('fetchAndStore throws when Frankfurter API is unavailable', function () {
    Http::fake([
        'api.frankfurter.app/*' => Http::response(null, 503),
    ]);

    $service = new ExchangeRateService();

    expect(fn () => $service->fetchAndStore())
        ->toThrow(\Illuminate\Http\Client\RequestException::class);
});
