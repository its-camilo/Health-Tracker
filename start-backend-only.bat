@echo off
echo 🐍 HEALTH TRACKER - SOLO BACKEND
echo =================================
echo.
echo 📍 Backend: http://localhost:8000
echo 📖 API Docs: http://localhost:8000/docs
echo 💾 Health Check: http://localhost:8000/health
echo.
echo 🛑 Presiona Ctrl+C para detener
echo.

cd /d "%~dp0\backend"

REM Instalar dependencias si es necesario
if not exist "venv" (
    echo 📦 Creando entorno virtual...
    python -m venv venv
)

if exist "venv\Scripts\activate.bat" (
    echo 🔧 Activando entorno virtual...
    call venv\Scripts\activate.bat
)

echo 📦 Verificando dependencias...
pip install -r requirements.txt >nul 2>&1

echo 🚀 Iniciando servidor...
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload

pause

