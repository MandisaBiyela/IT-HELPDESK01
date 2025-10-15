from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Application
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    APP_BASE_URL: str = "http://localhost:8000"
    
    # SMTP Email
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str
    SMTP_FROM_NAME: str = "Ndabase IT Helpdesk"
    
    # Management Contacts
    ICT_GM_EMAIL: str
    ICT_MANAGER_EMAIL: str
    
    # WhatsApp (Twilio)
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_WHATSAPP_FROM: str
    ICT_GM_WHATSAPP: str
    ICT_MANAGER_WHATSAPP: str
    
    # SLA Timings (in minutes)
    SLA_URGENT_MINUTES: int = 20
    SLA_HIGH_MINUTES: int = 480
    SLA_NORMAL_MINUTES: int = 1440
    SLA_WARNING_MINUTES: int = 2
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
