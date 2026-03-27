#!/usr/bin/env bash

ifndef VERBOSE
.SILENT:
endif

DOCKER_COMPOSE  = docker compose
EXEC_PHP        = $(DOCKER_COMPOSE) exec phpfpm
ARTISAN         = $(EXEC_PHP) php artisan
COMPOSER        = $(EXEC_PHP) composer

# Deployment — override via env or CLI: make deploy DEPLOY_HOST=myserver.com
DEPLOY_USER    ?= u220762961
DEPLOY_HOST    ?= benjamin-mabille.net
DEPLOY_PORT    ?= 65002
DEPLOY_PATH    ?= /home/u220762961/domains/benjamin-mabille.net/public_html/webcv
DEPLOY_SSH      = ssh -p $(DEPLOY_PORT) $(DEPLOY_USER)@$(DEPLOY_HOST)

.DEFAULT_GOAL := help
help: ## This help
	@grep -E '(^[a-zA-Z_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/  \x1b\[32m##/\x1b\[33m/'
.PHONY: help

##
## Project
## -------
build: .env ## Build docker images
	$(DOCKER_COMPOSE) build

run: build ## Start containers
	$(DOCKER_COMPOSE) up -d

stop: ## Stop containers
	$(DOCKER_COMPOSE) stop

down: ## Stop and remove containers + volumes
	$(DOCKER_COMPOSE) down --volumes

clean: ## Stop containers and remove generated files (ask confirmation)
	@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	$(DOCKER_COMPOSE) down -v
	rm -rf vendor public/build storage/logs/laravel.log

start: add-hooks .env run vendor assets init-storage key init-database ## First install: full project setup

.env:
	cp .env.example .env

add-hooks: ## Install git hooks
	rm -fr .git/hooks && ln -s `pwd`/.hooks/ .git/hooks

##
## Assets
## ------
assets: ## Install npm deps and compile assets
	$(EXEC_PHP) npm install
	$(EXEC_PHP) npm run build

assets-watch: ## Compile assets in watch mode
	$(EXEC_PHP) npm run dev

##
## Composer
## --------
vendor: ## Run composer install
	$(COMPOSER) install

composer-update: ## Update composer dependencies
	$(COMPOSER) update

##
## Database
## --------
init-database: ## Fresh migration + seed
	$(ARTISAN) migrate:fresh --seed

migrate: ## Run pending migrations
	$(ARTISAN) migrate

seed: ## Run seeders
	$(ARTISAN) db:seed

##
## Laravel
## -------
key: ## Generate APP_KEY in .env
	$(ARTISAN) key:generate

init-storage: ## Create public storage symlink
	$(ARTISAN) storage:link

optimize: ## Cache config, routes and views
	$(ARTISAN) optimize

optimize-clear: ## Clear all caches
	$(ARTISAN) optimize:clear

tinker: ## Run Laravel Tinker
	$(ARTISAN) tinker

connect: ## Open shell in PHP container
	$(EXEC_PHP) bash

##
## Tests
## -----
tests: ## Run Pest tests
	$(ARTISAN) test

##
## Deployment (production)
## -----------------------
deploy: deploy-assets deploy-sync deploy-env deploy-composer deploy-artisan ## Full production deployment

deploy-assets: ## Build production assets locally (npm run build)
	printf "\033[32m Building assets... \033[0m\n"
	$(EXEC_PHP) npm install
	$(EXEC_PHP) npm run build

deploy-sync: ## Sync files to server via rsync (excludes .env, vendor, node_modules, logs)
	printf "\033[32m Syncing to $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_PATH) ... \033[0m\n"
	rsync -az --delete -p \
		--exclude='.git' \
		--exclude='.env' \
		--exclude='.claude' \
		--exclude='node_modules' \
		--exclude='vendor' \
		--exclude='storage/logs' \
		--exclude='storage/app/public' \
		--exclude='public/hot' \
		--exclude='docker' \
		--exclude='docker-compose.yml' \
		--exclude='Makefile' \
		--exclude='CLAUDE.md' \
		-e "ssh -p $(DEPLOY_PORT)" \
		./ \
		$(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_PATH)/

deploy-env: ## Copy .env.production to .env on production server
	printf "\033[32m Copying .env.production to .env on server... \033[0m\n"
	$(DEPLOY_SSH) "cp $(DEPLOY_PATH)/.env.production $(DEPLOY_PATH)/.env"

deploy-composer: ## Run composer install --no-dev on production server
	printf "\033[32m Installing dependencies on server... \033[0m\n"
	$(DEPLOY_SSH) "cd $(DEPLOY_PATH) && composer install --no-dev --optimize-autoloader --no-interaction"

deploy-artisan: ## Run migrations and cache commands on production server
	printf "\033[32m Running artisan commands on server... \033[0m\n"
	$(DEPLOY_SSH) "cd $(DEPLOY_PATH) && php artisan migrate --force && php artisan storage:link --force && php artisan optimize"

deploy-ssh: ## Open SSH session on production server
	$(DEPLOY_SSH)

.PHONY: build run stop down clean start add-hooks
.PHONY: assets assets-watch
.PHONY: vendor composer-update
.PHONY: init-database migrate seed
.PHONY: key init-storage optimize optimize-clear tinker connect
.PHONY: tests
.PHONY: deploy deploy-assets deploy-sync deploy-env deploy-composer deploy-artisan deploy-ssh
