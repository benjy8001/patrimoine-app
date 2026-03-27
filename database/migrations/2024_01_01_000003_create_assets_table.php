<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('asset_category_id')->constrained()->restrictOnDelete();
            $table->foreignId('platform_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('currency', 3)->default('EUR');
            $table->decimal('current_value', 15, 2)->default(0);
            $table->decimal('initial_value', 15, 2)->nullable()->comment('Capital initially invested');
            $table->date('acquisition_date')->nullable();
            $table->timestamp('last_updated_at')->nullable();
            $table->enum('status', ['active', 'closed', 'pending'])->default('active');
            $table->enum('update_frequency', ['weekly', 'monthly', 'quarterly', 'yearly', 'manual'])->default('monthly');
            $table->decimal('estimated_yield', 8, 4)->nullable()->comment('Estimated annual yield in %');
            $table->text('notes')->nullable();
            $table->json('meta')->nullable()->comment('Type-specific fields (shares, token, IBAN, etc.)');
            $table->boolean('is_liability')->default(false)->comment('True for debts and loans');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'is_liability']);
            $table->index(['user_id', 'asset_category_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('assets'); }
};
