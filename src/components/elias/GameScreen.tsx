'use client';

import { useElias } from '@/contexts/EliasContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, Mic, Ear } from 'lucide-react';
import { Progress } from '../ui/progress';
import { PlayerAvatar } from '../game/PlayerAvatar';

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

  const ActivePlayersDisplay = () => {
    if (!clueGiver || !guesser) return null;
    return (
      <div className="flex items-center justify-center gap-8 md:gap-16">
        <div className="flex flex-col items-center gap-2">
            <div className='flex items-center gap-2 text-muted-foreground'>
                <Mic className='h-5 w-5' />
                <span className='font-semibold'>Clue Giver</span>
            </div>
            <PlayerAvatar player={clueGiver} size='lg'/>
            <p className='text-lg font-bold text-primary'>{clueGiver.name}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
            <div className='flex items-center gap-2 text-muted-foreground'>
                <Ear className='h-5 w-5' />
                <span className='font-semibold'>Guesser</span>
            </div>
            <PlayerAvatar player={guesser} size='lg'/>
            <p className='text-lg font-bold text-primary'>{guesser.name}</p>
        </div>
      </div>
    );
  };

  const getScreenContent = () => {
    if (isPlayerClueGiver) {
      return (
        <div className='flex flex-col items-center gap-8'>
          <p className="text-lg text-muted-foreground">Your word is:</p>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight my-4 font-headline">
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
        </div>
      );
    }
    return (
      <div className='flex flex-col items-center gap-4 text-center'>
        <p className="text-xl text-muted-foreground">
            {isPlayerGuesser ? "It's your turn to guess!" : "Observing Round"}
        </p>
         <h2 className="text-2xl font-bold">
            Listen for clues!
        </h2>
      </div>
    );
  };
  
  const timerPercentage = (game.timer / ROUND_TIME) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in-0 zoom-in-95">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
            <div className='flex justify-center gap-8 pt-2'>
                <p className='text-2xl'>Success: <span className='font-bold text-green-500'>{game.roundSuccesses}</span></p>
                <p className='text-2xl'>Fails: <span className='font-bold text-destructive'>{game.roundFails}</span></p>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center gap-8 min-h-[400px]">
          <ActivePlayersDisplay />
          <div className='w-full border-t my-4'></div>
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
