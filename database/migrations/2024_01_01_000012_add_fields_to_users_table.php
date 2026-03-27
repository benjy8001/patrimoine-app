<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('currency', 3)->default('EUR')->after('email');
            $table->string('locale', 5)->default('fr')->after('currency');
            $table->string('timezone')->default('Europe/Paris')->after('locale');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['currency', 'locale', 'timezone']);
        });
    }
};
