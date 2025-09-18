import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isConnecting, setIsConnecting] = useState(false);
  const hasWelcomed = useRef(false);

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

      addMessage(messageData);
      client.sendMessage(messageData);

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [client, chatState.isConnected, username, addMessage, isSending]);

  const connect = useCallback(async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting || chatState.isConnected) {
      console.log('Connection already in progress or established');
      return;
    }

    setIsConnecting(true);
    
    try {
      console.log('Attempting connection with:', { roomId, username });

      const livekitClient = new LiveKitClient();

      livekitClient.onMessage((messageData) => {
        if (messageData.sender !== username) {
          addMessage(messageData);
        }
      });

      livekitClient.onParticipants(updateParticipants);

      const token = await generateToken(roomId, username);
      const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
      
      if (!wsUrl) {
        throw new Error("NEXT_PUBLIC_LIVEKIT_URL is not defined");
      }
      
      await livekitClient.connect(wsUrl, token);
      setClient(livekitClient);
      setChatState(prev => ({ ...prev, isConnected: true }));

      // Only show welcome message once
      if (!hasWelcomed.current) {
        setTimeout(() => {
          addMessage({
            text: `Welcome to the room, ${username}! I'm your AI assistant. How can I help you today?`,
            sender: 'AI Assistant',
            isAI: true
          });
          hasWelcomed.current = true;
        }, 1000);
      }

    } catch (error) {
      console.error('Failed to connect:', error);
      setChatState(prev => ({ ...prev, isConnected: false }));
    } finally {
      setIsConnecting(false);
    }
  }, [roomId, username, addMessage, updateParticipants, isConnecting, chatState.isConnected]);

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect();
      setClient(null);
    }
    setChatState(prev => ({ ...prev, isConnected: false }));
  }, [client]);

  // FIXED: Only connect once when roomId and username are first available
  useEffect(() => {
    // Guard clause - don't connect if required params are missing
    if (!roomId || !username) {
      console.log('Waiting for roomId and username...', { roomId, username });
      return;
    }

    // Don't reconnect if already connected
    if (chatState.isConnected) {
      console.log('Already connected, skipping...');
      return;
    }

    console.log('Starting connection process...', { roomId, username });
    connect();

    return () => {
      if (client) {
        console.log('Cleaning up connection...');
        client.disconnect();
        setClient(null);
        setChatState(prev => ({ ...prev, isConnected: false }));
        hasWelcomed.current = false;
      }
    };
  }, [roomId, username]); // Removed connect and disconnect from dependencies

  return {
    ...chatState,
    sendMessage,
    connect,
    disconnect,
    isSending,
    isConnecting
  };
};