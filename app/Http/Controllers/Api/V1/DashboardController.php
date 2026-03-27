<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\PatrimonyCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $calc = new PatrimonyCalculator($request->user());

        return response()->json([
            'total_assets'        => $calc->totalAssets(),
            'total_liabilities'   => $calc->totalLiabilities(),
            'net_worth'           => $calc->netWorth(),
            'initial_invested'    => $calc->totalInitialInvested(),
            'global_yield'        => $calc->globalYield(),
            'monthly_variation'   => $calc->monthlyVariation(),
            'yearly_variation'    => $calc->yearlyVariation(),
            'allocation_category' => $calc->allocationByCategory(),
            'allocation_platform' => $calc->allocationByPlatform(),
            'allocation_currency' => $calc->allocationByCurrency(),
            'income_current_year' => $calc->incomeByYear(now()->year),
            'overdue_assets'      => $calc->overdueAssetsCount(),
        ]);
    }

    public function monthlyChart(Request $request): JsonResponse
    {
        $months = (int) $request->get('months', 12);
        $calc = new PatrimonyCalculator($request->user());

        return response()->json($calc->monthlyChartData(min($months, 60)));
    }

    public function yearlyChart(Request $request): JsonResponse
    {
        $years = (int) $request->get('years', 5);
        $calc = new PatrimonyCalculator($request->user());

        return response()->json($calc->yearlyChartData(min($years, 10)));
    }
}
