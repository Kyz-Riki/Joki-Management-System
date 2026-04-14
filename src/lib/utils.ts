import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mengubah nama game menjadi slug aman untuk URL dan game_code.
 * Contoh: "Mobile Legends: Bang Bang" → "mobile-legends-bang-bang"
 * Contoh: "Clash of Clans!" → "clash-of-clans"
 */
/**
 * Menghasilkan UID order 6 karakter alphanumeric uppercase.
 * Karakter ambigu (0, O, I, 1) dihilangkan agar mudah dibaca.
 * Contoh output: "A3F9KL"
 */
export function generateOrderUid(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0, O, I, 1
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

export function slugifyGameName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // hapus karakter non-alphanumeric kecuali spasi & dash
    .replace(/\s+/g, '-')          // spasi → dash
    .replace(/-+/g, '-')           // multiple dash → single dash
    .replace(/^-|-$/g, '');        // trim leading/trailing dash
}
