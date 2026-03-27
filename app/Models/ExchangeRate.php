<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    protected $fillable = ['from_currency', 'to_currency', 'rate', 'date'];
    protected $casts = ['rate' => 'decimal:6', 'date' => 'date'];

    public static function getRate(string $from, string $to, ?string $date = null): float
    {
        if ($from === $to) return 1.0;
        $query = static::where('from_currency', $from)->where('to_currency', $to);
        if ($date) $query->where('date', '<=', $date);
        $rate = $query->orderByDesc('date')->first();
        return $rate ? (float)$rate->rate : 1.0;
    }
}
