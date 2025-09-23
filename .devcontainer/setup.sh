#!/bin/bash

# Health Tracker Development Environment Setup Script
# This script sets up the development environment for both frontend and backend

set -e

echo "🚀 Setting up Health Tracker development environment..."

# Update package lists
echo "📦 Updating system packages..."
sudo apt-get update

# Install Expo CLI globally
echo "📱 Installing Expo CLI..."
npm install -g @expo/cli

# Install backend dependencies
echo "🐍 Installing Python backend dependencies..."
cd /workspaces/Health-Tracker/backend
pip install -r requirements.txt

# Install frontend dependencies  
echo "⚛️  Installing React Native frontend dependencies..."
cd /workspaces/Health-Tracker/frontend
npm install

# Create environment files if they don't exist
echo "🔧 Setting up environment files..."

# Backend .env file
if [ ! -f "/workspaces/Health-Tracker/backend/.env" ]; then
    cat > /workspaces/Health-Tracker/backend/.env << EOF
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=health_tracker

# JWT Configuration  
JWT_SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8081", "http://localhost:19000", "http://localhost:19001", "http://localhost:19002"]

# Development settings
DEBUG=True
ENVIRONMENT=development
EOF
    echo "✅ Created backend/.env file with development defaults"
fi

# Frontend .env file (for Expo)
if [ ! -f "/workspaces/Health-Tracker/frontend/.env" ]; then
    cat > /workspaces/Health-Tracker/frontend/.env << EOF
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_ENVIRONMENT=development

# Development settings
EXPO_PUBLIC_DEBUG=true
EOF
    echo "✅ Created frontend/.env file with development defaults"
fi

# Set up Git configuration if not already set
if [ -z "$(git config --global user.name)" ]; then
    echo "⚙️  Setting up Git configuration..."
    git config --global user.name "Codespaces User"
    git config --global user.email "codespaces@github.com"
fi

# Create helpful scripts
echo "📝 Creating development helper scripts..."

# Backend start script
cat > /workspaces/Health-Tracker/start-backend.sh << 'EOF'
#!/bin/bash
echo "🐍 Starting FastAPI backend server..."
cd /workspaces/Health-Tracker/backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
EOF
chmod +x /workspaces/Health-Tracker/start-backend.sh

# Frontend start script  
cat > /workspaces/Health-Tracker/start-frontend.sh << 'EOF'
#!/bin/bash
echo "⚛️  Starting Expo development server..."
cd /workspaces/Health-Tracker/frontend
expo start --web --host 0.0.0.0
EOF
chmod +x /workspaces/Health-Tracker/start-frontend.sh

# Combined start script
cat > /workspaces/Health-Tracker/start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Health Tracker development servers..."
echo "📍 Backend will be available at: http://localhost:8000"
echo "📍 Frontend will be available at: http://localhost:3000"
echo "📍 Expo DevTools will be available at: http://localhost:19000"
echo ""
echo "To start servers separately:"
echo "  Backend: ./start-backend.sh"
echo "  Frontend: ./start-frontend.sh"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start backend in background
cd /workspaces/Health-Tracker/backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend in background
cd /workspaces/Health-Tracker/frontend  
expo start --web --host 0.0.0.0 &
FRONTEND_PID=$!

# Wait for interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

echo "✅ Servers started! Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"
wait
EOF
chmod +x /workspaces/Health-Tracker/start-dev.sh

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Quick Start Guide:"
echo "  1. Start both servers: ./start-dev.sh"
echo "  2. Or start individually:"
echo "     - Backend only: ./start-backend.sh"  
echo "     - Frontend only: ./start-frontend.sh"
echo ""
echo "🌐 Access URLs:"
echo "  - Backend API: http://localhost:8000"
echo "  - Frontend Web: http://localhost:3000"
echo "  - Expo DevTools: http://localhost:19000"
echo ""
echo "📚 For more information, check the README.md file"
echo ""