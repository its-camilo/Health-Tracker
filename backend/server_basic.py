import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
from starlette.middleware.cors import CORSMiddleware

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
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
""")

# MongoDB connection with fallback (limit exception scope to PyMongo errors)
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client: Optional[AsyncIOMotorClient]
db = None
# Forzar uso de almacenamiento en memoria para desarrollo
# try:
#     client = AsyncIOMotorClient(
#         mongo_url, serverSelectionTimeoutMS=1000
#     )  # 1s timeout
#     db_name = os.environ.get('DB_NAME', 'health_tracker')
#     db = client[db_name]
# except (ServerSelectionTimeoutError, PyMongoError):
#     # Defer connection errors to runtime (endpoints manejarán la ausencia)
#     client = None
#     db = None
client = None

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI(title="Health Tracker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models


class UserRegistration(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


def sanitize_user(doc: dict) -> dict:
    """Return a user object safe for API responses."""
    return {
        "id": str(doc.get("_id", doc.get("username"))),
        "email": doc.get("email"),
        "name": doc.get("username"),
        "has_gemini_key": bool(doc.get("has_gemini_key", False)),
    }


class HealthRecord(BaseModel):
    id: Optional[str] = None
    user_id: str
    record_type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Security
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials",
            )
        return username
    except JWTError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
        ) from exc

# Health check endpoint


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Health Tracker API is running",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected" if db is not None else "not_configured"
    }

# Root endpoint


@app.get("/")
async def root():
    return {
        "message": "Welcome to Health Tracker API",
        "docs": "/docs",
        "health": "/health"
    }

# In-memory storage for development without MongoDB
users_storage = {}
records_storage = {}

# Authentication endpoints


@app.post("/auth/register")
async def register(user: UserRegistration):
    try:
        if db is not None:
            # Check if user already exists in database
            existing_user = await db.users.find_one({
                "$or": [
                    {"username": user.username},
                    {"email": user.email},
                ]
            })
            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Username or email already registered",
                )

            # Hash password
            hashed_password = bcrypt.hash(user.password)

            # Create user
            user_doc = {
                "username": user.username,
                "email": user.email,
                "password": hashed_password,
                "has_gemini_key": False,
                "created_at": datetime.utcnow(),
            }

            await db.users.insert_one(user_doc)
        else:
            # Use in-memory storage for development
            if (
                user.username in users_storage
                or any(
                    u.get("email") == user.email
                    for u in users_storage.values()
                )
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Username or email already registered",
                )

            # Hash password
            hashed_password = bcrypt.hash(user.password)

            # Store user in memory
            users_storage[user.username] = {
                "username": user.username,
                "email": user.email,
                "password": hashed_password,
                "has_gemini_key": False,
                "created_at": datetime.utcnow(),
            }

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        # Build user payload (without password)
        if db is not None:
            created_user = await db.users.find_one({"username": user.username})
        else:
            created_user = users_storage[user.username]

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "message": "User registered successfully",
            "user": sanitize_user(created_user),
        }
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001 - convert to HTTPException
        raise HTTPException(
            status_code=500,
            detail=f"Registration error: {e}",
        ) from e


@app.post("/auth/login")
async def login(user: UserLogin):
    try:
        if db is not None:
            # Find user in database
            user_doc = await db.users.find_one({"username": user.username})
            if (
                not user_doc
                or not bcrypt.verify(
                    user.password, user_doc["password"]
                )
            ):
                raise HTTPException(
                    status_code=401,
                    detail="Incorrect username or password",
                )
        else:
            # Use in-memory storage for development
            if user.username not in users_storage:
                raise HTTPException(
                    status_code=401,
                    detail="Incorrect username or password",
                )

            user_doc = users_storage[user.username]
            if not bcrypt.verify(user.password, user_doc["password"]):
                raise HTTPException(
                    status_code=401,
                    detail="Incorrect username or password",
                )

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        # user_doc guaranteed at this point (either from DB or memory)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": sanitize_user(user_doc),
        }
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Login error: {e}") from e

# Health records endpoints


@app.get("/records")
async def get_records(current_user: str = Depends(get_current_user)):
    if db is None:
        # Return mock data for development
        return [
            {
                "id": "1",
                "record_type": "blood_pressure",
                "data": {"systolic": 120, "diastolic": 80},
                "timestamp": datetime.utcnow().isoformat()
            }
        ]

    # Get user records from database
    records = []
    async for record in db.records.find({"user_id": current_user}):
        record["_id"] = str(record["_id"])
        records.append(record)

    return records


@app.post("/records")
async def create_record(
    record: HealthRecord,
    current_user: str = Depends(get_current_user),
):
    if db is None:
        # Return mock response for development
        return {
            "id": str(uuid.uuid4()),
            "message": "Record created successfully (mock mode)"
        }

    record.user_id = current_user
    record_doc = record.dict()
    record_doc["id"] = str(uuid.uuid4())

    await db.records.insert_one(record_doc)

    return {
        "id": record_doc["id"],
        "message": "Record created successfully"
    }

# File upload endpoint (without AI processing)


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
):
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file.size,
        # Long message segmented for readability
        "message": (
            "File uploaded successfully (AI processing not available - "
            "emergentintegrations module missing)"
        ),
        "user": current_user
    }


# --- Additional auth utility endpoints ---

@app.get("/auth/me")
async def auth_me(current_user: str = Depends(get_current_user)):
    if db is not None:
        doc = await db.users.find_one({"username": current_user})
        if not doc:
            raise HTTPException(status_code=404, detail="User not found")
        return sanitize_user(doc)
    # in-memory
    doc = users_storage.get(current_user)
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return sanitize_user(doc)


@app.put("/auth/gemini-key")
async def set_gemini_key(
    payload: dict,
    current_user: str = Depends(get_current_user),
):
    gemini_key = payload.get("gemini_api_key")
    if not gemini_key:
        raise HTTPException(status_code=400, detail="gemini_api_key requerido")
    if db is not None:
        await db.users.update_one(
            {"username": current_user},
            {"$set": {"has_gemini_key": True, "gemini_api_key": gemini_key}},
        )
        doc = await db.users.find_one({"username": current_user})
        return {"status": "ok", "user": sanitize_user(doc)}
    # memory
    if current_user in users_storage:
        users_storage[current_user]["has_gemini_key"] = True
        users_storage[current_user]["gemini_api_key"] = gemini_key
        return {
            "status": "ok",
            "user": sanitize_user(users_storage[current_user]),
        }
    raise HTTPException(status_code=404, detail="User not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
