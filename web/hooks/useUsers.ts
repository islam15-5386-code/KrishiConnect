import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { User } from '@/types/api.types';

export function useUsers(role?: string) {
  return useQuery<User[]>({
    queryKey: ['users', role],
    queryFn: async () => {
      const url = role && role !== 'all' ? `/v1/admin/users?role=${role}` : '/v1/admin/users';
      const res = await api.get(url);
      return res.data?.data?.data ?? res.data?.data ?? [];
    },
  });
}
