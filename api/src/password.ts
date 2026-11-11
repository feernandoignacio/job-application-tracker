import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Transforma a senha num "hash": um código que não dá para desfazer
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// Confere se a senha digitada gera o mesmo hash que está guardado
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const storedHash = Buffer.from(hash, 'hex');
  const testHash = scryptSync(password, salt, 64);
  return timingSafeEqual(storedHash, testHash);
}
