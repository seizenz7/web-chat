#!/bin/bash

# PERN Stack Setup Script
# This script automates the initial setup process

set -e  # Exit on error

echo "=========================================="
echo "PERN Stack - Initial Setup"
echo "=========================================="
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Installing yarn..."
    npm install -g yarn
fi

echo "✓ Prerequisites check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
yarn install
echo "✓ Dependencies installed"
echo ""

# Setup environment files
echo "⚙️  Setting up environment files..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env from .env.example"
else
    echo "ℹ️  .env already exists, skipping"
fi

if [ ! -f apps/server/.env ]; then
    cp apps/server/.env.example apps/server/.env
    echo "✓ Created apps/server/.env"
else
    echo "ℹ️  apps/server/.env already exists, skipping"
fi

if [ ! -f apps/client/.env ]; then
    cp apps/client/.env.example apps/client/.env
    echo "✓ Created apps/client/.env"
else
    echo "ℹ️  apps/client/.env already exists, skipping"
fi

echo ""

# Setup Husky (git hooks)
echo "🪝 Setting up Git hooks..."
if command -v husky &> /dev/null; then
    npx husky install
    npx husky add .husky/pre-commit "yarn lint-staged" 2>/dev/null || true
    npx husky add .husky/pre-push "yarn type-check" 2>/dev/null || true
    echo "✓ Git hooks configured"
else
    echo "ℹ️  Husky will be set up when you run yarn"
fi

echo ""

# Start Docker services
echo "🐳 Starting Docker services..."
echo "   This may take a minute..."

if docker-compose ps | grep -q "pern-postgres"; then
    echo "ℹ️  Docker services already running"
else
    docker-compose up -d
    echo "✓ Docker services started"
    
    # Wait for services to be ready
    echo "   Waiting for services to be ready..."
    sleep 5
fi

echo ""

# Final checks
echo "✅ Setup complete!"
echo ""
echo "=========================================="
echo "Next steps:"
echo "=========================================="
echo ""
echo "1. Start the development servers:"
echo "   yarn dev"
echo ""
echo "2. Open your browser:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo ""
echo "3. Check out the documentation:"
echo "   - README.md for architecture overview"
echo "   - DEVELOPMENT.md for development guide"
echo ""
echo "Happy coding! 🚀"
echo ""
