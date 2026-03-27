<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetValuation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ValuationController extends Controller
{
    public function index(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        $valuations = $asset->valuations()
            ->orderByDesc('recorded_at')
            ->paginate(50);

        return response()->json($valuations);
    }

    public function store(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $data = $request->validate([
            'value'       => 'required|numeric|min:0',
            'currency'    => 'nullable|string|size:3',
            'recorded_at' => 'nullable|date',
            'notes'       => 'nullable|string|max:1000',
        ]);

        $recordedAt = $data['recorded_at'] ?? now();

        $valuation = AssetValuation::create([
            'asset_id'    => $asset->id,
            'value'       => $data['value'],
            'currency'    => $data['currency'] ?? $asset->currency,
            'recorded_at' => $recordedAt,
            'source'      => 'manual',
            'notes'       => $data['notes'] ?? null,
        ]);

        $asset->update([
            'current_value'   => $data['value'],
            'last_updated_at' => $recordedAt,
        ]);

        return response()->json($valuation, 201);
    }
}
