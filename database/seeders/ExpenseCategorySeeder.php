<?php
namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Logement',      'icon' => 'home',           'color' => '#3B82F6', 'order' => 1],
            ['name' => 'Alimentation',  'icon' => 'shopping-cart',  'color' => '#10B981', 'order' => 2],
            ['name' => 'Transport',     'icon' => 'car',            'color' => '#F59E0B', 'order' => 3],
            ['name' => 'Santé',         'icon' => 'heart-pulse',    'color' => '#EF4444', 'order' => 4],
            ['name' => 'Loisirs',       'icon' => 'gamepad-2',      'color' => '#8B5CF6', 'order' => 5],
            ['name' => 'Vêtements',     'icon' => 'shirt',          'color' => '#EC4899', 'order' => 6],
            ['name' => 'Abonnements',   'icon' => 'repeat',         'color' => '#06B6D4', 'order' => 7],
            ['name' => 'Restauration',  'icon' => 'utensils',       'color' => '#F97316', 'order' => 8],
            ['name' => 'Voyages',       'icon' => 'plane',          'color' => '#84CC16', 'order' => 9],
            ['name' => 'Éducation',     'icon' => 'graduation-cap', 'color' => '#A78BFA', 'order' => 10],
            ['name' => 'Autres',        'icon' => 'more-horizontal','color' => '#64748B', 'order' => 11],
        ];

        foreach ($categories as $data) {
            ExpenseCategory::updateOrCreate(
                ['user_id' => null, 'name' => $data['name']],
                array_merge($data, ['is_system' => true, 'user_id' => null])
            );
        }
    }
}
