'use client';

import { ImpostorRiddleProvider, useImpostorRiddle } from '@/contexts/ImpostorRiddleContext';
import { Lobby } from '@/components/impostors-riddle/Lobby';
import { DiscussionScreen } from '@/components/impostors-riddle/DiscussionScreen';
import { RevealScreen } from '@/components/impostors-riddle/RevealScreen';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { JoinScreen } from '@/components/impostors-riddle/JoinScreen';

function ImpostorRiddleView() {
  const { game, player } = useImpostorRiddle();

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-32 w-full max-w-md" />
        <Skeleton className="h-12 w-48" />
        <p className="text-muted-foreground">Finding the impostor...</p>
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
      case 'discussion':
      case 'voting':
        return <DiscussionScreen />;
      case 'reveal':
        return <RevealScreen />;
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

export default function ImpostorRiddlePage() {
  const params = useParams();
  const roomCode = Array.isArray(params.roomCode)
    ? params.roomCode[0]
    : params.roomCode;

  if (!roomCode) {
    return null;
  }

  return (
    <ImpostorRiddleProvider roomCode={roomCode.toUpperCase()}>
      <ImpostorRiddleView />
    </ImpostorRiddleProvider>
  );
}
