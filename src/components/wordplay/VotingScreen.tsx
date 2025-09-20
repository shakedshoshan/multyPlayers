'use client';

import { useWordplay } from '@/contexts/WordplayContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function VotingScreen() {
  const { game, player, castVote, leaveGame } = useWordplay();

  if (!game || !player) return <Loader2 className="animate-spin" />;

  const playerHasVoted = player.id in game.votes;
  const votedForId = playerHasVoted ? game.votes[player.id] : null;

  const handleVote = (sentenceId: string) => {
    if (!playerHasVoted) {
      castVote(sentenceId);
    }
  };

  const renderedSentence = (sentence: any) => {
    let partIndex = 0;
    const parts = sentence.template.split(/(\[.*?\])/).filter(Boolean);

    return (
      <p className="text-xl md:text-2xl font-semibold leading-relaxed">
        {parts.map((part: string, index: number) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            const blank = sentence.blanks[partIndex];
            partIndex++;
            return <span key={index} className="text-primary font-bold underline decoration-wavy underline-offset-4">{blank.value}</span>
          }
          return <span key={index}>{part}</span>
        })}
      </p>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in-0 zoom-in-95">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tighter">Vote for the Best Sentence!</h1>
        <p className="text-muted-foreground mt-2">Which one made you laugh the most?</p>
      </header>

      <main className="grid md:grid-cols-2 gap-6">
        {game.sentences.map(sentence => (
            <Card key={sentence.id} className={cn("flex flex-col justify-between transition-all", votedForId === sentence.id && "ring-4 ring-primary shadow-lg scale-105")}>
                <CardContent className="p-6">
                    {renderedSentence(sentence)}
                </CardContent>
                <CardFooter>
                    <Button 
                        className="w-full" 
                        onClick={() => handleVote(sentence.id)}
                        disabled={playerHasVoted || sentence.authorId === player.id}
                        variant={votedForId === sentence.id ? 'secondary' : 'default'}
                    >
                       {votedForId === sentence.id ? <><Check className="mr-2"/> Voted</> : 'Vote for this!'}
                    </Button>
                </CardFooter>
            </Card>
        ))}
      </main>

       <footer className="text-center mt-4">
            {playerHasVoted ? (
                <p className="text-green-500 font-semibold">Thanks for voting! Waiting for others...</p>
            ) : (
                 <p className="text-primary font-semibold">You can't vote for your own sentence.</p>
            )}
            <Button variant="ghost" onClick={leaveGame} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Leave Game
            </Button>
        </footer>
    </div>
  );
}
