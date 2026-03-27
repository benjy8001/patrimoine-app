<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssetRequest;
use App\Http\Requests\UpdateAssetRequest;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use App\Models\AssetValuation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AssetController extends Controller
{
    private const SORTABLE_FIELDS = ['name', 'current_value', 'last_updated_at', 'created_at'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->assets()
            ->with(['category', 'platform', 'loan'])
            ->when($request->filled('category'), fn($q) => $q->whereHas('category', fn($qq) => $qq->where('slug', $request->category)))
            ->when($request->filled('is_liability'), fn($q) => $q->where('is_liability', $request->boolean('is_liability')))
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->when($request->filled('search'), fn($q) => $q->where('name', 'like', '%' . $request->search . '%'))
            ->when($request->filled('currency'), fn($q) => $q->where('currency', $request->currency));

        $sortField = in_array($request->get('sort'), self::SORTABLE_FIELDS)
            ? $request->get('sort')
            : 'name';
        $sortDir = $request->get('dir') === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortField, $sortDir);

        return AssetResource::collection(
            $request->boolean('all') ? $query->get() : $query->paginate(20)
        );
    }

    public function store(StoreAssetRequest $request): AssetResource
    {
        $asset = DB::transaction(function () use ($request) {
            $asset = $request->user()->assets()->create($request->validated());

            if ($asset->current_value > 0) {
                $this->recordValuation($asset, (float) $asset->current_value, $asset->currency, $asset->acquisition_date ?? now(), 'Valeur initiale');
            }

            return $asset;
        });

        return new AssetResource($asset->load(['category', 'platform', 'loan']));
    }

    public function show(Request $request, Asset $asset): AssetResource
    {
        $this->authorize('view', $asset);

        return new AssetResource($asset->load(['category', 'platform', 'loan', 'valuations', 'incomeEntries', 'attachments']));
    }

    public function update(UpdateAssetRequest $request, Asset $asset): AssetResource
    {
        $this->authorize('update', $asset);
        $data = $request->validated();

        if (isset($data['current_value']) && (float) $data['current_value'] !== (float) $asset->current_value) {
            $this->recordValuation($asset, (float) $data['current_value'], $data['currency'] ?? $asset->currency);
            $data['last_updated_at'] = now();
        }

        $asset->update($data);

        return new AssetResource($asset->fresh()->load(['category', 'platform', 'loan']));
    }

    public function destroy(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('delete', $asset);
        $asset->delete();

        return response()->json(['message' => 'Actif supprimé.']);
    }

    private function recordValuation(
        Asset $asset,
        float $value,
        string $currency,
        mixed $recordedAt = null,
        ?string $notes = null,
    ): AssetValuation {
        return AssetValuation::create([
            'asset_id'    => $asset->id,
            'value'       => $value,
            'currency'    => $currency,
            'recorded_at' => $recordedAt ?? now(),
            'source'      => 'manual',
            'notes'       => $notes,
        ]);
    }
}
