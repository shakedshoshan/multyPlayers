'use client';

import { useElias } from '@/contexts/EliasContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import { Progress } from '../ui/progress';

const ROUND_TIME = 60;

export function GameScreen() {
  const { game, player, markWord } = useElias();

  if (!game || !player || game.gameState !== 'playing') {
    return <Loader2 className="animate-spin" />;
  }

  const currentPair = game.pairs.find(p => p.id === game.currentPairId);
  const clueGiver = game.players.find(p => p.id === currentPair?.clueGiverId);
  const guesser = game.players.find(p => p.id === currentPair?.guesserId);
  const currentWord = game.words[game.currentWordIndex];

  const isPlayerClueGiver = player.id === clueGiver?.id;
  const isPlayerGuesser = player.id === guesser?.id;
  const isObserver = !isPlayerClueGiver && !isPlayerGuesser;

  const timerPercentage = (game.timer / ROUND_TIME) * 100;

  const getScreenContent = () => {
    if (isPlayerClueGiver) {
      return (
        <>
          <p className="text-lg text-muted-foreground">Your word is:</p>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight my-8 font-headline">
            {currentWord}
          </h1>
          <div className="flex w-full justify-center gap-4">
            <Button
              size="lg"
              variant="destructive"
              onClick={() => markWord(false)}
              className="w-32 h-16 text-xl"
            >
              <X className="mr-2 h-8 w-8" /> Fail
            </Button>
            <Button
              size="lg"
              variant="default"
              onClick={() => markWord(true)}
              className="w-32 h-16 text-xl bg-green-500 hover:bg-green-600"
            >
              <Check className="mr-2 h-8 w-8" /> Pass
            </Button>
          </div>
        </>
      );
    }

    if (isPlayerGuesser) {
      return (
        <>
          <p className="text-lg text-muted-foreground">It's your turn to guess!</p>
          <h1 className="text-3xl font-bold mt-4">
            Your partner <strong className='text-primary'>{clueGiver?.name}</strong> is giving you clues.
          </h1>
        </>
      );
    }
    
    return (
        <>
          <p className="text-lg text-muted-foreground">Observing Round</p>
          <h1 className="text-3xl font-bold mt-4">
            <strong className='text-primary'>{clueGiver?.name}</strong> is giving clues to <strong className='text-primary'>{guesser?.name}</strong>.
          </h1>
        </>
    )
  };


  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in-0 zoom-in-95">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
            <CardTitle className='text-2xl'>
                Turn: <span className='text-primary'>{clueGiver?.name} & {guesser?.name}</span>
            </CardTitle>
            <div className='flex justify-center gap-8 pt-2'>
                <p className='text-xl'>Success: <span className='font-bold text-green-500'>{game.roundSuccesses}</span></p>
                <p className='text-xl'>Fails: <span className='font-bold text-destructive'>{game.roundFails}</span></p>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center gap-8 min-h-[300px]">
          {getScreenContent()}
        </CardContent>
        <CardFooter className="flex flex-col justify-center pb-6 gap-4">
            <div className="w-full max-w-md">
                <div className="flex items-center gap-4">
                    <Progress value={timerPercentage} className="h-3" />
                    <p className="text-3xl font-mono font-bold w-16 text-right">
                        {game.timer}
                    </p>
                </div>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
