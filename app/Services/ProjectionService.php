<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\ExchangeRate;
use App\Models\User;

class ProjectionService
{
    public function __construct(private readonly User $user) {}

    /**
     * Simulate future patrimony growth.
     *
     * @param  array{
     *   horizon_years: int,
     *   inflation_rate: float|null,
     *   category_rates: array<string, array{growth_rate: float, monthly_savings: float}>
     * } $params
     */
    public function simulate(array $params): array
    {
        $horizonYears   = (int) $params['horizon_years'];
        $inflationRate  = (float) ($params['inflation_rate'] ?? 0) / 100;
        $categoryRates  = $params['category_rates'] ?? [];

        $initialByCategory = $this->getInitialValuesByCategory();

        if (empty($initialByCategory)) {
            return [
                'current_value'      => 0.0,
                'projected_value'    => 0.0,
                'data_points'        => [],
                'cumulative_savings' => 0.0,
                'inflation_adjusted' => $inflationRate > 0,
            ];
        }

        $dataPoints = [];

        for ($n = 1; $n <= $horizonYears; $n++) {
            $total     = 0.0;
            $breakdown = [];

            foreach ($initialByCategory as $categoryId => $initialValue) {
                $rates         = $categoryRates[(string) $categoryId] ?? ['growth_rate' => 0, 'monthly_savings' => 0];
                $annualRate    = (float) $rates['growth_rate'] / 100;
                $monthlySav    = (float) ($rates['monthly_savings'] ?? 0);

                // Capital compound growth: V₀ × (1 + r)ⁿ
                $capital = $initialValue * pow(1 + $annualRate, $n);

                // Savings future value (ordinary annuity)
                if ($annualRate > 0) {
                    $monthlyRate = $annualRate / 12;
                    $savings = $monthlySav * (pow(1 + $monthlyRate, 12 * $n) - 1) / $monthlyRate;
                } else {
                    $savings = $monthlySav * 12 * $n;
                }

                $nominal = $capital + $savings;

                // Inflation-adjusted real value
                $real = $inflationRate > 0
                    ? $nominal / pow(1 + $inflationRate, $n)
                    : $nominal;

                $breakdown[(string) $categoryId] = round($real, 2);
                $total += $real;
            }

            $dataPoints[] = [
                'year'      => $n,
                'total'     => round($total, 2),
                'breakdown' => $breakdown,
            ];
        }

        // Cumulative savings = raw contributions (no compounding)
        $cumulativeSavings = array_sum(array_map(
            fn($rates) => (float) ($rates['monthly_savings'] ?? 0) * 12 * $horizonYears,
            $categoryRates
        ));

        $currentValue    = round((float) array_sum($initialByCategory), 2);
        $projectedValue  = !empty($dataPoints) ? end($dataPoints)['total'] : $currentValue;

        return [
            'current_value'      => $currentValue,
            'projected_value'    => round($projectedValue, 2),
            'data_points'        => $dataPoints,
            'cumulative_savings' => round($cumulativeSavings, 2),
            'inflation_adjusted' => $inflationRate > 0,
        ];
    }

    /**
     * Returns current EUR-converted value of active non-liability assets, keyed by category_id (string).
     *
     * @return array<string, float>
     */
    private function getInitialValuesByCategory(): array
    {
        return $this->user->assets()
            ->active()
            ->assets()   // scopeAssets: where is_liability = false
            ->with('category')
            ->get()
            ->groupBy('asset_category_id')
            ->map(fn($assets) => round(
                $assets->sum(fn(Asset $a) => (float) $a->current_value * ExchangeRate::getRate($a->currency, 'EUR')),
                2
            ))
            ->toArray();
    }
}
