<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class AssetCategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'       => $this->faker->unique()->word(),
            'slug'       => $this->faker->unique()->slug(),
            'type'       => 'asset',
            'icon'       => 'package',
            'color'      => $this->faker->hexColor(),
            'is_system'  => false,
            'sort_order' => $this->faker->numberBetween(1, 99),
        ];
    }
}
