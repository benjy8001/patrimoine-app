# PatrimoineApp

Application de gestion de patrimoine personnel — Laravel 13 + React 18 + MySQL/MariaDB.

## Présentation

PatrimoineApp est une application web full-stack permettant de centraliser et suivre son patrimoine personnel :

- **Actifs** : comptes bancaires, livrets, assurance-vie, PEA/CTO, SCPI, immobilier, crypto, crowdlending, etc.
- **Passifs** : prêts bancaires, crédits, dettes
- **Tableau de bord** : patrimoine net, répartitions, évolution dans le temps
- **Fiscalité** : aide à la préparation de la déclaration d'impôt française
- **Rapports** : exports CSV et PDF

> ⚠️ **Disclaimer fiscal** : PatrimoineApp est un outil d'aide à la préparation et ne remplace pas les conseils d'un expert-comptable ou fiscaliste agréé.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Backend | Laravel 13 + PHP 8.3 |
| Frontend | React 18 + TypeScript + Vite |
| Base de données | MariaDB (MySQL-compatible) |
| Auth | Laravel Sanctum (SPA stateful) |
| UI | Tailwind CSS + shadcn/ui (Radix UI) |
| Graphiques | Recharts |
| Export PDF | barryvdh/laravel-dompdf |
| Cache/Queue | Redis |
| Tests | Pest PHP + Vitest |
| Infrastructure | Docker + Nginx |

## Prérequis

- Docker + Docker Compose
- Make (optionnel mais recommandé)
- Git

## Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo> patrimoine-app
cd patrimoine-app
```

### 2. Premier lancement (installation complète)

```bash
make start
```

Cette commande :
1. Crée le fichier `.env` depuis `.env.example`
2. Construit les images Docker
3. Démarre les conteneurs
4. Installe les dépendances PHP (Composer)
5. Compile les assets frontend (npm install + vite build)
6. Génère la clé applicative Laravel
7. Crée le lien de stockage
8. Lance les migrations et seeders (données de démo)

### 3. Lancement manuel (si nécessaire)

Si `make start` pose des problèmes, voici les étapes individuelles :

```bash
# Copier la configuration
cp .env.example .env

# Démarrer Docker
docker compose up -d

# Installer les dépendances PHP
docker compose exec phpfpm composer install

# Installer les dépendances JS et builder
docker compose exec phpfpm npm install
docker compose exec phpfpm npm run build

# Générer la clé
docker compose exec phpfpm php artisan key:generate

# Lien de stockage
docker compose exec phpfpm php artisan storage:link

# Migrations + données de démo
docker compose exec phpfpm php artisan migrate:fresh --seed
```

## Configuration

### Variables d'environnement principales (`.env`)

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `APP_NAME` | Nom de l'application | `PatrimoineApp` |
| `APP_URL` | URL de l'application | `http://localhost` |
| `APP_FRONTEND_URL` | URL du frontend (CORS) | `http://localhost:5173` |
| `DB_HOST` | Hôte MariaDB | `mariadb` |
| `DB_DATABASE` | Nom de la BDD | `patrimoine` |
| `DB_USERNAME` | Utilisateur BDD | `patrimoine` |
| `DB_PASSWORD` | Mot de passe BDD | `secret` |
| `REDIS_HOST` | Hôte Redis | `redis` |
| `SANCTUM_STATEFUL_DOMAINS` | Domaines autorisés Sanctum | `localhost,localhost:5173` |

## Accès à l'application

Une fois lancée :

| Service | URL | Description |
|---------|-----|-------------|
| Application | http://localhost | Frontend React + API Laravel |
| MailHog | http://localhost/mailhog/ | Capture des emails (dev) |

### Compte de démonstration

```
Email    : demo@patrimoine.local
Mot de passe : password
```

## Commandes utiles

### Docker & projet

```bash
make run              # Démarrer les conteneurs
make stop             # Arrêter les conteneurs
make down             # Arrêter + supprimer volumes
make connect          # Ouvrir un shell dans le conteneur PHP
```

### Développement

```bash
make assets-watch     # Compiler les assets en mode watch (hot reload)
make migrate          # Lancer les migrations
make seed             # Lancer les seeders
make init-database    # Réinitialiser la BDD (migrate:fresh --seed)
make tests            # Lancer les tests Pest
make tinker           # Laravel Tinker
```

### Assets / Frontend

```bash
make assets           # Build de production
make assets-watch     # Mode développement (HMR)
```

### Base de données

```bash
make migrate          # Appliquer les migrations en attente
make seed             # Injecter les données de démo
make init-database    # Réinitialisation complète (migrate:fresh --seed)
```

