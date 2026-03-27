<?php

namespace Database\Factories;

use App\Models\AssetCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AssetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'           => User::factory(),
            'asset_category_id' => AssetCategory::factory(),
            'name'              => $this->faker->words(2, true),
            'currency'          => 'EUR',
            'current_value'     => $this->faker->randomFloat(2, 100, 100000),
            'initial_value'     => $this->faker->randomFloat(2, 100, 80000),
            'status'            => 'active',
            'update_frequency'  => $this->faker->randomElement(['monthly', 'quarterly', 'yearly']),
            'is_liability'      => false,
            'sort_order'        => 0,
        ];
    }
}
