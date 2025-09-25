#!/bin/bash
echo "🐍 Starting FastAPI backend server..."
cd /workspaces/Health-Tracker/backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload