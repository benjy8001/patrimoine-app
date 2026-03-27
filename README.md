# PatrimoineApp

Application de gestion de patrimoine personnel — Laravel 12 + React 18 + MySQL/MariaDB.

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
| Backend | Laravel 12 + PHP 8.3 |
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

## Guide d'utilisation

### Workflow typique

1. **Connexion** — S'authentifier avec le compte de démo ou créer un nouveau compte
2. **Configurer ses plateformes** — Ajouter ses établissements financiers (Boursorama, Binance, etc.) depuis la page *Plateformes*
3. **Ajouter ses actifs** — Créer chaque actif ou passif avec sa catégorie, sa plateforme et sa valeur actuelle
4. **Suivre les valorisations** — Depuis le détail d'un actif, enregistrer les mises à jour de valeur périodiquement
5. **Saisir ses revenus** — Depuis la page *Revenus*, saisir les intérêts, dividendes, loyers et plus-values reçus dans l'année
6. **Générer le rapport fiscal** — Depuis la page *Fiscalité*, générer le rapport annuel et exporter en CSV ou PDF
7. **Consulter les rapports** — Répartitions par catégorie, plateforme, devise depuis la page *Rapports*

### Pages de l'application

| Page | Description |
|------|-------------|
| **Tableau de bord** | Patrimoine net, répartitions par catégorie/plateforme/devise, graphiques d'évolution mensuelle et annuelle, rendement global |
| **Actifs** | Liste complète, recherche textuelle, filtrage par catégorie et statut (actif/clôturé/en attente) |
| **Détail actif** | Historique des valorisations, revenus associés, informations du prêt lié, mise à jour de valeur |
| **Passifs** | Vue dédiée aux dettes et prêts avec détail des remboursements |
| **Revenus** | Saisie des revenus par type (intérêts, dividendes, loyers, plus-values, crypto, SCPI, crowdlending) et année fiscale |
| **Fiscalité** | Génération du rapport fiscal annuel avec mapping des cases (2TR, 2DC, 4BE, 4L, 3VG, 3AN), export CSV et PDF |
| **Rapports** | Rapport annuel consolidé, répartitions par catégorie, exports CSV et PDF |
| **Historique** | Courbes d'évolution des valorisations dans le temps par actif |
| **Rappels** | Gestion des rappels de mise à jour d'actifs (fréquences : hebdo, mensuel, trimestriel, annuel) |
| **Plateformes** | Gestion des établissements financiers de l'utilisateur |
| **Paramètres** | Devise principale, langue, fuseau horaire, informations du compte |

## Catégories d'actifs

Les catégories sont prédéfinies par le système et non modifiables.

**Actifs (12) :**

| Catégorie | Description |
|-----------|-------------|
| Comptes bancaires | Comptes courants, comptes à vue |
| Livrets & épargne | Livret A, LDDS, CEL, PEL, livrets bancaires |
| Assurance-vie | Contrats d'assurance-vie en euros ou UC |
| Actions / PEA / CTO | Portefeuilles d'actions, PEA, compte-titres ordinaire |
| SCPI | Sociétés Civiles de Placement Immobilier |
| Immobilier | Biens immobiliers physiques (résidence, locatif) |
| Crypto-actifs | Bitcoin, Ethereum et autres crypto-monnaies |
| Crowdfunding | Investissements en financement participatif |
| Crowdlending | Prêts participatifs (October, Younited, etc.) |
| Prêts consentis | Prêts accordés à des tiers |
| Autres plateformes | Actifs sur plateformes non catégorisées |
| Autres actifs | Actifs divers non couverts par les autres catégories |

**Passifs (3) :**

