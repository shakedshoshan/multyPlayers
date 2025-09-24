'use client';

import { useElias } from '@/contexts/EliasContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Copy, Loader2, ArrowLeft, Globe, Link2, Trash2 } from 'lucide-react';
import { PlayerAvatar } from '@/components/game/PlayerAvatar';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import type { EliasPlayer } from '@/lib/types';

export function Lobby() {
  const { game, player, startGame, leaveGame, setLanguage, setTargetScore, createPair, removePair } = useElias();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<EliasPlayer | null>(null);

  if (!game || !player) return null;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(game.roomCode);
    toast({
      title: 'Room code copied!',
      description: 'You can now share it with your friends.',
    });
  };

  const handleStartGame = () => {
    setIsStarting(true);
    startGame();
  };

  const handlePlayerClick = (p: EliasPlayer) => {
    if (!player.isHost) return;
    if (selectedPlayer) {
      if (selectedPlayer.id !== p.id) {
        createPair(selectedPlayer.id, p.id);
        setSelectedPlayer(null);
      } else {
        setSelectedPlayer(null); // Deselect if clicking the same player
      }
    } else {
        setSelectedPlayer(p);
    }
  }

  const handleLanguageChange = (lang: string) => {
    if (player.isHost) {
      setLanguage(lang);
    }
  };

  const handleScoreChange = (score: string) => {
    if (player.isHost) {
      setTargetScore(parseInt(score, 10));
    }
  }
  
  const pairedPlayerIds = game.pairs.flatMap(p => [p.player1Id, p.player2Id]);
  const unpairedPlayers = game.players.filter(p => !pairedPlayerIds.includes(p.id));
  const canStart = player.isHost && game.players.length > 1 && unpairedPlayers.length === 0;

  return (
    <Card className="w-full max-w-4xl animate-in fade-in-0 zoom-in-95 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold tracking-tighter">
          Elias Lobby
        </CardTitle>
        <CardDescription>
          Waiting for players. The host pairs players and starts the game.
        </CardDescription>
        <div className="flex items-center justify-center gap-4 pt-4">
          <p className="text-4xl font-mono font-bold tracking-[0.2em] bg-muted px-4 py-2 rounded-md">
            {game.roomCode}
          </p>
          <Button variant="ghost" size="icon" onClick={copyRoomCode}>
            <Copy className="h-6 w-6" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h3 className="font-bold text-lg mb-2">Players</h3>
            {player.isHost && <p className='text-sm text-muted-foreground mb-4'>Click two players to form a pair.</p>}
            <div className="grid grid-cols-2 gap-4">
              {game.players.map((p) => {
                const isPaired = pairedPlayerIds.includes(p.id);
                const isSelected = selectedPlayer?.id === p.id;
                return (
                  <button
                    key={p.id}
                    disabled={!player.isHost || isPaired}
                    onClick={() => !isPaired && handlePlayerClick(p)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 bg-background rounded-lg border text-center transition-all",
                      player.isHost && !isPaired && "cursor-pointer hover:bg-accent",
                      isSelected && "ring-2 ring-primary",
                      isPaired && "opacity-50"
                    )}
                  >
                    <PlayerAvatar player={p} />
                    <span className="font-medium truncate">{p.name}</span>
                  </button>
                )
              })}
            </div>
             <div className="mt-8 text-center">
                {player.isHost && (
                    <Button
                      size="lg"
                      onClick={handleStartGame}
                      disabled={isStarting || !canStart}
                    >
                      {isStarting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Start Game
                    </Button>
                )}
                {!canStart && player.isHost && (
                    <p className="text-muted-foreground mt-2 text-sm">
                        All players must be in a pair to start. You need at least one pair.
                    </p>
                )}
            </div>
          </div>
          <div className="grid gap-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Pairs</h3>
              <div className="grid gap-2">
                {game.pairs.map(pair => {
                    const p1 = game.players.find(p => p.id === pair.player1Id);
                    const p2 = game.players.find(p => p.id === pair.player2Id);
                    if (!p1 || !p2) return null;
                    return (
                        <div key={pair.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                            <div className='flex items-center gap-2'>
                                <PlayerAvatar player={p1} size='sm' />
                                <Link2 className='h-4 w-4 text-muted-foreground' />
                                <PlayerAvatar player={p2} size='sm' />
                                <p className='font-semibold'>{p1?.name} & {p2?.name}</p>
                            </div>
                            {player.isHost && (
                                <Button variant='ghost' size='icon' onClick={() => removePair(pair.id)}><Trash2 className='h-4 w-4 text-destructive'/></Button>
                            )}
                        </div>
                    )
                })}
              </div>
            </div>
             <div className="grid gap-2 text-left">
                <Label htmlFor="language-select">Language</Label>
                <Select
                  value={game.language}
                  onValueChange={handleLanguageChange}
                  disabled={!player.isHost}
                >
                  <SelectTrigger id="language-select" className="w-full">
                    <Globe className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="he">עברית</SelectItem>
                  </SelectContent>
                </Select>
                 {!player.isHost && (
                    <p className="text-xs text-muted-foreground">Only the host can change the language.</p>
                 )}
              </div>
              <div className="grid gap-2 text-left">
              <Label htmlFor="rounds-select">Target Score</Label>
              <Select
                value={String(game.targetScore)}
                onValueChange={handleScoreChange}
                disabled={!player.isHost}
              >
                <SelectTrigger id="rounds-select" className="w-full">
                  <SelectValue placeholder="Select target score" />
                </SelectTrigger>
                <SelectContent>
                  {[30, 40, 50, 60].map(num => (
                    <SelectItem key={num} value={String(num)}>{num} Points</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               {!player.isHost && (
                <p className="text-xs text-muted-foreground">
                  Only the host can set the target score.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="ghost" onClick={leaveGame}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Main Menu
        </Button>
      </CardFooter>
    </Card>
  );
}
