# Proposed Code for `useChat.ts`

This is the refactored code for the main `useEffect` hook in `app/hooks/useChat.ts`. This pattern resolves the infinite loop by moving the connection and cleanup logic directly inside the `useEffect` hook, ensuring it only re-runs when its true dependencies (`roomId`, `username`) change.

```typescript
  useEffect(() => {
    if (!roomId || !username) return;

    let livekitClient: LiveKitClient;

    const setupConnection = async () => {
      try {
        livekitClient = new LiveKitClient();

        // Set up message handler
        livekitClient.onMessage((messageData) => {
          if (messageData.sender !== username) {
            addMessage(messageData);
          }
        });

        // Set up participant handler
        livekitClient.onParticipants(updateParticipants);

        // Generate token and connect
        const token = await generateToken(roomId, username);
        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
        
        if (!wsUrl) {
          throw new Error("NEXT_PUBLIC_LIVEKIT_URL is not defined");
        }

        await livekitClient.connect(wsUrl, token);
        setClient(livekitClient);
        setChatState(prev => ({ ...prev, isConnected: true }));

        // Add welcome message
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

    // Cleanup on unmount or when dependencies change
    return () => {
      if (livekitClient) {
        livekitClient.disconnect();
      }
      setClient(null);
      setChatState(prev => ({ ...prev, isConnected: false }));
    };
  }, [roomId, username, addMessage, updateParticipants]);
```
