<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tax_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('fiscal_year');
            $table->enum('status', ['draft', 'final'])->default('draft');
            $table->json('data')->nullable()->comment('Snapshot of tax data at generation time');
            $table->timestamp('generated_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('exported_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'fiscal_year']);
        });
    }
    public function down(): void { Schema::dropIfExists('tax_reports'); }
};
