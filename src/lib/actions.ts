'use server';

import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import type { Game } from './types';

function generateRoomCode(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function createRoomAction(language: string = 'en'): Promise<string> {
  const roomCode = generateRoomCode(4);

  const initialGame: Game = {
    roomCode,
    players: [],
    gameState: 'lobby',
    category: '',
    round: 0,
    streak: 0,
    timer: 30, // ROUND_TIME
    answers: {},
    previousCategories: [],
    lastRoundSuccess: false,
    language: language,
  };

  const gameRef = ref(db, `rooms/${roomCode}`);
  await set(gameRef, initialGame);

  return roomCode;
}

    