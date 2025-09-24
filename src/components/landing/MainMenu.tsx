'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const games = [
  {
    title: 'SynapseSync',
    description: 'A real-time multiplayer word association game where the goal is to think like your friends.',
    href: '/synapsesync',
    icon: '🧠',
  },
  {
    title: "The Impostor's Riddle",
    description: 'A game of deduction and deception. Find the impostor who doesn\'t know the secret word.',
    href: '/impostors-riddle',
    icon: '🕵️',
  },
  {
    title: 'Wordplay',
    description: 'A creative multiplayer game where players team up to craft hilariously absurd sentences.',
    href: '/wordplay',
    icon: '✏️',
  },
  {
    title: 'Elias',
    description: 'A fast-paced word guessing game where you give clues to your partner.',
    href: '/elias',
    icon: '🗣️',
  }
];

export function MainMenu() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl font-headline">
        Game Hub
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground md:text-xl">
        Choose a game to play. More games coming soon!
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {games.map((game) => (
          <Link href={game.href} key={game.title} className="group">
            <Card className="w-full max-w-md shadow-2xl transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-left">
                       <span className="text-4xl mr-4">{game.icon}</span>{game.title}
                    </CardTitle>
                    <CardDescription className="mt-2 text-left">{game.description}</CardDescription>
                  </div>
                   <ArrowRight className="h-8 w-8 text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
