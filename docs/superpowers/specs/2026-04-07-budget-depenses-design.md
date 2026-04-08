# Budget & Dépenses Mensuelles — Design Spec

**Date:** 2026-04-07
**Statut:** Approuvé

---

## Contexte

L'application patrimoine-app suit actuellement les actifs, passifs, revenus et projections, mais n'offre aucun suivi des dépenses quotidiennes ni de gestion budgétaire. L'utilisateur veut pouvoir :

1. Saisir ses dépenses manuellement (transaction par transaction)
2. Définir un budget prévisionnel par catégorie (récurrent mensuel + override ponctuel)
3. Comparer budget prévu vs réel pour chaque mois
4. Visualiser l'évolution des dépenses sur l'année

Ce module est **indépendant du patrimoine** : il couvre exclusivement les sorties d'argent courantes du quotidien, sans lien avec les actifs ou revenus existants.

---

## Modèles de données

### `expense_categories`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | bigint PK | |
| `user_id` | bigint FK nullable | null = catégorie système |
| `name` | string | Libellé |
| `icon` | string nullable | Icône optionnelle |
| `color` | string | Couleur hex pour UI |
| `is_system` | boolean | true = non modifiable/supprimable |
| `order` | integer | Ordre d'affichage |
| `timestamps` | | |

**Catégories système prédéfinies (11) :**
Logement, Alimentation, Transport, Santé, Loisirs, Vêtements, Abonnements, Restauration, Voyages, Éducation, Autres

Les utilisateurs peuvent ajouter des catégories custom (`user_id` = leur ID). Ils ne peuvent ni modifier ni supprimer les catégories système.

---

### `expenses`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | bigint PK | |
| `user_id` | bigint FK | |
| `expense_category_id` | bigint FK | |
| `amount` | decimal(15,2) | Montant |
| `currency` | string(3) | Code ISO (EUR, USD...) |
| `description` | string | Libellé de la transaction |
| `date` | date | Date de la dépense |
| `notes` | text nullable | Notes libres |
| `timestamps` | | |

La conversion vers la devise de référence utilise le système `ExchangeRateService` existant.

---

### `budgets`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | bigint PK | |
| `user_id` | bigint FK | |
| `expense_category_id` | bigint FK | |
| `amount` | decimal(15,2) | Montant budgété |
| `currency` | string(3) | Code ISO |
| `month` | tinyint nullable | 1-12, null = récurrent |
| `year` | smallint nullable | null = récurrent |
| `timestamps` | | |

**Logique de résolution du budget effectif pour un mois donné :**
1. Cherche un budget avec `(category_id, month, year)` exact → override ponctuel
2. Fallback sur un budget avec `(category_id, null, null)` → récurrent
3. Si aucun → budget = 0 (catégorie non budgétée)

Contrainte unique : `(user_id, expense_category_id, month, year)` — un seul budget par catégorie/mois.

---

## API

Tous les endpoints sous `/api/v1/`, authentifiés via Sanctum. Isolation utilisateur via Laravel Policies.

### Catégories de dépenses

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/expense-categories` | Liste (système + custom de l'user) |
| `POST` | `/expense-categories` | Créer une catégorie custom |
| `PUT` | `/expense-categories/{id}` | Modifier (custom seulement) |
| `DELETE` | `/expense-categories/{id}` | Supprimer (custom seulement) |

### Dépenses

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/expenses` | Liste filtrée (`month`, `year`, `category_id`) |
| `POST` | `/expenses` | Créer une transaction |
| `PUT` | `/expenses/{id}` | Modifier |
| `DELETE` | `/expenses/{id}` | Supprimer |

### Budgets

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/budgets` | Budgets effectifs pour un mois (`month`, `year`) |
| `POST` | `/budgets` | Définir un budget (récurrent ou ponctuel) |
| `PUT` | `/budgets/{id}` | Modifier |
| `DELETE` | `/budgets/{id}` | Supprimer |

### Synthèse et évolution

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/budget/summary` | Agrégation par catégorie (`month`, `year`) : budget effectif + dépensé + reste |
| `GET` | `/budget/evolution` | Total dépensé par mois sur l'année (`year`) pour graphique |

