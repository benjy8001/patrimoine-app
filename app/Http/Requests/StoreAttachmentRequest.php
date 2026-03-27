<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file'  => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png,gif,webp,doc,docx,xls,xlsx,csv,txt',
            'notes' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Un fichier est requis.',
            'file.max'      => 'Le fichier ne doit pas dépasser 10 Mo.',
            'file.mimes'    => 'Formats acceptés : PDF, images, Word, Excel, CSV, texte.',
        ];
    }
}
