<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\IncomeEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncomeEntryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $entries = $request->user()->incomeEntries()
            ->with('asset')
            ->when($request->filled('year'), fn($q) => $q->where('fiscal_year', $request->year))
            ->when($request->filled('type'), fn($q) => $q->where('income_type', $request->type))
            ->orderByDesc('received_at')
            ->paginate(30);

        return response()->json($entries);
    }

    public function byAsset(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        $entries = $asset->incomeEntries()
            ->when($request->filled('year'), fn($q) => $q->where('fiscal_year', $request->year))
            ->orderByDesc('received_at')
            ->get();

        return response()->json($entries);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'asset_id'     => 'nullable|exists:assets,id',
            'income_type'  => 'required|in:interest,dividend,rental,capital_gain,scpi,crowdlending,crypto,other',
            'amount'       => 'required|numeric|min:0',
            'currency'     => 'nullable|string|size:3',
            'fiscal_year'  => 'required|integer|min:2000|max:2100',
            'received_at'  => 'required|date',
            'is_taxable'   => 'boolean',
            'tax_category' => 'nullable|string|max:100',
            'notes'        => 'nullable|string|max:2000',
        ]);

        if (!empty($data['asset_id'])) {
            $asset = Asset::findOrFail($data['asset_id']);
            abort_if($asset->user_id !== $request->user()->id, 403);
        }

        $data['currency'] ??= 'EUR';
        $entry = $request->user()->incomeEntries()->create($data);

        return response()->json($entry->load('asset'), 201);
    }

    public function update(Request $request, IncomeEntry $income): JsonResponse
    {
        $this->authorize('update', $income);

        $data = $request->validate([
            'income_type'  => 'sometimes|in:interest,dividend,rental,capital_gain,scpi,crowdlending,crypto,other',
            'amount'       => 'sometimes|numeric|min:0',
            'currency'     => 'nullable|string|size:3',
            'fiscal_year'  => 'sometimes|integer|min:2000|max:2100',
            'received_at'  => 'sometimes|date',
            'is_taxable'   => 'boolean',
            'tax_category' => 'nullable|string|max:100',
            'notes'        => 'nullable|string|max:2000',
        ]);

        $income->update($data);

        return response()->json($income->load('asset'));
    }

    public function destroy(Request $request, IncomeEntry $income): JsonResponse
    {
        $this->authorize('delete', $income);
        $income->delete();

        return response()->json(['message' => 'Revenu supprimé.']);
    }
}
