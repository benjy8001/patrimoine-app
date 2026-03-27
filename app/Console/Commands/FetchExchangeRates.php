<?php

namespace App\Console\Commands;

use App\Services\ExchangeRateService;
use Illuminate\Console\Command;

class FetchExchangeRates extends Command
{
    protected $signature   = 'exchange-rates:fetch';
    protected $description = 'Récupère les taux de change EUR depuis Frankfurter (ECB) et les enregistre en base';

    public function handle(ExchangeRateService $service): int
    {
        try {
            $result = $service->fetchAndStore();
            $this->info("{$result['updated']} taux mis à jour pour le {$result['date']}.");
            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Échec de la récupération des taux : {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
