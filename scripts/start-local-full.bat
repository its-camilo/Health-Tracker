@echo off
echo 🚀 Iniciando Health Tracker (desarrollo local completo)...

REM Cambiar al directorio del proyecto
cd /d "%~dp0\.."

echo 📁 Directorio del proyecto: %CD%
echo.
echo 📍 Backend estará disponible en: http://localhost:8000
echo 📍 Frontend estará disponible en: http://localhost:3000
echo.
echo 🛑 Presiona Ctrl+C para detener todos los servidores
echo.

REM Iniciar backend en segundo plano
echo 🐍 Iniciando backend...
start /B cmd /c "cd backend && call start-local.bat"

REM Esperar un poco para que el backend se inicie
timeout /t 3 /nobreak >nul

REM Iniciar frontend
echo ⚛️ Iniciando frontend...
cd frontend
if exist "node_modules" (
    echo ✅ node_modules encontrado
) else (
    echo 📦 Instalando dependencias del frontend...
    npm install
)

echo 🌐 Iniciando Expo...
npx expo start --web --host localhost

echo.
echo 🛑 Servidores detenidos
pause
