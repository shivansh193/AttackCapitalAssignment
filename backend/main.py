#!/usr/bin/env python3
"""
AI Chat Agent - Main Entry Point

This script starts the LiveKit agent that provides AI-powered chat responses
with memory capabilities.

Usage:
    python main.py

Environment variables required:
    - LIVEKIT_URL: Your LiveKit server URL
    - LIVEKIT_API_KEY: Your LiveKit API key
    - LIVEKIT_API_SECRET: Your LiveKit API secret
    - GEMINI_API_KEY: Your Google Gemini API key
    - MEM0_API_KEY: Your mem0 API key (optional, will fallback to JSON)
"""

import asyncio
import logging
import sys
from livekit.agents import cli, WorkerOptions
from agent.config import Config
from agent.gemini_service import GeminiService
from agent.memory_service import MemoryService
from agent.chat_agent import entrypoint

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def test_services():
    """Test all services before starting the agent"""
    logger.info("Testing services...")
    
    # Test Gemini
    try:
        gemini = GeminiService()
        if gemini.test_connection():
            logger.info("✅ Gemini service: Connected")
        else:
            logger.error("❌ Gemini service: Connection failed")
            return False
    except Exception as e:
        logger.error(f"❌ Gemini service: {e}")
        return False
    
    # Test Memory service
    try:
        memory = MemoryService()
        logger.info(f"✅ Memory service: Initialized ({'mem0' if memory.use_mem0 else 'JSON'})")
    except Exception as e:
        logger.error(f"❌ Memory service: {e}")
        return False
    
    logger.info("All services tested successfully!")
    return True

def main():
    """Main function"""
    print("🤖 AI Chat Agent Starting...")
    print("=" * 50)
    
    try:
        # Validate configuration
        logger.info("Validating configuration...")
        Config.validate()
        logger.info("✅ Configuration valid")
        
        # Test services
        if not test_services():
            logger.error("Service tests failed. Exiting.")
            sys.exit(1)
        
        # Start the LiveKit agent
        logger.info("Starting LiveKit agent...")
        print("\n🚀 Agent is ready!")
        print("💡 Users can mention '@agent' in chat to interact")
        print("📝 Conversations will be remembered for context")
        print("🛑 Press Ctrl+C to stop")
        print("=" * 50)
        
        # Run the agent using LiveKit's CLI
        cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
        
    except KeyboardInterrupt:
        logger.info("Agent stopped by user")
        print("\n👋 Agent stopped. Goodbye!")
    except Exception as e:
        logger.error(f"Error starting agent: {e}")
        print(f"\n❌ Failed to start agent: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()