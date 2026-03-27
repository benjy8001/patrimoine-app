<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport Fiscal {{ $report->fiscal_year }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 20px; }
  h1 { font-size: 18px; color: #1d4ed8; margin-bottom: 4px; }
  .subtitle { color: #6b7280; font-size: 11px; margin-bottom: 16px; }
  .disclaimer { padding: 10px; background: #fef9c3; border-left: 3px solid #eab308; font-size: 9px; color: #713f12; margin-bottom: 18px; }
  .kpis { display: flex; gap: 20px; margin-bottom: 18px; }
  .kpi { flex: 1; padding: 10px; background: #f8fafc; border-radius: 4px; }
  .kpi p { font-size: 10px; color: #6b7280; margin-bottom: 3px; }
  .kpi strong { font-size: 14px; }
  h2 { font-size: 13px; font-weight: bold; margin: 16px 0 8px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1d4ed8; color: white; padding: 7px 8px; text-align: left; font-size: 10px; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .amount { text-align: right; font-weight: 600; }
  .box-code { font-family: monospace; font-weight: bold; color: #1d4ed8; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 9px; }
</style>
</head>
<body>
  <h1>Rapport Fiscal {{ $report->fiscal_year }}</h1>
  <p class="subtitle">{{ $data['user_name'] ?? '' }} — Généré le {{ $data['generated_at'] ? \Carbon\Carbon::parse($data['generated_at'])->format('d/m/Y H:i') : '' }}</p>

  <div class="disclaimer">{{ $data['disclaimer'] ?? '' }}</div>

  <div class="kpis">
    <div class="kpi"><p>Total revenus {{ $report->fiscal_year }}</p><strong>{{ number_format($data['summary']['total_income'] ?? 0, 2, ',', ' ') }} €</strong></div>
    <div class="kpi"><p>Revenus imposables</p><strong>{{ number_format($data['summary']['total_taxable'] ?? 0, 2, ',', ' ') }} €</strong></div>
    <div class="kpi"><p>Nombre d'entrées</p><strong>{{ $data['entries_count'] ?? 0 }}</strong></div>
  </div>

  <h2>Montants à reporter — Déclaration {{ $report->fiscal_year }}</h2>
  @if(!empty($data['tax_lines']))
  <table>
    <thead>
      <tr><th style="width:60px">Case</th><th>Description</th><th style="text-align:right;width:100px">Montant (€)</th></tr>
    </thead>
    <tbody>
      @foreach($data['tax_lines'] as $line)
      <tr>
        <td><span class="box-code">{{ $line['box'] }}</span></td>
        <td>
          {{ $line['label'] }}
          @if(!empty($line['note']))<br><small style="color:#6b7280">{{ $line['note'] }}</small>@endif
        </td>
        <td class="amount">{{ number_format($line['amount'] ?? 0, 2, ',', ' ') }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @else
  <p style="color:#6b7280;padding:10px 0">Aucun montant déclarable trouvé pour {{ $report->fiscal_year }}.</p>
  @endif

  @if(!empty($data['summary']['by_type']))
  <h2>Détail par type de revenu</h2>
  <table>
    <thead>
      <tr><th>Type</th><th style="text-align:right">Total</th><th style="text-align:right">Imposable</th></tr>
    </thead>
    <tbody>
      @foreach($data['summary']['by_type'] as $type => $typeData)
      <tr>
        <td>{{ \App\Models\IncomeEntry::incomeTypeLabel($type) }}</td>
        <td class="amount">{{ number_format($typeData['total'] ?? 0, 2, ',', ' ') }} €</td>
        <td class="amount">{{ number_format($typeData['taxable'] ?? 0, 2, ',', ' ') }} €</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <div class="footer">PatrimoineApp • Rapport fiscal {{ $report->fiscal_year }} — Ce document n'a pas de valeur officielle</div>
</body>
</html>
