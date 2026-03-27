<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport patrimonial</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 20px; }
  h1 { font-size: 20px; color: #1d4ed8; margin-bottom: 4px; }
  .subtitle { color: #6b7280; font-size: 11px; margin-bottom: 20px; }
  .meta { display: flex; gap: 30px; margin-bottom: 20px; padding: 12px; background: #f8fafc; border-radius: 6px; }
  .meta-item p { font-size: 10px; color: #6b7280; margin-bottom: 2px; }
  .meta-item strong { font-size: 15px; color: #1a1a1a; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #1d4ed8; color: white; padding: 7px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .value { text-align: right; font-weight: 600; }
  .liability { color: #dc2626; }
  .section-title { font-size: 13px; font-weight: bold; margin: 18px 0 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .disclaimer { margin-top: 24px; padding: 10px; background: #fef9c3; border-left: 3px solid #eab308; font-size: 9px; color: #713f12; }
  .footer { margin-top: 20px; text-align: center; color: #9ca3af; font-size: 9px; }
</style>
</head>
<body>
  <h1>Rapport Patrimonial</h1>
  <p class="subtitle">{{ $user->name }} — Généré le {{ $generated_at }}</p>

  <div class="meta">
    <div class="meta-item"><p>Patrimoine net</p><strong>{{ number_format($net_worth, 0, ',', ' ') }} €</strong></div>
    <div class="meta-item"><p>Total actifs</p><strong>{{ number_format($total_assets, 0, ',', ' ') }} €</strong></div>
    <div class="meta-item"><p>Total passifs</p><strong>{{ number_format($total_liabilities, 0, ',', ' ') }} €</strong></div>
    <div class="meta-item"><p>Nombre d'actifs</p><strong>{{ $assets->where('is_liability', false)->count() }}</strong></div>
  </div>

  <div class="section-title">Actifs</div>
  <table>
    <thead>
      <tr>
        <th>Nom</th>
        <th>Catégorie</th>
        <th>Plateforme</th>
        <th>Devise</th>
        <th style="text-align:right">Valeur</th>
        <th style="text-align:right">Capital investi</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      @foreach($assets->where('is_liability', false) as $asset)
      <tr>
        <td>{{ $asset->name }}</td>
        <td>{{ $asset->category?->name }}</td>
        <td>{{ $asset->platform?->name ?? '—' }}</td>
        <td>{{ $asset->currency }}</td>
        <td class="value">{{ number_format((float)$asset->current_value, 2, ',', ' ') }}</td>
        <td class="value">{{ $asset->initial_value ? number_format((float)$asset->initial_value, 2, ',', ' ') : '—' }}</td>
        <td>{{ $asset->status }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>

  @if($assets->where('is_liability', true)->count() > 0)
  <div class="section-title">Passifs</div>
  <table>
    <thead>
      <tr>
        <th>Nom</th>
        <th>Catégorie</th>
        <th>Devise</th>
        <th style="text-align:right">Montant</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      @foreach($assets->where('is_liability', true) as $asset)
      <tr>
        <td>{{ $asset->name }}</td>
        <td>{{ $asset->category?->name }}</td>
        <td>{{ $asset->currency }}</td>
        <td class="value liability">{{ number_format((float)$asset->current_value, 2, ',', ' ') }}</td>
        <td>{{ $asset->status }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <div class="disclaimer">
    ⚠️ Ce document est généré automatiquement. Les valorisations sont basées sur les données saisies manuellement et ne constituent pas un conseil en investissement.
  </div>
  <div class="footer">PatrimoineApp • {{ $generated_at }}</div>
</body>
</html>
