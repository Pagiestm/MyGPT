import { z } from 'zod';

export interface Folder {
  id: string;
  name: string;
  instructions: string | null;
}

export const folderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom du dossier est requis')
    .max(60, 'Le nom du dossier ne peut pas dépasser 60 caractères'),
  instructions: z.string().max(2000, 'Les consignes ne peuvent pas dépasser 2000 caractères'),
});

export type FolderInput = z.infer<typeof folderSchema>;
