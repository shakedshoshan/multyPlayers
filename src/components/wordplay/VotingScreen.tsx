'use client';

import { useWordplay } from '@/contexts/WordplayContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Sentence } from '@/lib/types';
import { PlayerAvatar } from '../game/PlayerAvatar';

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

  const RenderedSentence = ({ sentence }: { sentence: Sentence }) => {
    const author = game.players.find((p) => p.id === sentence.authorId);
    const parts = sentence.template.split('[blank]');

    return (
      <div className="flex flex-col h-full">
        <CardContent className="p-6 flex-grow">
          <p className="text-xl md:text-2xl font-semibold leading-relaxed">
            {parts[0]}
            <span className="text-primary font-bold underline decoration-wavy underline-offset-4">
              {sentence.blanks[0].value}
            </span>
            {parts[1]}
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-4">
           <div className='flex items-center gap-2 text-sm text-muted-foreground'>
             <p>by</p>
             {author && <PlayerAvatar player={author} size="sm" />}
             <p className='font-semibold'>{author?.name}</p>
           </div>
          <Button
            className="w-full mt-2"
            onClick={() => handleVote(sentence.id)}
            disabled={playerHasVoted || sentence.authorId === player.id}
            variant={votedForId === sentence.id ? 'secondary' : 'default'}
          >
            {votedForId === sentence.id ? (
              <>
                <Check className="mr-2" /> Voted
              </>
            ) : (
              'Vote for this!'
            )}
          </Button>
        </CardFooter>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in-0 zoom-in-95">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tighter">
          Vote for the Best Sentence!
        </h1>
        <p className="text-muted-foreground mt-2">
          Which one made you laugh the most? You can't vote for your own.
        </p>
      </header>

      <main className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {game.sentences.map((sentence) => (
          <Card
            key={sentence.id}
            className={cn(
              'flex flex-col justify-between transition-all',
              votedForId === sentence.id &&
                'ring-4 ring-primary shadow-lg scale-105'
            )}
          >
            <RenderedSentence sentence={sentence} />
          </Card>
        ))}
      </main>

      <footer className="text-center mt-4">
        {playerHasVoted && (
          <p className="text-green-500 font-semibold">
            Thanks for voting! Waiting for others...
          </p>
        )}
        <Button variant="ghost" onClick={leaveGame} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Leave Game
        </Button>
      </footer>
    </div>
  );
}
