@echo off
echo 🐍 Iniciando backend Health Tracker (desarrollo local)...

REM Cambiar al directorio del proyecto
cd /d "%~dp0\.."

echo 📁 Directorio del proyecto: %CD%
echo.

REM Ir al directorio backend
cd backend

REM Verificar si existe .env, si no, crearlo desde .env.example
if not exist ".env" (
    if exist ".env.example" (
        echo 📝 Creando archivo .env desde .env.example...
        copy ".env.example" ".env" >nul
        echo ✅ Archivo .env creado
    )
)

REM Verificar entorno virtual
if "%VIRTUAL_ENV%"=="" (
    echo ⚠️  No hay entorno virtual activo
    if exist ".venv" (
        echo 🔧 Activando entorno virtual...
        call .venv\Scripts\activate.bat
        if errorlevel 1 (
            echo ❌ Error activando entorno virtual
            echo Intenta manualmente: cd backend && .venv\Scripts\activate
            pause
            exit /b 1
        )
        echo ✅ Entorno virtual activado
    ) else (
        echo 📦 Instalando dependencias globalmente (no recomendado)...
    )
) else (
    echo ✅ Entorno virtual activo: %VIRTUAL_ENV%
)

echo.
echo 🚀 Iniciando servidor de desarrollo...
echo 📍 Backend: http://localhost:8000
echo 📖 Documentación: http://localhost:8000/docs
echo 💾 Health check: http://localhost:8000/health
echo.
echo 🛑 Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar servidor unificado (detecta automáticamente MongoDB)
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload

if errorlevel 1 (
    echo.
    echo ❌ Error al iniciar el servidor
    echo 🔧 Verifica que las dependencias estén instaladas:
    echo    pip install -r requirements.txt
    echo.
    pause
)
