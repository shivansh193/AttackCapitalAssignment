import { useState, useEffect, useCallback } from 'react';
import { Message, Participant, ChatState } from '../../lib/types';
import { LiveKitClient, generateToken } from '../../lib/livekit';

export const useChat = (roomId: string, username: string) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    participants: [],
    isConnected: false,
    currentUser: username,
    roomId: roomId
  });
  
  const [isSending, setIsSending] = useState(false);
  const [client, setClient] = useState<LiveKitClient | null>(null);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, []);

  const updateParticipants = useCallback((participants: Participant[]) => {
    setChatState(prev => ({
      ...prev,
      participants
    }));
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!client || !chatState.isConnected || isSending) return;

    setIsSending(true);

    try {
      const messageData = {
        text,
        sender: username,
        isAI: false
      };

      // Add the message to local state immediately
      addMessage(messageData);

      // Send to LiveKit room
      client.sendMessage(messageData);

    } catch (error) {
      console.error('Failed to send message:', error);
      // Could add error handling here (e.g., show toast notification)
    } finally {
      setIsSending(false);
    }
  }, [client, chatState.isConnected, username, addMessage, isSending]);

  const connect = useCallback(async () => {
    try {
      const livekitClient = new LiveKitClient();

      // Set up message handler
      livekitClient.onMessage((messageData) => {
        // Don't add messages from current user (already added locally)
        if (messageData.sender !== username) {
          addMessage(messageData);
        }
      });

      // Set up participant handler
      livekitClient.onParticipants(updateParticipants);

      // Generate token and connect
      const token = await generateToken(roomId, username);
      const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.com';
      
      await livekitClient.connect(wsUrl, token);

      setClient(livekitClient);
      setChatState(prev => ({ ...prev, isConnected: true }));

      // Add welcome message from AI
      setTimeout(() => {
        addMessage({
          text: `Welcome to the room, ${username}! I'm your AI assistant. How can I help you today?`,
          sender: 'AI Assistant',
          isAI: true
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to connect:', error);
      setChatState(prev => ({ ...prev, isConnected: false }));
    }
  }, [roomId, username, addMessage, updateParticipants]);

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect();
      setClient(null);
    }
    setChatState(prev => ({ ...prev, isConnected: false }));
  }, [client]);

  // Auto-connect when hook is initialized
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [roomId, username]);

  return {
    ...chatState,
    sendMessage,
    connect,
    disconnect,
    isSending
  };
};