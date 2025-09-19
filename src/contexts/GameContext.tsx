'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { Game, GameState, Player } from '@/lib/types';
import { generateCategory } from '@/ai/flows/dynamic-category-generation';

const ROUND_TIME = 30;
const BOT_NAMES = ['Synthia', 'Cybrina', 'Unit-734'];
const POSSIBLE_BOT_ANSWERS = [
  'apple',
  'banana',
  'car',
  'dog',
  'moon',
  'sun',
  'water',
  'fire',
];

const createBot = (id: string, name: string): Player => ({
  id,
  name,
  isHost: false,
  score: 0,
  isBot: true,
});

const createPlayer = (): Player => ({
  id: 'player1',
  name: 'You',
  isHost: true,
  score: 0,
  isBot: false,
});

const initialPlayer = createPlayer();
const initialBots = BOT_NAMES.map((name, i) => createBot(`bot${i + 1}`, name));

interface GameContextType {
  game: Game | null;
  startGame: () => void;
  submitAnswer: (answer: string) => void;
  nextRound: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({
  children,
  roomCode,
}: {
  children: ReactNode;
  roomCode: string;
}) {
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    setGame({
      roomCode,
      players: [initialPlayer, ...initialBots],
      gameState: 'lobby',
      category: '',
      round: 0,
      streak: 0,
      timer: ROUND_TIME,
      answers: new Map(),
      previousCategories: [],
      lastRoundSuccess: false,
    });
  }, [roomCode]);

  const fetchNewCategory = useCallback(async () => {
    if (!game) return;
    try {
      const successRate = game.round > 0 ? (game.lastRoundSuccess ? 1 : 0) : 0.5;
      const result = await generateCategory({
        previousCategories: game.previousCategories,
        successRate,
      });
      setGame((g) => (g ? { ...g, category: result.category } : null));
    } catch (error) {
      console.error('Failed to generate category:', error);
      setGame((g) => (g ? { ...g, category: 'A type of fruit' } : null));
    }
  }, [game]);

  const startGame = useCallback(async () => {
    if (!game || game.gameState !== 'lobby') return;
    setGame((g) =>
      g
        ? {
            ...g,
            gameState: 'playing',
            round: 1,
            timer: ROUND_TIME,
            answers: new Map(),
          }
        : null
    );
    await fetchNewCategory();
  }, [game, fetchNewCategory]);

  const endRound = useCallback(() => {
    if (!game || game.gameState !== 'playing') return;

    const finalAnswers = new Map(game.answers);
    game.players.forEach((p) => {
      if (p.isBot && !finalAnswers.has(p.id)) {
        const playerAnswer = finalAnswers.get('player1');
        if (playerAnswer && Math.random() < 0.5) {
          finalAnswers.set(p.id, playerAnswer);
        } else {
          finalAnswers.set(
            p.id,
            POSSIBLE_BOT_ANSWERS[
              Math.floor(Math.random() * POSSIBLE_BOT_ANSWERS.length)
            ]
          );
        }
      }
    });

    setGame((g) =>
      g ? { ...g, gameState: 'revealing', timer: 0, answers: finalAnswers } : null
    );
  }, [game]);

  const submitAnswer = useCallback(
    (answer: string) => {
      if (!game || game.gameState !== 'playing') return;
      const newAnswers = new Map(game.answers);
      newAnswers.set('player1', answer);
      setGame((g) => (g ? { ...g, answers: newAnswers } : null));
    },
    [game]
  );

  const nextRound = useCallback(async () => {
    if (!game || game.gameState !== 'results') return;
    setGame((g) =>
      g
        ? {
            ...g,
            gameState: 'playing',
            round: g.round + 1,
            timer: ROUND_TIME,
            answers: new Map(),
            previousCategories: [...g.previousCategories, g.category],
          }
        : null
    );
    await fetchNewCategory();
  }, [game, fetchNewCategory]);

  useEffect(() => {
    if (game?.gameState === 'playing' && game.timer > 0) {
      const interval = setInterval(() => {
        setGame((g) => (g ? { ...g, timer: g.timer - 1 } : null));
      }, 1000);
      return () => clearInterval(interval);
    } else if (game?.gameState === 'playing' && game.timer === 0) {
      endRound();
    }
  }, [game?.gameState, game?.timer, endRound]);

  useEffect(() => {
    if (game?.gameState === 'revealing') {
      const timeout = setTimeout(() => {
        const answers = Array.from(game.answers.values()).map((a) =>
          a.toLowerCase().trim()
        );
        const allMatch =
          answers.length === game.players.length && new Set(answers).size === 1;

        setGame((g) => {
          if (!g) return null;
          const newStreak = allMatch ? g.streak + 1 : 0;
          const newPlayers = allMatch
            ? g.players.map((p) => ({ ...p, score: p.score + 10 }))
            : g.players;

          return {
            ...g,
            gameState: 'results',
            streak: newStreak,
            players: newPlayers,
            lastRoundSuccess: allMatch,
          };
        });
      }, 2000 + game.players.length * 500);
      return () => clearTimeout(timeout);
    }
  }, [game?.gameState, game?.answers, game?.players]);

  const value = { game, startGame, submitAnswer, nextRound };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
