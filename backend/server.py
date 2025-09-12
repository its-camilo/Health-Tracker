from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Análisis de Salud Capilar API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    gemini_api_key: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

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

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user_data = await db.users.find_one({"id": user_id})
    if user_data is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    
    return User(**user_data)

# Authentication endpoints
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        has_gemini_key=False
    )
    
    return Token(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": user_data.email})
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

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        has_gemini_key=bool(current_user.gemini_api_key)
    )

@api_router.put("/auth/gemini-key")
async def update_gemini_key(
    key_data: GeminiKeyUpdate,
    current_user: User = Depends(get_current_user)
):
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"gemini_api_key": key_data.gemini_api_key}}
    )
    return {"message": "API key de Gemini actualizada correctamente"}

# Document upload endpoints
@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    try:
        # Read file content
        content = await file.read()
        
        if document_type == "image":
            # Convert image to base64
            base64_content = base64.b64encode(content).decode('utf-8')
            processed_content = base64_content
        elif document_type == "pdf":
            # For now, store as base64, will process later
            base64_content = base64.b64encode(content).decode('utf-8')
            processed_content = base64_content
        else:
            raise HTTPException(status_code=400, detail="Tipo de documento no soportado")
        
        # Create document record
        document = HealthDocument(
            user_id=current_user.id,
            document_type=document_type,
            original_filename=file.filename,
            content=processed_content
        )
        
        # Save to database
        await db.health_documents.insert_one(document.dict())
        
        return {
            "document_id": document.id,
            "filename": file.filename,
            "type": document_type,
            "message": "Documento subido correctamente"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir documento: {str(e)}")

@api_router.get("/documents")
async def get_documents(current_user: User = Depends(get_current_user)):
    documents = await db.health_documents.find({"user_id": current_user.id}).to_list(1000)
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
    document = await db.health_documents.find_one({
        "id": request.document_id,
        "user_id": current_user.id
    })
    
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    if document["document_type"] != "image":
        raise HTTPException(
            status_code=400, 
            detail="El análisis capilar solo funciona con imágenes"
        )
    
    # TODO: Implement Gemini analysis here
    # For now return mock data
    mock_result = HairAnalysisResult(
        hair_count_estimate=12500,
        baldness_zones=["Corona superior", "Línea frontal"],
        alopecia_risk_3_years="Bajo (15%)",
        alopecia_risk_5_years="Moderado (35%)",
        alopecia_risk_10_years="Alto (65%)",
        recommendations=[
            "Mantener una dieta rica en proteínas y biotina",
            "Usar champú sin sulfatos",
            "Evitar peinados muy tirantes",
            "Considerar suplementos de vitamina D"
        ],
        confidence_score=0.78
    )
    
    # Save analysis result
    await db.health_documents.update_one(
        {"id": request.document_id},
        {"$set": {"analysis_result": mock_result.dict()}}
    )
    
    return mock_result

# Health dashboard endpoint
@api_router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    # Get recent documents and analyses
    documents = await db.health_documents.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).limit(10).to_list(10)
    
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

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()