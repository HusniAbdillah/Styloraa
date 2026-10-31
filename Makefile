# Stylora Makefile — thin wrappers over the pnpm scripts and the Supabase CLI.
# Requires Node.js 22 and pnpm (see README.md). Run `make help` for the list.

PNPM := pnpm

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show available targets
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'

.PHONY: env
env: ## Copy .env.example to .env.local when missing
	@test -f .env.local || cp .env.example .env.local
	@test -f .env.local && echo ".env.local ready (fill in values from .env.example)."

.PHONY: install
install: ## Install dependencies with pnpm
	$(PNPM) install

.PHONY: dev
dev: ## Start the Next.js dev server
	$(PNPM) dev

.PHONY: build
build: ## Production build
	$(PNPM) build

.PHONY: start
start: ## Serve the production build
	$(PNPM) start

.PHONY: lint
lint: ## Run ESLint
	$(PNPM) lint

.PHONY: typecheck
typecheck: ## Run Next.js type generation and tsc
	$(PNPM) typecheck

.PHONY: test
test: ## Run unit tests once
	$(PNPM) test

.PHONY: test-watch
test-watch: ## Run unit tests in watch mode
	$(PNPM) test:watch

.PHONY: format
format: ## Format with Prettier
	$(PNPM) format

.PHONY: check
check: ## Run lint + typecheck + tests
	$(PNPM) check

.PHONY: db-start
db-start: ## Start local Supabase (needs Docker)
	$(PNPM) db:start

.PHONY: db-stop
db-stop: ## Stop local Supabase
	$(PNPM) db:stop

.PHONY: db-reset
db-reset: ## Reset the LOCAL database (destroys local data)
	$(PNPM) db:reset

.PHONY: db-types
db-types: ## Regenerate typed database contracts
	$(PNPM) db:types

.PHONY: db-test
db-test: ## Run database policy tests
	$(PNPM) db:test

.PHONY: clean
clean: ## Remove build output and Next.js cache
	rm -rf .next out
