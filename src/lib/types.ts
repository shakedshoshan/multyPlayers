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
