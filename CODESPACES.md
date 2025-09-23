# 🚀 Health Tracker - Codespaces Quick Start

Welcome to the Health Tracker project! This guide will get you up and running in GitHub Codespaces in just a few minutes.

## 📋 What You Get

✅ **Fully configured development environment**
- Python 3.12 with all backend dependencies
- Node.js 18 with Expo CLI and React Native tools
- VS Code with optimal extensions
- Automatic port forwarding
- Environment files with development defaults

✅ **Ready-to-use helper scripts**
- `./start-dev.sh` - Start both frontend and backend
- `./start-backend.sh` - Start API server only
- `./start-frontend.sh` - Start mobile app only

✅ **Pre-configured VS Code extensions**
- Python development tools
- React Native and Expo tools
- ESLint and Prettier for code formatting
- GitHub Copilot for AI assistance

## ⚡ Quick Start (2 minutes)

1. **Open in Codespaces**
   - Click "Code" → "Codespaces" → "Create codespace"
   - Wait 2-3 minutes for automatic setup

2. **Start development**
   ```bash
   ./start-dev.sh
   ```

3. **Access your applications**
   - Backend API: http://localhost:8000
   - Frontend Web: http://localhost:3000  
   - Expo DevTools: http://localhost:19000

That's it! 🎉

## 🔧 Configuration Details

### Automatic Setup Includes:
- Environment variables for development
- Database configuration (MongoDB)
- API endpoints and CORS setup
- Mobile development with Expo
- Code formatting and linting

### Ports Forwarded:
- **8000**: FastAPI Backend
- **3000**: React Native Web
- **8081**: Expo CLI
- **19000-19002**: Expo Development Servers

### Environment Files Created:
- `backend/.env` - API keys, database URLs
- `frontend/.env` - Frontend configuration

## 🛠️ Development Commands

```bash
# Start everything
./start-dev.sh

# Backend only
./start-backend.sh
cd backend && uvicorn server:app --reload

# Frontend only  
./start-frontend.sh
cd frontend && expo start --web

# Testing
python backend_test.py              # Test API endpoints
cd frontend && npm run lint         # Lint frontend code

# Database and API
curl http://localhost:8000/docs     # View API documentation
```

## 🐛 Troubleshooting

**Ports not accessible?**
- Check the "Ports" tab in VS Code
- Ensure ports are forwarded and public

**Dependencies issues?**
```bash
# Reinstall backend
cd backend && pip install -r requirements.txt

# Reinstall frontend  
cd frontend && npm install
```

**Environment reset?**
```bash
.devcontainer/setup.sh
```

## 📱 Mobile Development

To test on your phone:
1. Install **Expo Go** app
2. Connect to same network as Codespace
3. Scan QR code from Expo DevTools
4. Or use web simulator at localhost:3000

## 🔑 API Keys Setup

For full functionality, configure these in `backend/.env`:
```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_secure_secret_key
GEMINI_API_KEY=your_gemini_api_key  # For AI features
```

## 📚 Learn More

- [Full Documentation](README.md)
- [Codespaces Guide](.devcontainer/README.md)
- [API Documentation](http://localhost:8000/docs) (after starting backend)

---

**Happy coding!** 🎯 If you run into any issues, check the troubleshooting section or refer to the detailed documentation.