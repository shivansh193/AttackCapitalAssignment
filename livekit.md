# LiveKit Integration Analysis

## 1. Current Status & The Problem

**Status:** The entire codebase for the LiveKit integration, both on the frontend and the backend, appears to be correctly implemented. 

- The frontend successfully requests and receives a valid access token from the `/api/token` endpoint.
- The Next.js server correctly generates this token using the appropriate API keys.
- The `useChat.ts` hook is architected correctly to use this token to initiate a connection.
- The backend agent is correctly configured to join LiveKit rooms.

**The Problem:** Despite all the code being correct, the frontend client fails to establish a connection to the LiveKit server. The browser logs a generic "unable to connect" error, and no real-time communication occurs. This points to an issue outside of the application's code, likely in the environment, network, or cloud configuration.

---

## 2. Frontend Connection Flow

This is the step-by-step process the frontend follows to connect:

1.  A user joins a room, triggering the `useChat` hook.
2.  The `useEffect` inside `useChat.ts` calls `fetch('/api/token', ...)` to request a token from the Next.js server.
3.  The request is handled by `app/api/token/route.ts`.
4.  This route uses the server-side `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` to generate a short-lived JWT access token.
5.  The route returns the token to the `useChat` hook.
6.  The hook receives the token and the `NEXT_PUBLIC_LIVEKIT_URL`.
7.  It then calls `livekitClient.connect(wsUrl, token)`.
8.  **FAILURE POINT:** The connection attempt at this final step fails.

---

## 3. File-by-File Breakdown

Here are all the files involved in the LiveKit integration.

### Frontend Files

#### `app/hooks/useChat.ts`
*   **Purpose:** The core of the frontend connection logic. It orchestrates fetching the token, connecting to the room, and handling messages and participants.
*   **Code:**
    ```typescript
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

          addMessage(messageData);
          client.sendMessage(messageData);

        } catch (error) {
          console.error('Failed to send message:', error);
        } finally {
          setIsSending(false);
        }
      }, [client, chatState.isConnected, username, addMessage, isSending]);

      useEffect(() => {
        if (!roomId || !username) return;

        let livekitClient: LiveKitClient;

        const setupConnection = async () => {
          try {
            livekitClient = new LiveKitClient();

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

            setTimeout(() => {
              addMessage({
                text: `Welcome, ${username}! Mention @agent to talk to the AI assistant.`,
                sender: 'AI Assistant',
                isAI: true
              });
            }, 1000);

          } catch (error) {
            console.error('Failed to connect:', error);
            setChatState(prev => ({ ...prev, isConnected: false }));
          }
        };

        setupConnection();

        return () => {
          if (livekitClient) {
            livekitClient.disconnect();
          }
          setClient(null);
          setChatState(prev => ({ ...prev, isConnected: false }));
        };
      }, [roomId, username, addMessage, updateParticipants]);

      return {
        ...chatState,
        sendMessage,
        isSending
      };
    };
    ```

#### `app/api/token/route.ts`
*   **Purpose:** A server-side Next.js API route that securely generates the LiveKit access token.
*   **Code:**
    ```typescript
    import { AccessToken } from 'livekit-server-sdk';
    import { NextRequest, NextResponse } from 'next/server';

    export async function POST(req: NextRequest) {
      const body = await req.json();
      const { roomName, username } = body;

      if (!roomName || !username) {
        return NextResponse.json(
          { error: 'Missing roomName or username' },
          { status: 400 }
        );
      }

      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;
      const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

      if (!apiKey || !apiSecret || !wsUrl) {
        return NextResponse.json(
          { error: 'Server misconfigured' },
          { status: 500 }
        );
      }

      const at = new AccessToken(apiKey, apiSecret, { identity: username });

      at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true });

      const token = await at.toJwt();

      return NextResponse.json({ token });
    }
    ```

#### `lib/livekit.ts` (relevant part)
*   **Purpose:** Contains the client-side helper function that calls our `/api/token` endpoint.
*   **Code:**
    ```typescript
    export const generateToken = async (roomName: string, username: string): Promise<string> => {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, username })
      });
      
      const { token } = await response.json();
      return token;
    };
    ```

#### `.env.local`
*   **Purpose:** Provides the environment variables for the Next.js server.
*   **Content:**
    ```
    NEXT_PUBLIC_LIVEKIT_URL="wss://your-project.livekit.cloud"
    LIVEKIT_API_KEY="your_key"
    LIVEKIT_API_SECRET="your_secret"
    ```

### Backend Files

#### `backend/agent/chat_agent.py`
*   **Purpose:** The Python agent that connects to the same LiveKit room to act as the AI assistant.
*   **Note:** This file is not directly involved in the frontend's connection failure but is part of the overall integration.

#### `backend/.env`
*   **Purpose:** Provides environment variables for the Python backend.
*   **Content:**
    ```
    LIVEKIT_URL="wss://your-project.livekit.cloud"
    LIVEKIT_API_KEY="your_key"
    LIVEKIT_API_SECRET="your_secret"
    GEMINI_API_KEY="your_gemini_key"
    ```

---

## 4. Most Likely Causes of Failure

Given that all the code above is correct, the issue is almost certainly environmental. Here are the most likely causes, in order:

1.  **CORS Misconfiguration in LiveKit Cloud:** This remains the #1 suspect for this exact problem. I know you've checked, but please double-check for typos or subtle mistakes. 
    *   **Action:** Go to your LiveKit Cloud project -> Settings -> Allowed Origins. Ensure the URL is exactly `http://localhost:3000`. A missing `http://`, a typo, or a different port number will cause the connection to be blocked.

2.  **Network Blocking WebSockets:** This is the second most likely cause. Your local network, a VPN, or a firewall might be blocking the `wss://` protocol.
    *   **Action:** Try connecting from a different network. The easiest way is to use your phone as a mobile hotspot and connect your computer to it. If it connects successfully on the hotspot, your primary network is the problem.

3.  **Incorrect Environment Variables:** A simple typo in the `NEXT_PUBLIC_LIVEKIT_URL` in your `.env.local` file.
    *   **Action:** Copy the WebSocket URL directly from your LiveKit Cloud project page and paste it into your `.env.local` file to be absolutely sure it is correct.
