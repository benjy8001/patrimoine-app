<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportCsvRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Un fichier CSV est requis.',
            'file.file'     => 'Le fichier fourni est invalide.',
            'file.mimes'    => 'Le fichier doit être au format CSV (.csv ou .txt).',
            'file.max'      => 'Le fichier ne doit pas dépasser 5 Mo.',
        ];
    }
}
