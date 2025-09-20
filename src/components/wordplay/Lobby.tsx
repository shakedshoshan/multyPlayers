'use client';

import { useWordplay } from '@/contexts/WordplayContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Copy, Loader2, ArrowLeft, Globe } from 'lucide-react';
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

export function Lobby() {
  const { game, player, startGame, leaveGame, setLanguage } = useWordplay();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

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

  const handleLanguageChange = (lang: string) => {
    if (player.isHost) {
      setLanguage(lang);
    }
  };

  const canStart = player.isHost && game.players.length >= 2;

  return (
    <Card className="w-full max-w-2xl animate-in fade-in-0 zoom-in-95 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold tracking-tighter">
          Wordplay Lobby
        </CardTitle>
        <CardDescription>
          Waiting for players to join. The host will start the game.
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
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Users className="h-5 w-5" />
              <h3 className="text-lg font-semibold">
                {game.players.length} / 8 Players
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 min-h-[10rem]">
              {game.players.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col items-center gap-2 p-4 bg-background rounded-lg border"
                >
                  <PlayerAvatar player={{ ...p, isBot: false, score: 0 }} />
                  <span className="font-medium truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
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
                <p className="text-xs text-muted-foreground">
                  Only the host can change the language.
                </p>
              )}
            </div>
          </div>
        </div>

        {player.isHost && (
          <div className="mt-8 text-center">
            <Button
              size="lg"
              onClick={handleStartGame}
              disabled={isStarting || !canStart}
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
                </>
              ) : (
                'Start Game'
              )}
            </Button>
            {!canStart && (
              <p className="text-muted-foreground mt-2 text-sm">
                You need at least 2 players to start the game.
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="ghost" onClick={leaveGame}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </CardFooter>
    </Card>
  );
}
