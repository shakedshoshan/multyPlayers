'use server';

import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import type { EliasGame } from './types';

function generateRoomCode(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function createEliasRoomAction(): Promise<string> {
  const roomCode = generateRoomCode(4);

  const initialGame: EliasGame = {
    roomCode,
    players: [],
    pairs: [],
    gameState: 'lobby',
    language: 'en',
    targetScore: 30,
    timer: 60,
    words: [],
    previousWords: [],
    currentWordIndex: 0,
    roundSuccesses: 0,
    roundFails: 0,
    currentPairIndex: 0,
    currentPairId: '',
    lastTurnByPair: {},
  };

  const gameRef = ref(db, `elias/${roomCode}`);
  await set(gameRef, initialGame);

  return roomCode;
}
