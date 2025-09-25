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
    
    # Determinar qué servidor usar
    # Si MongoDB no está disponible, usar server_dev.py
    # Si MongoDB está disponible, usar server_basic.py
    
    print("\n🔍 Detectando configuración...")
    
    # Intentar determinar el mejor servidor para usar
    use_dev_server = True
    
    # Verificar si MongoDB está disponible (opcional)
    try:
        import pymongo
        from dotenv import load_dotenv
        load_dotenv()
        
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        if mongo_url != 'mongodb://localhost:27017' or os.environ.get('DEVELOPMENT_MODE') != 'true':
            # Si hay una URL de MongoDB personalizada, intentar conectar
            print(f"🔗 Probando conexión a MongoDB: {mongo_url}")
            try:
                client = pymongo.MongoClient(mongo_url, serverSelectionTimeoutMS=2000)
                client.server_info()  # Forzar conexión
                use_dev_server = False
                print("✅ MongoDB disponible, usando server_basic.py")
            except Exception as e:
                print(f"❌ MongoDB no disponible: {e}")
                print("🔄 Usando server_dev.py (almacenamiento en memoria)")
        else:
            print("🔄 Usando server_dev.py (modo desarrollo sin MongoDB)")
            
    except ImportError:
        print("📦 pymongo no encontrado, usando server_dev.py")
    except Exception as e:
        print(f"⚠️  Error verificando MongoDB: {e}")
        print("🔄 Usando server_dev.py por seguridad")
    
    # Seleccionar servidor
    if use_dev_server:
        server_file = "server_dev:app"
        print("🚀 Iniciando servidor de desarrollo (sin MongoDB)")
    else:
        server_file = "server_basic:app"
        print("🚀 Iniciando servidor básico (con MongoDB)")
    
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
