<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('expense_category_id')->constrained('expense_categories')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('EUR');
            $table->tinyInteger('month')->unsigned()->nullable()->comment('1-12, null=récurrent');
            $table->smallInteger('year')->unsigned()->nullable()->comment('null=récurrent');
            $table->timestamps();
            $table->index(['user_id', 'expense_category_id', 'month', 'year']);
        });
    }
    public function down(): void { Schema::dropIfExists('budgets'); }
};
