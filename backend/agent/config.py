import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # LiveKit Configuration
    LIVEKIT_URL = os.getenv("LIVEKIT_URL")
    LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
    LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
    
    # Gemini Configuration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = "gemini-2.5-flash"  # Updated to latest model
    
    # Memory Configuration
    MEM0_API_KEY = os.getenv("MEM0_API_KEY")
    
    # Supabase Configuration (optional)
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    
    # Agent Configuration
    AGENT_NAME = "AI Assistant"
    AGENT_TRIGGER = "@agent"  # Users must mention this to get responses
    MAX_CONTEXT_LENGTH = 4000  # Characters to include from memory
    
    @classmethod
    def validate(cls):
        """Validate required environment variables"""
        required = [
            cls.LIVEKIT_URL,
            cls.LIVEKIT_API_KEY, 
            cls.LIVEKIT_API_SECRET,
            cls.GEMINI_API_KEY
        ]
        
        missing = [var for var in required if not var]
        if missing:
            raise ValueError(f"Missing required environment variables: {missing}")
        
        return True