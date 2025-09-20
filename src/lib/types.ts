export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  isBot: boolean;
};

export type GameState = 'lobby' | 'playing' | 'revealing' | 'results';

// Use a Record for answers to be Firebase-friendly
export type Answers = Record<string, string>;

export type Game = {
  roomCode: string;
  players: Player[];
  gameState: GameState;
  category: string;
  round: number;
  streak: number;
  timer: number;
  answers: Answers;
  previousCategories: string[];
  lastRoundSuccess: boolean;
  language: string;
};

// Types for The Impostor's Riddle
export type RiddlePlayer = {
    id: string;
    name: string;
    isHost: boolean;
    isImpostor: boolean;
    votedFor: string | null; // Player ID they voted for
};

export type RiddleGameState = 'lobby' | 'voting' | 'reveal';

export type RiddleGame = {
    roomCode: string;
    players: RiddlePlayer[];
    gameState: RiddleGameState;
    category: string;
    secretWord: string;
    timer: number; // 10 minutes = 600 seconds
    votes: Record<string, string>; // Voter ID -> Voted Player ID
    winner: 'knowers' | 'impostor' | null;
    previousWords: string[];
};

// Types for Wordplay
export type WordplayPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
};

export type WordplayGameState = 'lobby' | 'writing' | 'voting' | 'results';

export type Blank = {
  type: 'adjective' | 'noun' | 'verb' | 'adverb' | 'plural noun';
  value: string;
  filledBy: string | null; // Player ID
};

export type Sentence = {
  template: string; // "The [adjective] [noun] [verb]s."
  blanks: Blank[];
  isComplete: boolean;
};

export type WordplayGame = {
  roomCode: string;
  players: WordplayPlayer[];
  gameState: WordplayGameState;
  sentences: Sentence[]; // One per player
  currentRound: number;
  currentTurnPlayerId: string | null; // Player ID of whose turn it is
  votes: Record<string, string>; // Voter ID -> Voted-for Player ID
};
