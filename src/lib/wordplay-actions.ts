'use server';

import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import type { WordplayGame } from './types';

function generateRoomCode(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function createWordplayRoomAction(): Promise<string> {
  const roomCode = generateRoomCode(4);

  const initialGame: WordplayGame = {
    roomCode,
    players: [],
    gameState: 'lobby',
    sentences: [],
    currentRound: 0,
    totalRounds: 5, // Default rounds
    currentTurnPlayerId: null,
    votes: {},
    lastRoundWinner: null,
    previousTemplates: [],
    language: 'en',
  };

  const gameRef = ref(db, `wordplay/${roomCode}`);
  await set(gameRef, initialGame);

  return roomCode;
}
