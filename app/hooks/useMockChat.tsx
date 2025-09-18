import { useState, useCallback, useEffect } from 'react';
import { Message, Participant, ChatState } from '../../lib/types';

// Mock AI responses for testing
const mockAIResponses = [
  "That's interesting! Tell me more about that.",
  "I understand. How does that make you feel?",
  "Thanks for sharing that with me. I'll remember this for our future conversations.",
  "That's a great point! I hadn't thought of it that way.",
  "I can help you with that. What would you like to know?",
  "Based on our previous conversations, I remember you mentioned something similar before.",
  "That reminds me of what we discussed earlier about your interests.",
  "I'm here to help! What questions do you have?",
  "That's fascinating! I love learning new things from our chats.",
  "I can see why that would be important to you."
];

const getRandomAIResponse = () => {
  return mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)];
};

// Mock participants that join/leave randomly
const mockUsernames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];

export const useMockChat = (roomId: string, username: string) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    participants: [],
    isConnected: false,
    currentUser: username,
    roomId: roomId
  });
  
  const [isSending, setIsSending] = useState(false);

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

  const addRandomParticipant = useCallback(() => {
    const availableNames = mockUsernames.filter(name => 
      name !== username && 
      !chatState.participants.some(p => p.username === name)
    );
    
    if (availableNames.length === 0) return;
    
    const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
    const newParticipant: Participant = {
      id: Math.random().toString(36).substr(2, 9),
      username: randomName,
      isConnected: true,
      joinedAt: new Date()
    };

    setChatState(prev => ({
      ...prev,
      participants: [...prev.participants, newParticipant]
    }));

    // Add a welcome message from the new participant
    setTimeout(() => {
      addMessage({
        text: `Hey everyone! Just joined the room.`,
        sender: randomName,
        isAI: false
      });
    }, 1000 + Math.random() * 3000);
  }, [chatState.participants, username, addMessage]);

  const removeRandomParticipant = useCallback(() => {
    if (chatState.participants.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * chatState.participants.length);
    const leavingParticipant = chatState.participants[randomIndex];
    
    setChatState(prev => ({
      ...prev,
      participants: prev.participants.filter((_, index) => index !== randomIndex)
    }));

    // Add a goodbye message
    setTimeout(() => {
      addMessage({
        text: `Thanks for the chat, everyone! Gotta go.`,
        sender: leavingParticipant.username,
        isAI: false
      });
    }, 500);
  }, [chatState.participants, addMessage]);

  const sendMessage = useCallback(async (text: string) => {
    if (!chatState.isConnected || isSending) return;

    setIsSending(true);

    try {
      // Add user message immediately
      addMessage({
        text,
        sender: username,
        isAI: false
      });

      // Simulate AI response delay
      setTimeout(() => {
        addMessage({
          text: getRandomAIResponse(),
          sender: 'AI Assistant',
          isAI: true
        });
      }, 1000 + Math.random() * 2000);

      // Occasionally add messages from other participants
      if (chatState.participants.length > 0 && Math.random() < 0.3) {
        const randomParticipant = chatState.participants[Math.floor(Math.random() * chatState.participants.length)];
        setTimeout(() => {
          const responses = [
            "I agree with that!",
            "That's really cool!",
            "Interesting perspective",
            "Thanks for sharing!",
            "I was thinking the same thing",
            "Good point!"
          ];
          addMessage({
            text: responses[Math.floor(Math.random() * responses.length)],
            sender: randomParticipant.username,
            isAI: false
          });
        }, 2000 + Math.random() * 3000);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setTimeout(() => setIsSending(false), 1000);
    }
  }, [chatState.isConnected, chatState.participants, username, addMessage, isSending]);

  const connect = useCallback(async () => {
    try {
      // Simulate connection delay
      setTimeout(() => {
        setChatState(prev => ({ ...prev, isConnected: true }));
        
        // Add welcome message from AI
        addMessage({
          text: `Welcome to the room, ${username}! I'm your AI assistant. This is a demo mode - I can remember our conversations and help you with various topics. Try sending me a message!`,
          sender: 'AI Assistant',
          isAI: true
        });

        // Add some initial messages for context
        setTimeout(() => {
          addMessage({
            text: "This is a demo of the chat interface. The AI responses are simulated, but the real version will have memory and connect to Gemini API.",
            sender: 'AI Assistant',
            isAI: true
          });
        }, 2000);

      }, 1500);

    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }, [username, addMessage]);

  const disconnect = useCallback(() => {
    setChatState(prev => ({ ...prev, isConnected: false, participants: [] }));
  }, []);

  // Simulate random participant activity
  useEffect(() => {
    if (!chatState.isConnected) return;

    const interval = setInterval(() => {
      const random = Math.random();
      
      if (random < 0.1 && chatState.participants.length < 4) {
        // 10% chance to add participant if room isn't full
        addRandomParticipant();
      } else if (random < 0.05 && chatState.participants.length > 0) {
        // 5% chance to remove participant
        removeRandomParticipant();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [chatState.isConnected, chatState.participants.length, addRandomParticipant, removeRandomParticipant]);

  // Add initial participants after connecting
  useEffect(() => {
    if (chatState.isConnected && chatState.participants.length === 0) {
      // Add 1-2 initial participants
      setTimeout(() => addRandomParticipant(), 3000);
      if (Math.random() > 0.5) {
        setTimeout(() => addRandomParticipant(), 5000);
      }
    }
  }, [chatState.isConnected, chatState.participants.length, addRandomParticipant]);

  // Auto-connect when hook is initialized
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [roomId, username]);

  return {
    ...chatState,
    sendMessage,
    connect,
    disconnect,
    isSending
  };
};