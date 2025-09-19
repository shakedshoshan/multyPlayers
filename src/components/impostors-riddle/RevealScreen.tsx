'use client';

import { useImpostorRiddle } from '@/contexts/ImpostorRiddleContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RevealScreen() {
  const { game, player, playAgain } = useImpostorRiddle();

  if (!game || !player) return null;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 items-center">
        <Card>
            <CardHeader>
                <CardTitle>Game Over!</CardTitle>
            </CardHeader>
            <CardContent>
                <p>The winner is: {game.winner}</p>
                {player.isHost && <Button onClick={playAgain}>Play Again</Button>}
            </CardContent>
        </Card>
    </div>
  );
}
