@echo off
echo 🐍 Iniciando servidor Health Tracker...

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Verificar si existe .env, si no, crearlo desde .env.example
if not exist ".env" (
    if exist ".env.example" (
        echo 📝 Creando archivo .env desde .env.example...
        copy ".env.example" ".env" >nul
        echo ✅ Archivo .env creado
    )
)

REM Verificar si estamos en el entorno virtual
if "%VIRTUAL_ENV%"=="" (
    echo ⚠️  Recomendación: Activar entorno virtual
    if exist ".venv" (
        echo    Ejecuta: .venv\Scripts\activate
    )
) else (
    echo ✅ Entorno virtual activo: %VIRTUAL_ENV%
)

echo.
echo 🚀 Iniciando servidor de desarrollo...
echo 📍 El servidor estará disponible en: http://localhost:8000
echo 📖 Documentación API: http://localhost:8000/docs
echo 💾 Estado de salud: http://localhost:8000/health
echo.
echo 🛑 Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar el servidor unificado
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload

if errorlevel 1 (
    echo.
    echo ❌ Error al iniciar el servidor
    echo Verifica que las dependencias estén instaladas: pip install -r requirements.txt
    pause
)
