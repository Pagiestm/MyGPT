import { http } from '../http/client';

export const userRepository = {
  updatePseudo: (pseudo: string) => http.patch('/users/profile/pseudo', { pseudo }),
  deleteAccount: () => http.delete('/users/profile'),
};
