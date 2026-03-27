<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('income_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('asset_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('income_type', [
                'interest', 'dividend', 'rental', 'capital_gain',
                'scpi', 'crowdlending', 'crypto', 'other'
            ]);
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('EUR');
            $table->unsignedSmallInteger('fiscal_year');
            $table->date('received_at');
            $table->boolean('is_taxable')->default(true);
            $table->string('tax_category')->nullable()->comment('Custom fiscal tag');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'fiscal_year']);
            $table->index(['user_id', 'income_type']);
        });
    }
    public function down(): void { Schema::dropIfExists('income_entries'); }
};
