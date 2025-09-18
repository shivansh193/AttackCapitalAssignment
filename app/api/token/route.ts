import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('DEBUG request body:', body); // 👈 Add this

    const { roomName, username } = body;
    if (!roomName || !username) {
      return NextResponse.json({ error: 'Missing roomName or username' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      console.error('Missing env vars:', { apiKey: !!apiKey, apiSecret: !!apiSecret, wsUrl });
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, { identity: username });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    console.log('Generated token successfully');
    console.log(token)

    return NextResponse.json({ token, wsUrl });
  } catch (err) {
    console.error('Token route error:', err);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
