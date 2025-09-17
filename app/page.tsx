"use client"
import { NextPage } from 'next';
import Head from 'next/head';
import JoinRoomForm from './components/JoinRoomForm';

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>AI Chat Agent - Join Room</title>
        <meta name="description" content="Join a chat room and talk with our AI assistant that remembers your conversations" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <JoinRoomForm />
    </>
  );
};

export default HomePage;