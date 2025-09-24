'use client';

import { useElias } from '@/contexts/EliasContext';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import { Progress } from '../ui/progress';

const ROUND_TIME = 60;

export function GameScreen() {
  const { game, player, markWord } = useElias();

  if (!game || !player || game.gameState !== 'playing') {
    return <Loader2 className="animate-spin" />;
  }

  const currentPair = game.pairs.find((p) => p.id === game.currentPairId);
  const clueGiver = game.players.find((p) => p.id === currentPair?.clueGiverId);
  const guesser = game.players.find((p) => p.id === currentPair?.guesserId);

  const isPlayerClueGiver = player.id === clueGiver?.id;

  const getScreenContent = () => {
    if (isPlayerClueGiver) {
      const currentWord = game.words[game.currentWordIndex];
      return (
        <div className="flex flex-col items-center gap-8">
          <p className="text-lg text-muted-foreground">Your word is:</p>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight my-4 font-headline text-center">
            {currentWord}
          </h1>
          <div className="flex w-full justify-center gap-4">
            <Button
              size="lg"
              variant="destructive"
              onClick={() => markWord(false)}
              className="w-32 h-16 text-xl"
            >
              <X className="mr-2 h-8 w-8" /> Skip
            </Button>
            <Button
              size="lg"
              variant="default"
              onClick={() => markWord(true)}
              className="w-32 h-16 text-xl bg-green-500 hover:bg-green-600"
            >
              <Check className="mr-2 h-8 w-8" /> Correct
            </Button>
          </div>
        </div>
      );
    }

    // Guesser and Observer view
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-bold">
          {player.id === guesser?.id
            ? "It's your turn to guess!"
            : 'Observing Round'}
        </h2>
        <p className="text-xl text-muted-foreground">Listen for clues from {clueGiver?.name}!</p>
      </div>
    );
  };

  const timerPercentage = (game.timer / ROUND_TIME) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in-0 zoom-in-95">
      <Card className="shadow-lg">
        <CardHeader className='pb-2'>
            <div className="grid grid-cols-2 gap-4 items-center mb-4">
                <div className="flex flex-col items-center gap-1">
                    <p className="text-2xl">Score</p>
                    <p className="text-5xl font-bold text-green-500">
                        {game.roundSuccesses}
                    </p>
                    <p className='text-sm text-muted-foreground'>Correct / <span className='text-destructive'>{game.roundFails} Skipped</span></p>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-2xl">Time</p>
                    <p className="text-5xl font-mono font-bold">{game.timer}</p>
                     <Progress value={timerPercentage} className="h-3 w-full mt-2" />
                </div>
            </div>
             <div className="text-center border-t pt-4">
                <p className="text-lg">
                    <span className="font-bold text-primary">{clueGiver?.name}</span> is giving clues to <span className="font-bold text-primary">{guesser?.name}</span>.
                </p>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center gap-8 min-h-[300px]">
          {getScreenContent()}
        </CardContent>
        <CardFooter>
            <p className='text-sm text-muted-foreground mx-auto'>Player: {player.name}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
