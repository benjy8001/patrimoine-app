<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttachmentRequest;
use App\Models\Asset;
use App\Models\Attachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    public function store(StoreAttachmentRequest $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $file = $request->file('file');
        $path = $file->store("attachments/{$request->user()->id}", 'local');

        $attachment = $asset->attachments()->create([
            'user_id'       => $request->user()->id,
            'filename'      => basename($path),
            'original_name' => $file->getClientOriginalName(),
            'mime_type'     => $file->getMimeType(),
            'size'          => $file->getSize(),
            'path'          => $path,
            'notes'         => $request->input('notes'),
        ]);

        return response()->json($attachment, 201);
    }

    public function download(Request $request, Attachment $attachment): StreamedResponse
    {
        abort_if($attachment->user_id !== $request->user()->id, 403);
        abort_unless(Storage::disk('local')->exists($attachment->path), 404, 'Fichier introuvable.');

        return Storage::disk('local')->download(
            $attachment->path,
            $attachment->original_name,
            ['Content-Type' => $attachment->mime_type ?? 'application/octet-stream']
        );
    }

    public function destroy(Request $request, Attachment $attachment): JsonResponse
    {
        abort_if($attachment->user_id !== $request->user()->id, 403);

        Storage::disk('local')->delete($attachment->path);
        $attachment->delete();

        return response()->json(['message' => 'Pièce jointe supprimée.']);
    }
}
