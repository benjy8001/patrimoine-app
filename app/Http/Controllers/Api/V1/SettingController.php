<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private const USER_FIELDS = ['currency', 'locale', 'timezone', 'name', 'email'];

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $settings = $user->settings()->pluck('value', 'key');

        return response()->json(array_merge(
            $user->only(self::USER_FIELDS),
            $settings->toArray(),
        ));
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'currency' => 'nullable|string|size:3',
            'locale'   => 'nullable|string|max:5',
            'timezone' => 'nullable|string|max:50',
            'name'     => 'nullable|string|max:255',
            'email'    => 'nullable|email|unique:users,email,' . $user->id,
        ]);

        $userFields = array_filter(
            array_intersect_key($data, array_flip(self::USER_FIELDS)),
            fn($value) => $value !== null,
        );

        if (!empty($userFields)) {
            $user->update($userFields);
        }

        return response()->json([
            'message' => 'Paramètres mis à jour.',
            'user'    => $user->fresh(),
        ]);
    }
}
