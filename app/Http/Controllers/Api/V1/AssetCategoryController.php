<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AssetCategory;
use Illuminate\Http\JsonResponse;

class AssetCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = AssetCategory::orderBy('sort_order')->get();
        return response()->json($categories);
    }
}
