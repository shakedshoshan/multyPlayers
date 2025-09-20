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
    winner: 'knowers' | 'impostor' | null;
    previousWords: string[];
    language: string;
};

// Types for Wordplay
export type WordplayPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
};

export type WordplayGameState = 'lobby' | 'writing' | 'voting' | 'results' | 'gameOver';

export type BlankType = 'adjective' | 'noun' | 'verb' | 'adverb' | 'plural noun';

export type Blank = {
  type: BlankType;
  value: string; // The word filled in by a player
  filledBy: string | null; // Player ID
};

export type Sentence = {
  id: string; // Unique ID for the sentence, e.g., player ID who it belongs to
  template: string; // "The [adjective] [noun] [verb]s."
  blanks: Blank[];
  isComplete: boolean;
  authorId: string;
};

export type WordplayGame = {
  roomCode: string;
  players: WordplayPlayer[];
  gameState: WordplayGameState;
  sentences: Sentence[];
  currentRound: number;
  totalRounds: number;
  // Player ID of whose turn it is to fill a blank
  currentTurnPlayerId: string | null; 
  // Index of the sentence being filled
  currentSentenceIndex: number; 
  // Index of the blank being filled
  currentBlankIndex: number;
  // Record<voterId, sentenceId>
  votes: Record<string, string>; 
  lastRoundWinner: WordplayPlayer | null;
  previousTemplates: string[];
  language: string;
};
