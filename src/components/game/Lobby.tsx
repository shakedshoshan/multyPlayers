'use client';

import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Copy, Loader2 } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function Lobby() {
  const { game, startGame } = useGame();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  if (!game) return null;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(game.roomCode);
    toast({
      title: 'Room code copied!',
      description: 'You can now share it with your friends.',
    });
  };

  const handleStartGame = () => {
    setIsStarting(true);
    startGame();
  };
  
  const canStart = game.players.length > 1;

  return (
    <Card className="w-full max-w-2xl animate-in fade-in-0 zoom-in-95 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold tracking-tighter">
          Lobby
        </CardTitle>
        <CardDescription>
          Waiting for the host to start the game.
        </CardDescription>
        <div className="flex items-center justify-center gap-4 pt-4">
          <p className="text-4xl font-mono font-bold tracking-[0.2em] bg-muted px-4 py-2 rounded-md">
            {game.roomCode}
          </p>
          <Button variant="ghost" size="icon" onClick={copyRoomCode}>
            <Copy className="h-6 w-6" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {game.players.length} / 4 Players
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {game.players.map((player) => (
            <div
              key={player.id}
              className="flex flex-col items-center gap-2 p-4 bg-background rounded-lg border"
            >
              <PlayerAvatar player={player} />
              <span className="font-medium truncate">{player.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button size="lg" onClick={handleStartGame} disabled={isStarting || !canStart}>
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
              </>
            ) : (
              'Start Game'
            )}
          </Button>
          {!canStart && <p className="text-muted-foreground mt-2 text-sm">You need at least 2 players to start the game.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
