# Health Tracker

A health analysis application with React Native/Expo frontend and FastAPI backend, featuring AI-powered hair health analysis using Gemini AI.

## Features

- 🔐 JWT Authentication system
- 📱 React Native/Expo mobile application
- 🐍 FastAPI Python backend
- 🤖 AI-powered hair analysis with Gemini AI
- 📄 Document upload and analysis (PDFs and images)
- 📊 Health dashboard with insights and recommendations
- 🔒 Secure user data management

## Quick Start with GitHub Codespaces

The easiest way to get started is using GitHub Codespaces:

1. **Open in Codespaces**: Click the "Code" button → "Codespaces" → "Create codespace on main"
2. **Wait for setup**: The development environment will be automatically configured
3. **Start development**: Run `./start-dev.sh` to start both frontend and backend servers

### Codespaces Features

- 🚀 Pre-configured development environment with Python 3.12 and Node.js 18
- 📦 Automatic dependency installation for both frontend and backend
- 🔧 VS Code extensions for React Native, Python, and more
- 🌐 Port forwarding for easy access to development servers
- 📝 Helper scripts for quick development

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- Git

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/its-camilo/Health-Tracker.git
   cd Health-Tracker
   ```

2. **Backend setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # Create .env file with your configuration
   uvicorn server:app --reload
   ```

3. **Frontend setup**:
   ```bash
   cd frontend
   npm install
   npx expo start
   ```

## Project Structure

```
Health-Tracker/
├── .devcontainer/          # Codespaces configuration
│   ├── devcontainer.json   # Container configuration
│   └── setup.sh           # Environment setup script
├── backend/                # FastAPI Python backend
│   ├── server.py          # Main application file
│   └── requirements.txt   # Python dependencies
├── frontend/               # React Native/Expo app
│   ├── app/               # App screens and navigation
│   ├── context/           # React contexts
│   └── package.json       # Node.js dependencies
├── start-dev.sh           # Start both servers
├── start-backend.sh       # Start backend only
└── start-frontend.sh      # Start frontend only
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/documents/upload` - Upload documents
- `GET /api/documents` - Get user documents
- `POST /api/analysis/hair` - Analyze hair images
- `POST /api/analysis/document` - Analyze documents
- `GET /api/dashboard` - Get dashboard data

## Development Servers

When running in development mode:

- **Backend API**: http://localhost:8000
- **Frontend Web**: http://localhost:3000
- **Expo DevTools**: http://localhost:19000

## Environment Configuration

The application uses environment variables for configuration. Sample `.env` files are automatically created in Codespaces, or you can create them manually:

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=health_tracker
JWT_SECRET_KEY=your-secret-key-here
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_ENVIRONMENT=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the MIT License.
