<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetValuation;
use App\Models\IncomeEntry;
use App\Models\Loan;
use App\Models\Platform;
use App\Models\Reminder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        /** @var User $user */
        $user = User::firstOrCreate(
            ['email' => 'demo@patrimoine.local'],
            [
                'name'     => 'Utilisateur Démo',
                'password' => Hash::make('password'),
                'currency' => 'EUR',
                'locale'   => 'fr',
                'timezone' => 'Europe/Paris',
            ]
        );

        // --- Platforms ---
        $bpce   = Platform::create(['user_id' => $user->id, 'name' => 'Banque Populaire',    'type' => 'bank',         'is_active' => true]);
        $bourso = Platform::create(['user_id' => $user->id, 'name' => 'Boursorama',          'type' => 'bank',         'is_active' => true]);
        $linxea = Platform::create(['user_id' => $user->id, 'name' => 'Linxea',              'type' => 'insurance',    'is_active' => true]);
        $cb     = Platform::create(['user_id' => $user->id, 'name' => 'Coinbase',            'type' => 'crypto',       'is_active' => true]);
        $october = Platform::create(['user_id' => $user->id, 'name' => 'October',            'type' => 'crowdlending', 'is_active' => true]);

        // --- Categories ---
        $catBank    = AssetCategory::where('slug', 'bank-accounts')->first();
        $catSav     = AssetCategory::where('slug', 'savings')->first();
        $catAv      = AssetCategory::where('slug', 'life-insurance')->first();
        $catPea     = AssetCategory::where('slug', 'stocks')->first();
        $catImmo    = AssetCategory::where('slug', 'real-estate')->first();
        $catCrypto  = AssetCategory::where('slug', 'crypto')->first();
        $catCrowd   = AssetCategory::where('slug', 'crowdlending')->first();
        $catLoan    = AssetCategory::where('slug', 'bank-loans')->first();

        // --- Assets ---
        $cc = Asset::create([
            'user_id' => $user->id, 'asset_category_id' => $catBank->id,
            'platform_id' => $bpce->id, 'name' => 'Compte courant BP',
            'currency' => 'EUR', 'current_value' => 4250.00, 'initial_value' => 0,
            'status' => 'active', 'update_frequency' => 'monthly',
            'last_updated_at' => now()->subDays(5),
            'meta' => ['iban_masked' => 'FR76 **** **** 4521', 'account_type' => 'current'],
        ]);

        $livret = Asset::create([
            'user_id' => $user->id, 'asset_category_id' => $catSav->id,
            'platform_id' => $bourso->id, 'name' => 'Livret A',
            'currency' => 'EUR', 'current_value' => 22950.00, 'initial_value' => 20000,
            'estimated_yield' => 3.0, 'status' => 'active', 'update_frequency' => 'quarterly',
            'last_updated_at' => now()->subDays(30),
        ]);

        $av = Asset::create([
            'user_id' => $user->id, 'asset_category_id' => $catAv->id,
            'platform_id' => $linxea->id, 'name' => 'AV Linxea Spirit 2',
            'currency' => 'EUR', 'current_value' => 45200.00, 'initial_value' => 40000,
            'estimated_yield' => 5.2, 'status' => 'active', 'update_frequency' => 'quarterly',
            'acquisition_date' => '2019-06-01', 'last_updated_at' => now()->subDays(45),
        ]);

        $pea = Asset::create([
            'user_id' => $user->id, 'asset_category_id' => $catPea->id,
            'platform_id' => $bourso->id, 'name' => 'PEA Boursorama',
            'currency' => 'EUR', 'current_value' => 32800.00, 'initial_value' => 25000,
            'estimated_yield' => 8.5, 'status' => 'active', 'update_frequency' => 'monthly',
            'acquisition_date' => '2020-01-15', 'last_updated_at' => now()->subDays(10),
            'meta' => ['account_type' => 'PEA', 'dividends' => 650],
        ]);

        $immo = Asset::create([
            'user_id' => $user->id, 'asset_category_id' => $catImmo->id,
            'name' => 'Appartement Paris 11e',
            'currency' => 'EUR', 'current_value' => 285000.00, 'initial_value' => 240000,
            'status' => 'active', 'update_frequency' => 'yearly',
            'acquisition_date' => '2018-03-20', 'last_updated_at' => now()->subMonths(8),
            'meta' => ['address' => '42 rue de la Roquette, 75011 Paris', 'area_sqm' => 48, 'rent_monthly' => 1200, 'charges_monthly' => 180],
        ]);

        $btc = Asset::create([
            'user_id' => $user->id, 'asset_category_id' => $catCrypto->id,
            'platform_id' => $cb->id, 'name' => 'Bitcoin',
            'currency' => 'EUR', 'current_value' => 8500.00, 'initial_value' => 5200,
            'status' => 'active', 'update_frequency' => 'weekly',
            'last_updated_at' => now()->subDays(2),
            'meta' => ['token' => 'BTC', 'quantity' => 0.13, 'average_buy_price' => 38000, 'wallet' => 'Coinbase'],
        ]);

        $crowd = Asset::create([
            'user_id' => $user->id, 'asset_category_id' => $catCrowd->id,
            'platform_id' => $october->id, 'name' => 'Portefeuille October',
            'currency' => 'EUR', 'current_value' => 5800.00, 'initial_value' => 6000,
            'status' => 'active', 'update_frequency' => 'monthly',
            'last_updated_at' => now()->subDays(20),
            'meta' => ['rate' => 7.5, 'capital_remaining' => 5800, 'interests_received' => 420],
        ]);

        // Passif : prêt immobilier
        $loanAsset = Asset::create([
            'user_id' => $user->id, 'asset_category_id' => $catLoan->id,
            'platform_id' => $bpce->id, 'name' => 'Crédit immobilier BP',
            'currency' => 'EUR', 'current_value' => 185000.00,
            'is_liability' => true, 'status' => 'active', 'update_frequency' => 'monthly',
            'acquisition_date' => '2018-03-20', 'last_updated_at' => now()->subDays(30),
        ]);
        Loan::create([
            'asset_id' => $loanAsset->id, 'lender_name' => 'Banque Populaire',
            'borrowed_amount' => 220000, 'remaining_capital' => 185000,
            'interest_rate' => 1.45, 'monthly_payment' => 980,
            'start_date' => '2018-03-20', 'end_date' => '2043-03-20',
            'loan_type' => 'mortgage', 'currency' => 'EUR',
        ]);

        // --- Valorisations historiques (12 mois) ---
        $valuationAssets = [$livret, $av, $pea, $immo, $btc, $crowd];
        foreach ($valuationAssets as $asset) {
            $baseValue = (float) $asset->current_value;
            for ($m = 12; $m >= 1; $m--) {
                $ratio = 1 - ($m * 0.005) + (rand(-20, 20) / 1000);
                AssetValuation::create([
                    'asset_id'    => $asset->id,
                    'value'       => round($baseValue * $ratio, 2),
                    'currency'    => $asset->currency,
                    'recorded_at' => now()->subMonths($m)->startOfMonth(),
                    'source'      => 'manual',
                ]);
            }
            // Valeur actuelle
            AssetValuation::create([
                'asset_id'    => $asset->id,
                'value'       => $baseValue,
                'currency'    => $asset->currency,
                'recorded_at' => now(),
                'source'      => 'manual',
            ]);
        }

        // --- Revenus / Income entries ---
        $incomeEntries = [
            ['asset_id' => $av->id,    'income_type' => 'interest',     'amount' => 1850.00, 'fiscal_year' => 2024, 'received_at' => '2024-12-31', 'tax_category' => '2TR'],
            ['asset_id' => $pea->id,   'income_type' => 'dividend',     'amount' => 650.00,  'fiscal_year' => 2024, 'received_at' => '2024-06-15', 'tax_category' => '2DC'],
            ['asset_id' => $immo->id,  'income_type' => 'rental',       'amount' => 11040.00,'fiscal_year' => 2024, 'received_at' => '2024-12-31', 'tax_category' => 'revenus fonciers'],
            ['asset_id' => $crowd->id, 'income_type' => 'crowdlending', 'amount' => 420.00,  'fiscal_year' => 2024, 'received_at' => '2024-12-01', 'tax_category' => '2TR'],
            ['asset_id' => $btc->id,   'income_type' => 'capital_gain', 'amount' => 3300.00, 'fiscal_year' => 2024, 'received_at' => '2024-09-10', 'tax_category' => '3AN'],
            // 2023
            ['asset_id' => $av->id,    'income_type' => 'interest',     'amount' => 1620.00, 'fiscal_year' => 2023, 'received_at' => '2023-12-31', 'tax_category' => '2TR'],
            ['asset_id' => $immo->id,  'income_type' => 'rental',       'amount' => 10800.00,'fiscal_year' => 2023, 'received_at' => '2023-12-31', 'tax_category' => 'revenus fonciers'],
            ['asset_id' => $crowd->id, 'income_type' => 'crowdlending', 'amount' => 380.00,  'fiscal_year' => 2023, 'received_at' => '2023-11-01', 'tax_category' => '2TR'],
        ];

        foreach ($incomeEntries as $entry) {
            IncomeEntry::create(array_merge($entry, [
                'user_id'    => $user->id,
                'currency'   => 'EUR',
                'is_taxable' => true,
            ]));
        }

        // --- Rappels ---
        Reminder::create([
            'user_id'     => $user->id,
            'asset_id'    => $immo->id,
            'title'       => 'Mettre à jour la valeur du bien immobilier',
            'message'     => 'Estimer la valeur de marché actuelle via un comparatif ou une agence.',
            'due_date'    => now()->addMonths(4)->format('Y-m-d'),
            'frequency'   => 'yearly',
            'is_active'   => true,
            'next_due_at' => now()->addMonths(4)->format('Y-m-d'),
        ]);

        Reminder::create([
            'user_id'     => $user->id,
            'asset_id'    => $av->id,
            'title'       => 'Vérifier la valorisation de l\'assurance-vie',
            'message'     => 'Consulter le relevé trimestriel sur l\'espace Linxea.',
            'due_date'    => now()->addDays(15)->format('Y-m-d'),
            'frequency'   => 'quarterly',
            'is_active'   => true,
            'next_due_at' => now()->addDays(15)->format('Y-m-d'),
        ]);

        Reminder::create([
            'user_id'     => $user->id,
            'asset_id'    => $btc->id,
            'title'       => 'Mettre à jour la valeur crypto',
            'message'     => 'Vérifier le cours BTC et mettre à jour la valorisation.',
            'due_date'    => now()->subDays(3)->format('Y-m-d'),
            'frequency'   => 'weekly',
            'is_active'   => true,
            'next_due_at' => now()->subDays(3)->format('Y-m-d'),
        ]);
    }
}
