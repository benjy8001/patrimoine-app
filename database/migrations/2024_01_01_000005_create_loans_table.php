<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained()->cascadeOnDelete();
            $table->string('lender_name')->nullable();
            $table->decimal('borrowed_amount', 15, 2);
            $table->decimal('remaining_capital', 15, 2);
            $table->decimal('interest_rate', 8, 4)->comment('Annual rate in %');
            $table->decimal('monthly_payment', 10, 2)->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('loan_type', ['mortgage', 'consumer', 'personal', 'crowdlending', 'other'])->default('other');
            $table->string('currency', 3)->default('EUR');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('loans'); }
};
