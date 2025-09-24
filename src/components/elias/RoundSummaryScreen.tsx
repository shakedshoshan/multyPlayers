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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

export function RoundSummaryScreen() {
  const { game, player, startNextRound, leaveGame } = useElias();
  
  if (!game || !player) {
    return <Loader2 className="animate-spin" />;
  }

  const sortedPairs = [...game.pairs].sort((a, b) => b.score - a.score);
  const nextPairIndex = (game.currentPairIndex + 1) % game.pairs.length;
  const nextPair = game.pairs[nextPairIndex];
  const nextPairP1 = game.players.find(p => p.id === nextPair?.player1Id);
  const nextPairP2 = game.players.find(p => p.id === nextPair?.player2Id);


  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 items-center text-center animate-in fade-in-0">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold">Round Over!</CardTitle>
          <CardDescription>Here are the current scores.</CardDescription>
        </CardHeader>
        <CardContent>
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
          
          <div className='mt-8'>
            <p className='text-lg'>Next up: <strong className='text-primary'>{nextPairP1?.name} & {nextPairP2?.name}</strong></p>
          </div>

        </CardContent>
        <CardFooter className="flex-col gap-4">
            {player.isHost ? (
                <Button size="lg" onClick={startNextRound}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Start Next Round
                </Button>
            ) : (
                <p className='text-muted-foreground'>Waiting for host to start the next round...</p>
            )}
            <Button variant="ghost" onClick={leaveGame}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Leave Game
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
