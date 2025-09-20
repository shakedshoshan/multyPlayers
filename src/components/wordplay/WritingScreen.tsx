'use client';

import { useWordplay } from '@/contexts/WordplayContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { FormEvent, useState, useMemo } from 'react';
import { PlayerAvatar } from '../game/PlayerAvatar';

export function WritingScreen() {
  const { game, player, submitWord, leaveGame } = useWordplay();
  const [word, setWord] = useState('');

  const isMyTurn = game?.currentTurnPlayerId === player?.id;

  const currentSentence = useMemo(() => {
    if (!game) return null;
    return game.sentences.find(s => s.authorId === game.currentTurnPlayerId);
  }, [game]);

  const turnPlayer = useMemo(() => {
    if (!game) return null;
    return game.players.find(p => p.id === game.currentTurnPlayerId);
  }, [game]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (word.trim() && isMyTurn) {
      submitWord(word.trim());
      setWord('');
    }
  };
  
  const renderedSentence = useMemo(() => {
    if (!currentSentence) return <p>Loading sentence...</p>;
    
    const parts = currentSentence.template.split(/(\[blank\])/g).filter(Boolean);

    return (
      <p className="text-2xl md:text-3xl font-semibold leading-relaxed text-center">
        {parts.map((part, index) => {
          if (part === '[blank]') {
             if (isMyTurn) {
                return <span key={index} className="font-bold text-primary underline decoration-wavy underline-offset-4 animate-pulse">______</span>
             }
             return <span key={index} className="font-bold text-muted-foreground">______</span>
          }
          return <span key={index}>{part}</span>
        })}
      </p>
    )
  }, [currentSentence, isMyTurn]);

  if (!game || !player || !currentSentence || !turnPlayer) {
    return <Loader2 className="animate-spin" />;
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in-0 zoom-in-95">
      <header className="text-center">
        <p className="text-sm text-muted-foreground">Round {game.currentRound} of {game.totalRounds}</p>
        <div className='flex items-center justify-center gap-2 mt-2'>
           <PlayerAvatar player={{...turnPlayer, score: 0, isBot: false}} size="sm" />
           <p className="text-lg font-bold">
            {isMyTurn ? "Your Turn!" : `${turnPlayer.name}'s Turn`}
            </p>
        </div>
        <p className="text-muted-foreground mt-1">
            Fill in the blank!
        </p>
      </header>

      <Card className="shadow-lg">
        <CardContent className="p-6 md:p-10 flex flex-col items-center gap-8">
            <div className="min-h-[8rem] flex items-center justify-center">
                {renderedSentence}
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-md">
                <div className="flex w-full items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="Enter a word..."
                      value={word}
                      onChange={(e) => setWord(e.target.value)}
                      disabled={!isMyTurn}
                      className="text-lg h-12"
                      aria-label="Enter a word to fill the blank"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-12 w-12 shrink-0"
                      disabled={!isMyTurn || !word.trim()}
                    >
                      <Send className="h-6 w-6" />
                    </Button>
              </div>
               {!isMyTurn && (
                <p className="mt-4 text-primary font-semibold text-center">
                  Waiting for {turnPlayer.name} to submit a word...
                </p>
              )}
            </form>
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
