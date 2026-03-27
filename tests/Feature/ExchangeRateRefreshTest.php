<?php

use App\Models\User;
use App\Services\ExchangeRateService;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

test('POST /api/v1/exchange-rates/refresh returns updated count on success', function () {
    $mock = $this->mock(ExchangeRateService::class);
    $mock->expects('fetchAndStore')->andReturn(['updated' => 3, 'date' => '2026-03-27']);

    $response = $this->postJson('/api/v1/exchange-rates/refresh');

    $response->assertOk();
    expect($response->json('updated'))->toBe(3);
    expect($response->json('date'))->toBe('2026-03-27');
});

test('POST /api/v1/exchange-rates/refresh returns 503 when service throws', function () {
    $mock = $this->mock(ExchangeRateService::class);
    $mock->expects('fetchAndStore')->andThrow(new \RuntimeException('API down'));

    $response = $this->postJson('/api/v1/exchange-rates/refresh');

    $response->assertStatus(503);
    expect($response->json('message'))->toBe('Service de taux de change indisponible.');
});

test('POST /api/v1/exchange-rates/refresh requires authentication', function () {
    auth()->forgetGuards();

    $response = $this->postJson('/api/v1/exchange-rates/refresh');

    $response->assertUnauthorized();
});
