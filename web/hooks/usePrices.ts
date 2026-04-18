import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PriceData } from '@/types/api.types';

export function usePrices() {
  return useQuery<PriceData[]>({
    queryKey: ['prices'],
    queryFn: async () => {
      const res = await api.get('/v1/prices');
      return res.data?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
