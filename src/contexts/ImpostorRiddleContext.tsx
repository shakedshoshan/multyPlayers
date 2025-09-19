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
import type { RiddleGame, RiddlePlayer } from '@/lib/types';
import { generateRiddle } from '@/ai/flows/generate-riddle-flow';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const DISCUSSION_TIME = 600; // 10 minutes

const createPlayer = (id: string, name: string, isHost = false): RiddlePlayer => ({
  id,
  name,
  isHost,
  isImpostor: false,
  votedFor: null,
});

interface ImpostorRiddleContextType {
  game: RiddleGame | null;
  player: RiddlePlayer | null;
  startGame: () => void;
  castVote: (votedPlayerId: string) => void;
  playAgain: () => void;
  joinGame: (name: string) => void;
  leaveGame: () => void;
}

const ImpostorRiddleContext = createContext<ImpostorRiddleContextType | undefined>(undefined);

export function ImpostorRiddleProvider({
  children,
  roomCode,
}: {
  children: ReactNode;
  roomCode: string;
}) {
  const [game, setGame] = useState<RiddleGame | null>(null);
  const [player, setPlayer] = useState<RiddlePlayer | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const gameRef = ref(db, `impostor-riddles/${roomCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const players: RiddlePlayer[] = data.players ? Object.values(data.players) : [];
        const transformedData: RiddleGame = {
          ...data,
          players: players,
          votes: data.votes || {},
          previousWords: data.previousWords || [],
        };
        
        if (player) {
          const currentPlayerInGame = players.find((p: RiddlePlayer) => p.id === player.id);
          if (currentPlayerInGame) {
             setPlayer(currentPlayerInGame); // Update player state with new data from DB
          } else {
             setPlayer(null); // Player was removed or left
             router.push(`/impostors-riddle`);
          }
        }
        
        setGame(transformedData);
      } else {
        toast({
          title: 'Room has been closed',
          description: "The game room is no longer available.",
        });
        setGame(null);
        setPlayer(null);
        router.push('/impostors-riddle');
      }
    });

    return () => unsubscribe();
  }, [roomCode, router, toast]);
  
  const leaveGame = useCallback(async () => {
    if (!player || !game) return;
  
    const playerRef = ref(db, `impostor-riddles/${roomCode}/players/${player.id}`);
    await remove(playerRef);
  
    const gameRef = ref(db, `impostor-riddles/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) {
        setPlayer(null);
        router.push('/impostors-riddle');
        return;
    }
    const currentPlayers = snapshot.val().players ? Object.values(snapshot.val().players) : [];

    if (currentPlayers.length === 0) {
      await remove(gameRef);
    } else if (player.isHost) {
      const newHostId = (currentPlayers[0] as RiddlePlayer).id;
      await update(ref(db, `impostor-riddles/${roomCode}/players/${newHostId}`), { isHost: true });
    }
    
    setPlayer(null);
    router.push('/impostors-riddle');
  }, [player, game, roomCode, router]);

  const joinGame = useCallback(
    async (name: string) => {
      if (player) return;

      const playerId = `player_${Date.now()}`;
      const gameRef = ref(db, `impostor-riddles/${roomCode}`);

      try {
        const snapshot = await get(gameRef);

        if (!snapshot.exists()) {
          toast({ title: 'Error', description: 'Room does not exist.', variant: 'destructive' });
          router.push('/impostors-riddle');
          return;
        }
        
        const currentPlayers = snapshot.val().players ? Object.values(snapshot.val().players) : [];

        if (currentPlayers.length >= 8) {
          toast({ title: 'Room is full', variant: 'destructive' });
          return;
        }

        const isHost = currentPlayers.length === 0;
        const newPlayer = createPlayer(playerId, name, isHost);
        
        const playerRef = ref(db, `impostor-riddles/${roomCode}/players/${playerId}`);
        await set(playerRef, newPlayer);
        setPlayer(newPlayer);

        onDisconnect(playerRef).remove().then(async () => {
           const roomSnapshot = await get(gameRef);
           if(roomSnapshot.exists()){
               const gameData = roomSnapshot.val();
               const remaining: RiddlePlayer[] = gameData.players ? Object.values(gameData.players) : [];
               if (remaining.length === 0) {
                   remove(gameRef);
               } else if (!remaining.some((p: RiddlePlayer) => p.isHost)) {
                   if(remaining[0] && remaining[0].id){
                    const newHostId = remaining[0].id;
                    update(ref(db, `impostor-riddles/${roomCode}/players/${newHostId}`), { isHost: true });
                   }
               }
           }
        });

      } catch (error) {
        console.error("Join game error:", error);
         toast({ title: 'Connection Error', variant: 'destructive' });
      }
    },
    [roomCode, player, router, toast]
  );
  
  const startGame = useCallback(async () => {
    if (!game || !player?.isHost || game.players.length < 3) {
      toast({ title: 'Not enough players', description: 'You need at least 3 players to start.', variant: 'destructive' });
      return;
    }

    try {
      const { category, secretWord } = await generateRiddle({ previousWords: game.previousWords || [] });
      const players = [...game.players];
      const impostorIndex = Math.floor(Math.random() * players.length);
      
      const playerUpdates: {[key: string]: any} = {};
      players.forEach((p, index) => {
        const isImpostor = index === impostorIndex;
        playerUpdates[`players/${p.id}/isImpostor`] = isImpostor;
        playerUpdates[`players/${p.id}/votedFor`] = null;
      });

      await update(ref(db, `impostor-riddles/${roomCode}`), {
        ...playerUpdates,
        gameState: 'voting',
        category,
        secretWord,
        timer: DISCUSSION_TIME,
        votes: {},
        winner: null,
        previousWords: [...(game.previousWords || []), secretWord],
      });

    } catch (error) {
      console.error("Failed to start game:", error);
      toast({ title: "Failed to start game", description: "Could not generate a new riddle.", variant: 'destructive' });
    }
  }, [game, player, roomCode, toast]);

  const castVote = async (votedPlayerId: string) => {
    if (!game || !player || game.gameState !== 'voting' || player.votedFor) return;
    await update(ref(db, `impostor-riddles/${roomCode}/players/${player.id}`), { votedFor: votedPlayerId });
  };
  
  const playAgain = async () => {
      if (!game || !player?.isHost) return;

      const playerUpdates: {[key: string]: any} = {};
      game.players.forEach(p => {
        playerUpdates[`/players/${p.id}/isImpostor`] = false;
        playerUpdates[`/players/${p.id}/votedFor`] = null;
      });
      
      await update(ref(db, `impostor-riddles/${roomCode}`), {
        ...playerUpdates,
        gameState: 'lobby',
        category: '',
        secretWord: '',
        timer: 0,
        votes: {},
        winner: null,
      });
  };

  // Timer effect (host only)
  useEffect(() => {
    if (player?.isHost && game?.gameState === 'voting' && game.timer > 0) {
      const interval = setInterval(async () => {
        const gameRef = ref(db, `impostor-riddles/${roomCode}`);
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
            // Time's up, impostor wins
            await update(gameRef, { gameState: 'reveal', winner: 'impostor' });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [game?.gameState, game?.timer, player?.isHost, roomCode]);

  // Game state transitions (host only)
  useEffect(() => {
    if (!game || !player?.isHost) return;

    // End game when all votes are in
    if (game.gameState === 'voting') {
      const allVoted = game.players.length > 0 && game.players.every(p => p.votedFor);
      if (allVoted) {
        const votes: Record<string, number> = {};
        let impostorId = '';
        game.players.forEach(p => {
          if (p.isImpostor) impostorId = p.id;
          if (p.votedFor) {
            votes[p.votedFor] = (votes[p.votedFor] || 0) + 1;
          }
        });

        const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
        const mostVotedPlayerId = sortedVotes.length > 0 ? sortedVotes[0][0] : null;

        const winner = mostVotedPlayerId === impostorId ? 'knowers' : 'impostor';
        
        update(ref(db, `impostor-riddles/${roomCode}`), {
          gameState: 'reveal',
          winner: winner,
        });
      }
    }
  }, [game, player, roomCode]);


  const value = { game, player, startGame, castVote, playAgain, joinGame, leaveGame };

  return <ImpostorRiddleContext.Provider value={value}>{children}</ImpostorRiddleContext.Provider>;
}

export const useImpostorRiddle = () => {
  const context = useContext(ImpostorRiddleContext);
  if (context === undefined) {
    throw new Error('useImpostorRiddle must be used within a ImpostorRiddleProvider');
  }
  return context;
};
