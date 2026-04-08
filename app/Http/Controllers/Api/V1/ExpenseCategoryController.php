<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = ExpenseCategory::forUser($request->user()->id)
            ->orderBy('order')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => 'required|string|max:100',
            'color' => 'nullable|string|max:7',
            'icon'  => 'nullable|string|max:50',
            'order' => 'nullable|integer',
        ]);

        $category = $request->user()->expenseCategories()->create(array_merge($data, [
            'is_system' => false,
            'color'     => $data['color'] ?? '#94A3B8',
            'order'     => $data['order'] ?? 99,
        ]));

        return response()->json($category, 201);
    }

    public function update(Request $request, ExpenseCategory $expenseCategory): JsonResponse
    {
        $this->authorize('update', $expenseCategory);

        $data = $request->validate([
            'name'  => 'sometimes|string|max:100',
            'color' => 'nullable|string|max:7',
            'icon'  => 'nullable|string|max:50',
            'order' => 'nullable|integer',
        ]);

        $expenseCategory->update($data);

        return response()->json($expenseCategory);
    }

    public function destroy(Request $request, ExpenseCategory $expenseCategory): JsonResponse
    {
        $this->authorize('delete', $expenseCategory);
        $expenseCategory->delete();

        return response()->json(['message' => 'Catégorie supprimée.']);
    }
}
