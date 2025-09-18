# AI Chat Agent

This project is a full-stack chat application that integrates a Gemini-powered AI agent into a LiveKit-based chat room. The AI agent can remember conversation history and respond to user mentions.

## Technologies Used

### Frontend

-   [Next.js](https://nextjs.org/)
-   [React](https://reactjs.org/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [LiveKit React SDK](https://docs.livekit.io/sdk/react/)
-   [Tailwind CSS](https://tailwindcss.com/)

### Backend

-   [Python](https://www.python.org/)
-   [LiveKit Agents Framework](https://docs.livekit.io/agents/)
-   [Google Gemini](https://deepmind.google/technologies/gemini/)
-   [Mem0 (for memory)](https://mem0.ai/)

## Getting Started

### Prerequisites

-   Node.js and npm
-   Python 3.9+
-   LiveKit account and project credentials (API Key, Secret, URL)
-   Google Gemini API Key
-   (Optional) Mem0 API Key for persistent memory

### Environment Variables

Create a `.env.local` file in the root directory for the frontend, and a `.env` file inside the `backend` directory for the agent.

#### Frontend (`.env.local`)
```
# LiveKit Credentials
NEXT_PUBLIC_LIVEKIT_URL="<YOUR_LIVEKIT_URL>"
LIVEKIT_API_KEY="<YOUR_LIVEKIT_API_KEY>"
LIVEKIT_API_SECRET="<YOUR_LIVEKIT_API_SECRET>"
```

#### Backend (`backend/.env`)
```
# LiveKit Credentials
LIVEKIT_URL="<YOUR_LIVEKIT_URL>"
LIVEKIT_API_KEY="<YOUR_LIVEKIT_API_KEY>"
LIVEKIT_API_SECRET="<YOUR_LIVEKIT_API_SECRET>"

# AI Service Credentials
GEMINI_API_KEY="<YOUR_GEMINI_API_KEY>"
MEM0_API_KEY="<YOUR_MEM0_API_KEY>" # Optional, falls back to local JSON
```

## Setup and Running

### Frontend

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be available at [http://localhost:3000](http://localhost:3000).

### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**
    -   Windows: `venv\Scripts\activate`
    -   macOS/Linux: `source venv/bin/activate`

4.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Run the agent:**
    ```bash
     python main.py connect --room "your-roomId"
    ```

    The agent will connect to your LiveKit room and wait for messages.
