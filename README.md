# 🩺 Health Tracker

Una aplicación inteligente para el análisis de salud capilar que combina **React Native/Expo** en el frontend con **FastAPI** en el backend, potenciada por **Inteligencia Artificial de Google Gemini**.

## 🤖 Funcionalidades de IA

### Análisis Capilar Inteligente
- **Análisis de imágenes capilares**: Sube una foto de tu cuero cabelludo y obtén:
  - Conteo estimado de cabellos visibles
  - Identificación de zonas de calvicie o pérdida
  - Evaluación de riesgo de alopecia (3, 5 y 10 años)
  - Recomendaciones personalizadas para mantener la salud capilar
  - Puntuación de confianza del análisis

### Análisis de Documentos Médicos
- **Procesamiento de PDFs**: Analiza documentos médicos relacionados con salud capilar
  - Extracción de hallazgos principales
  - Recomendaciones basadas en la información médica
  - Puntos de atención para seguimiento
  - Resumen ejecutivo del análisis

### Tecnología IA
- **Motor**: Google Gemini 1.5 Flash (`gemini-1.5-flash:generateContent`)
- **Capacidades**: Análisis multimodal (texto e imágenes)
- **Formato de respuesta**: JSON estructurado para integración perfecta
- **Seguridad**: Las claves API se almacenan de forma segura por usuario

## 🚀 Inicio Rápido

### 🖥️ Desarrollo Local (Windows/Mac/Linux)

#### Backend Solo:
```bash
# Opción 1: Script universal (recomendado)
cd backend
python start-local.py

# Opción 2: Script Windows
cd backend
start-local.bat

# Opción 3: Comando directo
cd backend
python -m uvicorn server_dev:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend + Backend:
```bash
# Desde la raíz del proyecto (Windows)
scripts\start-local-full.bat

# O manualmente:
# Terminal 1 - Backend
cd backend
python start-local.py

# Terminal 2 - Frontend  
cd frontend
npm install
npx expo start --web
```

### ☁️ GitHub Codespaces

#### Backend:
```bash
# Script optimizado para Codespaces
./scripts/start-backend.sh

# O comando directo
cd backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend + Backend:
```bash
# Iniciar ambos servicios
./scripts/start-dev.sh

# O manualmente:
# Terminal 1 - Backend
./scripts/start-backend.sh

# Terminal 2 - Frontend
./scripts/start-frontend.sh
```

## 🔧 Configuración de IA (Gemini)

### 1. Obtener API Key
1. Ve a [Google AI Studio](https://aistudio.google.com/apikey)
2. Crea una nueva API key
3. Copia la clave (debe tener al menos 30 caracteres)

### 2. Configurar en la App
1. Abre la aplicación
2. Ve a la pantalla de **Configuración** (`settings.tsx`)
3. Pega tu API key en el campo "API Key de Gemini"
4. Guarda la configuración

### 3. Uso de IA
- **Para imágenes**: Sube una foto del cuero cabelludo y usa "Análisis Capilar"
- **Para documentos**: Sube un PDF médico y usa "Análisis de Documento"
- Los resultados aparecerán en el dashboard con análisis detallado

## 🌐 URLs y Endpoints

### Desarrollo Local:
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Frontend Web**: http://localhost:3000

### Codespaces:
- **Backend**: https://[codespace-name]-8000.app.github.dev
- **Frontend**: https://[codespace-name]-3000.app.github.dev

## 📁 Estructura del Proyecto

```
Health-Tracker/
├── backend/
│   ├── server.py              # 🤖 Servidor completo con IA
│   ├── server_basic.py        # 🔄 Servidor híbrido (con/sin MongoDB)
│   ├── server_dev.py          # 🚀 Servidor desarrollo (memoria)
│   ├── start-local.py         # 🔧 Script inicio universal
│   ├── start-local.bat        # 🔧 Script inicio Windows
│   ├── .env.example           # ⚙️ Configuración template
│   └── requirements.txt       # 📦 Dependencias Python
├── frontend/
│   ├── app/
│   │   ├── auth/              # 🔐 Autenticación
│   │   ├── dashboard.tsx      # 📊 Panel principal
│   │   ├── settings.tsx       # ⚙️ Configuración IA
│   │   └── upload.tsx         # 📤 Subida archivos
│   ├── constants/api.ts       # 🌐 Configuración API
│   └── context/AuthContext.tsx # 👤 Contexto usuario
├── scripts/
│   ├── start-local-full.bat   # 🚀 Inicio completo local
│   ├── start-backend.sh       # ☁️ Backend Codespaces
│   └── start-dev.sh           # ☁️ Completo Codespaces
└── README.md                  # 📖 Esta documentación
```

## 🔄 Modos de Servidor

### 🤖 `server.py` - Producción/IA Completa
- **Uso**: Producción y Codespaces
- **Características**: 
  - Funcionalidad completa de IA
  - Análisis de imágenes y documentos
  - Requiere MongoDB y API key de Gemini
- **Comando**: `uvicorn server:app --host 0.0.0.0 --port 8000 --reload`

### 🔄 `server_basic.py` - Híbrido
- **Uso**: Desarrollo con opción de MongoDB
- **Características**:
  - Funciona con o sin MongoDB
  - Fallback a almacenamiento en memoria
  - Compatible local y Codespaces
- **Comando**: `uvicorn server_basic:app --host 0.0.0.0 --port 8000 --reload`

### 🚀 `server_dev.py` - Desarrollo Rápido
- **Uso**: Desarrollo local sin dependencias
- **Características**:
  - Solo almacenamiento en memoria
  - Sin MongoDB ni IA
  - Inicio instantáneo
- **Comando**: `uvicorn server_dev:app --host 0.0.0.0 --port 8000 --reload`

## 🔧 Configuración de Entorno

### Variables de Entorno (`.env`):
```env
# Base de datos
MONGO_URL=mongodb://localhost:27017
DB_NAME=health_tracker_dev

# Seguridad
JWT_SECRET_KEY=tu-clave-secreta-aqui
JWT_ALGORITHM=HS256

# Desarrollo
DEVELOPMENT_MODE=true
```

### Configuración Frontend (`frontend/constants/api.ts`):
- **Detección automática**: Local vs Codespaces
- **Configuración manual**: Variables `IS_CODESPACES`, URLs personalizadas
- **Variable de entorno**: `EXPO_PUBLIC_BACKEND_URL` tiene prioridad

## 🛠️ Instalación y Configuración Completa

### 📋 Prerrequisitos:
- **Python 3.11+** instalado
- **Node.js 18+** (para el frontend)
- **Git** (obviamente)

### 🚀 Configuración Paso a Paso:

#### 1. Clonar el Repositorio
```bash
git clone <tu-repo-url>
cd Health-Tracker
```

#### 2. Configurar Backend

##### Instalar dependencias:
```bash
cd backend

# Crear entorno virtual (recomendado)
python -m venv .venv

# Activar entorno virtual
# En Windows:
.venv\Scripts\activate
# En Mac/Linux:
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

##### Configuración automática:
El proyecto creará automáticamente un archivo `.env` la primera vez que ejecutes el servidor. El archivo se basa en `.env.example`.

#### 3. Configurar Frontend
```bash
cd frontend
npm install
```

## 🎯 Guía de Uso Detallada

### 🔧 Modos de Ejecución Detallados

#### 🚀 Desarrollo Local (Sin MongoDB)
- **Archivo:** `server_dev.py`
- **Características:** 
  - Almacenamiento en memoria
  - No requiere base de datos
  - Ideal para desarrollo rápido
- **Comando:** `python -m uvicorn server_dev:app --host 0.0.0.0 --port 8000 --reload`

#### 🔄 Desarrollo con MongoDB
- **Archivo:** `server_basic.py` 
- **Características:**
  - Conecta a MongoDB local o remoto
  - Fallback a almacenamiento en memoria si MongoDB no está disponible
  - Compatible con Codespaces
- **Comando:** `python -m uvicorn server_basic:app --host 0.0.0.0 --port 8000 --reload`

#### 🤖 Producción/Codespaces
- **Archivo:** `server.py`
- **Características:**
  - Funcionalidad completa con IA (Gemini)
  - Requiere MongoDB
  - Análisis de documentos e imágenes
- **Comando:** `python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload`

### ⚙️ Variables de Entorno Detalladas

El archivo `.env` se crea automáticamente con estos valores por defecto:

```env
# Configuración para desarrollo local
MONGO_URL=mongodb://localhost:27017
DB_NAME=health_tracker_dev
JWT_SECRET_KEY=dev-jwt-secret-key-change-in-production
JWT_ALGORITHM=HS256

# Para Codespaces (se sobrescribirán estas variables si están disponibles)
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net
# DB_NAME=health_tracker_prod

# Para desarrollo local sin MongoDB, usar server_dev.py en su lugar
DEVELOPMENT_MODE=true
```

#### Para Codespaces:
Las variables de entorno pueden ser sobrescritas en Codespaces usando secretos o configuración específica.

### 📁 Estructura de Archivos Detallada

```
Health-Tracker/
├── backend/
│   ├── .env.example          # 📋 Plantilla de configuración
│   ├── start-local.py        # 🔧 Script de inicio universal
│   ├── start-local.bat       # 🔧 Script de inicio para Windows
│   ├── server_dev.py         # 🚀 Servidor sin MongoDB
│   ├── server_basic.py       # 🔄 Servidor híbrido
│   ├── server.py            # 🤖 Servidor completo con IA
│   └── requirements.txt     # 📦 Dependencias Python
├── scripts/
│   ├── start-local-backend.bat    # 🖥️ Solo backend para Windows
│   ├── start-local-full.bat       # 🖥️ Backend + Frontend para Windows
│   ├── start-backend.sh           # ☁️ Para Codespaces (Linux)
│   └── start-dev.sh              # ☁️ Completo para Codespaces
├── frontend/
│   ├── constants/api.ts     # 🌐 Configuración de API
│   ├── app/
│   │   ├── auth/           # 🔐 Autenticación
│   │   ├── dashboard.tsx   # 📊 Panel principal
│   │   ├── settings.tsx    # ⚙️ Configuración IA
│   │   └── upload.tsx      # 📤 Subida archivos
│   └── context/AuthContext.tsx # 👤 Contexto usuario
└── README.md               # 📖 Esta documentación
```

### 🔄 Compatibilidad con Múltiples Entornos

Los scripts están diseñados para funcionar tanto en local como en Codespaces:

- **Local:** Usa rutas relativas y detección automática del entorno
- **Codespaces:** Usa las rutas absolutas `/workspaces/Health-Tracker/`
- **Variables de entorno:** Se pueden sobrescribir según el entorno

## 🔍 Solución de Problemas

### PowerShell y comandos:
```powershell
# ❌ Error en PowerShell: cd backend && python start-local.py
# ✅ Correcto en PowerShell:
cd backend; python start-local.py

# O usar dos comandos separados:
cd backend
python start-local.py
```

### 🐛 Errores Comunes y Soluciones

#### El servidor no inicia
1. **Verifica que el entorno virtual esté activado**
   ```bash
   # Windows:
   .venv\Scripts\activate
   # Mac/Linux:
   source .venv/bin/activate
   ```

2. **Instala las dependencias:** 
   ```bash
   pip install -r requirements.txt
   ```

3. **Usa `server_dev.py` si tienes problemas con MongoDB**
   ```bash
   python -m uvicorn server_dev:app --host 0.0.0.0 --port 8000 --reload
   ```

#### Error de conexión de frontend
1. **Verifica que el backend esté ejecutándose en puerto 8000**
2. **Revisa la configuración en `frontend/constants/api.ts`**
3. **Asegúrate de que no hay firewall bloqueando el puerto**

#### Problemas con MongoDB
- El sistema automáticamente usará almacenamiento en memoria si MongoDB no está disponible
- Para desarrollo local, se recomienda usar `server_dev.py`
- Si necesitas MongoDB local, instálalo desde [mongodb.com](https://www.mongodb.com/try/download/community)

#### Error de permisos en Windows
- Ejecuta la terminal como administrador
- O usa PowerShell en lugar de CMD
- Verifica que Python esté en el PATH

#### "Could not import module"
- **Asegúrate de estar en el directorio correcto:**
  ```bash
  # Para server_dev.py:
  cd backend
  python -m uvicorn server_dev:app --reload
  ```
- **Verifica que las dependencias estén instaladas**
- **Activa el entorno virtual si lo usas**

#### Frontend no se conecta al backend
- **Verifica URLs en `frontend/constants/api.ts`:**
  ```typescript
  // Para desarrollo local debe ser:
  BASE_URL: 'http://localhost:8000'
  ```
- **Comprueba que backend esté corriendo en puerto 8000**
- **Revisa la consola del navegador para errores CORS**

#### Problemas específicos de Codespaces
- **Puertos:** Asegúrate de que los puertos 8000 y 3000 estén reenviados
- **URLs:** Usa las URLs generadas automáticamente por Codespaces
- **Variables de entorno:** Configura los secretos necesarios en GitHub

### 🆘 Comandos de Diagnóstico

```bash
# Verificar que Python funciona
python --version

# Verificar que uvicorn está instalado
python -c "import uvicorn; print('✅ uvicorn disponible')"

# Verificar que FastAPI funciona
python -c "import fastapi; print('✅ FastAPI disponible')"

# Probar importación del servidor
cd backend
python -c "import server_dev; print('✅ server_dev.py importa correctamente')"

# Verificar que el puerto 8000 está libre
netstat -an | findstr :8000
```

### 🔧 Comandos de Limpieza

```bash
# Limpiar caché de Python
find . -type d -name "__pycache__" -delete
find . -name "*.pyc" -delete

# Reinstalar dependencias del backend
cd backend
pip uninstall -r requirements.txt -y
pip install -r requirements.txt

# Reinstalar dependencias del frontend  
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📞 Soporte y Ayuda

### 🔍 Lista de Verificación de Problemas

Si encuentras problemas, sigue esta lista en orden:

1. **🔧 Verifica prerrequisitos:**
   - Python 3.11+ instalado
   - Node.js 18+ instalado (para frontend)
   - Dependencias instaladas (`pip install -r requirements.txt`)

2. **📁 Verifica directorios:**
   - Estás en el directorio correcto (`backend/` para servidor)
   - Los archivos existen (`server_dev.py`, `requirements.txt`, etc.)

3. **🌐 Verifica configuración:**
   - URLs en `frontend/constants/api.ts`
   - Variables de entorno en `.env`
   - Puertos no ocupados (8000 para backend, 3000 para frontend)

4. **🤖 Para funcionalidades de IA:**
   - API key de Gemini configurada correctamente
   - Usuario tiene `has_gemini_key = true`
   - Usando `server.py` (no `server_dev.py`)

### 🆘 Obtener Ayuda

Si sigues teniendo problemas:

1. **📋 Revisa la sección "Solución de Problemas" arriba**
2. **🔍 Ejecuta los comandos de diagnóstico**
3. **📝 Documenta el error exacto y los pasos que seguiste**
4. **🌐 Verifica que estés usando los comandos correctos para tu entorno**

### 📊 Información del Sistema

Para reportar problemas, incluye esta información:

```bash
# Sistema operativo
echo $OS  # Windows: echo %OS%

# Versión de Python
python --version

# Versión de Node.js (si usas frontend)
node --version

# Directorio actual
pwd  # Windows: cd

# Contenido del directorio backend
ls backend/  # Windows: dir backend\
```

## 🤝 Contribuciones y Desarrollo

### 🚀 Flujo de Desarrollo Recomendado

1. **🔧 Desarrollo local rápido**: 
   ```bash
   cd backend
   python start-local.py  # Usa server_dev.py automáticamente
   ```

2. **🧪 Pruebas con persistencia**:
   ```bash
   cd backend
   python -m uvicorn server_basic:app --reload
   ```

3. **🤖 Pruebas con IA completa**:
   ```bash
   cd backend
   python -m uvicorn server:app --reload
   # Requiere: MongoDB + API key de Gemini
   ```

4. **✅ Verificación final**:
   - Probar en local con `server_dev.py`
   - Probar en local con `server_basic.py` 
   - Probar funcionalidades de IA con `server.py`
   - Verificar compatibilidad con Codespaces

### 🔄 Compatibilidad Multiplataforma

Al contribuir, asegúrate de que tu código funcione en:

- **🖥️ Local Windows** (PowerShell, CMD)
- **🖥️ Local Mac/Linux** (bash, zsh)
- **☁️ GitHub Codespaces** (Ubuntu container)

### 📝 Convenciones de Código

- **Backend**: Seguir PEP 8, usar `black` para formateo
- **Frontend**: Seguir convenciones de React Native/TypeScript
- **Scripts**: Incluir comentarios explicativos y manejo de errores
- **Documentación**: Mantener README actualizado con cambios

### 🎯 Áreas de Contribución

- **🤖 IA**: Mejorar prompts de Gemini, agregar nuevos tipos de análisis
- **🔧 DevOps**: Mejorar scripts de configuración, Docker, CI/CD
- **🎨 Frontend**: Mejorar UI/UX, agregar nuevas funcionalidades
- **🐛 Bugs**: Reportar y arreglar problemas de compatibilidad
- **📖 Documentación**: Mejorar guías, agregar ejemplos

## 🎉 ¡Listo para Empezar!

Ahora tienes todo lo necesario para ejecutar Health Tracker en tu entorno. Comienza con:

```bash
# 1. Clona el repositorio
git clone <tu-repo-url>
cd Health-Tracker

# 2. Configuración rápida
cd backend
python start-local.py

# 3. En otra terminal, inicia el frontend (opcional)
cd frontend
npx expo start --web
```

¡Disfruta desarrollando con Health Tracker! 🚀
