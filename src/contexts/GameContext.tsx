
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
  
    const playerRef = ref(db, `rooms/${roomCode}/players/${player.id}`);
    await remove(playerRef);
  
    const gameRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) {
      setPlayer(null);
      router.push('/');
      return;
    }
  
    const currentGame: Game = snapshot.val();
    const remainingPlayers = currentGame.players ? Object.values(currentGame.players) : [];
  
    if (remainingPlayers.length === 0) {
      await remove(gameRef);
    } else {
      const isHostStillPresent = remainingPlayers.some(p => p.isHost);
      if (!isHostStillPresent && remainingPlayers.length > 0) {
        const newHostId = remainingPlayers[0].id;
        await update(ref(db, `rooms/${roomCode}/players/${newHostId}`), { isHost: true });
      }
    }
  
    setPlayer(null);
    router.push('/');
  }, [player, game, roomCode, router]);

  const joinGame = useCallback(
    async (name: string) => {
      if (player) return; // Already joined

      const playerId = `player_${Date.now()}`;
      const gameRef = ref(db, `rooms/${roomCode}`);

      try {
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
        const players = currentGame.players ? Object.values(currentGame.players) : [];

        if (players.length >= 8) {
          toast({
            title: 'Room is full',
            description: 'This game room has reached the maximum number of players.',
            variant: 'destructive',
          });
          return;
        }

        const isHost = players.length === 0;
        const newPlayer = createPlayer(playerId, name, isHost);
        
        const playerRef = ref(db, `rooms/${roomCode}/players/${playerId}`);
        await set(playerRef, newPlayer);

        onDisconnect(playerRef).remove();

        onDisconnect(gameRef).get().then(snap => {
            if (snap.exists()) {
                const gameData = snap.val();
                const remainingPlayers = gameData.players ? Object.values(gameData.players) : [];
                if (remainingPlayers.length === 0) {
                    remove(gameRef);
                } else {
                    const isHostStillPresent = remainingPlayers.some(p => p.isHost);
                    if (!isHostStillPresent && remainingPlayers.length > 0) {
                        const newHostId = remainingPlayers[0].id;
                        update(ref(db, `rooms/${roomCode}/players/${newHostId}`), { isHost: true });
                    }
                }
            }
        });

        setPlayer(newPlayer);

      } catch (error) {
        console.error("Join game error:", error);
         toast({
          title: 'Connection Error',
          description: 'Could not connect to the game room.',
          variant: 'destructive',
        });
      }
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
    const players = currentGame.players ? Object.values(currentGame.players) : [];

    if (
      currentGame.gameState !== 'lobby' ||
      !player?.isHost ||
      players.length < 2
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
    if (!game || !player?.isHost || game.gameState !== 'playing') return;

    const players = game.players ? Object.values(game.players) : [];
    const answers = game.answers || {};

    if (
      players.length > 0 &&
      Object.keys(answers).length === players.length
    ) {
      endRound();
    }
  }, [game, player?.isHost, endRound]);


  // Results calculation (host only)
  useEffect(() => {
    if (player?.isHost && game?.gameState === 'revealing') {
      const players = game.players ? Object.values(game.players) : [];
      const timeout = setTimeout(async () => {
        const gameRef = ref(db, `rooms/${roomCode}`);
        const snapshot = await get(gameRef);
        if (!snapshot.exists()) return;
        const currentGame: Game = snapshot.val();
        
        const currentPlayers = currentGame.players ? Object.values(currentGame.players) : [];
        const amIStillHost = (currentPlayers.find(p => p.id === player.id) || {}).isHost;
        if(!amIStillHost) return;

        const answers: Answers = currentGame.answers || {};
        const answerValues = Object.values(answers)
          .map((a) => a.toLowerCase().trim())
          .filter((a) => a);

        const allMatch =
          answerValues.length > 0 &&
          answerValues.length === currentPlayers.length &&
          new Set(answerValues).size === 1;

        let newStreak = currentGame.streak;
        let newPlayersData = currentGame.players;

        if (allMatch) {
          newStreak = currentGame.streak + 1;
          
          const updatedPlayers: Record<string, Player> = {};
          currentPlayers.forEach(p => {
              updatedPlayers[p.id] = { ...p, score: p.score + 10 };
          });
          newPlayersData = updatedPlayers;

        } else {
          newStreak = 0;
        }

        await update(gameRef, {
          gameState: 'results',
          streak: newStreak,
          players: newPlayersData,
          lastRoundSuccess: allMatch,
        });
      }, 2000 + players.length * 500); // Wait for reveal animation
      return () => clearTimeout(timeout);
    }
  }, [player?.id, player?.isHost, game?.gameState, game?.players, roomCode]);

  const value = { game: game ? { ...game, players: game.players ? Object.values(game.players) : [] } : null, player, startGame, submitAnswer, nextRound, joinGame, leaveGame };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

    