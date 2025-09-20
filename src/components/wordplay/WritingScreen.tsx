'use client';

import { useWordplay } from '@/contexts/WordplayContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, Loader2, Check } from 'lucide-react';
import { FormEvent, useState, useMemo } from 'react';
import { Progress } from '../ui/progress';

const ROUND_TIME = 40;

export function WritingScreen() {
  const { game, player, submitWord, leaveGame } = useWordplay();
  const [word, setWord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mySentence = useMemo(() => {
    if (!game || !player) return null;
    return game.sentences.find((s) => s.authorId === player.id);
  }, [game, player]);

  const hasSubmitted = useMemo(() => {
    if (!mySentence) return false;
    return mySentence.blanks[0]?.value !== '';
  }, [mySentence]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (word.trim() && !hasSubmitted) {
      setIsSubmitting(true);
      submitWord(word.trim());
    }
  };

  const renderedSentence = useMemo(() => {
    if (!mySentence) return <p>Loading your sentence...</p>;

    const parts = mySentence.template.split('[blank]');
    return (
      <p className="text-2xl md:text-3xl font-semibold leading-relaxed text-center">
        {parts[0]}
        <span className="font-bold text-primary underline decoration-wavy underline-offset-4 px-2">
          {hasSubmitted ? mySentence.blanks[0].value : '______'}
        </span>
        {parts[1]}
      </p>
    );
  }, [mySentence, hasSubmitted]);
  
  if (!game || !player) {
    return <Loader2 className="animate-spin" />;
  }

  const timerPercentage = game.timer > 0 ? (game.timer / ROUND_TIME) * 100 : 0;
  const waitingCount = game.players.length - game.sentences.filter(s => s.isComplete).length;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in-0 zoom-in-95">
      <header className="text-center">
        <p className="text-sm text-muted-foreground">
          Round {game.currentRound} of {game.totalRounds}
        </p>
        <h1 className="text-4xl font-extrabold tracking-tighter mt-2">
          Fill in the Blank!
        </h1>
        <p className="text-muted-foreground mt-1">
          Unleash your creativity. The funnier, the better!
        </p>
      </header>

      <Card className="shadow-lg">
        <CardContent className="p-6 md:p-10 flex flex-col items-center gap-8">
          <div className="min-h-[8rem] flex items-center justify-center">
            {renderedSentence}
          </div>
          
           <div className="w-full max-w-md">
            <div className="flex items-center gap-4 mb-4">
                <Progress value={timerPercentage} className="h-3" />
                <p className="text-3xl font-mono font-bold w-16 text-right">
                    {game.timer}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full">
                <div className="flex w-full items-center space-x-2">
                <Input
                    type="text"
                    placeholder="Enter your word..."
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    disabled={hasSubmitted || isSubmitting}
                    className="text-lg h-12"
                    aria-label="Enter a word to fill the blank"
                />
                <Button
                    type="submit"
                    size="icon"
                    className="h-12 w-12 shrink-0"
                    disabled={hasSubmitted || isSubmitting || !word.trim()}
                >
                    {hasSubmitted ? (
                    <Check className="h-6 w-6" />
                    ) : isSubmitting ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                    <Send className="h-6 w-6" />
                    )}
                </Button>
                </div>
                {hasSubmitted && (
                <p className="mt-4 text-green-500 font-semibold text-center">
                    Your word is in! Waiting for {waitingCount} more player{waitingCount === 1 ? '' : 's'}...
                </p>
                )}
            </form>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button variant="ghost" onClick={leaveGame}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Leave Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
