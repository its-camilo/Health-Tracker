#!/usr/bin/env python3
"""
Script para iniciar el servidor en desarrollo local (Windows/Mac/Linux)
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    # Cambiar al directorio del script
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    print("🐍 Iniciando servidor Health Tracker...")
    print(f"📁 Directorio: {backend_dir}")
    
    # Verificar si existe archivo .env
    env_file = backend_dir / '.env'
    env_example = backend_dir / '.env.example'
    
    if not env_file.exists() and env_example.exists():
        print("📝 Creando archivo .env desde .env.example...")
        with open(env_example, 'r', encoding='utf-8') as f:
            env_content = f.read()
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(env_content)
        print("✅ Archivo .env creado")
    
    # Verificar si estamos en un entorno virtual
    venv_active = os.environ.get('VIRTUAL_ENV') is not None
    if not venv_active:
        print("⚠️  Recomendación: Activar entorno virtual (.venv)")
        venv_path = backend_dir / '.venv'
        if venv_path.exists():
            if sys.platform == "win32":
                print("   Ejecuta: .venv\\Scripts\\activate")
            else:
                print("   Ejecuta: source .venv/bin/activate")
    
    # Usar el servidor unificado que automáticamente detecta MongoDB
    print("\n🔍 Usando servidor unificado...")
    server_file = "server:app"
    print("🚀 Iniciando servidor unificado (detección automática de MongoDB)")
    print("   - Si MongoDB está disponible: se conectará automáticamente")
    print("   - Si MongoDB no está disponible: usará almacenamiento en memoria")
    
    print("📍 El servidor estará disponible en: http://localhost:8000")
    print("📖 Documentación API: http://localhost:8000/docs")
    print("💾 Estado de salud: http://localhost:8000/health")
    print("\n🛑 Presiona Ctrl+C para detener el servidor\n")
    
    # Iniciar el servidor
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            server_file,
            "--host", "0.0.0.0",
            "--port", "8000", 
            "--reload"
        ], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por el usuario")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error al iniciar el servidor: {e}")
        return 1
    except FileNotFoundError:
        print("❌ uvicorn no encontrado. Instala las dependencias:")
        print("   pip install -r requirements.txt")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
