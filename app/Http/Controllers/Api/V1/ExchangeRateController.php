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
