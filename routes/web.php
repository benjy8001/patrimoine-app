<?php

use Illuminate\Support\Facades\Route;

// Catch-all: serve the React SPA
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*');
