import { useState } from 'react';
import { useRouter } from 'next/navigation';

const JoinRoomForm = () => {
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [errors, setErrors] = useState<{username?: string; roomName?: string}>({});
  const router = useRouter();

  const validateForm = () => {
    const newErrors: {username?: string; roomName?: string} = {};
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 2) {
      newErrors.username = 'Username must be at least 2 characters';
    }

    if (!roomName.trim()) {
      newErrors.roomName = 'Room name is required';
    } else if (roomName.length < 2) {
      newErrors.roomName = 'Room name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsJoining(true);
    
    try {
      // Store user data and navigate to room
      sessionStorage.setItem('username', username.trim());
      router.push(`/room/${encodeURIComponent(roomName.trim())}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Join Chat Room</h1>
            <p className="text-gray-600">Enter your details to start chatting with our AI assistant</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isJoining}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
                Room Name
              </label>
              <input
                id="roomName"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isJoining}
              />
              {errors.roomName && (
                <p className="mt-1 text-sm text-red-600">{errors.roomName}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Joining...
                </div>
              ) : (
                'Join Room'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              No account needed. Just pick a username and start chatting!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomForm;