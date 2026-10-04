import { z } from 'zod';

export interface User {
  pseudo: string;
  email: string;
  customInstructions?: string | null;
  preferredModel?: string | null;
}

// Mêmes règles que les DTO du serveur (class-validator)
export const PASSWORD_PATTERN =
  /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/;

export const PASSWORD_RULES = [
  { label: '10 caractères minimum', test: (value: string) => value.length >= 10 },
  { label: 'Une majuscule', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Un chiffre', test: (value: string) => /[0-9]/.test(value) },
  {
    label: 'Un caractère spécial',
    test: (value: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value),
  },
];

const email = z.string().min(1, "L'email est requis").pipe(z.email('Email invalide'));

const password = z
  .string()
  .min(1, 'Le mot de passe est requis')
  .min(10, 'Le mot de passe doit contenir au minimum 10 caractères')
  .regex(
    PASSWORD_PATTERN,
    'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractère spécial',
  );

export const pseudoSchema = z
  .string()
  .trim()
  .min(1, 'Le pseudo est requis')
  .min(3, 'Le pseudo doit contenir entre 3 et 20 caractères')
  .max(20, 'Le pseudo doit contenir entre 3 et 20 caractères');

export const loginSchema = z.object({ email, password });
export const registerSchema = z.object({ email, pseudo: pseudoSchema, password });
export const profileSchema = z.object({ pseudo: pseudoSchema });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

export const preferencesSchema = z.object({
  customInstructions: z.string().max(2000, 'Les consignes ne peuvent pas dépasser 2000 caractères'),
  preferredModel: z.string().nullable(),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;
