'use client';

import { useImpostorRiddle } from '@/contexts/ImpostorRiddleContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerAvatar } from '../game/PlayerAvatar';
import { Button } from '../ui/button';
import { Check, Hourglass, Info, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function DiscussionScreen() {
  const { game, player, castVote, leaveGame } = useImpostorRiddle();

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
                    Blend in, discuss the category, and don't get caught.
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
                {game.players.map(p => {
                  const isVotedPlayer = player.votedFor === p.id;
                  return (
                    <Card key={p.id} className={cn(
                        "flex flex-col items-center justify-between p-4 transition-all", 
                        isVotedPlayer && "ring-4 ring-primary shadow-lg scale-105",
                        playerHasVoted && !isVotedPlayer && "opacity-60"
                      )}>
                        <PlayerAvatar player={{...p, isBot: false, score: 0}} />
                        <p className="font-bold mt-2 truncate">{p.name}</p>
                        <div className="h-10 mt-2 flex items-center">
                           {player.id !== p.id && (
                             <Button 
                                onClick={() => handleVote(p.id)}
                                disabled={playerHasVoted}
                                variant={isVotedPlayer ? 'secondary' : 'default'}
                                size="sm"
                             >
                                {isVotedPlayer ? (
                                  <>
                                    <Check className='h-4 w-4 mr-2' /> Voted
                                  </>
                                ) : "Vote"}
                             </Button>
                           )}
                           {player.id === p.id && <div className="h-9"></div>}
                           
                        </div>
                    </Card>
                )})}
             </div>
           </div>
        </CardContent>
        <CardFooter className='flex-col gap-4'>
            {!playerHasVoted && <p className="text-primary font-semibold">Discuss and cast your vote for the impostor!</p>}
            {playerHasVoted && <p className="text-green-500 font-semibold">You have voted! Waiting for other players.</p>}
             <Button variant="ghost" onClick={leaveGame} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Leave Game
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
