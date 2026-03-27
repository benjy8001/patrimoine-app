<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'PatrimoineApp') }}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    @viteReactRefresh
    @vite(['resources/js/main.tsx', 'resources/css/app.css'])
</head>
<body class="bg-background text-foreground antialiased">
    <div id="root"></div>
</body>
</html>
