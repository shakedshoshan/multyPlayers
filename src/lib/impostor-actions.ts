'use server';

import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import type { RiddleGame } from './types';

function generateRoomCode(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function createRoomAction(): Promise<string> {
  const roomCode = generateRoomCode(4);

  const initialGame: RiddleGame = {
    roomCode,
    players: [],
    gameState: 'lobby',
    category: '',
    secretWord: '',
    timer: 600, // 10 minutes
    votes: {},
    winner: null,
    previousWords: [],
    language: 'en',
  };

  const gameRef = ref(db, `impostor-riddles/${roomCode}`);
  await set(gameRef, initialGame);

  return roomCode;
}
