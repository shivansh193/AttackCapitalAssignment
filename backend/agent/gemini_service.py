from google import genai
from google.genai import types
from typing import Optional
import logging
from .config import Config

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        """Initialize Gemini API client"""
        self.client = genai.Client(api_key=Config.GEMINI_API_KEY)
        self.model_name = Config.GEMINI_MODEL
        
        # System prompt for the AI agent
        self.system_prompt = """You are a helpful AI assistant in a group chat. 
        You have access to conversation history and user context from previous interactions.
        
        Key guidelines:
        - Be conversational and friendly
        - Reference past conversations when relevant
        - Keep responses concise (1-3 sentences typically)
        - If you remember something about the user, mention it naturally
        - Be helpful but not overly verbose in group settings
        
        Current conversation context will be provided below."""
    
    async def generate_response(self, message: str, context: str = "", username: str = "") -> str:
        """
        Generate AI response using Gemini
        
        Args:
            message: User's current message
            context: Relevant conversation history/context
            username: Username of the person sending the message
            
        Returns:
            AI-generated response
        """
        try:
            # Build the full prompt
            full_prompt = self._build_prompt(message, context, username)
            
            # Generate response with new API
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=0)  # Disable thinking for speed
                )
            )
            
            if response.text:
                return response.text.strip()
            else:
                logger.warning("Empty response from Gemini")
                return "I'm sorry, I couldn't generate a response right now."
                
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I'm experiencing some technical difficulties. Please try again."
    
    def _build_prompt(self, message: str, context: str, username: str) -> str:
        """Build the complete prompt for Gemini"""
        
        prompt_parts = [self.system_prompt]
        
        # Add context if available
        if context:
            prompt_parts.append(f"\nPrevious conversation context:\n{context}")
        
        # Add current message
        if username:
            prompt_parts.append(f"\nCurrent message from {username}: {message}")
        else:
            prompt_parts.append(f"\nCurrent message: {message}")
        
        prompt_parts.append(f"\nPlease respond as the AI assistant:")
        
        return "\n".join(prompt_parts)
    
    def test_connection(self) -> bool:
        """Test if Gemini API is working"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents="Hello, this is a test.",
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=0)
                )
            )
            return bool(response.text)
        except Exception as e:
            logger.error(f"Gemini connection test failed: {e}")
            return False