<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('asset_valuations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained()->cascadeOnDelete();
            $table->decimal('value', 15, 2);
            $table->string('currency', 3)->default('EUR');
            $table->timestamp('recorded_at');
            $table->enum('source', ['manual', 'import', 'automatic'])->default('manual');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['asset_id', 'recorded_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('asset_valuations'); }
};
