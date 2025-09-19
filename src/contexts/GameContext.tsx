'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, update, get } from 'firebase/database';
import type { Game, Player, Answers } from '@/lib/types';
import { generateCategory } from '@/ai/flows/dynamic-category-generation';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const ROUND_TIME = 30;

const createPlayer = (id: string, name: string, isHost = false): Player => ({
  id,
  name,
  isHost,
  score: 0,
  isBot: false,
});

interface GameContextType {
  game: Game | null;
  player: Player | null;
  startGame: () => void;
  submitAnswer: (answer: string) => void;
  nextRound: () => void;
  joinGame: (name: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({
  children,
  roomCode,
  lang,
}: {
  children: ReactNode;
  roomCode: string;
  lang: string;
}) {
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const gameRef = ref(db, `rooms/${roomCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase stores empty arrays as undefined, so we default it
        if (!data.players) data.players = [];
        if (!data.answers) data.answers = {};
        if (!data.previousCategories) data.previousCategories = [];
        setGame(data as Game);
      } else {
        toast({
          title: 'Room not found',
          description: "This game room doesn't exist.",
          variant: 'destructive',
        });
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [roomCode, router, toast]);
  
  const joinGame = useCallback(async (name: string) => {
    if (!game) return;

    const playerId = `player_${Date.now()}`;
    const gameRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(gameRef);
    const currentGame: Game = snapshot.val();

    const isHost = !currentGame.players || currentGame.players.length === 0;
    const newPlayer = createPlayer(playerId, name, isHost);

    const updatedPlayers = [...(currentGame.players || []), newPlayer];

    await update(gameRef, { players: updatedPlayers });
    setPlayer(newPlayer);
  }, [game, roomCode]);

  const fetchNewCategory = useCallback(async () => {
    if (!game) return;
    try {
      const successRate =
        game.round > 0 ? (game.lastRoundSuccess ? 1 : 0) : 0.5;
      const result = await generateCategory({
        previousCategories: game.previousCategories || [],
        successRate,
        language: game.language,
      });
      await update(ref(db, `rooms/${roomCode}`), { category: result.category });
    } catch (error) {
      console.error('Failed to generate category:', error);
      await update(ref(db, `rooms/${roomCode}`), { category: 'A type of fruit' });
    }
  }, [game, roomCode]);

  const startGame = useCallback(async () => {
    if (!game || game.gameState !== 'lobby' || !player?.isHost) return;
    
    await update(ref(db, `rooms/${roomCode}`), {
      gameState: 'playing',
      round: 1,
      timer: ROUND_TIME,
      answers: {},
    });
    await fetchNewCategory();
  }, [game, player, roomCode, fetchNewCategory]);

  const endRound = useCallback(async () => {
    if (!game || game.gameState !== 'playing') return;
    
    await update(ref(db, `rooms/${roomCode}`), {
      gameState: 'revealing',
      timer: 0,
    });
  }, [game, roomCode]);

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!game || game.gameState !== 'playing' || !player) return;
      const answerPath = `rooms/${roomCode}/answers/${player.id}`;
      await set(ref(db, answerPath), answer);
    },
    [game, player, roomCode]
  );
  
  const nextRound = useCallback(async () => {
    if (!game || game.gameState !== 'results' || !player?.isHost) return;

    await update(ref(db, `rooms/${roomCode}`), {
      gameState: 'playing',
      round: game.round + 1,
      timer: ROUND_TIME,
      answers: {},
      previousCategories: [...(game.previousCategories || []), game.category],
    });
    await fetchNewCategory();
  }, [game, player, roomCode, fetchNewCategory]);

  // Timer effect (host only)
  useEffect(() => {
    if (player?.isHost && game?.gameState === 'playing' && game.timer > 0) {
      const interval = setInterval(async () => {
        const newTime = game.timer - 1;
        await update(ref(db, `rooms/${roomCode}`), { timer: newTime });
      }, 1000);
      return () => clearInterval(interval);
    } else if (player?.isHost && game?.gameState === 'playing' && game.timer === 0) {
      endRound();
    }
  }, [game?.gameState, game?.timer, player?.isHost, roomCode, endRound]);

  // Results calculation (host only)
  useEffect(() => {
    if (player?.isHost && game?.gameState === 'revealing') {
      const timeout = setTimeout(async () => {
        const answers: Answers = game.answers || {};
        const answerValues = Object.values(answers).map((a) => a.toLowerCase().trim());
        const allMatch =
          answerValues.length === game.players.length && new Set(answerValues).size === 1;

        let newStreak = game.streak;
        let newPlayers = game.players;

        if (allMatch) {
          newStreak = game.streak + 1;
          newPlayers = game.players.map((p) => ({ ...p, score: p.score + 10 }));
        } else {
          newStreak = 0;
        }

        await update(ref(db, `rooms/${roomCode}`), {
          gameState: 'results',
          streak: newStreak,
          players: newPlayers,
          lastRoundSuccess: allMatch,
        });

      }, 2000 + game.players.length * 500); // Wait for reveal animation
      return () => clearTimeout(timeout);
    }
  }, [player?.isHost, game?.gameState, game?.answers, game?.players, game?.streak, roomCode]);


  const value = { game, player, startGame, submitAnswer, nextRound, joinGame };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
