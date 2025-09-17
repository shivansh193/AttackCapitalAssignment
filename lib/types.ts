export interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: Date;
    isAI: boolean;
  }
  
  export interface Participant {
    id: string;
    username: string;
    isConnected: boolean;
    joinedAt: Date;
  }
  
  export interface ChatState {
    messages: Message[];
    participants: Participant[];
    isConnected: boolean;
    currentUser: string;
    roomId: string;
  }