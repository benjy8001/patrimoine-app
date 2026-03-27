<?php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'description'       => $this->description,
            'currency'          => $this->currency,
            'current_value'     => (float) $this->current_value,
            'initial_value'     => $this->initial_value ? (float) $this->initial_value : null,
            'acquisition_date'  => $this->acquisition_date?->format('Y-m-d'),
            'last_updated_at'   => $this->last_updated_at?->toIso8601String(),
            'status'            => $this->status,
            'update_frequency'  => $this->update_frequency,
            'estimated_yield'   => $this->estimated_yield ? (float) $this->estimated_yield : null,
            'notes'             => $this->notes,
            'meta'              => $this->meta ?? [],
            'is_liability'      => (bool) $this->is_liability,
            'is_overdue'        => $this->isOverdue(),
            'gain_loss'         => $this->gainLoss(),
            'gain_loss_percent' => $this->gainLossPercent(),
            'sort_order'        => $this->sort_order,
            'created_at'        => $this->created_at?->toIso8601String(),
            'category'          => $this->whenLoaded('category', fn() => [
                'id'    => $this->category->id,
                'name'  => $this->category->name,
                'slug'  => $this->category->slug,
                'type'  => $this->category->type,
                'icon'  => $this->category->icon,
                'color' => $this->category->color,
            ]),
            'platform'          => $this->whenLoaded('platform', fn() => $this->platform ? [
                'id'   => $this->platform->id,
                'name' => $this->platform->name,
                'type' => $this->platform->type,
            ] : null),
            'loan'              => $this->whenLoaded('loan', fn() => $this->loan->first()),
            'valuations'        => $this->whenLoaded('valuations', fn() => $this->valuations->take(24)),
            'income_entries'    => $this->whenLoaded('incomeEntries', fn() => $this->incomeEntries),
        ];
    }
}
