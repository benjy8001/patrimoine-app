<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AssetController;
use App\Http\Controllers\Api\V1\AssetCategoryController;
use App\Http\Controllers\Api\V1\PlatformController;
use App\Http\Controllers\Api\V1\ValuationController;
use App\Http\Controllers\Api\V1\LoanController;
use App\Http\Controllers\Api\V1\IncomeEntryController;
use App\Http\Controllers\Api\V1\TaxReportController;
use App\Http\Controllers\Api\V1\ReminderController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\AssetImportController;
use App\Http\Controllers\Api\V1\ExchangeRateController;

Route::prefix('v1')->group(function () {
    // Auth (public)
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/chart/monthly', [DashboardController::class, 'monthlyChart']);
        Route::get('/dashboard/chart/yearly', [DashboardController::class, 'yearlyChart']);

        // Assets
        Route::post('/assets/import/preview', [AssetImportController::class, 'preview']);
        Route::post('/assets/import',         [AssetImportController::class, 'import']);
        Route::apiResource('assets', AssetController::class);
        Route::post('/assets/{asset}/valuations', [ValuationController::class, 'store']);
        Route::get('/assets/{asset}/valuations', [ValuationController::class, 'index']);
        Route::get('/assets/{asset}/income', [IncomeEntryController::class, 'byAsset']);

        // Asset categories
        Route::get('/asset-categories', [AssetCategoryController::class, 'index']);

        // Platforms
        Route::apiResource('platforms', PlatformController::class)->except(['show']);

        // Loans
        Route::get('/loans', [LoanController::class, 'index']);
        Route::post('/loans', [LoanController::class, 'store']);
        Route::put('/loans/{loan}', [LoanController::class, 'update']);
        Route::delete('/loans/{loan}', [LoanController::class, 'destroy']);

        // Income entries
        Route::apiResource('income', IncomeEntryController::class)->except(['show']);

        // Reminders
        Route::apiResource('reminders', ReminderController::class)->except(['show']);

        // Tax reports
        Route::get('/tax-reports', [TaxReportController::class, 'index']);
        Route::post('/tax-reports/generate/{year}', [TaxReportController::class, 'generate']);
        Route::get('/tax-reports/{taxReport}', [TaxReportController::class, 'show']);
        Route::get('/tax-reports/{taxReport}/export/csv', [TaxReportController::class, 'exportCsv']);
        Route::get('/tax-reports/{taxReport}/export/pdf', [TaxReportController::class, 'exportPdf']);

        // Reports
        Route::get('/reports/annual', [ReportController::class, 'annual']);
        Route::get('/reports/by-category', [ReportController::class, 'byCategory']);
        Route::get('/reports/export/csv', [ReportController::class, 'exportCsv']);
        Route::get('/reports/export/pdf', [ReportController::class, 'exportPdf']);

        // Settings
        Route::get('/settings', [SettingController::class, 'index']);
        Route::put('/settings', [SettingController::class, 'update']);

        // Exchange rates
        Route::get('/exchange-rates', [ExchangeRateController::class, 'index']);
        Route::put('/exchange-rates', [ExchangeRateController::class, 'update']);
    });
});
