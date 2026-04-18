import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { CropListing } from '@/types/api.types';

export type ListingFilters = {
  district?: string;
  crop?: string;
  grade?: string;
  sort?: string;
  page?: number;
  search?: string;
};

export function useCropListings(filters: ListingFilters) {
  return useQuery<{ data: CropListing[]; totalPages: number }>({
    queryKey: ['crop-listings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.district) params.set('district', filters.district);
      if (filters.crop) params.set('crop', filters.crop);
      if (filters.grade) params.set('grade', filters.grade);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.search) params.set('search', filters.search);

      const res = await api.get(`/v1/crop-listings?${params.toString()}`);
      const payload = res.data?.data ?? {};
      return {
        data: payload.data ?? payload.items ?? [],
        totalPages: payload.last_page ?? 1,
      };
    },
  });
}
