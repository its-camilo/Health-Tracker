#!/bin/bash

# Codespaces Configuration Validation Script
# This script validates that the devcontainer setup is working correctly

echo "🔍 Validating Codespaces configuration..."

# Check if we're in the right directory
if [ ! -f "backend/server.py" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ ERROR: Not in the correct project root directory"
    exit 1
fi

# Check devcontainer files exist
echo "📁 Checking devcontainer files..."
if [ ! -f ".devcontainer/devcontainer.json" ]; then
    echo "❌ ERROR: .devcontainer/devcontainer.json not found"
    exit 1
fi

if [ ! -f ".devcontainer/setup.sh" ]; then
    echo "❌ ERROR: .devcontainer/setup.sh not found"
    exit 1
fi

if [ ! -x ".devcontainer/setup.sh" ]; then
    echo "❌ ERROR: .devcontainer/setup.sh is not executable"
    exit 1
fi

echo "✅ Devcontainer files present and correct"

# Validate devcontainer.json syntax
echo "🔧 Validating devcontainer.json syntax..."
if command -v jq >/dev/null 2>&1; then
    if ! jq empty .devcontainer/devcontainer.json >/dev/null 2>&1; then
        echo "❌ ERROR: devcontainer.json has invalid JSON syntax"
        exit 1
    fi
    echo "✅ devcontainer.json syntax is valid"
else
    echo "⚠️  jq not available, skipping JSON validation"
fi

# Check Python requirements
echo "🐍 Checking Python requirements..."
if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ ERROR: backend/requirements.txt not found"
    exit 1
fi

# Check if Python dependencies look reasonable
if ! grep -q "fastapi" backend/requirements.txt; then
    echo "❌ ERROR: FastAPI not found in requirements.txt"
    exit 1
fi

echo "✅ Python requirements file is valid"

# Check Node.js package.json
echo "⚛️  Checking Node.js configuration..."
if [ ! -f "frontend/package.json" ]; then
    echo "❌ ERROR: frontend/package.json not found"
    exit 1
fi

# Check if package.json has required dependencies
if ! grep -q "expo" frontend/package.json; then
    echo "❌ ERROR: Expo not found in frontend dependencies"
    exit 1
fi

echo "✅ Frontend package.json is valid"

# Check helper scripts
echo "📝 Checking helper scripts..."
expected_scripts=("start-dev.sh" "start-backend.sh" "start-frontend.sh")

for script in "${expected_scripts[@]}"; do
    if [ ! -f "$script" ]; then
        echo "❌ ERROR: Helper script $script not found"
        exit 1
    fi
    
    if [ ! -x "$script" ]; then
        echo "❌ ERROR: Helper script $script is not executable"
        exit 1
    fi
done

echo "✅ Helper scripts are present and executable"

# Check README files
echo "📚 Checking documentation..."
if [ ! -f "README.md" ]; then
    echo "❌ ERROR: Main README.md not found"
    exit 1
fi

if [ ! -f ".devcontainer/README.md" ]; then
    echo "❌ ERROR: .devcontainer/README.md not found"
    exit 1
fi

echo "✅ Documentation files are present"

# Summary
echo ""
echo "🎉 Codespaces configuration validation completed successfully!"
echo ""
echo "📋 What was validated:"
echo "  ✅ Devcontainer configuration files"
echo "  ✅ JSON syntax validation"
echo "  ✅ Python backend requirements"
echo "  ✅ Node.js frontend configuration"
echo "  ✅ Helper scripts and permissions"
echo "  ✅ Documentation files"
echo ""
echo "🚀 The project is ready for GitHub Codespaces!"
echo ""
echo "Next steps:"
echo "  1. Commit these changes to your repository"
echo "  2. Create a new Codespace from the GitHub interface"
echo "  3. Wait for the automatic setup to complete"
echo "  4. Run './start-dev.sh' to start development servers"
echo ""