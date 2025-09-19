
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
  setLanguage: (lang: string) => void;
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
  const [player, setPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const gameRef = ref(db, `rooms/${roomCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase stores empty objects/arrays as null, so we default them
        const players = data.players ? Object.values(data.players) : [];
        const transformedData: Game = {
          ...data,
          players: players,
          answers: data.answers || {},
          previousCategories: data.previousCategories || [],
        };
        
        // If player is set, check if they are still in the game
        if (player && !players.some((p: Player) => p.id === player.id)) {
          // Player was removed from the game (e.g. kicked, or data reset)
          setPlayer(null); 
          router.push(`/game/${roomCode}`);
        }
        
        setGame(transformedData);
      } else {
        // Game room has been deleted
        toast({
          title: 'Room has been closed',
          description: "The game room is no longer available.",
        });
        setGame(null);
        setPlayer(null);
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
    const currentPlayers = snapshot.val().players ? Object.values(snapshot.val().players) : [];


    if (currentPlayers.length === 0) {
      // If last player leaves, remove the entire room
      await remove(gameRef);
    } else if (player.isHost) {
      // If host leaves, assign a new host
      const newHostId = currentPlayers[0].id;
      await update(ref(db, `rooms/${roomCode}/players/${newHostId}`), { isHost: true });
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
        
        const currentPlayers = snapshot.val().players ? Object.values(snapshot.val().players) : [];

        if (currentPlayers.length >= 8) {
          toast({
            title: 'Room is full',
            description: 'This game room has reached the maximum number of players.',
            variant: 'destructive',
          });
          return;
        }

        const isHost = currentPlayers.length === 0;
        const newPlayer = createPlayer(playerId, name, isHost);
        
        const playerRef = ref(db, `rooms/${roomCode}/players/${playerId}`);
        await set(playerRef, newPlayer);
        setPlayer(newPlayer);

        // Set up onDisconnect logic
        onDisconnect(playerRef).remove().then(async () => {
           const roomSnapshot = await get(gameRef);
           if(roomSnapshot.exists()){
               const gameData = roomSnapshot.val();
               const remaining = gameData.players ? Object.values(gameData.players) : [];
               if (remaining.length === 0) {
                   remove(gameRef);
               } else if (!remaining.some((p: Player) => p.isHost)) {
                   if(remaining[0] && remaining[0].id){
                    const newHostId = remaining[0].id;
                    update(ref(db, `rooms/${roomCode}/players/${newHostId}`), { isHost: true });
                   }
               }
           }
        });

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
  
  const setLanguage = useCallback(async (lang: string) => {
    if (!game || !player?.isHost) return;
    await update(ref(db, `rooms/${roomCode}`), { language: lang });
  }, [game, player, roomCode]);

  const fetchNewCategory = useCallback(async () => {
    if(!game) return;
    try {
      const successRate =
        game.round > 1
          ? game.lastRoundSuccess
            ? 1
            : 0
          : 0.5;
      const result = await generateCategory({
        previousCategories: game.previousCategories || [],
        successRate,
        language: game.language,
      });
      await update(ref(db, `rooms/${roomCode}`), { category: result.category });
    } catch (error) {
      console.error('Failed to generate category:', error);
      await update(ref(db, `rooms/${roomCode}`), { category: 'A type of fruit' }); // Fallback
    }
  }, [game, roomCode]);

  const startGame = useCallback(async () => {
    if (!game || !player?.isHost || game.gameState !== 'lobby' || game.players.length < 2) {
        return;
    }

    await update(ref(db, `rooms/${roomCode}`), {
      gameState: 'playing',
      round: 1,
      timer: ROUND_TIME,
      answers: {},
    });
    await fetchNewCategory();
  }, [player, game, roomCode, fetchNewCategory]);

  const endRound = useCallback(async () => {
    const gameRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists() || snapshot.val().gameState !== 'playing') return;

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
    if (!game || !player?.isHost || game.gameState !== 'results') return;

    await update(ref(db, `rooms/${roomCode}`), {
      gameState: 'playing',
      round: game.round + 1,
      timer: ROUND_TIME,
      answers: {},
      previousCategories: [
        ...(game.previousCategories || []),
        game.category,
      ],
    });
    await fetchNewCategory();
  }, [player, game, roomCode, fetchNewCategory]);

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

    if (
      game.players.length > 0 &&
      Object.keys(game.answers).length === game.players.length
    ) {
      endRound();
    }
  }, [game, player?.isHost, endRound]);


  // Results calculation (host only)
  useEffect(() => {
    if (player?.isHost && game?.gameState === 'revealing') {
      const timeout = setTimeout(async () => {
        const gameRef = ref(db, `rooms/${roomCode}`);
        const snapshot = await get(gameRef);
        if (!snapshot.exists()) return;
        const currentGame = snapshot.val();
        
        const currentPlayers = currentGame.players ? Object.values(currentGame.players) : [];
        if (currentPlayers.length === 0) return;

        const amIStillHost = (currentPlayers.find((p:Player) => p.id === player.id) || {}).isHost;
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
        let newPlayersData: Record<string, Player> = {...currentGame.players};

        if (allMatch) {
          newStreak = currentGame.streak + 1;
          
          currentPlayers.forEach((p: Player) => {
              newPlayersData[p.id] = { ...p, score: p.score + 10 };
          });
        } else {
          newStreak = 0;
        }

        await update(gameRef, {
          gameState: 'results',
          streak: newStreak,
          players: newPlayersData,
          lastRoundSuccess: allMatch,
        });
      }, 2000 + game.players.length * 500); // Wait for reveal animation
      return () => clearTimeout(timeout);
    }
  }, [player?.id, player?.isHost, game?.gameState, game?.players, roomCode]);

  const value = { game, player, startGame, submitAnswer, nextRound, joinGame, leaveGame, setLanguage };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

    
