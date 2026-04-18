import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdvisoryTicket } from '@/types/api.types';

export function useAdvisoryTickets(status?: string) {
  return useQuery<AdvisoryTicket[]>({
    queryKey: ['advisory-tickets', status],
    queryFn: async () => {
      const url = status && status !== 'all' ? `/v1/admin/advisory-tickets?status=${status}` : '/v1/admin/advisory-tickets';
      const res = await api.get(url);
      return res.data?.data?.data ?? res.data?.data ?? [];
    },
  });
}
