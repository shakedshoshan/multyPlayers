'use client';

import { useWordplay } from '@/contexts/WordplayContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { PlayerAvatar } from '../game/PlayerAvatar';

export function ResultsScreen() {
  const { game, player, nextRound, leaveGame } = useWordplay();

  if (!game || !game.lastRoundWinner) {
    return <Loader2 className="animate-spin" />;
  }

  const winner = game.lastRoundWinner;
  const isGameOver = game.currentRound >= game.totalRounds;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 items-center text-center animate-in fade-in-0">
       <div className='flex flex-col items-center gap-2 text-yellow-400'>
          <Trophy className="h-16 w-16" />
          <h1 className="text-4xl font-extrabold">{winner.name} Wins the Round!</h1>
          <p className="text-xl text-foreground">
            They now have {winner.score} points!
          </p>
       </div>

      <div className="w-full mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {game.players.map(p => (
            <Card key={p.id} className="p-4 flex flex-col items-center">
                 <PlayerAvatar player={p} />
                 <p className="font-bold mt-2">{p.name}</p>
                 <p className="font-mono text-xl">{p.score}</p>
                 <p className="text-sm text-muted-foreground">Points</p>
            </Card>
        ))}
      </div>
      
      <div className='flex items-center gap-4 mt-8'>
        {player.isHost && (
            <Button onClick={nextRound} size="lg">
              {isGameOver ? 'View Final Results' : 'Next Round'}
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
