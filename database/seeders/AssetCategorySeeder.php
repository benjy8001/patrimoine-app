<?php

namespace Database\Seeders;

use App\Models\AssetCategory;
use Illuminate\Database\Seeder;

class AssetCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            // Actifs
            ['name' => 'Comptes bancaires',    'slug' => 'bank-accounts',     'type' => 'asset',     'icon' => 'building-2',   'color' => '#3B82F6', 'is_system' => true, 'sort_order' => 1],
            ['name' => 'Livrets / Épargne',    'slug' => 'savings',           'type' => 'asset',     'icon' => 'piggy-bank',   'color' => '#10B981', 'is_system' => true, 'sort_order' => 2],
            ['name' => 'Assurance-vie',        'slug' => 'life-insurance',    'type' => 'asset',     'icon' => 'shield-check', 'color' => '#8B5CF6', 'is_system' => true, 'sort_order' => 3],
            ['name' => 'PEA / CTO / Titres',   'slug' => 'stocks',            'type' => 'asset',     'icon' => 'trending-up',  'color' => '#F59E0B', 'is_system' => true, 'sort_order' => 4],
            ['name' => 'SCPI',                 'slug' => 'scpi',              'type' => 'asset',     'icon' => 'landmark',     'color' => '#EF4444', 'is_system' => true, 'sort_order' => 5],
            ['name' => 'Immobilier',           'slug' => 'real-estate',       'type' => 'asset',     'icon' => 'home',         'color' => '#F97316', 'is_system' => true, 'sort_order' => 6],
            ['name' => 'Crypto-actifs',        'slug' => 'crypto',            'type' => 'asset',     'icon' => 'coins',        'color' => '#EAB308', 'is_system' => true, 'sort_order' => 7],
            ['name' => 'Crowdfunding',         'slug' => 'crowdfunding',      'type' => 'asset',     'icon' => 'users',        'color' => '#06B6D4', 'is_system' => true, 'sort_order' => 8],
            ['name' => 'Crowdlending',         'slug' => 'crowdlending',      'type' => 'asset',     'icon' => 'handshake',    'color' => '#84CC16', 'is_system' => true, 'sort_order' => 9],
            ['name' => 'Prêts accordés',       'slug' => 'loans-given',       'type' => 'asset',     'icon' => 'hand-coins',   'color' => '#A78BFA', 'is_system' => true, 'sort_order' => 10],
            ['name' => 'Plateformes diverses', 'slug' => 'other-platforms',   'type' => 'asset',     'icon' => 'layers',       'color' => '#94A3B8', 'is_system' => true, 'sort_order' => 11],
            ['name' => 'Autres actifs',        'slug' => 'other-assets',      'type' => 'asset',     'icon' => 'package',      'color' => '#64748B', 'is_system' => true, 'sort_order' => 12],
            // Passifs
            ['name' => 'Prêts bancaires',      'slug' => 'bank-loans',        'type' => 'liability', 'icon' => 'credit-card',  'color' => '#DC2626', 'is_system' => true, 'sort_order' => 20],
            ['name' => 'Crédits / Emprunts',   'slug' => 'credits',           'type' => 'liability', 'icon' => 'receipt',      'color' => '#B91C1C', 'is_system' => true, 'sort_order' => 21],
            ['name' => 'Dettes',               'slug' => 'debts',             'type' => 'liability', 'icon' => 'minus-circle', 'color' => '#991B1B', 'is_system' => true, 'sort_order' => 22],
        ];

        foreach ($categories as $data) {
            AssetCategory::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );
        }
    }
}
