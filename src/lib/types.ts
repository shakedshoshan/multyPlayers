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

export type BlankType = 'blank';

export type Blank = {
  type: BlankType;
  value: string; // The word filled in by a player
  filledBy: string | null; // Player ID
};

export type Sentence = {
  id: string; // Unique ID for the sentence, e.g., player ID who it belongs to
  template: string; // "The quick brown [blank] jumps over the lazy dog."
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
  timer: number;
  // Record<voterId, sentenceId>
  votes: Record<string, string>; 
  lastRoundWinner: WordplayPlayer | null;
  previousTemplates: string[];
  language: string;
};

// Types for Elias
export type EliasPlayer = {
  id: string;
  name: string;
  isHost: boolean;
};

export type Pair = {
  id: string;
  player1Id: string;
  player2Id: string;
  score: number;
  clueGiverId?: string; // transient, for the current round
  guesserId?: string; // transient, for the current round
};

export type EliasGameState = 'lobby' | 'playing' | 'summary' | 'gameOver';

export type EliasGame = {
  roomCode: string;
  players: EliasPlayer[];
  pairs: Pair[];
  gameState: EliasGameState;
  language: string;
  targetScore: number;
  timer: number;
  words: string[];
  previousWords: string[];
  currentWordIndex: number;
  roundSuccesses: number;
  roundFails: number;
  currentPairIndex: number;
  currentPairId: string;
  lastTurnByPair: Record<string, string>; // Maps pairId to the last clueGiverId
};
