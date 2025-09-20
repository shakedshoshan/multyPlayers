'use client';

import { useWordplay } from '@/contexts/WordplayContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { FormEvent, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlayerAvatar } from '../game/PlayerAvatar';

export function WritingScreen() {
  const { game, player, submitWord, leaveGame } = useWordplay();
  const [word, setWord] = useState('');

  const isMyTurn = game?.currentTurnPlayerId === player?.id;

  const currentSentence = useMemo(() => {
    if (!game) return null;
    return game.sentences[game.currentSentenceIndex];
  }, [game]);

  const currentBlank = useMemo(() => {
    if (!currentSentence) return null;
    return currentSentence.blanks[game.currentBlankIndex];
  }, [currentSentence, game?.currentBlankIndex]);

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
    
    let partIndex = 0;
    const parts = currentSentence.template.split(/(\[.*?\])/).filter(Boolean);

    return (
      <p className="text-2xl md:text-3xl font-semibold leading-relaxed text-center">
        {parts.map((part, index) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            const blank = currentSentence.blanks[partIndex];
            const isCurrentBlank = partIndex === game?.currentBlankIndex;
            partIndex++;
            if (blank.value) {
              return <span key={index} className="text-primary font-bold underline decoration-wavy underline-offset-4">{blank.value}</span>
            }
            if (isCurrentBlank) {
               return <span key={index} className="font-bold text-accent animate-pulse">[{blank.type}]</span>
            }
            return <span key={index} className="font-bold text-muted-foreground">[{blank.type}]</span>
          }
          return <span key={index}>{part}</span>
        })}
      </p>
    )
  }, [currentSentence, game?.currentBlankIndex]);

  if (!game || !player || !currentSentence || !currentBlank || !turnPlayer) {
    return <Loader2 className="animate-spin" />;
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in-0 zoom-in-95">
      <header className="text-center">
        <p className="text-sm text-muted-foreground">Round {game.round}</p>
        <div className='flex items-center justify-center gap-2 mt-2'>
           <PlayerAvatar player={{...turnPlayer, score: 0, isBot: false}} size="sm" />
           <p className="text-lg font-bold">
            {isMyTurn ? "Your Turn!" : `${turnPlayer.name}'s Turn`}
            </p>
        </div>
        <p className="text-muted-foreground mt-1">
            Fill in the blank for the <span className='font-bold text-primary'>[{currentBlank.type}]</span>
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
                      placeholder={`Enter a ${currentBlank.type}...`}
                      value={word}
                      onChange={(e) => setWord(e.target.value)}
                      disabled={!isMyTurn}
                      className="text-lg h-12"
                      aria-label={`Enter a ${currentBlank.type}`}
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
