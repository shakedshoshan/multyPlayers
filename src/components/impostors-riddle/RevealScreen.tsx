'use client';

import { useImpostorRiddle } from '@/contexts/ImpostorRiddleContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, UserX, Loader2, ArrowLeft } from 'lucide-react';
import { PlayerAvatar } from '../game/PlayerAvatar';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { RiddlePlayer } from '@/lib/types';

export function RevealScreen() {
  const { game, player, playAgain, leaveGame } = useImpostorRiddle();
  const [isStartingNew, setIsStartingNew] = useState(false);

  if (!game || !player) return null;

  const handlePlayAgain = () => {
    setIsStartingNew(true);
    playAgain();
  };

  const impostor = game.players.find(p => p.isImpostor);
  const winnerText = game.winner === 'knowers' ? 'The Knowers Win!' : 'The Impostor Wins!';

  const getVoteTargetName = (votedForId: string | null) => {
    if (!votedForId) return 'No vote';
    const target = game.players.find(p => p.id === votedForId);
    return target ? target.name : 'Unknown';
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 items-center text-center animate-in fade-in-0">
      <div className={cn('flex flex-col items-center gap-2', game.winner === 'knowers' ? 'text-green-400' : 'text-destructive')}>
        {game.winner === 'knowers' ? <Trophy className="h-16 w-16" /> : <UserX className="h-16 w-16" />}
        <h1 className="text-4xl font-extrabold">{winnerText}</h1>
      </div>

      {impostor && (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>The Impostor was {impostor.name}</CardTitle>
                <CardDescription>The secret word was <strong className='text-primary'>{game.secretWord}</strong></CardDescription>
            </CardHeader>
        </Card>
      )}

      <div className="w-full mt-8">
        <h3 className="text-2xl font-bold mb-4">Final Votes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {game.players.map((p: RiddlePlayer) => (
            <Card key={p.id} className="p-4 flex flex-col items-center">
              <PlayerAvatar player={{...p, isBot: false, score: 0}} />
              <p className="font-bold mt-2">{p.name}</p>
              <p className='text-muted-foreground text-sm'>Voted for:</p>
              <p className='font-semibold'>{getVoteTargetName(p.votedFor)}</p>
            </Card>
          ))}
        </div>
      </div>
      
      <div className='flex items-center gap-4 mt-8'>
        {player.isHost && (
            <Button onClick={handlePlayAgain} size="lg" disabled={isStartingNew}>
              {isStartingNew ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Play Again
            </Button>
        )}
         <Button variant="ghost" onClick={leaveGame}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Leave Game
        </Button>
      </div>

    </div>
  );
}
