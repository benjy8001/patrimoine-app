<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ExportService;
use App\Services\PatrimonyCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ReportController extends Controller
{
    public function annual(Request $request): JsonResponse
    {
        $year = (int) $request->get('year', now()->year);
        $user = $request->user();
        $calc = new PatrimonyCalculator($user);

        return response()->json([
            'year'                => $year,
            'net_worth'           => $calc->netWorth(),
            'total_assets'        => $calc->totalAssets(),
            'total_liabilities'   => $calc->totalLiabilities(),
            'global_yield'        => $calc->globalYield(),
            'income_year'         => $calc->incomeByYear($year),
            'allocation_category' => $calc->allocationByCategory(),
            'monthly_chart'       => $calc->monthlyChartData(12),
        ]);
    }

    public function byCategory(Request $request): JsonResponse
    {
        $calc = new PatrimonyCalculator($request->user());
        return response()->json($calc->allocationByCategory());
    }

    public function exportCsv(Request $request, ExportService $exportService): Response
    {
        $csv = $exportService->exportAssetsAsCsv($request->user());
        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="patrimoine_' . now()->format('Y-m-d') . '.csv"',
        ]);
    }

    public function exportPdf(Request $request, ExportService $exportService): mixed
    {
        return $exportService->exportAssetsPdf($request->user());
    }

    public function exportXlsx(Request $request, ExportService $exportService): mixed
    {
        return $exportService->exportAssetsAsXlsx($request->user());
    }
}
