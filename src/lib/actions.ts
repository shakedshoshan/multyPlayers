'use server';

import { redirect } from 'next/navigation';

function generateRoomCode(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function createRoomAction() {
  const roomCode = generateRoomCode(4);
  redirect(`/game/${roomCode}`);
}
