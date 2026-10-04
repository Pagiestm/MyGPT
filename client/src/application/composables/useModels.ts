import { useQuery } from '@pinia/colada';
import { chatRepository } from '@/infrastructure/repositories/chat.repository';
import { queryKeys } from '../queryKeys';

export function useModels() {
  return useQuery({
    key: queryKeys.models,
    query: chatRepository.models,
    staleTime: Infinity,
  });
}
