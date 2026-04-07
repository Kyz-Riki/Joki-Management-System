import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-z0-9-]+$/, 'Hanya huruf kecil, angka, dan dash'),
  email: z.string().email('Email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  turnstileToken: z.string().min(1, 'Turnstile token diperlukan'),
  honeypot: z.string().max(0).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username diperlukan'),
  password: z.string().min(1, 'Password diperlukan'),
});

export const workerSchema = z.object({
  name: z.string().min(1, 'Nama diperlukan').max(50, 'Nama maksimal 50 karakter').trim(),
});

export const containerSchema = z.object({
  game_code: z.enum(['mlbb', 'val', 'ff', 'hsr', 'gi', 'aov', 'pubgm', 'cod']),
});

export const orderSchema = z.object({
  customer_name: z
    .string()
    .min(1, 'Nama customer diperlukan')
    .max(100, 'Nama customer maksimal 100 karakter')
    .trim(),
  details: z.string().max(500, 'Detail maksimal 500 karakter').optional(),
  worker_id: z.string().uuid('Worker ID tidak valid'),
});

export const statusActionSchema = z.object({
  action: z.enum(['process', 'complete', 'archive', 'reactivate']),
});

export type RegisterInput     = z.infer<typeof registerSchema>;
export type LoginInput        = z.infer<typeof loginSchema>;
export type WorkerInput       = z.infer<typeof workerSchema>;
export type ContainerInput    = z.infer<typeof containerSchema>;
export type OrderInput        = z.infer<typeof orderSchema>;
export type StatusActionInput = z.infer<typeof statusActionSchema>;
