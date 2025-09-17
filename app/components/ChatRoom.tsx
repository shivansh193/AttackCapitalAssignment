import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ParticipantList from './ParticpantList';

interface ChatRoomProps {
  roomId: string;
}

const ChatRoom = ({ roomId }: ChatRoomProps) => {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [showParticipants, setShowParticipants] = useState(true);

  // Get username from session storage
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username');
    if (!storedUsername) {
      router.push('/');
      return;
    }
    setUsername(storedUsername);
  }, [router]);

  const {
    messages,
    participants,
    isConnected,
    sendMessage,
    isSending
  } = useChat(roomId, username);

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('username');
    router.push('/');
  };

  const toggleParticipants = () => {
    setShowParticipants(!showParticipants);
  };

  if (!username) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {decodeURIComponent(roomId)}
          </h1>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleParticipants}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Toggle participants"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </button>

          <div className="text-sm text-gray-600">
            Welcome, <span className="font-medium">{username}</span>
          </div>

          <button
            onClick={handleLeaveRoom}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <MessageList 
            messages={messages} 
            currentUser={username} 
          />
          <MessageInput 
            onSendMessage={sendMessage}
            isConnected={isConnected}
            isSending={isSending}
          />
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className={`${showParticipants ? 'block' : 'hidden'} lg:block`}>
            <ParticipantList 
              participants={participants}
              currentUser={username}
            />
          </div>
        )}
      </div>

      {/* Mobile participant overlay */}
      {showParticipants && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleParticipants}
        >
          <div 
            className="absolute right-0 top-0 h-full w-80 max-w-[80vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <ParticipantList 
              participants={participants}
              currentUser={username}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;