| Catégorie | Description |
|-----------|-------------|
| Prêts bancaires | Crédits immobiliers, prêts auto |
| Crédits & emprunts | Crédits à la consommation, prêts personnels |
| Dettes | Dettes diverses envers des tiers |

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
│   ├── migrations/                  # 15 migrations
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

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/v1/login` | Connexion |
| `POST` | `/api/v1/register` | Inscription |
| `POST` | `/api/v1/logout` | Déconnexion |
| `GET` | `/api/v1/user` | Utilisateur connecté |

### Tableau de bord

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/dashboard` | Données agrégées (patrimoine net, répartitions, rendement) |
| `GET` | `/api/v1/dashboard/chart/monthly` | Données graphique mensuel |
| `GET` | `/api/v1/dashboard/chart/yearly` | Données graphique annuel |

### Actifs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/assets` | Liste des actifs (paramètres : `all`, `status`, `category_id`, `search`, `sort`) |
| `POST` | `/api/v1/assets` | Créer un actif |
| `PUT` | `/api/v1/assets/{id}` | Modifier un actif |
| `DELETE` | `/api/v1/assets/{id}` | Supprimer un actif |
| `GET` | `/api/v1/assets/{id}/valuations` | Historique des valorisations |
| `POST` | `/api/v1/assets/{id}/valuations` | Enregistrer une valorisation |
| `GET` | `/api/v1/assets/{id}/income` | Revenus liés à cet actif |

### Catégories d'actifs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/asset-categories` | Liste des catégories système |

### Plateformes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/platforms` | Liste des plateformes de l'utilisateur |
| `POST` | `/api/v1/platforms` | Créer une plateforme |
| `PUT` | `/api/v1/platforms/{id}` | Modifier une plateforme |
| `DELETE` | `/api/v1/platforms/{id}` | Supprimer une plateforme |

### Prêts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/loans` | Liste des prêts |
| `POST` | `/api/v1/loans` | Créer un prêt |
| `PUT` | `/api/v1/loans/{id}` | Modifier un prêt |
| `DELETE` | `/api/v1/loans/{id}` | Supprimer un prêt |

### Revenus

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/income` | Liste des revenus (paramètres : `year`, `type`, `asset_id`) |
| `POST` | `/api/v1/income` | Créer un revenu |
| `PUT` | `/api/v1/income/{id}` | Modifier un revenu |
| `DELETE` | `/api/v1/income/{id}` | Supprimer un revenu |

### Rappels

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/reminders` | Liste des rappels |
| `POST` | `/api/v1/reminders` | Créer un rappel |
| `PUT` | `/api/v1/reminders/{id}` | Modifier un rappel |
| `DELETE` | `/api/v1/reminders/{id}` | Supprimer un rappel |

### Rapports fiscaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/tax-reports` | Liste des rapports fiscaux |
| `POST` | `/api/v1/tax-reports/generate/{year}` | Générer le rapport pour une année |
| `GET` | `/api/v1/tax-reports/{id}` | Détail d'un rapport fiscal |
| `GET` | `/api/v1/tax-reports/{id}/export/csv` | Export CSV du rapport fiscal |
| `GET` | `/api/v1/tax-reports/{id}/export/pdf` | Export PDF du rapport fiscal |

### Rapports

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/reports/annual` | Rapport annuel consolidé |
| `GET` | `/api/v1/reports/by-category` | Répartition par catégorie |
| `GET` | `/api/v1/reports/export/csv` | Export CSV |
| `GET` | `/api/v1/reports/export/pdf` | Export PDF |

### Paramètres

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/settings` | Paramètres de l'utilisateur |
| `PUT` | `/api/v1/settings` | Mettre à jour les paramètres |

### Taux de change

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/exchange-rates` | Taux de change enregistrés |
| `PUT` | `/api/v1/exchange-rates` | Mettre à jour les taux de change |

## Tâches planifiées

L'application inclut une commande Artisan pour le traitement des rappels :

```bash
php artisan app:send-reminder-notifications
```

Cette commande détecte les rappels arrivés à échéance et les marque comme déclenchés. En production, elle doit être exécutée régulièrement via le scheduler Laravel. Ajouter au crontab du serveur :

```
* * * * * cd /chemin/vers/le/projet && php artisan schedule:run >> /dev/null 2>&1
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
