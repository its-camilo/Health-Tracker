#!/bin/bash
echo "🐍 Starting FastAPI backend server..."
cd /home/runner/work/Health-Tracker/Health-Tracker/backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload