from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
from passlib.hash import bcrypt
from jose import JWTError, jwt
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import base64
import json
import asyncio
import requests
import PyPDF2
import io

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create default .env if it doesn't exist
if not (ROOT_DIR / '.env').exists():
    env_example = ROOT_DIR / '.env.example'
    if env_example.exists():
        # Copy from .env.example if it exists
        with open(env_example, 'r', encoding='utf-8') as f:
            env_content = f.read()
        with open(ROOT_DIR / '.env', 'w', encoding='utf-8') as f:
            f.write(env_content)
    else:
        # Create basic .env file
        with open(ROOT_DIR / '.env', 'w', encoding='utf-8') as f:
            f.write("""MONGO_URL=mongodb://localhost:27017
DB_NAME=health_tracker
JWT_SECRET_KEY=dev-jwt-secret-key-change-in-production
JWT_ALGORITHM=HS256
""")

# MongoDB connection with fallback to in-memory storage
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client: Optional[AsyncIOMotorClient] = None
db = None

# Try to connect to MongoDB, fallback to in-memory storage
try:
    client = AsyncIOMotorClient(
        mongo_url, serverSelectionTimeoutMS=1000
    )  # 1s timeout
    db_name = os.environ.get('DB_NAME', 'health_tracker')
    db = client[db_name]
    logging.info("MongoDB connected successfully")
except (ServerSelectionTimeoutError, PyMongoError) as e:
    logging.warning(f"MongoDB connection failed, using in-memory storage: {e}")
    client = None
    db = None

# In-memory storage for development/fallback
users_storage = {}
records_storage = {}
documents_storage = {}

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-key-change-in-production")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS = 24

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Health Tracker API - Unified", version="2.0.0")

# Create a router with the /api prefix (for compatibility)
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserRegistration(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    name: str
    gemini_api_key: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    has_gemini_key: bool

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class GeminiKeyUpdate(BaseModel):
    gemini_api_key: str

class HealthDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    document_type: str  # "pdf", "image"
    original_filename: str
    content: str  # base64 for images, text for PDFs
    analysis_result: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AnalysisRequest(BaseModel):
    document_id: str
    analysis_type: str  # "capilar", "general"

class HairAnalysisResult(BaseModel):
    hair_count_estimate: Optional[int] = None
    baldness_zones: List[str] = []
    alopecia_risk_3_years: Optional[str] = None
    alopecia_risk_5_years: Optional[str] = None
    alopecia_risk_10_years: Optional[str] = None
    recommendations: List[str] = []
    confidence_score: Optional[float] = None

class HealthRecord(BaseModel):
    id: Optional[str] = None
    user_id: str
    record_type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def sanitize_user(doc: dict) -> dict:
    """Return a user object safe for API responses."""
    return {
        "id": str(doc.get("_id", doc.get("username", doc.get("id")))),
        "email": doc.get("email"),
        "name": doc.get("name", doc.get("username")),
        "has_gemini_key": bool(doc.get("gemini_api_key")),
    }

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    # Try MongoDB first, then fallback to memory storage
    user_data = None
    if db is not None:
        user_data = await db.users.find_one({"id": user_id})
    
    if user_data is None and user_id in users_storage:
        user_data = users_storage[user_id]
        
    if user_data is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    
    return User(**user_data)

async def get_current_user_basic(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Basic user authentication for backward compatibility"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# AI Analysis Functions with integrated Gemini API
async def analyze_hair_with_gemini(api_key: str, image_base64: str) -> HairAnalysisResult:
    """Analyze hair image using Google Gemini API."""
    try:
        # Google AI Studio API endpoint
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        hair_analysis_prompt = """
Analiza esta imagen del cuero cabelludo y proporciona un análisis detallado de salud capilar.

Evalúa y proporciona:
1. Estimación del conteo de cabellos visible (número aproximado)
2. Zonas de calvicie o pérdida de cabello identificadas
3. Riesgo de alopecia a 3, 5 y 10 años (bajo/medio/alto)
4. Recomendaciones específicas para mantener la salud capilar
5. Puntuación de confianza del análisis (0.0 a 1.0)

Responde en formato JSON:
{
    "hair_count_estimate": número_entero,
    "baldness_zones": ["zona1", "zona2"],
    "alopecia_risk_3_years": "bajo|medio|alto",
    "alopecia_risk_5_years": "bajo|medio|alto",
    "alopecia_risk_10_years": "bajo|medio|alto",
    "recommendations": ["recomendación1", "recomendación2"],
    "confidence_score": 0.85
}
"""

        # Prepare the request payload
        payload = {
            "contents": [{
                "parts": [
                    {"text": hair_analysis_prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": image_base64
                        }
                    }
                ]
            }]
        }

        # Make the API request
        headers = {"Content-Type": "application/json"}
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        result = response.json()
        
        # Extract and parse the generated text
        if "candidates" in result and len(result["candidates"]) > 0:
            generated_text = result["candidates"][0]["content"]["parts"][0]["text"]
            
            # Try to parse JSON response
            try:
                # Clean the response and extract JSON
                json_start = generated_text.find('{')
                json_end = generated_text.rfind('}') + 1
                if json_start != -1 and json_end != -1:
                    json_text = generated_text[json_start:json_end]
                    analysis_data = json.loads(json_text)
                    
                    return HairAnalysisResult(
                        hair_count_estimate=analysis_data.get("hair_count_estimate"),
                        baldness_zones=analysis_data.get("baldness_zones", []),
                        alopecia_risk_3_years=analysis_data.get("alopecia_risk_3_years"),
                        alopecia_risk_5_years=analysis_data.get("alopecia_risk_5_years"),
                        alopecia_risk_10_years=analysis_data.get("alopecia_risk_10_years"),
                        recommendations=analysis_data.get("recommendations", []),
                        confidence_score=analysis_data.get("confidence_score")
                    )
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                pass
                
            # Fallback response if JSON parsing failed
            return HairAnalysisResult(
                hair_count_estimate=0,
                baldness_zones=["Análisis visual"],
                alopecia_risk_3_years="medio",
                alopecia_risk_5_years="medio", 
                alopecia_risk_10_years="alto",
                recommendations=[f"Análisis: {generated_text[:200]}..."],
                confidence_score=0.7
            )
        else:
            raise ValueError("No response from Gemini API")
            
    except requests.exceptions.RequestException as e:
        logging.error(f"HTTP error calling Gemini API: {str(e)}")
        return HairAnalysisResult(
            hair_count_estimate=0,
            baldness_zones=["Error en análisis"],
            alopecia_risk_3_years="desconocido",
            alopecia_risk_5_years="desconocido",
            alopecia_risk_10_years="desconocido",
            recommendations=["Revisar imagen y reintentar análisis"],
            confidence_score=0.0
        )
    except Exception as e:
        logging.error(f"Error analyzing hair with Gemini: {str(e)}")
        return HairAnalysisResult(
            hair_count_estimate=0,
            baldness_zones=["Error en análisis"],
            alopecia_risk_3_years="desconocido",
            alopecia_risk_5_years="desconocido", 
            alopecia_risk_10_years="desconocido",
            recommendations=[f"Error en análisis: {str(e)}"],
            confidence_score=0.0
        )

async def analyze_document_with_gemini(api_key: str, text_content: str, document_type: str) -> Dict[str, Any]:
    """Analyze document content using Google Gemini API."""
    try:
        # Google AI Studio API endpoint
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        analysis_prompt = f"""
Analiza el siguiente texto de un documento médico relacionado con salud capilar:

{text_content}

Proporciona un análisis que incluya:
1. Hallazgos principales relacionados con salud capilar
2. Recomendaciones basadas en la información
3. Puntos de atención o seguimiento necesario

Responde en formato JSON:
{{
    "main_findings": ["hallazgo1", "hallazgo2"],
    "recommendations": ["recomendación1", "recomendación2"],
    "follow_up_points": ["punto1", "punto2"],
    "summary": "resumen_general"
}}
"""

        # Prepare the request payload
        payload = {
            "contents": [{
                "parts": [{"text": analysis_prompt}]
            }]
        }

        # Make the API request
        headers = {"Content-Type": "application/json"}
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        result = response.json()
        
        # Extract the generated text
        if "candidates" in result and len(result["candidates"]) > 0:
            generated_text = result["candidates"][0]["content"]["parts"][0]["text"]
            
            # Try to parse JSON response
            try:
                json_start = generated_text.find('{')
                json_end = generated_text.rfind('}') + 1
                if json_start != -1 and json_end != -1:
                    json_text = generated_text[json_start:json_end]
                    return json.loads(json_text)
            except json.JSONDecodeError:
                pass
            
            # Fallback if JSON parsing fails
            return {
                "main_findings": ["Documento procesado"],
                "recommendations": [f"Análisis: {generated_text[:200]}..."],
                "follow_up_points": ["Consulta con especialista"],
                "summary": generated_text[:300] + "..." if len(generated_text) > 300 else generated_text
            }
        else:
            raise ValueError("No response from Gemini API")
            
    except requests.exceptions.RequestException as e:
        logging.error(f"HTTP error calling Gemini API: {str(e)}")
        return {
            "main_findings": ["Error en análisis"],
            "recommendations": ["Revisar documento manualmente"],
            "follow_up_points": ["Consulta técnica"],
            "summary": f"Error de conexión: {str(e)}"
        }
    except Exception as e:
        logging.error(f"Error analyzing document with Gemini: {str(e)}")
        return {
            "main_findings": ["Error en análisis"],
            "recommendations": ["Revisar documento manualmente"],
            "follow_up_points": ["Consulta técnica"],
            "summary": f"Error interno: {str(e)}"
        }

# Health check endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Health Tracker API - Unified is running",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected" if db is not None else "in_memory",
        "version": "2.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to Health Tracker API - Unified",
        "docs": "/docs",
        "health": "/health",
        "version": "2.0.0"
    }

# Authentication endpoints (both with and without /api prefix for compatibility)
@api_router.post("/auth/register", response_model=Token)
@app.post("/auth/register")
async def register(user: UserRegistration):
    try:
        # Check if user exists
        user_exists = False
        if db is not None:
            existing_user = await db.users.find_one({"email": user.email})
            user_exists = existing_user is not None
        else:
            # Check in-memory storage
            for stored_user in users_storage.values():
                if stored_user.get("email") == user.email:
                    user_exists = True
                    break
        
        if user_exists:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = hash_password(user.password)
        
        user_data = {
            "id": user_id,
            "email": user.email,
            "name": user.username,
            "password": hashed_password,
            "created_at": datetime.utcnow(),
            "has_gemini_key": False
        }
        
        # Store in database or memory
        if db is not None:
            await db.users.insert_one(user_data)
        else:
            users_storage[user_id] = user_data
        
        # Create access token
        access_token = create_access_token(data={"sub": user_id})
        
        user_response = UserResponse(
            id=user_id,
            email=user.email,
            name=user.username,
            has_gemini_key=False
        )
        
        return Token(access_token=access_token, user=user_response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {e}")

@api_router.post("/auth/login", response_model=Token)
@app.post("/auth/login")
async def login(user_data: UserLogin):
    # Find user
    user_doc = None
    if db is not None:
        user_doc = await db.users.find_one({"email": user_data.email})
    else:
        # Check in-memory storage
        for stored_user in users_storage.values():
            if stored_user.get("email") == user_data.email:
                user_doc = stored_user
                break
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Verify password
    if not verify_password(user_data.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Create access token
    access_token = create_access_token(data={"sub": user_doc["id"]})
    
    user_response = UserResponse(
        id=user_doc["id"],
        email=user_doc["email"],
        name=user_doc["name"],
        has_gemini_key=bool(user_doc.get("gemini_api_key"))
    )
    
    return Token(access_token=access_token, user=user_response)

@api_router.get("/auth/me")
@app.get("/auth/me")
async def auth_me(current_user: str = Depends(get_current_user_basic)):
    # Get user data
    user_doc = None
    if db is not None:
        user_doc = await db.users.find_one({"id": current_user})
    else:
        user_doc = users_storage.get(current_user)
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return sanitize_user(user_doc)

@api_router.put("/auth/gemini-key")
@app.put("/auth/gemini-key")
async def set_gemini_key(
    payload: dict,
    current_user: str = Depends(get_current_user_basic),
):
    gemini_key = payload.get("gemini_api_key")
    if not gemini_key:
        raise HTTPException(status_code=400, detail="gemini_api_key requerido")
    
    # Update user with Gemini API key
    if db is not None:
        await db.users.update_one(
            {"id": current_user},
            {"$set": {"has_gemini_key": True, "gemini_api_key": gemini_key}},
        )
        doc = await db.users.find_one({"id": current_user})
        return {"status": "ok", "user": sanitize_user(doc)}
    
    # Update in-memory storage
    if current_user in users_storage:
        users_storage[current_user]["has_gemini_key"] = True
        users_storage[current_user]["gemini_api_key"] = gemini_key
        return {
            "status": "ok",
            "user": sanitize_user(users_storage[current_user]),
        }
    
    raise HTTPException(status_code=404, detail="User not found")

# Health records endpoints
@api_router.get("/records")
@app.get("/records")
async def get_records(current_user: str = Depends(get_current_user_basic)):
    if db is not None:
        # Get user records from database
        records = []
        async for record in db.records.find({"user_id": current_user}):
            record["_id"] = str(record["_id"])
            records.append(record)
        return records
    else:
        # Return records from memory storage
        user_records = records_storage.get(current_user, [])
        return user_records

@api_router.post("/records")
@app.post("/records")
async def create_record(
    record: HealthRecord,
    current_user: str = Depends(get_current_user_basic),
):
    record.user_id = current_user
    record.id = str(uuid.uuid4())
    
    if db is not None:
        # Store in database
        record_dict = record.model_dump()
        await db.records.insert_one(record_dict)
        return {"status": "ok", "record": record_dict}
    else:
        # Store in memory
        if current_user not in records_storage:
            records_storage[current_user] = []
        record_dict = record.model_dump()
        records_storage[current_user].append(record_dict)
        return {"status": "ok", "record": record_dict}

# File upload endpoint
@api_router.post("/upload")
@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user_basic),
):
    try:
        # Read file content
        contents = await file.read()
        
        # Basic file validation
        if len(contents) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=413, detail="File too large")
        
        # For development, we'll just return a success response
        # In production, you'd want to store this properly
        file_info = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(contents),
            "uploaded_at": datetime.utcnow().isoformat()
        }
        
        return {
            "status": "ok", 
            "message": "File uploaded successfully",
            "file": file_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

# Document management endpoints with AI analysis
@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    try:
        if file.size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=413, detail="Archivo muy grande")
        
        # Read file content
        content_bytes = await file.read()
        
        # Process content based on file type
        content = ""
        if document_type == "pdf":
            # Extract text from PDF
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content_bytes))
            for page in pdf_reader.pages:
                content += page.extract_text() + "\n"
        else:
            # For images, store as base64
            content = base64.b64encode(content_bytes).decode('utf-8')
        
        # Create document record
        document = HealthDocument(
            user_id=current_user.id,
            document_type=document_type,
            original_filename=file.filename,
            content=content
        )
        
        document_dict = document.model_dump()
        
        # Store document
        if db is not None:
            await db.health_documents.insert_one(document_dict)
        else:
            if current_user.id not in documents_storage:
                documents_storage[current_user.id] = []
            documents_storage[current_user.id].append(document_dict)
        
        return {
            "id": document.id,
            "filename": file.filename,
            "type": document_type,
            "message": "Documento subido correctamente"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir documento: {str(e)}")

@api_router.get("/documents")
async def get_documents(current_user: User = Depends(get_current_user)):
    if db is not None:
        documents = await db.health_documents.find({"user_id": current_user.id}).to_list(1000)
    else:
        documents = documents_storage.get(current_user.id, [])
    
    return [
        {
            "id": doc["id"],
            "filename": doc["original_filename"],
            "type": doc["document_type"],
            "created_at": doc["created_at"],
            "has_analysis": bool(doc.get("analysis_result"))
        }
        for doc in documents
    ]

@api_router.post("/analysis/hair")
async def analyze_hair(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    # Check if user has Gemini API key
    if not current_user.gemini_api_key:
        raise HTTPException(
            status_code=400, 
            detail="Necesitas configurar tu API key de Gemini primero"
        )
    
    # Get document
    document = None
    if db is not None:
        document = await db.health_documents.find_one({
            "id": request.document_id,
            "user_id": current_user.id
        })
    else:
        user_docs = documents_storage.get(current_user.id, [])
        for doc in user_docs:
            if doc["id"] == request.document_id:
                document = doc
                break
    
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    if document["document_type"] != "image":
        raise HTTPException(
            status_code=400, 
            detail="El análisis capilar solo funciona con imágenes"
        )
    
    try:
        # Analyze with Gemini AI
        result = await analyze_hair_with_gemini(
            current_user.gemini_api_key,
            document["content"]
        )
        
        # Save analysis result
        analysis_data = result.model_dump()
        update_data = {"analysis_result": analysis_data}
        
        if db is not None:
            await db.health_documents.update_one(
                {"id": request.document_id},
                {"$set": update_data}
            )
        else:
            # Update in-memory storage
            user_docs = documents_storage.get(current_user.id, [])
            for i, doc in enumerate(user_docs):
                if doc["id"] == request.document_id:
                    user_docs[i].update(update_data)
                    break
        
        return {
            "analysis_result": analysis_data,
            "message": "Análisis completado exitosamente"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")

@api_router.post("/analysis/document")
async def analyze_document(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    # Check if user has Gemini API key
    if not current_user.gemini_api_key:
        raise HTTPException(
            status_code=400, 
            detail="Necesitas configurar tu API key de Gemini primero"
        )
    
    # Get document
    document = None
    if db is not None:
        document = await db.health_documents.find_one({
            "id": request.document_id,
            "user_id": current_user.id
        })
    else:
        user_docs = documents_storage.get(current_user.id, [])
        for doc in user_docs:
            if doc["id"] == request.document_id:
                document = doc
                break
    
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    if document["document_type"] != "pdf":
        raise HTTPException(
            status_code=400, 
            detail="El análisis de documentos solo funciona con PDFs"
        )
    
    try:
        # Analyze with Gemini AI
        result = await analyze_document_with_gemini(
            current_user.gemini_api_key,
            document["content"],
            document["document_type"]
        )
        
        # Save analysis result
        update_data = {"analysis_result": result}
        
        if db is not None:
            await db.health_documents.update_one(
                {"id": request.document_id},
                {"$set": update_data}
            )
        else:
            # Update in-memory storage
            user_docs = documents_storage.get(current_user.id, [])
            for i, doc in enumerate(user_docs):
                if doc["id"] == request.document_id:
                    user_docs[i].update(update_data)
                    break
        
        return {
            "analysis_result": result,
            "message": "Análisis de documento completado"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")

# Health dashboard endpoint
@api_router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    # Get recent documents and analyses
    documents = []
    if db is not None:
        documents = await db.health_documents.find(
            {"user_id": current_user.id}
        ).sort("created_at", -1).limit(10).to_list(10)
    else:
        user_docs = documents_storage.get(current_user.id, [])
        documents = sorted(user_docs, key=lambda x: x.get("created_at", datetime.utcnow()), reverse=True)[:10]
    
    analyzed_documents = [doc for doc in documents if doc.get("analysis_result")]
    
    return {
        "total_documents": len(documents),
        "analyzed_documents": len(analyzed_documents),
        "recent_analyses": [
            {
                "id": doc["id"],
                "filename": doc["original_filename"],
                "type": doc["document_type"],
                "created_at": doc["created_at"],
                "analysis": doc["analysis_result"]
            }
            for doc in analyzed_documents[:5]
        ]
    }

# Include the router in the main app for /api endpoints
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

@app.on_event("startup")
async def startup_event():
    logging.info("Health Tracker API - Unified started successfully")
    if db is not None:
        logging.info("Connected to MongoDB")
    else:
        logging.info("Using in-memory storage (MongoDB unavailable)")

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()
        logging.info("MongoDB connection closed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)