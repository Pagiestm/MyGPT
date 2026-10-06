import { z } from 'zod';

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface AccountSummary {
  id: string;
  email: string;
  pseudo: string;
  role: UserRole;
  created_at: string;
}

export interface User {
  pseudo: string;
  email: string;
  role: UserRole;
  customInstructions?: string | null;
  preferredModel?: string | null;
}

export interface Credentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface Registration extends Credentials {
  pseudo: string;
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

export const pseudoSchema = z
  .string()
  .trim()
  .min(1, 'Le pseudo est requis')
  .min(3, 'Le pseudo doit contenir entre 3 et 20 caractères')
  .max(20, 'Le pseudo doit contenir entre 3 et 20 caractères');
