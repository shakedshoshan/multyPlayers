'use client';

import { GameProvider, useGame } from '@/contexts/GameContext';
import { Lobby } from '@/components/game/Lobby';
import { GameScreen } from '@/components/game/GameScreen';
import { ResultsScreen } from '@/components/game/ResultsScreen';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

function GameView() {
  const { game } = useGame();

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-32 w-full max-w-md" />
        <Skeleton className="h-12 w-48" />
        <p className="text-muted-foreground">Syncing with the hive...</p>
      </div>
    );
  }

  const renderGameState = () => {
    switch (game.gameState) {
      case 'lobby':
        return <Lobby />;
      case 'playing':
        return <GameScreen />;
      case 'revealing':
      case 'results':
        return <ResultsScreen />;
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

export default function GamePage() {
  const params = useParams();
  const roomCode = Array.isArray(params.roomCode)
    ? params.roomCode[0]
    : params.roomCode;

  if (!roomCode) {
    return null; 
  }

  return (
    <GameProvider roomCode={roomCode.toUpperCase()}>
      <GameView />
    </GameProvider>
  );
}
