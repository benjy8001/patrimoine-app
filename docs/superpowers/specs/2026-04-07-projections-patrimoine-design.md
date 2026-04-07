# Projections de Patrimoine — Design Spec

**Date :** 2026-04-07  
**Statut :** Approuvé

---

## Contexte

PatrimoineApp permet de suivre son patrimoine en temps réel (actifs, passifs, revenus, valorisations historiques). Aujourd'hui, la vue est exclusivement rétrospective. L'objectif de cette feature est d'ajouter une dimension **prospective** : simuler la croissance future du patrimoine selon des hypothèses configurables par l'utilisateur, avec des taux de croissance et d'épargne différenciés par catégorie d'actif.

---

## Périmètre

- Simulation de la croissance future du patrimoine sur un horizon configurable
- Paramètres par catégorie d'actif (taux de croissance annuel + épargne mensuelle)
- Horizon en années (slider) et/ou âge cible
- Ajustement optionnel à l'inflation
- Persistance des paramètres dans la table `settings` existante
- UI dans la page Reports (nouvelle section "Projections")
- **Hors périmètre V1 :** multi-scénarios sauvegardés, comparaison aux indices de marché

---

## Architecture

### Backend

```
app/Http/Controllers/ProjectionController.php   (nouveau)
app/Http/Requests/StoreProjectionSettingsRequest.php  (nouveau)
app/Services/ProjectionService.php              (nouveau)
routes/api.php                                  (2 nouvelles routes)
```

**Pas de nouvelle table DB.** Les paramètres sont stockés dans la table `settings` existante sous la clé `projection_settings` (valeur JSON).

### Frontend

```
resources/js/pages/Reports/
  └── ProjectionsSection.tsx    (nouveau)
      ├── ProjectionParams.tsx  (panneau paramètres collapsible)
      └── ProjectionChart.tsx   (graphique Recharts)
```

---

## API

### Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/v1/projections/settings` | Charger les paramètres sauvegardés |
| `PUT` | `/api/v1/projections/settings` | Sauvegarder les paramètres |
| `POST` | `/api/v1/projections/simulate` | Lancer la simulation |

Tous les endpoints requièrent une authentification Sanctum.

### Payload de simulation (POST /simulate)

```json
{
  "horizon_years": 20,
  "target_age": 65,
  "inflation_rate": 2.0,
  "category_rates": {
    "1": { "growth_rate": 3.5, "monthly_savings": 200.0 },
    "2": { "growth_rate": 8.0, "monthly_savings": 300.0 },
    "3": { "growth_rate": 1.5, "monthly_savings": 0.0 }
  }
}
```

- `horizon_years` : entier 1–50, requis
- `target_age` : entier optionnel (utilisé pour la synchronisation avec le champ âge actuel côté client)
- `inflation_rate` : float 0–20, optionnel (défaut 0)
- `category_rates` : objet, clés = asset_category_id de l'utilisateur

### Réponse de simulation

```json
{
  "current_value": 250000.0,
  "projected_value": 1250000.0,
  "data_points": [
    {
      "year": 1,
      "total": 285000.0,
      "breakdown": { "1": 120000.0, "2": 95000.0, "3": 70000.0 }
    }
  ],
  "cumulative_savings": 480000.0,
  "inflation_adjusted": false
}
```

---

## Logique de calcul (ProjectionService)

### Point de départ
- Récupérer la valorisation actuelle de chaque asset actif de l'utilisateur, groupée par `asset_category_id`
- Exclure les passifs (liabilities)

### Formule par catégorie, par année `n`

```
valeur_n = valeur_initiale * (1 + taux)^n
         + épargne_mensuelle * ((1 + taux/12)^(12*n) - 1) / (taux/12)
```

Si `taux = 0` : `valeur_n = valeur_initiale + épargne_mensuelle * 12 * n`

### Ajustement inflation (optionnel)
```
valeur_réelle_n = valeur_nominale_n / (1 + inflation)^n
```

### Agrégation
- Somme des valeurs projetées par catégorie pour obtenir le total annuel
- Point de données généré pour chaque année de 1 à `horizon_years`

---

## Interface utilisateur

Nouvelle section "Projections" dans `/reports`, après les sections existantes.

```
┌─────────────────────────────────────────────────────────┐
│  📈 Projections                          [▼ Paramètres] │
├─────────────────────────────────────────────────────────┤
│  Horizon : [━━━━●━━━━━━] 20 ans    Âge cible : [65 ans] │
│  Inflation : 2.0 %     [☑ Ajuster à l'inflation]        │
├─────────────────────────────────────────────────────────┤
│  Taux par catégorie :                                    │
│  Immobilier  [3.5 %]  Épargne mensuelle [200 €]         │
│  ETF/Actions [8.0 %]  Épargne mensuelle [300 €]         │
│  Livrets     [1.5 %]  Épargne mensuelle [0 €]           │
├─────────────────────────────────────────────────────────┤
│  [Graphique Recharts — courbe du patrimoine total]       │
│   Axe X : années / Axe Y : valeur en €                  │
│   Tooltip : total + breakdown par catégorie              │
├─────────────────────────────────────────────────────────┤
│  À 20 ans : 1 250 000 €                                  │
│  dont 480 000 € d'épargne cumulée                        │
│                            [Sauvegarder les paramètres] │
└─────────────────────────────────────────────────────────┘
```

**Comportements clés :**
- Panneau paramètres collapsible (masqué par défaut, ouvert au 1er usage si aucun paramètre sauvegardé)
- Debounce 500 ms sur chaque changement → appel automatique à `/simulate`
- Bouton "Sauvegarder" → appel à `PUT /projections/settings`
- Slider années + champ âge cible synchronisés via un champ optionnel "âge actuel" dans les paramètres (stocké dans `projection_settings`). Si non renseigné, les deux champs fonctionnent indépendamment.
- Les catégories affichées sont celles que l'utilisateur a effectivement dans son portefeuille (actifs)

---

## Gestion des erreurs

- Taux invalide (< 0 ou > 100) → validation backend + message inline frontend
- Aucun asset actif → message "Ajoutez des actifs pour générer une projection"
- Âge cible dans le passé → validation frontend

---

## Tests

### Backend (Pest)

**`ProjectionServiceTest`**
- Projection capital seul (sans épargne, sans inflation)
- Projection avec épargne mensuelle répartie par catégorie
- Projection avec ajustement inflation
- Taux à 0 % (croissance nulle, épargne seule)
- Plusieurs catégories agrégées correctement

**`ProjectionControllerTest`**
- `GET /settings` retourne les paramètres sauvegardés (ou défauts)
- `PUT /settings` persiste dans la table settings
- `POST /simulate` retourne les data points corrects
- Authentification requise (401 sans token)
- Validation : horizon_years manquant → 422

### Frontend (Vitest)

- `ProjectionParams` : changement de taux → debounce → appel API
- `ProjectionChart` : rendu avec données mockées
- Hook `useProjectionSettings` : load/save settings

---

## Fichiers clés existants à connaître

- `app/Services/PatrimonyCalculator.php` — calcul de la valeur nette actuelle (source de la valeur initiale)
- `app/Models/Setting.php` + `app/Http/Controllers/SettingController.php` — pattern à suivre pour la persistance
- `app/Models/Asset.php` + `app/Models/AssetCategory.php` — relations à requêter
- `resources/js/pages/Reports/` — page cible pour la nouvelle section
- `routes/api.php` — ajout des 3 nouvelles routes dans le groupe auth
