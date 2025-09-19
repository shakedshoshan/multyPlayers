'use client';

import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  RefreshCw,
  XCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import type { Player } from '@/lib/types';
import { PlayerAvatar } from './PlayerAvatar';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function AnswerCard({
  player,
  answer,
  isRevealed,
}: {
  player: Player;
  answer: string;
  isRevealed: boolean;
}) {
  return (
    <div
      className={cn(
        'relative transition-transform duration-700 [transform-style:preserve-3d]',
        isRevealed ? '[transform:rotateY(0deg)]' : '[transform:rotateY(180deg)]'
      )}
    >
      {/* Card Back - initially visible */}
      <div className="absolute inset-0 flex h-40 w-full items-center justify-center rounded-lg bg-primary [backface-visibility:hidden]">
        <PlayerAvatar player={player} />
      </div>
      {/* Card Front - initially hidden */}
      <div className="flex h-40 w-full flex-col items-center justify-center rounded-lg border bg-card p-2 [transform:rotateY(180deg)] [backface-visibility:hidden]">
        <p className="text-sm text-muted-foreground">{player.name}</p>
        <p className="break-all p-2 text-center text-xl font-bold md:text-2xl">
          {answer}
        </p>
      </div>
    </div>
  );
}

export function ResultsScreen() {
  const { game, player, nextRound, leaveGame } = useGame();
  const [revealed, setRevealed] = useState<string[]>([]);
  const [isStartingNext, setIsStartingNext] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Start revealing cards when the state is 'revealing'
    if (
      game?.gameState === 'revealing' &&
      game.players.length > revealed.length
    ) {
      const revealInterval = setInterval(() => {
        setRevealed((r) => {
          const nextIndex = r.length;
          if (nextIndex < game.players.length) {
            return [...r, game.players[nextIndex].id];
          }
          clearInterval(revealInterval);
          return r;
        });
      }, 500);
      return () => clearInterval(revealInterval);
    }
  }, [game?.gameState, game?.players, revealed.length]);

  useEffect(() => {
    // When all cards are revealed and we are in the 'results' state, show the final result
    if (game?.gameState === 'results' && !showResults) {
      const timer = setTimeout(() => {
        setShowResults(true);
      }, 250); // Short delay after last card flips to show result
      return () => clearTimeout(timer);
    }
    // Reset for next round
    if (game?.gameState !== 'results' && game?.gameState !== 'revealing') {
        setRevealed([]);
        setShowResults(false);
    }
  }, [game?.gameState, showResults]);

  if (!game || !player) return null;

  const handleNextRound = () => {
    setIsStartingNext(true);
    nextRound();
  };

  const { gameState, lastRoundSuccess, streak, players, answers } = game;
  const isFinished = gameState === 'results';

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 items-center text-center animate-in fade-in-0">
      <div
        className={cn(
          'transition-all duration-700 ease-in-out',
          showResults ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        )}
      >
        {lastRoundSuccess ? (
          <div className="flex flex-col items-center gap-2 text-green-400">
            <CheckCircle2 className="h-16 w-16" />
            <h1 className="text-4xl font-extrabold">SUCCESS!</h1>
            <p className="text-xl text-foreground">
              You're on the same wavelength!
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-destructive">
            <XCircle className="h-16 w-16" />
            <h1 className="text-4xl font-extrabold">FAILURE!</h1>
            <p className="text-xl text-foreground">
              The hive mind is fractured.
            </p>
          </div>
        )}
        <h2 className="text-2xl md:text-3xl font-bold text-primary mt-4">
          Hive Mind Streak:{' '}
          <span className="text-accent font-black">{streak}</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-8">
        {players.map((p) => (
          <div key={p.id} className="[perspective:1000px]">
            <AnswerCard
              player={p}
              answer={answers[p.id] || '...'}
              isRevealed={revealed.includes(p.id)}
            />
          </div>
        ))}
      </div>

      {isFinished && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-5 delay-500 duration-500 fill-mode-both flex items-center gap-4">
          {player.isHost && (
            <Button
              size="lg"
              onClick={handleNextRound}
              disabled={isStartingNext}
            >
              {isStartingNext ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-5 w-5" />
              )}
              Next Round
            </Button>
          )}
           <Button variant="ghost" onClick={leaveGame}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Leave Game
            </Button>
        </div>
      )}
    </div>
  );
}
