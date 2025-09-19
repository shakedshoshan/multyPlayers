'use client';
import { useGame } from '@/contexts/GameContext';
import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Player } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const PlayerScore = ({ player, rank }: { player: Player; rank: number }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1',
              player.isHost && 'bg-primary/20'
            )}
          >
            {rank === 0 && <Trophy className="h-4 w-4 text-yellow-400" />}
            <span
              className={cn(
                'font-semibold truncate max-w-20',
                player.isHost && 'text-primary'
              )}
            >
              {player.name}
            </span>
            <span className="font-mono font-bold text-muted-foreground">
              {player.score}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {player.name}: {player.score} points
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function Leaderboard() {
  const { game } = useGame();

  if (!game) return null;

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);

  return (
    <Card className="p-1 md:p-2">
      <div className="flex items-center gap-1 md:gap-2">
        {sortedPlayers.map((player, index) => (
          <PlayerScore key={player.id} player={player} rank={index} />
        ))}
      </div>
    </Card>
  );
}
