# Codespaces Development Guide

This guide helps you get started with the Health Tracker project in GitHub Codespaces.

## Getting Started

1. **Create a Codespace**:
   - Go to the GitHub repository
   - Click "Code" → "Codespaces" → "Create codespace on main"
   - Wait for the environment to set up (2-3 minutes)

2. **Automatic Setup**:
   The following will be automatically configured:
   - Python 3.12 with all backend dependencies
   - Node.js 18 with Expo CLI and frontend dependencies
   - Environment files with development defaults
   - VS Code extensions for optimal development

3. **Start Development**:
   ```bash
   # Start both frontend and backend
   ./start-dev.sh
   
   # Or start individually
   ./start-backend.sh    # Backend only (port 8000)
   ./start-frontend.sh   # Frontend only (port 3000)
   ```

## Available Ports

The following ports are automatically forwarded:

- **8000**: FastAPI Backend API
- **3000**: Frontend Web Application  
- **8081**: Expo DevTools
- **19000**: Expo Development Server
- **19001**: Expo Metro Bundler
- **19002**: Expo iOS Development Server

## VS Code Extensions

Pre-installed extensions include:

- **Python**: Development, linting, formatting
- **React Native**: Mobile development tools
- **Expo Tools**: Expo-specific features
- **ESLint/Prettier**: Code formatting and linting
- **GitHub Copilot**: AI-powered coding assistance

## Environment Variables

Development environment files are automatically created:

### Backend (backend/.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=health_tracker
JWT_SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
DEBUG=True
ENVIRONMENT=development
```

### Frontend (frontend/.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_DEBUG=true
```

## Development Workflow

1. **Backend Development**:
   ```bash
   cd backend
   # The server auto-reloads on changes
   uvicorn server:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Frontend Development**:
   ```bash
   cd frontend
   # Start Expo development server
   expo start --web --host 0.0.0.0
   ```

3. **Testing**:
   ```bash
   # Run backend tests
   cd backend
   python -m pytest
   
   # Run frontend linting
   cd frontend
   npm run lint
   ```

## Troubleshooting

### Port Issues
If you encounter port conflicts:
```bash
# Check what's running on ports
sudo netstat -tlnp | grep :8000
sudo netstat -tlnp | grep :3000

# Kill processes if needed
sudo pkill -f uvicorn
sudo pkill -f expo
```

### Dependency Issues
If dependencies fail to install:
```bash
# Reinstall backend dependencies
cd backend
pip install --force-reinstall -r requirements.txt

# Reinstall frontend dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Environment Reset
To reset the development environment:
```bash
# Re-run the setup script
.devcontainer/setup.sh
```

## Database Setup

For development, you can use a local MongoDB instance or a cloud service:

1. **Local MongoDB** (if needed):
   ```bash
   # Install MongoDB in Codespaces
   sudo apt-get install -y mongodb
   sudo systemctl start mongodb
   ```

2. **MongoDB Cloud** (recommended):
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Update `MONGO_URL` in `backend/.env`

## API Testing

Test the backend API endpoints:

```bash
# Run the test script
python backend_test.py

# Or use curl
curl -X GET http://localhost:8000/api/auth/me
```

## Mobile Development

To test on mobile devices:

1. **Install Expo Go** on your mobile device
2. **Connect to the same network** as your Codespace
3. **Scan the QR code** from the Expo DevTools
4. **Or use the device simulator** in the browser

## Helpful Commands

```bash
# View all running processes
ps aux | grep -E "(uvicorn|expo|node)"

# Check available ports
sudo ss -tlnp

# View logs
tail -f ~/.expo/logs/*

# Git shortcuts
git status
git add .
git commit -m "Your message"
git push
```

## Tips for Codespaces

- **Save your work frequently** - Codespaces may timeout
- **Use the integrated terminal** for better performance
- **Forward ports manually** if auto-forwarding doesn't work
- **Install additional extensions** as needed from the VS Code marketplace
- **Use Git** to save your progress regularly