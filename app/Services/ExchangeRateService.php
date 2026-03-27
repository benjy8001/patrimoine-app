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
