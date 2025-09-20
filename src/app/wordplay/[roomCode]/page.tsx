'use client';

import { useParams } from 'next/navigation';
import { WordplayProvider, useWordplay } from '@/contexts/WordplayContext';
import { Skeleton } from '@/components/ui/skeleton';
import { JoinScreen } from '@/components/wordplay/JoinScreen';
import { Lobby } from '@/components/wordplay/Lobby';
import { WritingScreen } from '@/components/wordplay/WritingScreen';
import { VotingScreen } from '@/components/wordplay/VotingScreen';
import { ResultsScreen } from '@/components/wordplay/ResultsScreen';
import { GameOverScreen } from '@/components/wordplay/GameOverScreen';

function WordplayView() {
  const { game, player } = useWordplay();

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-32 w-full max-w-md" />
        <Skeleton className="h-12 w-48" />
        <p className="text-muted-foreground">Loading the word factory...</p>
      </div>
    );
  }

  if (!player) {
    return <JoinScreen />;
  }

  const renderGameState = () => {
    switch (game.gameState) {
      case 'lobby':
        return <Lobby />;
      case 'writing':
        return <WritingScreen />;
      case 'voting':
        return <VotingScreen />;
      case 'results':
        return <ResultsScreen />;
      case 'gameOver':
        return <GameOverScreen />;
      default:
        return <Lobby />;
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 md:p-8">
      {renderGameState()}
    </main>
  );
}

export default function WordplayGamePage() {
  const params = useParams();
  const roomCode = Array.isArray(params.roomCode)
    ? params.roomCode[0]
    : params.roomCode;

  if (!roomCode) {
    return null;
  }

  return (
    <WordplayProvider roomCode={roomCode.toUpperCase()}>
      <WordplayView />
    </WordplayProvider>
  );
}
