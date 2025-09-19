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
