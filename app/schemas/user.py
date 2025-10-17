from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole, TechnicianType


class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.TECHNICIAN
    technician_type: Optional[TechnicianType] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    technician_type: Optional[TechnicianType] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    redirect_url: Optional[str] = None
    user_role: Optional[str] = None
    user_name: Optional[str] = None


class TokenData(BaseModel):
    email: Optional[str] = None


class ProfileUpdate(BaseModel):
    """Schema for user profile updates"""
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    """Schema for password changes"""
    current_password: str
    new_password: str
