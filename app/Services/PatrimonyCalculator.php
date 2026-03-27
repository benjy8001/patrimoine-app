<?php

namespace App\Services;

use App\Models\ExchangeRate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class PatrimonyCalculator
{
    private ?Collection $activeAssets = null;

    public function __construct(private readonly User $user) {}

    public function totalAssets(): float
    {
        return $this->getActiveAssets()
            ->where('is_liability', false)
            ->sum(fn($asset) => $this->convertToEur((float) $asset->current_value, $asset->currency));
    }

    public function totalLiabilities(): float
    {
        return $this->getActiveAssets()
            ->where('is_liability', true)
            ->sum(fn($asset) => $this->convertToEur((float) $asset->current_value, $asset->currency));
    }

    public function netWorth(): float
    {
        return $this->totalAssets() - $this->totalLiabilities();
    }

    public function totalInitialInvested(): float
    {
        return $this->getActiveAssets()
            ->where('is_liability', false)
            ->whereNotNull('initial_value')
            ->sum(fn($a) => $this->convertToEur((float) $a->initial_value, $a->currency));
    }

    public function monthlyVariation(): array
    {
        return $this->buildVariation(
            $this->netWorthAtDate(now()->subMonth()->endOfMonth())
        );
    }

    public function yearlyVariation(): array
    {
        return $this->buildVariation(
            $this->netWorthAtDate(now()->subYear()->endOfMonth())
        );
    }

    public function allocationByCategory(): Collection
    {
        $assets = $this->getActiveAssets()->where('is_liability', false);

        return $this->buildAllocation($assets, fn($a) => $a->category?->name ?? 'Sans catégorie')
            ->map(fn($item, $key) => array_merge($item, [
                'name'  => $key,
                'color' => $assets->firstWhere(fn($a) => ($a->category?->name ?? 'Sans catégorie') === $key)?->category?->color ?? '#94A3B8',
            ]))
            ->sortByDesc('value')
            ->values();
    }

    public function allocationByPlatform(): Collection
    {
        $assets = $this->getActiveAssets()->where('is_liability', false);

        return $this->buildAllocation($assets, fn($a) => $a->platform?->name ?? 'Sans plateforme')
            ->map(fn($item, $key) => array_merge($item, ['name' => $key]))
            ->sortByDesc('value')
            ->values();
    }

    public function allocationByCurrency(): Collection
    {
        $assets = $this->getActiveAssets()->where('is_liability', false);

        return $this->buildAllocation($assets, fn($a) => $a->currency)
            ->map(fn($item, $key) => array_merge($item, ['currency' => $key]))
            ->sortByDesc('value')
            ->values();
    }

    public function monthlyChartData(int $months = 12): Collection
    {
        return collect(range($months, 0, -1))->map(function (int $i) {
            $date = now()->subMonths($i)->endOfMonth();
            $assets = $this->assetsValueAtDate($date);
            $liabilities = $this->liabilitiesValueAtDate($date);

            return [
                'month'       => $date->format('Y-m'),
                'label'       => $date->translatedFormat('M Y'),
                'net_worth'   => round($assets - $liabilities, 2),
                'assets'      => round($assets, 2),
                'liabilities' => round($liabilities, 2),
            ];
        });
    }

    public function yearlyChartData(int $years = 5): Collection
    {
        return collect(range($years, 0, -1))->map(function (int $i) {
            $date = now()->subYears($i)->endOfYear();
            if ($date->isFuture()) {
                $date = now();
            }
            $assets = $this->assetsValueAtDate($date);
            $liabilities = $this->liabilitiesValueAtDate($date);

            return [
                'year'        => $date->year,
                'net_worth'   => round($assets - $liabilities, 2),
                'assets'      => round($assets, 2),
                'liabilities' => round($liabilities, 2),
            ];
        });
    }

    public function incomeByYear(int $year): float
    {
        return $this->user->incomeEntries()
            ->where('fiscal_year', $year)
            ->where('is_taxable', true)
            ->sum('amount');
    }

    public function overdueAssetsCount(): int
    {
        return $this->user->assets()
            ->active()
            ->overdue()
            ->count();
    }

    public function globalYield(): float
    {
        $invested = $this->totalInitialInvested();

        if ($invested <= 0) {
            return 0;
        }

        return round((($this->netWorth() - $invested) / $invested) * 100, 2);
    }

    private function getActiveAssets(): Collection
    {
        if ($this->activeAssets === null) {
            $this->activeAssets = $this->user->assets()
                ->with(['category', 'platform'])
                ->where('status', 'active')
                ->get();
        }

        return $this->activeAssets;
    }

    private function buildVariation(float $previousNetWorth): array
    {
        $currentNetWorth = $this->netWorth();
        $diff = $currentNetWorth - $previousNetWorth;
        $percent = $previousNetWorth != 0
            ? ($diff / abs($previousNetWorth)) * 100
            : 0;

        return [
            'previous' => round($previousNetWorth, 2),
            'current'  => round($currentNetWorth, 2),
            'diff'     => round($diff, 2),
            'percent'  => round($percent, 2),
        ];
    }

    private function buildAllocation(Collection $assets, callable $groupBy): Collection
    {
        $total = $assets->sum(fn($a) => $this->convertToEur((float) $a->current_value, $a->currency));

        return $assets->groupBy($groupBy)->map(function (Collection $group) use ($total) {
            $value = $group->sum(fn($a) => $this->convertToEur((float) $a->current_value, $a->currency));

            return [
                'value'   => round($value, 2),
                'percent' => $total > 0 ? round(($value / $total) * 100, 1) : 0,
                'count'   => $group->count(),
            ];
        });
    }

    private function netWorthAtDate(Carbon $date): float
    {
        return $this->assetsValueAtDate($date) - $this->liabilitiesValueAtDate($date);
    }

    private function sumValueAtDate(Carbon $date, bool $isLiability): float
    {
        $assets = $this->user->assets()
            ->with(['valuations' => fn($q) => $q->where('recorded_at', '<=', $date)->orderByDesc('recorded_at')])
            ->where('is_liability', $isLiability)
            ->get();

        return $assets->sum(function ($asset) {
            $valuation = $asset->valuations->first();
            $value = $valuation ? (float) $valuation->value : (float) $asset->current_value;

            return $this->convertToEur($value, $asset->currency);
        });
    }

    private function assetsValueAtDate(Carbon $date): float
    {
        return $this->sumValueAtDate($date, false);
    }

    private function liabilitiesValueAtDate(Carbon $date): float
    {
        return $this->sumValueAtDate($date, true);
    }

    private function convertToEur(float $amount, string $currency): float
    {
        if ($currency === 'EUR') {
            return $amount;
        }

        return ExchangeRate::getRate($currency, 'EUR') * $amount;
    }
}