## Structure du projet

```
/
├── app/
│   ├── Console/Commands/
│   │   └── SendReminderNotifications.php
│   ├── Http/
│   │   ├── Controllers/Api/V1/      # Contrôleurs API REST
│   │   ├── Requests/                # Validation des formulaires
│   │   └── Resources/               # Transformateurs API
│   ├── Models/                      # Modèles Eloquent
│   ├── Policies/                    # Autorisation (AssetPolicy, etc.)
│   └── Services/                    # Logique métier
│       ├── PatrimonyCalculator.php  # Calculs patrimoniaux
│       ├── TaxReportGenerator.php   # Génération rapport fiscal
│       ├── ExportService.php        # Exports CSV/PDF
│       └── ReminderService.php      # Gestion des rappels
│
├── database/
│   ├── migrations/                  # 12 migrations
│   ├── seeders/                     # Données initiales + démo
│   └── factories/                   # Factories pour tests
│
├── resources/
│   ├── css/app.css                  # Tailwind + variables CSS
│   ├── js/                          # Source React TypeScript
│   │   ├── api/                     # Couche API Axios
│   │   ├── components/              # Composants réutilisables
│   │   ├── hooks/                   # Custom hooks
│   │   ├── pages/                   # Pages React (13 pages)
│   │   ├── stores/                  # Zustand (auth)
│   │   ├── types/                   # Types TypeScript
│   │   └── utils/                   # Utilitaires (format, cn)
│   └── views/
│       ├── app.blade.php            # Shell SPA
│       └── exports/                 # Templates PDF (DomPDF)
│
├── routes/
│   ├── api.php                      # Routes API V1
│   ├── web.php                      # Catch-all → SPA
│   └── console.php                  # Scheduler
│
├── docker/                          # Config Docker
├── docker-compose.yml
├── Makefile
├── composer.json
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## Modèle de données

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs (+ currency, locale, timezone) |
| `asset_categories` | Catégories système (banque, crypto, immobilier, etc.) |
| `platforms` | Plateformes / établissements de l'utilisateur |
| `assets` | Actifs et passifs avec champs `meta` JSON extensibles |
| `asset_valuations` | Historique des valorisations |
| `loans` | Détails des emprunts liés aux actifs |
| `income_entries` | Revenus (intérêts, dividendes, loyers, plus-values, etc.) |
| `tax_reports` | Rapports fiscaux annuels générés |
| `reminders` | Rappels de mise à jour |
| `attachments` | Pièces jointes polymorphiques |
| `settings` | Préférences utilisateur (clé/valeur JSON) |
| `exchange_rates` | Taux de change manuels |

## API REST

Toutes les routes sont préfixées par `/api/v1/` et protégées par `auth:sanctum` (sauf login/register).

Exemples :

```
GET    /api/v1/dashboard
GET    /api/v1/assets?all=true&status=active
POST   /api/v1/assets
PUT    /api/v1/assets/{id}
DELETE /api/v1/assets/{id}
POST   /api/v1/assets/{id}/valuations
GET    /api/v1/income?year=2024
POST   /api/v1/tax-reports/generate/2024
GET    /api/v1/tax-reports/{id}/export/csv
```

## Tests

```bash
# Tests PHP (Pest)
make tests

# Tests frontend (Vitest)
docker compose exec phpfpm npm run test
```

## Idées d'amélioration (V2/V3)

### V2 — Enrichissement
- [ ] Export Excel (.xlsx) via maatwebsite/laravel-excel
- [ ] Taux de change automatiques (API fixer.io ou ECB)
- [ ] Pièces jointes / justificatifs (upload PDF, relevés)
- [ ] Import CSV d'actifs en masse
- [ ] Notifications email pour les rappels (Laravel Mail)
- [ ] Mode sombre / thème
- [ ] Multi-utilisateurs avec isolation des données

### V3 — Automatisation
- [ ] Synchronisation API plateformes (Budget Insight / Linxo)
- [ ] OCR de relevés bancaires et fiscaux (PDF → données)
- [ ] Application mobile React Native (API existante)
- [ ] Catégorisation automatique par IA
- [ ] Alertes de performance (alerte si rendement < seuil)
- [ ] Comparaison avec indices de référence (CAC40, inflation)

## Sécurité

- Authentification par session Sanctum (pas de tokens JWT exposés)
- Policies Laravel : chaque utilisateur ne voit que ses propres données
- Validation côté backend (Form Requests) et côté frontend (zod)
- CORS configuré pour le domaine frontend uniquement
- Variables sensibles uniquement dans `.env` (jamais committé)

## License

MIT
