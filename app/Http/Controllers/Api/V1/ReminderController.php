<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Reminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->reminders()
            ->with('asset')
            ->when($request->filled('active'), fn($q) => $q->where('is_active', (bool)$request->active))
            ->orderBy('next_due_at');
        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'asset_id'   => 'nullable|exists:assets,id',
            'title'      => 'required|string|max:255',
            'message'    => 'nullable|string|max:2000',
            'due_date'   => 'required|date',
            'frequency'  => 'required|in:once,weekly,monthly,quarterly,yearly',
            'is_active'  => 'boolean',
        ]);

        $reminder = $request->user()->reminders()->create(array_merge($data, [
            'next_due_at' => $data['due_date'],
        ]));

        return response()->json($reminder->load('asset'), 201);
    }

    public function update(Request $request, Reminder $reminder): JsonResponse
    {
        $this->authorize('update', $reminder);
        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'message'     => 'nullable|string|max:2000',
            'due_date'    => 'sometimes|date',
            'frequency'   => 'sometimes|in:once,weekly,monthly,quarterly,yearly',
            'is_active'   => 'boolean',
            'next_due_at' => 'nullable|date',
        ]);
        $reminder->update($data);
        return response()->json($reminder->load('asset'));
    }

    public function destroy(Request $request, Reminder $reminder): JsonResponse
    {
        $this->authorize('delete', $reminder);
        $reminder->delete();
        return response()->json(['message' => 'Rappel supprimé.']);
    }
}
