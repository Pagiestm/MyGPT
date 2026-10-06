import { z } from 'zod';
import { pseudoSchema } from '@/shared/types/user';

export const profileSchema = z.object({ pseudo: pseudoSchema });

const strongPassword = z
  .string()
  .min(1, 'Le mot de passe est requis')
  .min(10, 'Le mot de passe doit contenir au minimum 10 caractères')
  .regex(
    /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/,
    'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractère spécial',
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: strongPassword,
});

export const changeEmailSchema = z.object({
  email: z.string().min(1, "L'email est requis").pipe(z.email('Email invalide')),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "L'email est requis").pipe(z.email('Email invalide')),
});

export const resetPasswordSchema = z.object({ password: strongPassword });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const preferencesSchema = z.object({
  customInstructions: z.string().max(2000, 'Les consignes ne peuvent pas dépasser 2000 caractères'),
  preferredModel: z.string().nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
