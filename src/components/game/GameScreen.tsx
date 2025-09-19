'use client';

import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Leaderboard } from './Leaderboard';
import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Check, ArrowLeft } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';

const ROUND_TIME = 30;

export function GameScreen() {
  const { game, player, submitAnswer } = useGame();
  const [answer, setAnswer] = useState('');

  if (!game || !player) return null;

  const playerHasAnswered = game.answers && game.answers[player.id];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (answer.trim() && !playerHasAnswered) {
      submitAnswer(answer.trim());
    }
  };

  const timerPercentage = (game.timer / ROUND_TIME) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in-0 zoom-in-95">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <p className="text-sm text-muted-foreground">Round {game.round}</p>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Hive Mind Streak:{' '}
            <span className="text-accent font-black">{game.streak}</span>
          </h2>
        </div>
        <Leaderboard />
      </header>

      <main>
        <Card className="text-center shadow-lg">
          <CardContent className="p-6 md:p-10 pb-4">
            <p className="text-lg text-muted-foreground font-medium">Category</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter mt-2 mb-8 font-headline min-h-[4rem] md:min-h-[6rem] flex items-center justify-center">
              {game.category ? (
                game.category
              ) : (
                <Skeleton className="h-12 w-3/4" />
              )}
            </h1>

            <div className="flex items-center gap-4 mb-8">
              <Progress value={timerPercentage} className="h-3" />
              <p className="text-3xl font-mono font-bold w-16 text-right">
                {game.timer}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex w-full max-w-lg mx-auto items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Your answer..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!!playerHasAnswered || !game.category}
                  className="text-lg h-12"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  disabled={
                    !!playerHasAnswered || !answer.trim() || !game.category
                  }
                >
                  {playerHasAnswered ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Send className="h-6 w-6" />
                  )}
                </Button>
              </div>
              {playerHasAnswered && (
                <p className="mt-4 text-green-400 font-semibold">
                  Your answer is locked in! Waiting for others...
                </p>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Leave Game
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
