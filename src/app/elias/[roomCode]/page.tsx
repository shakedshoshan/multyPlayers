'use client';

import { useParams } from 'next/navigation';
import { EliasProvider, useElias } from '@/contexts/EliasContext';
import { Skeleton } from '@/components/ui/skeleton';
import { JoinScreen } from '@/components/elias/JoinScreen';
import { Lobby } from '@/components/elias/Lobby';
import { GameScreen } from '@/components/elias/GameScreen';
import { RoundSummaryScreen } from '@/components/elias/RoundSummaryScreen';
import { GameOverScreen } from '@/components/elias/GameOverScreen';

function EliasView() {
  const { game, player } = useElias();

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-32 w-full max-w-md" />
        <Skeleton className="h-12 w-48" />
        <p className="text-muted-foreground">Loading the fun...</p>
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
      case 'playing':
        return <GameScreen />;
      case 'summary':
        return <RoundSummaryScreen />;
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

export default function EliasGamePage() {
  const params = useParams();
  const roomCode = Array.isArray(params.roomCode)
    ? params.roomCode[0]
    : params.roomCode;

  if (!roomCode) {
    return null;
  }

  return (
    <EliasProvider roomCode={roomCode.toUpperCase()}>
      <EliasView />
    </EliasProvider>
  );
}
