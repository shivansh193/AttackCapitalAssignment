# 24-Hour Development Roadmap: AI Chat Agent with Memory

## Time Allocation (24 hours total)

- **Hours 1-6: Frontend + Basic LiveKit Setup ✅** - A functional Next.js frontend with all UI components and LiveKit client-side integration is complete.
- **Hours 7-12: LiveKit Agent + Gemini Integration ✅** - The Python backend agent is fully implemented, connecting to LiveKit and integrating the Gemini service.
- **Hours 13-18: Memory Integration (mem0/RAG) ✅** - The memory service is complete, featuring a dual-mode system with `mem0` and a JSON fallback.
- **Hours 19-22: End-to-End Integration & Testing ✅** - The frontend and backend are fully integrated and communicating successfully via LiveKit.
- **Hours 23-24: Documentation + Demo Video**

---

## Phase 1: Frontend (Hours 1-6) ✅
*All frontend components, hooks, and types for the chat interface have been implemented and are fully functional.*

- **Next.js Project Structure ✅** - Implemented using the Next.js `app` router directory structure.
- **`pages/index.tsx` ✅** - Done as `app/page.tsx`, rendering the `JoinRoomForm`.
- **`pages/room/[roomId].tsx` ✅** - Done as `app/room/[roomId]/page.tsx`, rendering the `ChatRoom`.
- **`components/JoinRoomForm.tsx` ✅** - A client component form that captures user and room name.
- **`components/ChatRoom.tsx` ✅** - The main chat interface, integrating all other components and hooks.
- **`components/MessageList.tsx` ✅** - Displays incoming messages.
- **`components/MessageInput.tsx` ✅** - Provides the text input for sending messages.
- **`components/ParticipantList.tsx` ✅** - Renders a list of connected participants.
- **`lib/livekit.ts` ✅** - Contains the client-side helper to fetch the API token.
- **`lib/types.ts` ✅** - Defines the shared `Message` type.
- **`hooks/useChat.ts` ✅** - A robust React hook that manages the LiveKit connection lifecycle.
- **Frontend Dependencies ✅** - All required npm packages are installed.

---

## Phase 2: Backend Setup (Hours 7-12) ✅
*The backend is fully implemented with a clear structure, configuration, and all necessary services.*

- **Python Project Structure ✅** - All files (`main.py`, `requirements.txt`, etc.) and the `agent` directory are in place.
- **`requirements.txt` ✅** - All Python dependencies are listed.
- **`config.py` ✅** - Handles loading all environment variables for the agent.
- **`chat_agent.py` ✅** - The core agent is complete, handling LiveKit events, message processing, and agent logic.
- **`gemini_service.py` ✅** - The service for interacting with the Google Gemini API is implemented.

---

## Phase 3: Memory Integration (Hours 13-18) ✅
*Memory persistence is fully implemented, providing the agent with conversational context.*

- **`memory_service.py` ✅** - A resilient memory service has been built. 
  - **Implementation:** It features a dual-mode design. If a `MEM0_API_KEY` is provided in the environment variables, it uses the advanced semantic search capabilities of `mem0`. Otherwise, it gracefully falls back to a simple `memory_storage.json` file for local persistence.
  - **Scope:** Memory is tied to the `username`. This means the agent remembers its conversations with a specific user **across all chat rooms**. If you talk to the agent in "Room A" and then join "Room B", it will still have the context from your conversation in Room A.
- **Context Integration Flow ✅** - The `chat_agent` correctly retrieves context from memory before calling Gemini and saves the new conversation afterward.

---

## Phase 4: API Routes & Services (Hours 15-17) ✅
*All necessary API endpoints for the application to function are complete.*

- **`app/api/token/route.ts` ✅** - A secure, server-side API endpoint for generating LiveKit tokens for the frontend is implemented.

---

## Phase 5: Integration & Testing (Hours 19-22) ✅
*The full end-to-end system is integrated and working as planned.*

- **Frontend ↔ LiveKit Connection ✅** - The frontend now successfully connects to LiveKit after resolving environment and configuration issues.
- **Agent ↔ Memory ↔ Gemini Pipeline ✅** - The backend agent's full logic pipeline is implemented and functional.
- **Testing Checklist ✅**
  - **User can join room with username ✅**
  - **Messages appear in real-time ✅**
  - **AI responds to messages ✅**
  - **Memory retrieval works ✅**
  - **Memory storage works ✅**
  - **Context persists across sessions ✅**

---

## Phase 6: Documentation & Demo (Hours 23-24)
*This is the final remaining phase.*

- **README.md Structure**
- **Demo Video Script**

---

## Bug Diagnosis: Agent Responds Incorrectly to New User

**Symptom:** When a new user (e.g., "def") sends a message like "@agent Hello", the backend agent correctly receives the message but the AI's response is "There is no direct mention of the @agent...", incorrectly stating that it was not mentioned.

**Analysis of Logs:**
```
# Log shows the agent correctly identifies the trigger
2025-09-18 15:18:42,597 - INFO agent.chat_agent - ✅ Agent mentioned! Processing message from def

# Log shows the agent correctly cleans the message before sending to Gemini
2025-09-18 15:18:42,597 - INFO agent.chat_agent - 🧹 Cleaned message: 'Hello'

# Log shows the incorrect response generated by Gemini
2025-09-18 15:18:43,470 - INFO agent.chat_agent - 📤 Sent message: There is no direct mention of the @agent. Therefore, the AI assistant will not respond....
```

**Root Cause:** The issue is not in the agent's code logic, but in a **conflict between the instructions given to the Gemini AI and the data it receives.**

1.  **The Instruction:** In `backend/agent/gemini_service.py`, the `system_prompt` contains the rule: `"- Only respond when directly mentioned with @agent"`.
2.  **The Data:** In `backend/agent/chat_agent.py`, the code correctly identifies the `@agent` trigger, but then it **removes it**, sending only the *cleaned* message (e.g., `"Hello"`) to the Gemini service.
3.  **The Conflict:** The Gemini AI receives the message `"Hello"`. It then checks its instructions, sees the rule about requiring `@agent`, and correctly concludes that the message it received does not contain the trigger. Therefore, it generates the response telling the user it was not mentioned.

**Conclusion:** The AI is working perfectly according to its instructions. The problem is that the agent's code guarantees the AI will always receive a message that violates its primary instruction.