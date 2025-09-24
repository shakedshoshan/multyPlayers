'use client';
import type { Player, RiddlePlayer, WordplayPlayer, EliasPlayer } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerAvatarProps {
  player: Player | RiddlePlayer | WordplayPlayer | EliasPlayer;
  size?: 'sm' | 'md' | 'lg';
}

export function PlayerAvatar({ player, size = 'md' }: PlayerAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  const isPlayerType = (p: any): p is Player => 'isBot' in p;

  return (
    <div className="relative">
      <Avatar
        className={cn(
          size === 'sm' && 'h-10 w-10',
          size === 'md' && 'h-16 w-16',
          size === 'lg' && 'h-24 w-24'
        )}
      >
        <AvatarImage src={player.avatarUrl} alt={player.name} />
        <AvatarFallback
          className={cn(
            'text-xl font-bold',
            size === 'lg' && 'text-3xl',
            isPlayerType(player) && player.isBot && 'bg-muted-foreground/20'
          )}
        >
          {isPlayerType(player) && player.isBot ? (
            <Bot className="h-2/3 w-2/3" />
          ) : (
            getInitials(player.name)
          )}
        </AvatarFallback>
      </Avatar>
      {player.isHost && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 p-1 rounded-full border-2 border-background">
          <Crown className="h-4 w-4 text-yellow-900" />
        </div>
      )}
    </div>
  );
}
