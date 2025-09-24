'use client';

import { useElias } from '@/contexts/EliasContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function GameOverScreen() {
  const { game, player, playAgain, leaveGame } = useElias();
  const [isStartingNew, setIsStartingNew] = useState(false);
  
  if (!game || !player) {
    return <Loader2 className="animate-spin" />;
  }

  const handlePlayAgain = () => {
    setIsStartingNew(true);
    playAgain();
  };

  const sortedPairs = [...game.pairs].sort((a, b) => b.score - a.score);
  const winningPair = sortedPairs.length > 0 ? sortedPairs[0] : null;
  const winnerP1 = game.players.find(p => p.id === winningPair?.player1Id);
  const winnerP2 = game.players.find(p => p.id === winningPair?.player2Id);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 items-center text-center animate-in fade-in-0">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <div className="flex flex-col items-center gap-2 text-yellow-400">
            <Trophy className="h-16 w-16" />
            <CardTitle className="text-4xl font-extrabold">WE HAVE A WINNER!</CardTitle>
          </div>
          {winnerP1 && winnerP2 && (
             <CardDescription className='text-2xl pt-2'>
                Congratulations to <strong className='text-primary'>{winnerP1.name} & {winnerP2.name}</strong>!
             </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <h3 className='text-xl font-bold mb-4'>Final Scores</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rank</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPairs.map((pair, index) => {
                const p1 = game.players.find(p => p.id === pair.player1Id);
                const p2 = game.players.find(p => p.id === pair.player2Id);
                return (
                  <TableRow key={pair.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{p1?.name} & {p2?.name}</TableCell>
                    <TableCell className="text-right font-mono text-lg">{pair.score}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardContent className="flex flex-col items-center justify-center gap-4">
            {player.isHost ? (
                <Button size="lg" onClick={handlePlayAgain} disabled={isStartingNew}>
                    {isStartingNew ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Play Again
                </Button>
            ) : (
                <p className='text-muted-foreground'>The host can start a new game.</p>
            )}
            <Button variant="ghost" onClick={leaveGame}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Leave Game
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
