import asyncio
import json
import logging
from livekit import agents, rtc
from livekit.agents import AutoSubscribe, WorkerOptions, cli, JobContext
from .config import Config
from .gemini_service import GeminiService
from .memory_service import MemoryService

logger = logging.getLogger(__name__)

class ChatAgent:
    def __init__(self):
        # Initialize services
        self.gemini = GeminiService()
        self.memory = MemoryService()
        self.room = None
        
        logger.info("ChatAgent initialized")
    
    async def start_session(self, ctx: JobContext):
        """Start the agent session"""
        logger.info(f"Agent joining room: {ctx.room.name}")
        
        # Store room reference
        self.room = ctx.room
        
        # Set up event handlers BEFORE connecting
        @self.room.on("data_received")
        def on_data_received(data_packet: rtc.DataPacket, participant: rtc.RemoteParticipant = None):
            """Handle data received - properly extract from DataPacket"""
            try:
                # Extract the actual data bytes from the DataPacket
                data_bytes = data_packet.data
                logger.debug(f"Received DataPacket with {len(data_bytes)} bytes from participant: {participant.identity if participant else 'unknown'}")
                
                # Handle the message asynchronously
                asyncio.create_task(self.handle_data_message(data_bytes, participant))
                
            except Exception as e:
                logger.error(f"Error in data_received handler: {e}")
        
        @self.room.on("participant_connected")
        def on_participant_connected(participant: rtc.RemoteParticipant):
            asyncio.create_task(self.handle_participant_joined(participant))
        
        @self.room.on("participant_disconnected") 
        def on_participant_disconnected(participant: rtc.RemoteParticipant):
            logger.info(f"Participant left: {participant.identity}")
        
        # Connect to room
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
        
        # Send welcome message
        await self.send_chat_message("🤖 AI Assistant has joined the chat! Mention @agent to talk to me.")
        
        logger.info(f"Agent successfully connected to room: {ctx.room.name}")
        
        # Keep the session alive - wait for participants to leave
        try:
            # Wait indefinitely - the session will end when all participants leave
            await asyncio.Future()
        except asyncio.CancelledError:
            logger.info("Agent session ended")
    
    async def handle_participant_joined(self, participant: rtc.RemoteParticipant):
        """Handle new participant joining"""
        logger.info(f"Participant joined: {participant.identity}")
        
        # Send personalized welcome if we have history with this user
        try:
            stats = self.memory.get_user_stats(participant.identity)
            if stats.get("total_conversations", 0) > 0:
                await self.send_chat_message(
                    f"Welcome back, {participant.identity}! 👋 I remember our previous conversations."
                )
        except Exception as e:
            logger.error(f"Error sending welcome message: {e}")
    
    async def handle_data_message(self, data: bytes, participant: rtc.RemoteParticipant = None):
        """
        Handle incoming data messages from chat
        Only responds if message contains @agent mention
        """
        try:
            # Decode message
            message_str = data.decode('utf-8')
            message_data = json.loads(message_str)
            
            # Get username - handle case where participant might be None
            if participant:
                username = participant.identity
            else:
                # Try to get username from message data if participant is missing
                username = message_data.get("sender", "unknown_user")
                logger.warning(f"No participant info, using sender from message: {username}")
            
            message_text = message_data.get("text", "")
            
            logger.info(f"🔍 RECEIVED MESSAGE FROM {username}: '{message_text}'")
            logger.info(f"📋 Full message_data: {message_data}")
            
            # Skip messages from the AI agent itself
            if message_data.get("type") == "ai" or message_data.get("sender") == Config.AGENT_NAME:
                logger.info("✅ Ignoring message from AI agent itself")
                return
            
            # DEBUG: Log the exact values for trigger comparison
            logger.info(f"🎯 TRIGGER DEBUG:")
            logger.info(f"   - Message text: '{message_text}'")
            logger.info(f"   - AGENT_TRIGGER: '{Config.AGENT_TRIGGER}'")
            logger.info(f"   - Message lower: '{message_text.lower()}'")
            logger.info(f"   - Trigger lower: '{Config.AGENT_TRIGGER.lower()}'")
            logger.info(f"   - Contains trigger: {Config.AGENT_TRIGGER.lower() in message_text.lower()}")
            
            # Check if agent is mentioned
            if Config.AGENT_TRIGGER.lower() not in message_text.lower():
                logger.info(f"❌ Agent not mentioned, ignoring message from {username}")
                return
            
            logger.info(f"✅ Agent mentioned! Processing message from {username}")
            
            # Remove agent mention from message
            cleaned_message = message_text.replace(Config.AGENT_TRIGGER, "").strip()
            if not cleaned_message:
                cleaned_message = "Hello"
            
            logger.info(f"🧹 Cleaned message: '{cleaned_message}'")
            
            # Get relevant context from memory
            context = await self.memory.get_relevant_context(username, cleaned_message)
            
            # Generate AI response
            ai_response = await self.gemini.generate_response(
                message=cleaned_message,
                context=context,
                username=username
            )
            
            # Save the conversation to memory
            await self.memory.save_conversation(
                username=username,
                user_message=cleaned_message,
                ai_response=ai_response,
                room_id=self.room.name if self.room else "unknown"
            )
            
            # Send response to chat
            await self.send_chat_message(ai_response)
            
            logger.info(f"✅ Sent response to {username}")
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to decode message JSON: {e}")
            logger.error(f"❌ Raw message: {data}")
        except Exception as e:
            logger.error(f"❌ Error processing message: {e}")
            # Send error message to chat
            try:
                await self.send_chat_message("Sorry, I encountered an error processing your message.")
            except:
                pass
    
    async def send_chat_message(self, message: str):
        """Send a message to the chat room"""
        if not self.room:
            logger.error("Cannot send message: room not connected")
            return
        
        try:
            # Create message data
            chat_message = {
                "text": message,
                "timestamp": int(asyncio.get_event_loop().time() * 1000),
                "sender": Config.AGENT_NAME,
                "type": "ai"
            }
            
            # Send as data message
            message_json = json.dumps(chat_message)
            await self.room.local_participant.publish_data(
                message_json.encode('utf-8'),
                reliable=True
            )
            
            logger.info(f"📤 Sent message: {message[:100]}...")
            
        except Exception as e:
            logger.error(f"Error sending chat message: {e}")

# Agent entry point for LiveKit - this is the main entrypoint
async def entrypoint(ctx: JobContext):
    """Main entry point for the agent"""
    try:
        # Validate configuration
        Config.validate()
        
        # Create and start agent session
        agent = ChatAgent()
        await agent.start_session(ctx)
        
    except Exception as e:
        logger.error(f"Agent failed to start: {e}")
        raise