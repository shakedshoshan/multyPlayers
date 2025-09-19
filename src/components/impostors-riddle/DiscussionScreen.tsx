'use client';

import { useImpostorRiddle } from '@/contexts/ImpostorRiddleContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerAvatar } from '../game/PlayerAvatar';
import { Button } from '../ui/button';
import { Check, Hourglass, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function DiscussionScreen() {
  const { game, player, castVote } = useImpostorRiddle();

  if (!game || !player) return null;

  const handleVote = (votedPlayerId: string) => {
    castVote(votedPlayerId);
  };

  const minutes = Math.floor(game.timer / 60);
  const seconds = game.timer % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const playerHasVoted = !!player.votedFor;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in-0 zoom-in-95">
      <Card className="text-center shadow-lg">
        <CardHeader>
          <p className="text-muted-foreground">Category</p>
          <CardTitle className="text-4xl md:text-6xl font-extrabold tracking-tighter font-headline">
            {game.category}
          </CardTitle>
          <div className='flex items-center justify-center gap-2 pt-2'>
            <Hourglass className="h-6 w-6" />
            <p className="text-3xl font-mono font-bold">
                {formattedTime}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {player.isImpostor ? (
            <Alert variant="destructive" className="max-w-md mx-auto">
                <Info className="h-4 w-4" />
                <AlertTitle>You are the Impostor!</AlertTitle>
                <AlertDescription>
                    Blend in, ask vague questions, and don't get caught.
                </AlertDescription>
            </Alert>
          ) : (
             <Alert className="max-w-md mx-auto">
                <Info className="h-4 w-4" />
                <AlertTitle>You are a Knower!</AlertTitle>
                <AlertDescription>
                    Your secret word is: <strong className="font-bold text-primary">{game.secretWord}</strong>. Find the impostor.
                </AlertDescription>
            </Alert>
          )}

           <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Players</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {game.players.map(p => (
                    <Card key={p.id} className={cn("flex flex-col items-center justify-between p-4", player.votedFor === p.id && "ring-2 ring-primary")}>
                        <PlayerAvatar player={{...p, isBot: false, score: 0}} />
                        <p className="font-bold mt-2 truncate">{p.name}</p>
                        <div className="h-10 mt-2">
                           {player.id !== p.id && (
                             <Button 
                                onClick={() => handleVote(p.id)}
                                disabled={playerHasVoted || game.gameState === 'discussion'}
                                size="sm"
                             >
                                {player.votedFor === p.id ? <Check className='h-4 w-4' /> : "Vote"}
                             </Button>
                           )}
                        </div>
                    </Card>
                ))}
             </div>
           </div>
        </CardContent>
        <CardFooter className='flex-col gap-2'>
            {game.gameState === 'discussion' && <p className="text-muted-foreground">Discussion phase is active. Voting will begin soon.</p>}
            {game.gameState === 'voting' && !playerHasVoted && <p className="text-primary font-semibold">It's time to vote! Who is the impostor?</p>}
            {playerHasVoted && <p className="text-green-500 font-semibold">You have voted! Waiting for other players.</p>}
        </CardFooter>
      </Card>
    </div>
  );
}
