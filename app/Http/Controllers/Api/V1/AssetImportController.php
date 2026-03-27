<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportCsvRequest;
use App\Services\ImportService;
use Illuminate\Http\JsonResponse;

class AssetImportController extends Controller
{
    public function __construct(private readonly ImportService $importService)
    {
    }

    public function preview(ImportCsvRequest $request): JsonResponse
    {
        $result = $this->importService->preview(
            $request->file('file'),
            $request->user()
        );

        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], 422);
        }

        return response()->json($result);
    }

    public function import(ImportCsvRequest $request): JsonResponse
    {
        $result = $this->importService->import(
            $request->file('file'),
            $request->user()
        );

        return response()->json($result, 201);
    }
}
