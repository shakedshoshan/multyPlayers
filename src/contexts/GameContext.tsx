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
import { ref, onValue, set, update, get, remove, onDisconnect } from 'firebase/database';
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
  leaveGame: () => void;
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
        
        // If players list exists, check if current player is still in it.
        if (player && data.players.every((p: Player) => p.id !== player.id)) {
          // Player was removed from the game (e.g. kicked, or data reset)
          setPlayer(null); 
          router.push(`/game/${roomCode}`);
        }
        
        setGame(data as Game);
      } else {
        // Game room has been deleted
        toast({
          title: 'Room has been closed',
          description: "The game room is no longer available.",
        });
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [roomCode, router, toast, player]);
  
  const leaveGame = useCallback(async () => {
    if (!player || !game) return;

    const gameRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) return;

    const currentGame: Game = snapshot.val();
    const updatedPlayers = (currentGame.players || []).filter(p => p.id !== player.id);

    if (updatedPlayers.length === 0) {
      await remove(gameRef);
    } else {
      // If the host leaves, make the next player the host
      if (player.isHost && updatedPlayers.length > 0) {
        updatedPlayers[0].isHost = true;
      }
      await update(gameRef, { players: updatedPlayers });
    }
    setPlayer(null);
    router.push('/');
  }, [player, game, roomCode, router]);

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

      if ((currentGame.players || []).length >= 8) {
        toast({
          title: 'Room is full',
          description: 'This game room has reached the maximum number of players.',
          variant: 'destructive',
        });
        return;
      }

      const isHost = !currentGame.players || currentGame.players.length === 0;
      const newPlayer = createPlayer(playerId, name, isHost);
      

      const updatedPlayers = [...(currentGame.players || []), newPlayer];
      await update(gameRef, { players: updatedPlayers });

      // Set onDisconnect logic
      const playerRef = ref(db, `rooms/${roomCode}/players`);
      onDisconnect(playerRef).set(updatedPlayers.filter(p => p.id !== newPlayer.id));
      
      const roomRef = ref(db, `rooms/${roomCode}`);
      onDisconnect(roomRef).get().then(snapshot => {
        if(snapshot.exists()) {
            const gameData = snapshot.val();
            if((gameData.players || []).length <= 1) { // If this is the last player
                remove(ref(db, `rooms/${roomCode}`));
            }
        }
      });
      setPlayer(newPlayer);
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

        // Check if host has changed since timeout was set
        const amIStillHost = (currentGame.players.find(p => p.id === player.id) || {}).isHost;
        if(!amIStillHost) return;

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
  }, [player?.id, player?.isHost, game?.gameState, roomCode, game?.players]);

  const value = { game, player, startGame, submitAnswer, nextRound, joinGame, leaveGame };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
