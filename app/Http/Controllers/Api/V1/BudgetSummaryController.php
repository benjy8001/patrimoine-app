<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetSummaryController extends Controller
{
    public function __construct(private BudgetService $service) {}

    public function summary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year'  => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        return response()->json(
            $this->service->getSummary($request->user(), (int) $validated['month'], (int) $validated['year']),
            200, [], JSON_PRESERVE_ZERO_FRACTION
        );
    }

    public function evolution(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        return response()->json(
            $this->service->getEvolution($request->user(), (int) $validated['year']),
            200, [], JSON_PRESERVE_ZERO_FRACTION
        );
    }
}
