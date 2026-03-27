<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssetRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'asset_category_id' => 'sometimes|exists:asset_categories,id',
            'platform_id'       => 'nullable|exists:platforms,id',
            'name'              => 'sometimes|string|max:255',
            'description'       => 'nullable|string|max:2000',
            'currency'          => 'nullable|string|size:3',
            'current_value'     => 'sometimes|numeric|min:0',
            'initial_value'     => 'nullable|numeric|min:0',
            'acquisition_date'  => 'nullable|date',
            'last_updated_at'   => 'nullable|date',
            'status'            => 'nullable|in:active,closed,pending',
            'update_frequency'  => 'nullable|in:weekly,monthly,quarterly,yearly,manual',
            'estimated_yield'   => 'nullable|numeric|min:-100|max:10000',
            'notes'             => 'nullable|string|max:5000',
            'meta'              => 'nullable|array',
            'is_liability'      => 'boolean',
            'sort_order'        => 'nullable|integer|min:0',
        ];
    }
}
