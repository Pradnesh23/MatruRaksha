import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Environment
    FASTAPI_ENV = os.getenv("FASTAPI_ENV", "development")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    # Telegram
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    
    # OAuth
    OAUTH_REDIRECT_URL = os.getenv("OAUTH_REDIRECT_URL", "http://localhost:5173/auth/callback")
    
    # Server
    SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT = int(os.getenv("SERVER_PORT", 8000))
    
    def __init__(self):
        if not self.SUPABASE_URL or not self.SUPABASE_KEY:
            raise ValueError("Supabase credentials required")
        if not self.TELEGRAM_BOT_TOKEN:
            raise ValueError("Telegram bot token required")

settings = Settings()