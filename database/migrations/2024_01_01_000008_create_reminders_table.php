<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('asset_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('message')->nullable();
            $table->date('due_date');
            $table->enum('frequency', ['once', 'weekly', 'monthly', 'quarterly', 'yearly'])->default('monthly');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_triggered_at')->nullable();
            $table->date('next_due_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'is_active', 'next_due_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('reminders'); }
};
