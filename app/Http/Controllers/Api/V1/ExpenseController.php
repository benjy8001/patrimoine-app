<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $expenses = $request->user()->expenses()
            ->with('category')
            ->when(
                $request->filled('month') && $request->filled('year'),
                fn ($q) => $q->whereMonth('date', $request->month)->whereYear('date', $request->year)
            )
            ->when(
                $request->filled('category_id'),
                fn ($q) => $q->where('expense_category_id', $request->category_id)
            )
            ->orderByDesc('date')
            ->paginate(50);

        return response()->json($expenses);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount'              => 'required|numeric|min:0.01',
            'currency'            => 'nullable|string|size:3',
            'description'         => 'required|string|max:255',
            'date'                => 'required|date',
            'notes'               => 'nullable|string|max:2000',
        ]);

        $data['currency'] ??= 'EUR';
        $expense = $request->user()->expenses()->create($data);

        return response()->json($expense->load('category'), 201);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $this->authorize('update', $expense);

        $data = $request->validate([
            'expense_category_id' => 'sometimes|exists:expense_categories,id',
            'amount'              => 'sometimes|numeric|min:0.01',
            'currency'            => 'nullable|string|size:3',
            'description'         => 'sometimes|string|max:255',
            'date'                => 'sometimes|date',
            'notes'               => 'nullable|string|max:2000',
        ]);

        $expense->update($data);

        return response()->json($expense->load('category'));
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $this->authorize('delete', $expense);
        $expense->delete();

        return response()->json(['message' => 'Dépense supprimée.']);
    }
}
