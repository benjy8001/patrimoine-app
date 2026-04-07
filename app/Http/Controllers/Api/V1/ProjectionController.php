<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProjectionRequest;
use App\Models\Setting;
use App\Services\ProjectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectionController extends Controller
{
    public function getSettings(Request $request): JsonResponse
    {
        $user     = $request->user();
        $settings = $user->getSetting('projection_settings');

        $categories = $user->assets()
            ->active()
            ->assets()
            ->with('category')
            ->get()
            ->pluck('category')
            ->unique('id')
            ->filter()
            ->map(fn($cat) => [
                'id'    => $cat->id,
                'name'  => $cat->name,
                'color' => $cat->color,
                'icon'  => $cat->icon,
            ])
            ->values();

        return response()->json([
            'settings'   => $settings,
            'categories' => $categories,
        ]);
    }

    public function saveSettings(ProjectionRequest $request): JsonResponse
    {
        Setting::updateOrCreate(
            ['user_id' => $request->user()->id, 'key' => 'projection_settings'],
            ['value'   => $request->validated()]
        );

        return response()->json(['message' => 'Paramètres sauvegardés.']);
    }

    public function simulate(ProjectionRequest $request): JsonResponse
    {
        $service = new ProjectionService($request->user());
        $result  = $service->simulate($request->validated());

        return response()->json($result, 200, [], JSON_PRESERVE_ZERO_FRACTION);
    }
}
