'use client';

import { useWordplay } from '@/contexts/WordplayContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, Trophy, Award } from 'lucide-react';
import { PlayerAvatar } from '../game/PlayerAvatar';
import { useRouter } from 'next/navigation';

export function GameOverScreen() {
  const { game, leaveGame } = useWordplay();
  const router = useRouter();

  if (!game) {
    return <Loader2 className="animate-spin" />;
  }

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const overallWinner = sortedPlayers[0];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 items-center text-center animate-in fade-in-0">
      <div className="flex flex-col items-center gap-2 text-primary">
        <Award className="h-20 w-20" />
        <h1 className="text-5xl font-extrabold">GAME OVER</h1>
        {overallWinner && (
          <p className="text-2xl text-foreground mt-2">
            <strong className="text-primary">{overallWinner.name}</strong> is the Wordplay Champion!
          </p>
        )}
      </div>

      <h2 className="text-2xl font-bold mt-8">Final Scores</h2>
      <div className="w-full mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {sortedPlayers.map((p, index) => (
          <Card key={p.id} className="p-4 flex flex-col items-center relative">
            {index === 0 && (
              <Trophy className="absolute -top-3 -right-3 h-8 w-8 text-yellow-400" />
            )}
            <PlayerAvatar player={{ ...p, isBot: false }} />
            <p className="font-bold mt-2">{p.name}</p>
            <p className="font-mono text-2xl font-bold">{p.score}</p>
            <p className="text-sm text-muted-foreground">Points</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-8">
        <Button onClick={() => router.push('/wordplay')} size="lg">
          Play Again
        </Button>
        <Button variant="ghost" onClick={leaveGame}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Main Menu
        </Button>
      </div>
    </div>
  );
}
