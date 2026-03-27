<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Loan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $loans = Loan::whereHas('asset', fn($q) => $q->where('user_id', $request->user()->id))
            ->with('asset.category')
            ->get();
        return response()->json($loans);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'asset_id'          => 'required|exists:assets,id',
            'lender_name'       => 'nullable|string|max:255',
            'borrowed_amount'   => 'required|numeric|min:0',
            'remaining_capital' => 'required|numeric|min:0',
            'interest_rate'     => 'required|numeric|min:0|max:100',
            'monthly_payment'   => 'nullable|numeric|min:0',
            'start_date'        => 'nullable|date',
            'end_date'          => 'nullable|date|after_or_equal:start_date',
            'loan_type'         => 'required|in:mortgage,consumer,personal,crowdlending,other',
            'currency'          => 'nullable|string|size:3',
        ]);

        $asset = Asset::findOrFail($data['asset_id']);
        abort_if($asset->user_id !== $request->user()->id, 403);

        $loan = Loan::create($data);
        return response()->json($loan->load('asset'), 201);
    }

    public function update(Request $request, Loan $loan): JsonResponse
    {
        abort_if($loan->asset->user_id !== $request->user()->id, 403);
        $data = $request->validate([
            'lender_name'       => 'nullable|string|max:255',
            'borrowed_amount'   => 'nullable|numeric|min:0',
            'remaining_capital' => 'nullable|numeric|min:0',
            'interest_rate'     => 'nullable|numeric|min:0|max:100',
            'monthly_payment'   => 'nullable|numeric|min:0',
            'start_date'        => 'nullable|date',
            'end_date'          => 'nullable|date',
            'loan_type'         => 'nullable|in:mortgage,consumer,personal,crowdlending,other',
            'currency'          => 'nullable|string|size:3',
        ]);
        $loan->update($data);
        return response()->json($loan);
    }

    public function destroy(Request $request, Loan $loan): JsonResponse
    {
        abort_if($loan->asset->user_id !== $request->user()->id, 403);
        $loan->delete();
        return response()->json(['message' => 'Prêt supprimé.']);
    }
}
