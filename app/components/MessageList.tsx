import { useEffect, useRef } from 'react';
import { Message } from '../../lib/types';

interface MessageListProps {
  messages: Message[];
  currentUser: string;
}

const MessageList = ({ messages, currentUser }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Welcome to the chat!</h3>
          <p className="text-gray-500">Send a message to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((message) => {
        const isOwnMessage = message.sender === currentUser && !message.isAI;
        const isAI = message.isAI;

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? 'order-1' : 'order-2'}`}>
              <div
                className={`rounded-2xl px-4 py-2 ${
                  isAI
                    ? 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100'
                    : isOwnMessage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${
                    isAI 
                      ? 'text-purple-600' 
                      : isOwnMessage 
                      ? 'text-blue-200' 
                      : 'text-gray-600'
                  }`}>
                    {isAI ? '🤖 AI Assistant' : message.sender}
                  </span>
                  <span className={`text-xs ml-2 ${
                    isAI
                      ? 'text-purple-500'
                      : isOwnMessage 
                      ? 'text-blue-200' 
                      : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${
                  isAI ? 'text-gray-800' : ''
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
            
            {!isOwnMessage && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 order-1 ${
                isAI 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                  : 'bg-gray-300'
              }`}>
                {isAI ? (
                  <span className="text-white text-sm">🤖</span>
                ) : (
                  <span className="text-gray-600 text-sm font-medium">
                    {message.sender.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;