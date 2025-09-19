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

  const joinGame = useCallback(
    async (name: string) => {
      if (player) return; // Already joined

      const playerId = `player_${Date.now()}`;
      const gameRef = ref(db, `rooms/${roomCode}`);
      const snapshot = await get(gameRef);

      if (!snapshot.exists()) {
        toast({
          title: 'Error joining room',
          description: 'The room no longer exists.',
          variant: 'destructive',
        });
        router.push('/');
        return;
      }
      const currentGame: Game = snapshot.val();

      const isHost = !currentGame.players || currentGame.players.length === 0;
      const newPlayer = createPlayer(playerId, name, isHost);
      setPlayer(newPlayer);

      const updatedPlayers = [...(currentGame.players || []), newPlayer];

      await update(gameRef, { players: updatedPlayers });
    },
    [roomCode, player, router, toast]
  );

  const fetchNewCategory = useCallback(async () => {
    const gameRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) return;
    const currentGame: Game = snapshot.val();

    try {
      const successRate =
        currentGame.round > 1
          ? currentGame.lastRoundSuccess
            ? 1
            : 0
          : 0.5;
      const result = await generateCategory({
        previousCategories: currentGame.previousCategories || [],
        successRate,
        language: currentGame.language,
      });
      await update(gameRef, { category: result.category });
    } catch (error) {
      console.error('Failed to generate category:', error);
      await update(gameRef, { category: 'A type of fruit' });
    }
  }, [roomCode]);

  const startGame = useCallback(async () => {
    const gameRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) return;
    const currentGame: Game = snapshot.val();

    if (
      currentGame.gameState !== 'lobby' ||
      !player?.isHost ||
      currentGame.players.length < 2
    )
      return;

    await update(gameRef, {
      gameState: 'playing',
      round: 1,
      timer: ROUND_TIME,
      answers: {},
    });
    await fetchNewCategory();
  }, [player, roomCode, fetchNewCategory]);

  const endRound = useCallback(async () => {
    const gameRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) return;
    const currentGame: Game = snapshot.val();

    if (currentGame.gameState !== 'playing') return;

    await update(gameRef, {
      gameState: 'revealing',
      timer: 0,
    });
  }, [roomCode]);

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!game || game.gameState !== 'playing' || !player) return;
      const answerPath = `rooms/${roomCode}/answers/${player.id}`;
      await set(ref(db, answerPath), answer);
    },
    [game, player, roomCode]
  );

  const nextRound = useCallback(async () => {
    const gameRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) return;
    const currentGame: Game = snapshot.val();

    if (currentGame.gameState !== 'results' || !player?.isHost) return;

    await update(gameRef, {
      gameState: 'playing',
      round: currentGame.round + 1,
      timer: ROUND_TIME,
      answers: {},
      previousCategories: [
        ...(currentGame.previousCategories || []),
        currentGame.category,
      ],
    });
    await fetchNewCategory();
  }, [player, roomCode, fetchNewCategory]);

  // Timer effect (host only)
  useEffect(() => {
    if (player?.isHost && game?.gameState === 'playing' && game.timer > 0) {
      const interval = setInterval(async () => {
        const gameRef = ref(db, `rooms/${roomCode}`);
        const snapshot = await get(gameRef);
        if (!snapshot.exists()) {
            clearInterval(interval);
            return;
        }
        const currentTimer = snapshot.val().timer;
        if(currentTimer > 0) {
            await update(gameRef, { timer: currentTimer - 1 });
        } else {
            clearInterval(interval);
            endRound();
        }
      }, 1000);
      return () => clearInterval(interval);
    } else if (
      player?.isHost &&
      game?.gameState === 'playing' &&
      game.timer <= 0
    ) {
      endRound();
    }
  }, [game?.gameState, game?.timer, player?.isHost, roomCode, endRound]);
  
    // Auto-advance if all players have answered (host only)
  useEffect(() => {
    if (
      player?.isHost &&
      game?.gameState === 'playing' &&
      game.answers &&
      Object.keys(game.answers).length === game.players.length &&
      game.players.length > 0
    ) {
      endRound();
    }
  }, [game?.answers, game?.players, game?.gameState, player?.isHost, endRound]);


  // Results calculation (host only)
  useEffect(() => {
    if (player?.isHost && game?.gameState === 'revealing') {
      const timeout = setTimeout(async () => {
        const gameRef = ref(db, `rooms/${roomCode}`);
        const snapshot = await get(gameRef);
        if (!snapshot.exists()) return;
        const currentGame: Game = snapshot.val();

        const answers: Answers = currentGame.answers || {};
        const answerValues = Object.values(answers)
          .map((a) => a.toLowerCase().trim())
          .filter((a) => a); // Filter out empty answers

        const allMatch =
          answerValues.length > 0 &&
          answerValues.length === currentGame.players.length &&
          new Set(answerValues).size === 1;

        let newStreak = currentGame.streak;
        let newPlayers = currentGame.players;

        if (allMatch) {
          newStreak = currentGame.streak + 1;
          newPlayers = currentGame.players.map((p) => ({
            ...p,
            score: p.score + 10,
          }));
        } else {
          newStreak = 0;
        }

        await update(gameRef, {
          gameState: 'results',
          streak: newStreak,
          players: newPlayers,
          lastRoundSuccess: allMatch,
        });
      }, 2000 + currentGame.players.length * 500); // Wait for reveal animation
      return () => clearTimeout(timeout);
    }
  }, [player?.isHost, game?.gameState, roomCode]);

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
