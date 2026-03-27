<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->string('from_currency', 3);
            $table->string('to_currency', 3);
            $table->decimal('rate', 15, 6);
            $table->date('date');
            $table->timestamps();
            $table->unique(['from_currency', 'to_currency', 'date']);
        });
    }
    public function down(): void { Schema::dropIfExists('exchange_rates'); }
};
