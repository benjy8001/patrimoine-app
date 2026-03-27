<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TaxReport;
use App\Services\ExportService;
use App\Services\TaxReportGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TaxReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reports = $request->user()->taxReports()->orderByDesc('fiscal_year')->get();
        return response()->json($reports);
    }

    public function show(Request $request, TaxReport $taxReport): JsonResponse
    {
        abort_if($taxReport->user_id !== $request->user()->id, 403);
        return response()->json($taxReport);
    }

    public function generate(Request $request, int $year, TaxReportGenerator $generator): JsonResponse
    {
        abort_if($year < 2000 || $year > now()->year, 422, 'Année fiscale invalide.');
        $report = $generator->generate($request->user(), $year);
        return response()->json($report, 201);
    }

    public function exportCsv(Request $request, TaxReport $taxReport, ExportService $exportService): Response
    {
        abort_if($taxReport->user_id !== $request->user()->id, 403);
        $taxReport->update(['exported_at' => now()]);
        $csv = $exportService->exportTaxReportAsCsv($taxReport);
        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="rapport_fiscal_' . $taxReport->fiscal_year . '.csv"',
        ]);
    }

    public function exportPdf(Request $request, TaxReport $taxReport, ExportService $exportService): mixed
    {
        abort_if($taxReport->user_id !== $request->user()->id, 403);
        $taxReport->update(['exported_at' => now()]);
        return $exportService->exportTaxReportPdf($taxReport);
    }

    public function destroy(Request $request, TaxReport $taxReport): JsonResponse
    {
        abort_if($taxReport->user_id !== $request->user()->id, 403);
        $taxReport->delete();
        return response()->json(['message' => 'Rapport supprimé.']);
    }
}
