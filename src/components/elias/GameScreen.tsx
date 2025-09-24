'use client';

import { useElias } from '@/contexts/EliasContext';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, Mic, Ear, User } from 'lucide-react';
import { Progress } from '../ui/progress';
import { PlayerAvatar } from '../game/PlayerAvatar';
import type { EliasPlayer } from '@/lib/types';

const ROUND_TIME = 60;

const ActivePlayerCard = ({
  player,
  role,
}: {
  player: EliasPlayer;
  role: 'Clue Giver' | 'Guesser';
}) => {
  const RoleIcon = role === 'Clue Giver' ? Mic : Ear;

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border p-4 bg-muted/50 w-full">
      <div className="flex items-center gap-2 text-muted-foreground self-start">
        <RoleIcon className="h-4 w-4" />
        <span className="font-semibold text-sm">{role}</span>
      </div>
      <PlayerAvatar player={player} size="lg" />
      <p className="text-lg font-bold text-primary truncate max-w-full">
        {player.name}
      </p>
    </div>
  );
};

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
        <p className="text-xl text-muted-foreground">Listen for clues!</p>
      </div>
    );
  };

  const timerPercentage = (game.timer / ROUND_TIME) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in-0 zoom-in-95">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center mb-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-2xl">Score</p>
              <p className="text-5xl font-bold text-green-500">
                {game.roundSuccesses}
              </p>
              <p className="text-sm text-muted-foreground">Correct Guesses</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-2xl">Time</p>
              <p className="text-5xl font-mono font-bold">{game.timer}</p>
              <Progress value={timerPercentage} className="h-3 w-full mt-2" />
            </div>
            <div className="flex flex-col items-center gap-2 p-2 border rounded-lg bg-background col-span-2 md:col-span-1">
                <div className='flex items-center gap-2 self-start text-muted-foreground'>
                   <User className='h-4 w-4' />
                   <span className='font-semibold text-sm'>You</span>
                </div>
                <PlayerAvatar player={player} />
                <p className="font-semibold">{player.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {clueGiver && (
              <ActivePlayerCard player={clueGiver} role="Clue Giver" />
            )}
            {guesser && <ActivePlayerCard player={guesser} role="Guesser" />}
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center gap-8 min-h-[300px]">
          {getScreenContent()}
        </CardContent>
        <CardFooter className="flex flex-col justify-center pb-6 gap-4"></CardFooter>
      </Card>
    </div>
  );
}
