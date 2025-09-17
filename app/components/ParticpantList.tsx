import { Participant } from '../../lib/types';

interface ParticipantListProps {
  participants: Participant[];
  currentUser: string;
}

const ParticipantList = ({ participants, currentUser }: ParticipantListProps) => {
  // Add current user to the list if not already present
  const allParticipants = [
    ...participants,
    ...(participants.find(p => p.username === currentUser) ? [] : [{
      id: 'current-user',
      username: currentUser,
      isConnected: true,
      joinedAt: new Date()
    }])
  ];

  // Add AI assistant as a special participant
  const participantsWithAI = [
    {
      id: 'ai-assistant',
      username: 'AI Assistant',
      isConnected: true,
      joinedAt: new Date(),
      isAI: true
    },
    ...allParticipants
  ];

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const formatJoinTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="w-64 bg-gray-50 border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold text-gray-900">Room Participants</h3>
        <p className="text-sm text-gray-500 mt-1">
          {participantsWithAI.length} {participantsWithAI.length === 1 ? 'participant' : 'participants'} online
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {participantsWithAI.map((participant) => {
            const isCurrentUser = participant.username === currentUser;
            const isAI = 'isAI' in participant && participant.isAI;

            return (
              <div
                key={participant.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors"
              >
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                  isAI
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : isCurrentUser
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-1'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {isAI ? '🤖' : getInitials(participant.username)}
                  
                  {participant.isConnected && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm font-medium truncate ${
                      isAI ? 'text-purple-700' : 'text-gray-900'
                    }`}>
                      {participant.username}
                      {isCurrentUser && <span className="text-blue-600 ml-1">(You)</span>}
                    </p>
                  </div>
                  
                  <div className="flex items-center mt-1">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      participant.isConnected ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <p className="text-xs text-gray-500">
                      {isAI 
                        ? 'Always online' 
                        : participant.isConnected 
                        ? `Joined at ${formatJoinTime(participant.joinedAt)}`
                        : 'Offline'
                      }
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {participantsWithAI.length === 1 && (
          <div className="mt-8 text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              Invite others to join the conversation!
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          Share this room with others using the room name above
        </div>
      </div>
    </div>
  );
};

export default ParticipantList;