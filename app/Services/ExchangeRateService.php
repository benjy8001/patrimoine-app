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

        try {
            $response = Http::timeout(10)->get("{$url}/latest", ['base' => 'EUR']);
            $response->throw();

            $data = $response->json();

            if (!isset($data['date'], $data['rates']) || !is_array($data['rates'])) {
                Log::warning('ExchangeRateService: réponse malformée', ['data' => $data]);
                throw new \RuntimeException('Réponse Frankfurter malformée : clés date/rates manquantes.');
            }

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

            Log::info('ExchangeRateService: taux mis à jour', ['count' => count($rates), 'date' => $date]);

            return ['updated' => count($rates), 'date' => $date];
        } catch (\Exception $e) {
            Log::error('ExchangeRateService: échec récupération taux', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