**Réponse `/budget/summary` :**
```json
{
  "month": 4,
  "year": 2026,
  "currency": "EUR",
  "total_budget": 2500.00,
  "total_spent": 1820.50,
  "total_remaining": 679.50,
  "categories": [
    {
      "category": { "id": 1, "name": "Logement", "color": "#..." },
      "budget": 900.00,
      "spent": 900.00,
      "remaining": 0.00,
      "rate": 100.0
    }
  ]
}
```

**Réponse `/budget/evolution` :**
```json
{
  "year": 2026,
  "currency": "EUR",
  "months": [
    {
      "month": 1,
      "total": 1750.00,
      "by_category": [
        { "category_id": 1, "name": "Logement", "amount": 900.00 }
      ]
    }
  ]
}
```

---

## Service Backend

**`BudgetService`** — logique métier centralisée :
- `getSummary(User $user, int $month, int $year): array` — résout les budgets effectifs, agrège les dépenses, calcule les restes
- `getEvolution(User $user, int $year): array` — agrège les dépenses par mois et catégorie
- `resolveEffectiveBudget(User $user, int $categoryId, int $month, int $year): ?Budget` — logique override vs récurrent

Pattern identique aux services existants (`PatrimonyCalculator`, `ProjectionService`).

---

## Frontend

### Page "Budget"

Nouvelle entrée dans le menu principal. Structure avec deux onglets.

#### Onglet 1 — "Mois en cours" (défaut)

- **Sélecteur mois/année** en haut (navigation ← →)
- **Tableau par catégorie** :
  - Colonnes : Catégorie | Budget | Dépensé | Reste | Progression
  - Barre de progression colorée : vert (< 80%), orange (80-100%), rouge (> 100%)
- **Bouton "+ Ajouter une dépense"** → formulaire slide-in (Sheet shadcn) :
  - Champs : Montant, Devise, Catégorie, Date, Description, Notes
- **Totaux globaux** en bas : Budget total | Dépensé | Reste
- **Bouton "Configurer les budgets"** → modal ou page dédiée

#### Onglet 2 — "Évolution"

- **Sélecteur d'année**
- **Stacked bar chart Recharts** : total dépensé par mois, coloré par catégorie
- Tooltip avec détail par catégorie au survol

#### Gestion des budgets (modal/page)

- Liste des catégories avec champ montant (budget récurrent)
- Toggle par catégorie pour "Override ce mois" → champ montant ponctuel
- Bouton pour ajouter une catégorie custom

---

### Fichiers frontend

| Fichier | Rôle |
|---------|------|
| `resources/js/api/budget.ts` | Wrappers API (expenses, budgets, summary, evolution) |
| `resources/js/hooks/useBudget.ts` | Hook : summary du mois, navigation mois, ajout dépense |
| `resources/js/hooks/useExpenses.ts` | Hook : liste + CRUD dépenses |
| `resources/js/pages/Budget/index.tsx` | Page principale avec onglets |
| `resources/js/pages/Budget/BudgetTable.tsx` | Tableau budget vs réel |
| `resources/js/pages/Budget/BudgetChart.tsx` | Stacked bar chart évolution |
| `resources/js/pages/Budget/ExpenseForm.tsx` | Formulaire saisie dépense (Sheet) |
| `resources/js/pages/Budget/BudgetConfig.tsx` | Configuration des budgets |

Patterns identiques à l'existant : shadcn/ui, Recharts, React Hook Form + Zod, Zustand si besoin de state global.

---

## Vérification / Tests

### Backend (Pest)
- `ExpenseCategoryTest` : création custom, blocage modification système, isolation user
- `ExpenseTest` : CRUD, filtrage par mois/catégorie, conversion devise
- `BudgetTest` : logique override vs récurrent, contrainte unique
- `BudgetSummaryTest` : calcul budget effectif + agrégation dépenses + taux
- `BudgetEvolutionTest` : agrégation par mois/catégorie sur l'année

### Frontend (Vitest)
- `BudgetService` : résolution budget effectif (override, fallback récurrent, aucun)
- `BudgetTable` : affichage couleurs selon taux consommation

### End-to-end
1. Créer des catégories custom
2. Définir des budgets récurrents pour 3 catégories
3. Définir un override ponctuel pour 1 catégorie sur le mois courant
4. Saisir plusieurs transactions
5. Vérifier le tableau summary : budget effectif correct (override > récurrent), totaux exacts
6. Naviguer vers l'onglet Évolution : vérifier que les mois avec dépenses apparaissent
