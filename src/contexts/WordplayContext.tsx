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
  WordplayGame,
  WordplayPlayer,
  Sentence,
  Blank,
  BlankType,
} from '@/lib/types';
import { generateSentence } from '@/ai/flows/generate-sentence-flow';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const createPlayer = (
  id: string,
  name: string,
  isHost = false
): WordplayPlayer => ({
  id,
  name,
  isHost,
  score: 0,
});

interface WordplayContextType {
  game: WordplayGame | null;
  player: WordplayPlayer | null;
  joinGame: (name: string) => void;
  leaveGame: () => void;
  startGame: () => void;
  submitWord: (word: string) => void;
  castVote: (sentenceId: string) => void;
  nextRound: () => void;
  setLanguage: (lang: string) => void;
  setTotalRounds: (rounds: number) => void;
}

const WordplayContext = createContext<WordplayContextType | undefined>(
  undefined
);

export function WordplayProvider({
  children,
  roomCode,
}: {
  children: ReactNode;
  roomCode: string;
}) {
  const [game, setGame] = useState<WordplayGame | null>(null);
  const [player, setPlayer] = useState<WordplayPlayer | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const parseFirebaseState = (data: any): WordplayGame => {
     return {
        ...data,
        players: data.players ? Object.values(data.players) : [],
        sentences: data.sentences ? Object.values(data.sentences) : [],
        votes: data.votes || {},
        previousTemplates: data.previousTemplates || [],
     }
  }

  useEffect(() => {
    const gameRef = ref(db, `wordplay/${roomCode}`);
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
            router.push(`/wordplay`);
          }
        }
      } else {
        toast({
          title: 'Room has been closed',
          description: 'The game room is no longer available.',
        });
        setGame(null);
        setPlayer(null);
        router.push('/wordplay');
      }
    });

    return () => unsubscribe();
  }, [roomCode, router, toast, player]);

  const leaveGame = useCallback(async () => {
    if (!player || !game) return;

    const playerRef = ref(db, `wordplay/${roomCode}/players/${player.id}`);
    await remove(playerRef);

    const gameRef = ref(db, `wordplay/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) {
      setPlayer(null);
      router.push('/wordplay');
      return;
    }
    const currentPlayers = snapshot.val().players
      ? Object.values(snapshot.val().players)
      : [];

    if (currentPlayers.length === 0) {
      await remove(gameRef);
    } else if (player.isHost) {
      const newHostId = (currentPlayers[0] as WordplayPlayer).id;
      await update(ref(db, `wordplay/${roomCode}/players/${newHostId}`), {
        isHost: true,
      });
    }

    setPlayer(null);
    router.push('/wordplay');
  }, [player, game, roomCode, router]);

  const joinGame = useCallback(
    async (name: string) => {
      if (player) return;

      const playerId = `player_${Date.now()}`;
      const gameRef = ref(db, `wordplay/${roomCode}`);

      try {
        const snapshot = await get(gameRef);

        if (!snapshot.exists()) {
          toast({
            title: 'Error',
            description: 'Room does not exist.',
            variant: 'destructive',
          });
          router.push('/wordplay');
          return;
        }

        const currentPlayers = snapshot.val().players
          ? Object.values(snapshot.val().players)
          : [];

        if (currentPlayers.length >= 15) {
          toast({ title: 'Room is full', variant: 'destructive' });
          return;
        }

        const isHost = currentPlayers.length === 0;
        const newPlayer = createPlayer(playerId, name, isHost);

        const playerRef = ref(db, `wordplay/${roomCode}/players/${playerId}`);
        await set(playerRef, newPlayer);
        setPlayer(newPlayer);

        onDisconnect(playerRef)
          .remove()
          .then(async () => {
            const roomSnapshot = await get(gameRef);
            if (roomSnapshot.exists()) {
              const gameData = roomSnapshot.val();
              const remaining: WordplayPlayer[] = gameData.players
                ? Object.values(gameData.players)
                : [];
              if (remaining.length === 0) {
                remove(gameRef);
              } else if (!remaining.some((p) => p.isHost)) {
                if (remaining[0] && remaining[0].id) {
                  const newHostId = remaining[0].id;
                  update(
                    ref(db, `wordplay/${roomCode}/players/${newHostId}`),
                    { isHost: true }
                  );
                }
              }
            }
          });
      } catch (error) {
        console.error('Join game error:', error);
        toast({ title: 'Connection Error', variant: 'destructive' });
      }
    },
    [roomCode, player, router, toast]
  );
  
  const setLanguage = useCallback(async (lang: string) => {
    if (!game || !player?.isHost) return;
    await update(ref(db, `wordplay/${roomCode}`), { language: lang });
  }, [game, player, roomCode]);

  const setTotalRounds = useCallback(async (rounds: number) => {
    if (!game || !player?.isHost) return;
    await update(ref(db, `wordplay/${roomCode}`), { totalRounds: rounds });
  }, [game, player, roomCode]);

  const parseSentenceTemplate = (template: string): Blank[] => {
    const blankRegex = /\[(.*?)]/g;
    const blanks: Blank[] = [];
    let match;
    while ((match = blankRegex.exec(template)) !== null) {
      blanks.push({
        type: match[1] as BlankType,
        value: '',
        filledBy: null,
      });
    }
    return blanks;
  };


  const startNewRound = useCallback(async (currentGame: WordplayGame) => {
    try {
      const newSentences: Sentence[] = [];
      const previousTemplates = currentGame.previousTemplates || [];
      const updatedPreviousTemplates = [...previousTemplates];

      for (const p of currentGame.players) {
         const { template } = await generateSentence({ previousTemplates: updatedPreviousTemplates, language: currentGame.language });
         newSentences.push({
            id: p.id,
            template,
            blanks: parseSentenceTemplate(template),
            isComplete: false,
            authorId: p.id,
         });
         updatedPreviousTemplates.push(template);
      }

      await update(ref(db, `wordplay/${roomCode}`), {
        gameState: 'writing',
        currentRound: currentGame.currentRound + 1,
        sentences: newSentences.reduce((acc, s, i) => ({ ...acc, [s.id]: s }), {}),
        currentTurnPlayerId: currentGame.players[0].id,
        currentSentenceIndex: 0,
        currentBlankIndex: 0,
        votes: {},
        lastRoundWinner: null,
        previousTemplates: updatedPreviousTemplates,
      });

    } catch (error) {
       console.error('Failed to start new round:', error);
      toast({
        title: 'Failed to start round',
        description: 'Could not generate new sentences.',
        variant: 'destructive',
      });
    }
  }, [roomCode, toast])

  const startGame = useCallback(async () => {
    if (!game || !player?.isHost || game.players.length < 2) {
      toast({
        title: 'Not enough players',
        description: 'You need at least 2 players to start.',
        variant: 'destructive',
      });
      return;
    }
    await startNewRound(game);
  }, [game, player, startNewRound, toast]);
  
  const submitWord = async (word: string) => {
    if (
      !game ||
      !player ||
      game.gameState !== 'writing' ||
      game.currentTurnPlayerId !== player.id
    )
      return;

    const gameRef = ref(db, `wordplay/${roomCode}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) return;
    
    const currentGame = parseFirebaseState(snapshot.val());

    const { sentences, players, currentSentenceIndex, currentBlankIndex } = currentGame;
    const sentence = sentences[currentSentenceIndex];
    
    sentence.blanks[currentBlankIndex].value = word;
    sentence.blanks[currentBlankIndex].filledBy = player.id;
    
    // Find next turn
    let nextBlankIndex = currentBlankIndex + 1;
    let nextSentenceIndex = currentSentenceIndex;

    const currentPlayerIndex = players.findIndex(p => p.id === player.id);
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayerId = players[nextPlayerIndex].id;

    if (nextBlankIndex >= sentence.blanks.length) {
        sentence.isComplete = true;
        nextBlankIndex = 0;
        nextSentenceIndex = (currentSentenceIndex + 1);

        if (nextSentenceIndex >= sentences.length) {
            // All sentences are complete, move to voting
            await update(gameRef, {
                sentences: sentences.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}),
                gameState: 'voting',
            });
            return;
        }
    }
    
    await update(gameRef, {
        sentences: sentences.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}),
        currentTurnPlayerId: nextPlayerId,
        currentSentenceIndex: nextSentenceIndex,
        currentBlankIndex: nextBlankIndex,
    });
  };
  
  const castVote = async (sentenceId: string) => {
    if (!game || !player || game.gameState !== 'voting') return;
    
    const voteRef = ref(db, `wordplay/${roomCode}/votes/${player.id}`);
    await set(voteRef, sentenceId);
  };
  
  const nextRound = async () => {
    if (!game || !player?.isHost) return;
    if (game.currentRound >= game.totalRounds) {
        await update(ref(db, `wordplay/${roomCode}`), { gameState: 'gameOver' });
    } else {
        await startNewRound(game);
    }
  };
  
  // Game state transitions (host only)
  useEffect(() => {
    if (!game || !player?.isHost) return;

    if (game.gameState === 'voting') {
      const allPlayersVoted = game.players.length === Object.keys(game.votes).length;
      
      if (allPlayersVoted) {
        const voteCounts: Record<string, number> = {};
        Object.values(game.votes).forEach(sentenceId => {
            voteCounts[sentenceId] = (voteCounts[sentenceId] || 0) + 1;
        });
        
        const sortedVotes = Object.entries(voteCounts).sort((a,b) => b[1] - a[1]);
        const winningSentenceId = sortedVotes[0][0];
        const winningSentence = game.sentences.find(s => s.id === winningSentenceId);
        
        if (winningSentence) {
            const winner = game.players.find(p => p.id === winningSentence.authorId);
            if (winner) {
                const updatedWinner = { ...winner, score: winner.score + 1 };
                const playerUpdates: {[key: string]: any} = {};
                game.players.forEach(p => {
                    playerUpdates[p.id] = p.id === winner.id ? updatedWinner : p;
                });
                
                update(ref(db, `wordplay/${roomCode}`), {
                  gameState: 'results',
                  lastRoundWinner: updatedWinner,
                  players: playerUpdates
                });
            }
        }
      }
    }
  }, [game, player, roomCode]);

  const value = {
    game,
    player,
    joinGame,
    leaveGame,
    startGame,
    submitWord,
    castVote,
    nextRound,
    setLanguage,
    setTotalRounds
  };

  return (
    <WordplayContext.Provider value={value}>
      {children}
    </WordplayContext.Provider>
  );
}

export const useWordplay = () => {
  const context = useContext(WordplayContext);
  if (context === undefined) {
    throw new Error('useWordplay must be used within a WordplayProvider');
  }
  return context;
};
