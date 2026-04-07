<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProjectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'horizon_years'                       => 'required|integer|min:1|max:50',
            'target_age'                          => 'nullable|integer|min:1|max:120',
            'current_age'                         => 'nullable|integer|min:1|max:120',
            'inflation_rate'                      => 'nullable|numeric|min:0|max:20',
            'category_rates'                      => 'required|array',
            'category_rates.*.growth_rate'        => 'required|numeric|min:0|max:100',
            'category_rates.*.monthly_savings'    => 'required|numeric|min:0|max:100000',
        ];
    }
}
