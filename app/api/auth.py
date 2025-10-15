from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token
from app.utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_active_user,
    require_role
)
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "technician"]))
):
    """Register a new user - Admins and Technicians can create accounts"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Technicians can only create other technician accounts
    if current_user.role == "technician" and user_data.role != "technician":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Technicians can only create other technician accounts"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        hashed_password=hashed_password,
        role=user_data.role,
        technician_type=user_data.technician_type
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token with role-based redirect"""
    # Find user
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    # Update last_login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    # Determine redirect URL based on role
    redirect_map = {
        "helpdesk_officer": "/helpdesk-officer.html",
        "technician": "/technician.html",
        "ict_manager": "/ict-manager.html",
        "ict_gm": "/ict-gm.html",
        "admin": "/index.html"
    }
    
    redirect_url = redirect_map.get(user.role, "/index.html")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "redirect_url": redirect_url,
        "user_role": user.role,
        "user_name": user.name
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current logged-in user information"""
    return current_user


@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all users (for assignee dropdown)"""
    users = db.query(User).filter(User.is_active == 1).all()
    return users
