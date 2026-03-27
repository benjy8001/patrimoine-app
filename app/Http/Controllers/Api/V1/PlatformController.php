<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Platform;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $platforms = $request->user()->platforms()
            ->withCount('assets')
            ->orderBy('name')
            ->get();
        return response()->json($platforms);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'type'      => 'nullable|string|max:100',
            'website'   => 'nullable|url|max:255',
            'notes'     => 'nullable|string|max:2000',
            'is_active' => 'boolean',
        ]);
        $platform = $request->user()->platforms()->create($data);
        return response()->json($platform, 201);
    }

    public function update(Request $request, Platform $platform): JsonResponse
    {
        abort_if($platform->user_id !== $request->user()->id, 403);
        $data = $request->validate([
            'name'      => 'sometimes|required|string|max:255',
            'type'      => 'nullable|string|max:100',
            'website'   => 'nullable|url|max:255',
            'notes'     => 'nullable|string|max:2000',
            'is_active' => 'boolean',
        ]);
        $platform->update($data);
        return response()->json($platform);
    }

    public function destroy(Request $request, Platform $platform): JsonResponse
    {
        abort_if($platform->user_id !== $request->user()->id, 403);
        $platform->delete();
        return response()->json(['message' => 'Plateforme supprimée.']);
    }
}
