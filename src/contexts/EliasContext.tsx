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
import {
  ref,
  onValue,
  set,
  update,
  get,
  remove,
  onDisconnect,
} from 'firebase/database';
import type {
  EliasGame,
  EliasPlayer,
  Pair
} from '@/lib/types';
import { generateWords } from '@/ai/flows/generate-words-flow';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const ROUND_TIME = 60;
const WORDS_PER_ROUND = 50;

const createPlayer = (
  id: string,
  name: string,
  isHost = false
): EliasPlayer => ({
  id,
  name,
  isHost,
});

interface EliasContextType {
  game: EliasGame | null;
  player: EliasPlayer | null;
  joinGame: (name: string) => void;
  leaveGame: () => void;
  setLanguage: (lang: string) => void;
  setTargetScore: (score: number) => void;
  createPair: (player1Id: string, player2Id: string) => void;
  removePair: (pairId: string) => void;
  startGame: () => void;
  markWord: (success: boolean) => void;
  startNextRound: () => void;
}

const EliasContext = createContext<EliasContextType | undefined>(
  undefined
);

export function EliasProvider({
  children,
  roomCode,
}: {
  children: ReactNode;
  roomCode: string;
}) {
  const [game, setGame] = useState<EliasGame | null>(null);
  const [player, setPlayer] = useState<EliasPlayer | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const parseFirebaseState = (data: any): EliasGame => {
     return {
        ...data,
        players: data.players ? Object.values(data.players) : [],
        pairs: data.pairs ? Object.values(data.pairs) : [],
        words: data.words || [],
        previousWords: data.previousWords || [],
     }
  }

  useEffect(() => {
    const gameRef = ref(db, `elias/${roomCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transformedData = parseFirebaseState(data);
        setGame(transformedData);

        if (player) {
          const currentPlayerInGame = transformedData.players.find(
            (p) => p.id === player.id
          );
          if (currentPlayerInGame) {
            setPlayer(currentPlayerInGame);
          } else {
            setPlayer(null);
            router.push(`/elias`);
          }
        }
      } else {
        toast({
          title: 'Room has been closed',
          description: 'The game room is no longer available.',
        });
        setGame(null);
        setPlayer(null);
        router.push('/elias');
      }
    });

    return () => unsubscribe();
  }, [roomCode, router, toast, player]);

  const leaveGame = useCallback(async () => {
    if (!player || !game) return;

    const playerRef = ref(db, `elias/${roomCode}/players/${player.id}`);
    await remove(playerRef);

    // Also remove player from any pairs
    const pairWithPlayer = game.pairs.find(p => p.player1Id === player.id || p.player2Id === player.id);
    if (pairWithPlayer) {
        await remove(ref(db, `elias/${roomCode}/pairs/${pairWithPlayer.id}`));
    }

    const gameRef = ref(db, `elias/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) {
      setPlayer(null);
      router.push('/elias');
      return;
    }
    const currentPlayers = snapshot.val().players
      ? Object.values(snapshot.val().players)
      : [];

    if (currentPlayers.length === 0) {
      await remove(gameRef);
    } else if (player.isHost) {
      const newHostId = (currentPlayers[0] as EliasPlayer).id;
      await update(ref(db, `elias/${roomCode}/players/${newHostId}`), {
        isHost: true,
      });
    }

    setPlayer(null);
    router.push('/');
  }, [player, game, roomCode, router]);

  const joinGame = useCallback(
    async (name: string) => {
      if (player) return;

      const playerId = `player_${Date.now()}`;
      const gameRef = ref(db, `elias/${roomCode}`);

      try {
        const snapshot = await get(gameRef);

        if (!snapshot.exists()) {
          toast({ title: 'Error', description: 'Room does not exist.', variant: 'destructive' });
          router.push('/elias');
          return;
        }

        const isHost = !snapshot.val().players;
        const newPlayer = createPlayer(playerId, name, isHost);

        const playerRef = ref(db, `elias/${roomCode}/players/${playerId}`);
        await set(playerRef, newPlayer);
        setPlayer(newPlayer);

        onDisconnect(playerRef).remove(); // Simple remove on disconnect
      } catch (error) {
        console.error('Join game error:', error);
        toast({ title: 'Connection Error', variant: 'destructive' });
      }
    },
    [roomCode, player, router, toast]
  );
  
  const setLanguage = useCallback(async (lang: string) => {
    if (!game || !player?.isHost) return;
    await update(ref(db, `elias/${roomCode}`), { language: lang });
  }, [game, player, roomCode]);

  const setTargetScore = useCallback(async (score: number) => {
    if (!game || !player?.isHost) return;
    await update(ref(db, `elias/${roomCode}`), { targetScore: score });
  }, [game, player, roomCode]);

  const createPair = useCallback(async (player1Id: string, player2Id: string) => {
    if (!game || !player?.isHost) return;
    const pairId = `pair_${Date.now()}`;
    const newPair: Pair = {
        id: pairId,
        player1Id,
        player2Id,
        score: 0,
    };
    await set(ref(db, `elias/${roomCode}/pairs/${pairId}`), newPair);
  }, [game, player, roomCode]);

  const removePair = useCallback(async (pairId: string) => {
    if (!game || !player?.isHost) return;
    await remove(ref(db, `elias/${roomCode}/pairs/${pairId}`));
  }, [game, player, roomCode]);


  const startNextRound = useCallback(async () => {
    if (!game || !player?.isHost) return;

    try {
        const { words } = await generateWords({
            previousWords: game.previousWords,
            language: game.language,
            count: WORDS_PER_ROUND,
        });

        const nextPairIndex = game.gameState === 'lobby' ? 0 : (game.currentPairIndex + 1) % game.pairs.length;
        const nextPair = game.pairs[nextPairIndex];
        
        // Alternate who gives clues
        const lastTurnByPair = game.lastTurnByPair || {};
        const lastTurn = lastTurnByPair[nextPair.id];
        const clueGiverId = lastTurn === nextPair.player1Id ? nextPair.player2Id : nextPair.player1Id;

        await update(ref(db, `elias/${roomCode}`), {
            gameState: 'playing',
            timer: ROUND_TIME,
            words,
            currentWordIndex: 0,
            roundSuccesses: 0,
            roundFails: 0,
            currentPairIndex: nextPairIndex,
            currentPairId: nextPair.id,
            previousWords: [...game.previousWords, ...words],
            [`lastTurnByPair/${nextPair.id}`]: clueGiverId,
            [`pairs/${nextPair.id}/clueGiverId`]: clueGiverId,
            [`pairs/${nextPair.id}/guesserId`]: clueGiverId === nextPair.player1Id ? nextPair.player2Id : nextPair.player1Id
        });
    } catch (error) {
        console.error("Failed to start next round:", error);
        toast({ title: 'Error starting round', variant: 'destructive' });
    }
  }, [game, player, roomCode, toast]);

  const startGame = useCallback(async () => {
      if (!game || !player?.isHost) return;
      if (game.pairs.length < 1) {
          toast({ title: "Cannot start game", description: "You need at least one pair.", variant: 'destructive' });
          return;
      }
      await startNextRound();
  }, [game, player, startNextRound, toast]);

  const endRound = useCallback(async () => {
    const gameRef = ref(db, `elias/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists() || snapshot.val().gameState !== 'playing') return;

    const currentGame = snapshot.val();
    const currentPairId = currentGame.currentPairId;
    const currentPair = currentGame.pairs[currentPairId];
    const newScore = currentPair.score + currentGame.roundSuccesses - currentGame.roundFails;
    
    await update(gameRef, {
      gameState: 'summary',
      timer: 0,
      [`pairs/${currentPairId}/score`]: newScore < 0 ? 0 : newScore, // Score can't be negative
    });
  }, [roomCode]);

  const markWord = useCallback(async (success: boolean) => {
      if (!game || !player || game.gameState !== 'playing') return;
      const currentPair = game.pairs.find(p => p.id === game.currentPairId);
      if (player.id !== currentPair?.clueGiverId) return;

      if (game.currentWordIndex >= game.words.length - 1) {
          endRound();
          return;
      }

      const updates: any = {
          currentWordIndex: game.currentWordIndex + 1,
      };

      if (success) {
          updates.roundSuccesses = game.roundSuccesses + 1;
      } else {
          updates.roundFails = game.roundFails + 1;
      }
      await update(ref(db, `elias/${roomCode}`), updates);

  }, [game, player, roomCode, endRound]);


  // Timer effect (host only)
  useEffect(() => {
    if (player?.isHost && game?.gameState === 'playing' && game.timer > 0) {
      const interval = setInterval(async () => {
        const gameRef = ref(db, `elias/${roomCode}`);
        const snapshot = await get(gameRef);
        if (!snapshot.exists() || snapshot.val().gameState !== 'playing') {
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
    }
  }, [game?.gameState, game?.timer, player?.isHost, roomCode, endRound]);
  

  const value = {
    game,
    player,
    joinGame,
    leaveGame,
    setLanguage,
    setTargetScore,
    createPair,
    removePair,
    startGame,
    markWord,
    startNextRound
  };

  return (
    <EliasContext.Provider value={value}>
      {children}
    </EliasContext.Provider>
  );
}

export const useElias = () => {
  const context = useContext(EliasContext);
  if (context === undefined) {
    throw new Error('useElias must be used within a EliasProvider');
  }
  return context;
};

    