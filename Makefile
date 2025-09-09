.PHONY: help dev build test clean install migrate seed check lint format
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)FlowQuest Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# Environment setup
install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@cd app/packages/common-schemas && npm install && npm run build
	@cd app/web && npm install
	@cd app/server && pip install -r requirements.txt
	@echo "$(GREEN)Dependencies installed successfully$(NC)"

# Development
dev: ## Start development environment with hot reload
	@echo "$(BLUE)Starting development environment...$(NC)"
	@cd app/infra && docker-compose up -d postgres redis minio
	@sleep 5
	@$(MAKE) migrate
	@cd app/infra && docker-compose up --build server web

dev-full: ## Start full development environment including TTS
	@echo "$(BLUE)Starting full development environment with TTS...$(NC)"
	@cd app/infra && docker-compose --profile tts up --build

dev-services: ## Start only infrastructure services (DB, Redis, MinIO)
	@echo "$(BLUE)Starting infrastructure services...$(NC)"
	@cd app/infra && docker-compose up -d postgres redis minio

stop: ## Stop all services
	@echo "$(BLUE)Stopping all services...$(NC)"
	@cd app/infra && docker-compose down

# Database operations
migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@cd app/server && python -m alembic upgrade head
	@echo "$(GREEN)Database migrations completed$(NC)"

migrate-create: ## Create new migration (usage: make migrate-create MESSAGE="description")
	@echo "$(BLUE)Creating new migration...$(NC)"
	@cd app/server && python -m alembic revision --autogenerate -m "$(MESSAGE)"

migrate-rollback: ## Rollback last migration
	@echo "$(YELLOW)Rolling back last migration...$(NC)"
	@cd app/server && python -m alembic downgrade -1

seed: ## Seed database with sample data
	@echo "$(BLUE)Seeding database...$(NC)"
	@cd app/server && python scripts/seed_data.py
	@echo "$(GREEN)Database seeded successfully$(NC)"

# Testing
test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	@$(MAKE) test-backend
	@$(MAKE) test-frontend
	@$(MAKE) test-e2e-smoke
	@echo "$(GREEN)All tests completed$(NC)"

test-backend: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	@cd app/server && python -m pytest tests/ -v

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	@cd app/web && npm run test

test-e2e: ## Run end-to-end tests
	@echo "$(BLUE)Running E2E tests...$(NC)"
	@cd app/web && npm run test:e2e

test-e2e-smoke: ## Run smoke tests only
	@echo "$(BLUE)Running E2E smoke tests...$(NC)"
	@cd app/web && npm run test:e2e:smoke

test-a11y: ## Run accessibility tests
	@echo "$(BLUE)Running accessibility tests...$(NC)"
	@cd app/web && npm run test:a11y

# Code quality
lint: ## Run linters for all code
	@echo "$(BLUE)Running linters...$(NC)"
	@cd app/server && black --check . && isort --check-only .
	@cd app/web && npm run lint
	@cd app/packages/common-schemas && npm run lint

format: ## Format all code
	@echo "$(BLUE)Formatting code...$(NC)"
	@cd app/server && black . && isort .
	@cd app/web && npm run lint:fix
	@cd app/packages/common-schemas && npm run lint:fix

type-check: ## Run type checking
	@echo "$(BLUE)Running type checks...$(NC)"
	@cd app/server && mypy .
	@cd app/web && npm run type-check
	@cd app/packages/common-schemas && npm run type-check

# Build and deployment
build: ## Build all applications for production
	@echo "$(BLUE)Building applications...$(NC)"
	@cd app/packages/common-schemas && npm run build
	@cd app/web && npm run build
	@echo "$(GREEN)Build completed successfully$(NC)"

build-docker: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	@cd app/infra && docker-compose build

# Cleanup
clean: ## Clean up build artifacts and caches
	@echo "$(BLUE)Cleaning up...$(NC)"
	@cd app/web && rm -rf .next node_modules
	@cd app/packages/common-schemas && rm -rf dist node_modules
	@cd app/server && rm -rf __pycache__ .pytest_cache
	@cd app/infra && docker-compose down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)Cleanup completed$(NC)"

# Health checks and monitoring
health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@curl -f http://localhost:8000/health || echo "$(RED)Backend health check failed$(NC)"
	@curl -f http://localhost:3000/health || echo "$(RED)Frontend health check failed$(NC)"
	@echo "$(GREEN)Health checks completed$(NC)"

logs: ## Show logs for all services
	@cd app/infra && docker-compose logs -f

logs-server: ## Show server logs
	@cd app/infra && docker-compose logs -f server

logs-web: ## Show web logs  
	@cd app/infra && docker-compose logs -f web

# Performance and acceptance tests
acceptance: ## Run full acceptance test suite
	@echo "$(BLUE)Running acceptance tests...$(NC)"
	@$(MAKE) test-delta
	@$(MAKE) test-sync
	@$(MAKE) test-latency
	@$(MAKE) test-tvo
	@$(MAKE) test-a11y

test-delta: ## Test delta rendering performance
	@echo "$(BLUE)Testing delta rendering...$(NC)"
	@cd app/server && python tests/acceptance/test_delta_rendering.py

test-sync: ## Test content synchronization
	@echo "$(BLUE)Testing sync between video and exports...$(NC)"
	@cd app/server && python tests/acceptance/test_sync.py

test-latency: ## Test video latency metrics
	@echo "$(BLUE)Testing video latency...$(NC)"
	@cd app/server && python tests/acceptance/test_latency.py

test-tvo: ## Test Time to Verified Outcome
	@echo "$(BLUE)Testing TVO metrics...$(NC)"
	@cd app/server && python tests/acceptance/test_tvo.py

# Documentation
docs: ## Generate API documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	@cd app/server && python scripts/generate_docs.py
	@echo "$(GREEN)Documentation generated$(NC)"

# Environment configuration
env: ## Copy environment template
	@echo "$(BLUE)Setting up environment files...$(NC)"
	@cp .env.example .env
	@echo "$(YELLOW)Please edit .env with your actual values$(NC)"

# Quick start for new developers
setup: install env dev-services migrate seed ## Complete setup for new developers
	@echo "$(GREEN)Setup complete! Run 'make dev' to start development$(NC)"

# Production deployment (placeholder)
deploy: ## Deploy to production (implementation needed)
	@echo "$(RED)Production deployment not yet implemented$(NC)"
	@echo "Configure your deployment pipeline here"
