import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.hash import bcrypt
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

# In-memory storage for development
users_storage = {}
records_storage = {}

app = FastAPI(title="Health Tracker API - Development", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
JWT_SECRET = "dev-secret-key-for-testing"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Pydantic models


class UserRegistration(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


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
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials"
            )
        return username
    except JWTError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        ) from exc

# Health check endpoint


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Health Tracker API is running (Development Mode)",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "in_memory_storage",
        "registered_users": len(users_storage)
    }

# Root endpoint


@app.get("/")
async def root():
    return {
        "message": "Welcome to Health Tracker API - Development Mode",
        "docs": "/docs",
        "health": "/health",
        "mode": "development"
    }

# Authentication endpoints


@app.post("/auth/register")
async def register(user: UserRegistration):
    try:
        # Check if user already exists
        if user.username in users_storage:
            raise HTTPException(
                status_code=400,
                detail="Username already registered"
            )

        if any(u.get("email") == user.email for u in users_storage.values()):
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        # Hash password
        hashed_password = bcrypt.hash(user.password)

        # Store user in memory
        users_storage[user.username] = {
            "username": user.username,
            "email": user.email,
            "password": hashed_password,
            "created_at": datetime.utcnow()
        }

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "message": "User registered successfully",
            "success": True,
            "toast": {
                "type": "success",
                "title": "¡Registro exitoso!",
                "message": (
                    f"Bienvenido {user.username}, "
                    f"tu cuenta ha sido creada correctamente."
                )
            },
            "user": {
                "username": user.username,
                "email": user.email
            }
        }
    except HTTPException as e:
        # Return error with toast information
        error_messages = {
            "Username already registered": (
                "El nombre de usuario ya está registrado"
            ),
            "Email already registered": "El email ya está registrado"
        }
        spanish_message = error_messages.get(e.detail, e.detail)

        return {
            "success": False,
            "toast": {
                "type": "error",
                "title": "Error en el registro",
                "message": spanish_message
            },
            "detail": e.detail
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Registration error: {str(e)}"
        ) from e


@app.post("/auth/login")
async def login(user: UserLogin):
    try:
        # Find user in memory storage
        if user.username not in users_storage:
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password"
            )

        user_doc = users_storage[user.username]
        if not bcrypt.verify(user.password, user_doc["password"]):
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password"
            )

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "message": "Login successful",
            "success": True,
            "toast": {
                "type": "success",
                "title": "¡Login exitoso!",
                "message": f"Bienvenido de vuelta, {user.username}!"
            },
            "user": {
                "username": user_doc["username"],
                "email": user_doc["email"]
            }
        }
    except HTTPException as e:
        # Return error with toast information
        error_messages = {
            "Incorrect username or password": (
                "Usuario o contraseña incorrectos"
            )
        }
        spanish_message = error_messages.get(e.detail, e.detail)

        return {
            "success": False,
            "toast": {
                "type": "error",
                "title": "Error en el login",
                "message": spanish_message
            },
            "detail": e.detail
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login error: {str(e)}"
        ) from e

# Get current user info


@app.get("/auth/me")
async def get_me(current_user: str = Depends(get_current_user)):
    if current_user not in users_storage:
        raise HTTPException(status_code=404, detail="User not found")

    user_doc = users_storage[current_user]
    return {
        "username": user_doc["username"],
        "email": user_doc["email"],
        "created_at": user_doc["created_at"]
    }

# Health records endpoints


@app.get("/records")
async def get_records(current_user: str = Depends(get_current_user)):
    user_records = [record for record in records_storage.values(
    ) if record["user_id"] == current_user]
    return user_records


@app.post("/records")
async def create_record(
    record: HealthRecord,
    current_user: str = Depends(get_current_user)
):
    record.user_id = current_user
    record_id = str(uuid.uuid4())
    record.id = record_id

    record_dict = record.dict()
    records_storage[record_id] = record_dict

    return {
        "id": record_id,
        "message": "Record created successfully"
    }

# File upload endpoint


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file.size,
        "message": "File uploaded successfully (development mode)",
        "user": current_user
    }

# Debug endpoints for development


@app.get("/debug/users")
async def debug_users():
    return {
        "total_users": len(users_storage),
        "users": [
            {"username": u["username"], "email": u["email"]}
            for u in users_storage.values()
        ]
    }


@app.get("/debug/records")
async def debug_records():
    return {
        "total_records": len(records_storage),
        "records": list(records_storage.values())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
