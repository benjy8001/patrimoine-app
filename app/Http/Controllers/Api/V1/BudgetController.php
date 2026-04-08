<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $budgets = $request->user()->budgets()
            ->with('category')
            ->when(
                $request->filled('month') && $request->filled('year'),
                fn ($q) => $q->where(fn ($sub) =>
                    $sub->where(fn ($x) => $x->where('month', $request->month)->where('year', $request->year))
                        ->orWhere(fn ($x) => $x->whereNull('month')->whereNull('year'))
                )
            )
            ->get();

        return response()->json($budgets);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount'              => 'required|numeric|min:0',
            'currency'            => 'nullable|string|size:3',
            'month'               => 'nullable|integer|between:1,12',
            'year'                => 'nullable|integer|min:2000|max:2100',
        ]);

        $data['currency'] ??= 'EUR';

        $budget = Budget::updateOrCreate(
            [
                'user_id'             => $request->user()->id,
                'expense_category_id' => $data['expense_category_id'],
                'month'               => $data['month'] ?? null,
                'year'                => $data['year']  ?? null,
            ],
            [
                'amount'   => $data['amount'],
                'currency' => $data['currency'],
            ]
        );

        $status = $budget->wasRecentlyCreated ? 201 : 200;

        return response()->json($budget->load('category'), $status);
    }

    public function destroy(Budget $budget): JsonResponse
    {
        $this->authorize('delete', $budget);
        $budget->delete();

        return response()->json(['message' => 'Budget supprimé.']);
    }
}
