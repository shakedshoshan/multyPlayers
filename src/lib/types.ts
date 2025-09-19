export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  isBot: boolean;
};

export type GameState = 'lobby' | 'playing' | 'revealing' | 'results';

export type Game = {
  roomCode: string;
  players: Player[];
  gameState: GameState;
  category: string;
  round: number;
  streak: number;
  timer: number;
  answers: Map<string, string>;
  previousCategories: string[];
  lastRoundSuccess: boolean;
  language: string;
};
