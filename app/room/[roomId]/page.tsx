"use client"
import { NextPage } from 'next';
import { useRouter, useParams } from 'next/navigation';
import Head from 'next/head';
import ChatRoom from '../../components/ChatRoom';


const RoomPage: NextPage = () => {
  const router = useRouter();
  const { roomId } = useParams();

  if (!roomId || typeof roomId !== 'string') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Room</h1>
          <p className="text-gray-600 mb-4">The room ID is invalid or missing.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${decodeURIComponent(roomId)} - AI Chat Agent`}</title>
        <meta name="description" content="Chat with AI assistant that remembers your conversations" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <ChatRoom roomId={roomId} />
    </>
  );
};

export default RoomPage;