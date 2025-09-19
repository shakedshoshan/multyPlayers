'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createRoomAction } from '@/lib/actions';

export function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim().length === 4) {
      setIsJoining(true);
      router.push(`/game/${roomCode.trim().toUpperCase()}`);
    }
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    await createRoomAction();
  };

  return (
    <div className="flex flex-col items-center text-center">
      <BrainCircuit className="h-16 w-16 text-primary" />
      <h1 className="mt-4 text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl font-headline">
        SynapseSync
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Get on the same wavelength. Can your group think as one?
      </p>
      <Card className="mt-8 w-full max-w-sm shadow-2xl">
        <CardHeader>
          <CardTitle>Join the Hive Mind</CardTitle>
          <CardDescription>
            Create a new room or join an existing one.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Room'
            )}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or join a room
              </span>
            </div>
          </div>
          <form onSubmit={handleJoinRoom} className="grid gap-4">
            <div className="grid gap-2 text-left">
              <Label htmlFor="room-code">Room Code</Label>
              <Input
                id="room-code"
                placeholder="ABCD"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                maxLength={4}
                className="text-center text-lg tracking-[0.5em] font-mono uppercase"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              disabled={isJoining || roomCode.length !== 4}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Room'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
