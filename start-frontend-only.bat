@echo off
echo ⚛️ HEALTH TRACKER - SOLO FRONTEND
echo ==================================
echo.
echo 📍 Frontend: http://localhost:8081
echo 🔧 Asegúrate de que el backend esté ejecutándose
echo.
echo 🛑 Presiona Ctrl+C para detener
echo.

cd /d "%~dp0\frontend"

REM Instalar dependencias si es necesario
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
)

echo 🧹 Limpiando caché de Expo...
npx expo install --fix >nul 2>&1

echo 🌐 Iniciando Expo (modo web)...
npx expo start --web --clear

pause
