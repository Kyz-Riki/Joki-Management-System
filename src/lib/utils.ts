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
export function slugifyGameName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // hapus karakter non-alphanumeric kecuali spasi & dash
    .replace(/\s+/g, '-')          // spasi → dash
    .replace(/-+/g, '-')           // multiple dash → single dash
    .replace(/^-|-$/g, '');        // trim leading/trailing dash
}
