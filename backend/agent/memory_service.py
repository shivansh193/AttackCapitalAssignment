import json
import os
from typing import List, Dict, Optional
from datetime import datetime
import logging
from .config import Config

logger = logging.getLogger(__name__)

class MemoryService:
    def __init__(self):
        """Initialize memory service - tries mem0, falls back to JSON"""
        self.use_mem0 = False
        self.memory_client = None
        self.json_storage_path = "memory_storage.json"
        
        # Try to initialize mem0
        if Config.MEM0_API_KEY:
            try:
                from mem0 import MemoryClient
                self.memory_client = MemoryClient(api_key=Config.MEM0_API_KEY)
                self.use_mem0 = True
                logger.info("Initialized mem0 client")
            except ImportError:
                logger.warning("mem0ai package not installed, falling back to JSON storage")
            except Exception as e:
                logger.warning(f"Failed to initialize mem0: {e}, falling back to JSON storage")
        
        # Initialize JSON storage if not using mem0
        if not self.use_mem0:
            self._init_json_storage()
            logger.info("Using JSON file storage for memory")
    
    def _init_json_storage(self):
        """Initialize JSON file storage"""
        if not os.path.exists(self.json_storage_path):
            with open(self.json_storage_path, 'w') as f:
                json.dump({"users": {}}, f)
    
    async def get_relevant_context(self, username: str, current_message: str) -> str:
        """
        Retrieve relevant conversation context for the user
        
        Args:
            username: User's username
            current_message: Current message to find relevant context for
            
        Returns:
            Formatted context string
        """
        if self.use_mem0:
            return await self._get_context_mem0(username, current_message)
        else:
            return self._get_context_json(username, current_message)
    
    async def save_conversation(self, username: str, user_message: str, ai_response: str, room_id: str = "default"):
        """
        Save conversation to memory
        
        Args:
            username: User's username
            user_message: User's message
            ai_response: AI's response
            room_id: Chat room identifier
        """
        if self.use_mem0:
            await self._save_conversation_mem0(username, user_message, ai_response, room_id)
        else:
            self._save_conversation_json(username, user_message, ai_response, room_id)
    
    async def _get_context_mem0(self, username: str, current_message: str) -> str:
        """Get context using mem0"""
        try:
            # Search for relevant memories
            memories = self.memory_client.search(
                query=current_message,
                user_id=username,
                limit=5
            )
            
            if memories:
                context_parts = []
                for memory in memories:  # ✅ iterate list directly
        # Depending on mem0 schema, key might be "memory", "content", or "text"
                    text = memory.get("memory") or memory.get("content") or str(memory)
                    context_parts.append(f"- {text}")
    
                return f"What I remember about {username}:\n" + "\n".join(context_parts)

            
        except Exception as e:
            logger.error(f"Error retrieving mem0 context: {e}")
            return ""
    
    def _get_context_json(self, username: str, current_message: str) -> str:
        """Get context using JSON storage"""
        try:
            with open(self.json_storage_path, 'r') as f:
                data = json.load(f)
            
            user_data = data.get("users", {}).get(username, {})
            conversations = user_data.get("conversations", [])
            
            # Simple context: return last few conversations
            if conversations:
                recent_conversations = conversations[-3:]  # Last 3 conversations
                context_parts = []
                
                for conv in recent_conversations:
                    context_parts.append(f"User: {conv['user_message']}")
                    context_parts.append(f"AI: {conv['ai_response']}")
                
                return f"Recent conversation with {username}:\n" + "\n".join(context_parts)
            
            return ""
            
        except Exception as e:
            logger.error(f"Error reading JSON context: {e}")
            return ""
    
    async def _save_conversation_mem0(self, username: str, user_message: str, ai_response: str, room_id: str):
        """Save conversation using mem0"""
        try:
            # Create memory entry
            conversation_summary = f"User asked: '{user_message}' and I responded: '{ai_response}'"
            
            self.memory_client.add(
                messages=[
                    {"role": "user", "content": user_message},
                    {"role": "assistant", "content": ai_response}
                ],
                user_id=username,
                metadata={
                    "room_id": room_id,
                    "timestamp": datetime.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Error saving to mem0: {e}")
    
    def _save_conversation_json(self, username: str, user_message: str, ai_response: str, room_id: str):
        """Save conversation using JSON storage"""
        try:
            # Read existing data
            with open(self.json_storage_path, 'r') as f:
                data = json.load(f)
            
            # Initialize user data if needed
            if username not in data["users"]:
                data["users"][username] = {"conversations": []}
            
            # Add new conversation
            conversation = {
                "user_message": user_message,
                "ai_response": ai_response,
                "timestamp": datetime.now().isoformat(),
                "room_id": room_id
            }
            
            data["users"][username]["conversations"].append(conversation)
            
            # Keep only last 50 conversations per user to prevent file bloat
            if len(data["users"][username]["conversations"]) > 50:
                data["users"][username]["conversations"] = data["users"][username]["conversations"][-50:]
            
            # Save back to file
            with open(self.json_storage_path, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error saving to JSON: {e}")
    
    def get_user_stats(self, username: str) -> Dict:
        """Get user statistics"""
        if self.use_mem0:
            # For mem0, this would require additional API calls
            return {"storage": "mem0", "username": username}
        else:
            try:
                with open(self.json_storage_path, 'r') as f:
                    data = json.load(f)
                
                user_data = data.get("users", {}).get(username, {})
                conversations = user_data.get("conversations", [])
                
                return {
                    "storage": "json",
                    "username": username,
                    "total_conversations": len(conversations),
                    "first_seen": conversations[0]["timestamp"] if conversations else None,
                    "last_seen": conversations[-1]["timestamp"] if conversations else None
                }
            except Exception as e:
                logger.error(f"Error getting user stats: {e}")
                return {"storage": "json", "username": username, "error": str(e)}