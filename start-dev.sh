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
uvicorn server_basic:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend in background
cd /workspaces/Health-Tracker/frontend  
npx expo start --web --host localhost &
FRONTEND_PID=$!

# Wait for interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

echo "✅ Servers started! Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"
wait