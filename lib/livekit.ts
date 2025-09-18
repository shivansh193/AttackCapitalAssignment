import { Room, RoomEvent, DataPacket_Kind } from 'livekit-client';

export class LiveKitClient {
  private room: Room | null = null;
  private onMessageCallback?: (message: any) => void;
  private onParticipantCallback?: (participants: any[]) => void;

  async connect(wsUrl: string, token: string) {
    this.room = new Room();
    
    this.room.on(RoomEvent.DataReceived, (payload, participant) => {
      const message = JSON.parse(new TextDecoder().decode(payload));
      this.onMessageCallback?.(message);
    });

    this.room.on(RoomEvent.ParticipantConnected, () => {
      this.updateParticipants();
    });

    this.room.on(RoomEvent.ParticipantDisconnected, () => {
      this.updateParticipants();
    });

    await this.room.connect(wsUrl, token);
    this.updateParticipants();
  }

  private updateParticipants() {
    if (!this.room) return;
    
    const participants = Array.from(this.room.remoteParticipants.values()).map(p => ({
      id: p.sid,
      username: p.identity,
      isConnected: true,
      joinedAt: new Date()
    }));

    this.onParticipantCallback?.(participants);
  }

  sendMessage(message: any) {
    if (!this.room) return;
    
    const data = new TextEncoder().encode(JSON.stringify(message));
    this.room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
  }

  onMessage(callback: (message: any) => void) {
    this.onMessageCallback = callback;
  }

  onParticipants(callback: (participants: any[]) => void) {
    this.onParticipantCallback = callback;
  }

  disconnect() {
    this.room?.disconnect();
    this.room = null;
  }
}

// lib/livekit.ts
export async function generateToken(roomName: string, username: string): Promise<string> {
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomName, username }),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate token: ${response.status} ${errorText}`);
    }
  
    const data = await response.json();
    if (!data.token) {
      throw new Error('No token received from server');
    }
  
    return data.token;
  }