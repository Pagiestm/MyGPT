import { z } from 'zod';
import { pseudoSchema } from '@/shared/types/user';

export const profileSchema = z.object({ pseudo: pseudoSchema });

export const preferencesSchema = z.object({
  customInstructions: z.string().max(2000, 'Les consignes ne peuvent pas dépasser 2000 caractères'),
  preferredModel: z.string().nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
