'use client';

import { useImpostorRiddle } from '@/contexts/ImpostorRiddleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DiscussionScreen() {
  const { game, player } = useImpostorRiddle();

  if (!game || !player) return null;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Discussion Phase</CardTitle>
        </CardHeader>
        <CardContent>
            <p>Category: {game.category}</p>
            {player.isImpostor ? (
                <p>You are the IMPOSTOR!</p>
            ) : (
                <p>Secret Word: {game.secretWord}</p>
            )}
            <p>Time Remaining: {game.timer}</p>
        </CardContent>
      </Card>
    </div>
  );
}
