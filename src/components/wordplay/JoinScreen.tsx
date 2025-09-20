'use client';

import { useState } from 'react';
import { useWordplay } from '@/contexts/WordplayContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function JoinScreen() {
  const { joinGame } = useWordplay();
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setIsJoining(true);
      joinGame(name.trim());
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Enter Your Name</CardTitle>
        <CardDescription>
          This name will be displayed to other players in the game.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              maxLength={20}
              required
            />
          </div>
          <Button type="submit" disabled={isJoining || !name.trim()}>
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Game'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
