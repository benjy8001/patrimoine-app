<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 100);
            $table->string('icon', 50)->nullable();
            $table->string('color', 7)->default('#94A3B8');
            $table->boolean('is_system')->default(false);
            $table->unsignedSmallInteger('order')->default(99);
            $table->timestamps();
            $table->index(['user_id', 'is_system']);
        });
    }
    public function down(): void { Schema::dropIfExists('expense_categories'); }
};
