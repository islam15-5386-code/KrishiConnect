'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Badge, Button, Card, PageHeader, SlideOver } from '@/components/ui';
import { useCropListings } from '@/hooks/useCropListings';
import type { CropListing } from '@/types/api.types';
import api from '@/lib/api';

type Filters = {
  search: string;
  district: string;
  crop: string;
  grade: string;
  sort: string;
  page: number;
};

const gradeClass: Record<string, string> = {
  A: 'bg-yellow-100 text-yellow-900',
  B: 'bg-amber-100 text-amber-900',
  C: 'bg-gray-100 text-gray-700',
};

function CropListingsContent() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>({ search: '', district: '', crop: '', grade: '', sort: '', page: 1 });
  const [selected, setSelected] = useState<CropListing | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pickup, setPickup] = useState('Jatrabari warehouse pickup within 24h.');

  const { data, isLoading } = useCropListings(filters);

  const listings = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const mutation = useMutation({
    mutationFn: async (payload: { listingId: number; price: string; qty: string; logistics: string }) => {
      return api.post(`/v1/crop-listings/${payload.listingId}/offers`, {
        offered_price_per_kg: Number(payload.price),
        quantity_kg: Number(payload.qty),
        pickup_logistics: payload.logistics,
      });
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['crop-listings'] });
      const previous = queryClient.getQueriesData({ queryKey: ['crop-listings'] });

      queryClient.setQueriesData({ queryKey: ['crop-listings'] }, (old: any) => {
        if (!old?.data) {
          return old;
        }
        return {
          ...old,
          data: old.data.map((item: CropListing) => (item.id === payload.listingId ? { ...item, hasOffer: true } : item)),
        };
      });

      return { previous };
    },
    onError: (_error, _payload, context) => {
      context?.previous?.forEach(([key, value]: any) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-listings'] });
    },
  });

  const pagination = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  return (
    <div className="space-y-4">
      <PageHeader title="Crop Listings" subtitle="জেলা, গ্রেড ও বাজারদরের উপর ভিত্তি করে আলোচনা শুরু করুন" />

      <Card>
        <div className="grid gap-2 md:grid-cols-5">
          <input
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
            placeholder="Search"
            className="rounded-md border border-krishi-border border-[0.5px] px-3 py-2 text-sm"
          />
          {['district', 'crop', 'grade', 'sort'].map((key) => (
            <select
              key={key}
              value={(filters as any)[key]}
              onChange={(e) => setFilters((p) => ({ ...p, [key]: e.target.value, page: 1 }))}
              className="rounded-md border border-krishi-border border-[0.5px] px-3 py-2 text-sm"
            >
              <option value="">{key}</option>
              <option value="Dhaka">Dhaka</option>
              <option value="Rajshahi">Rajshahi</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="latest">latest</option>
            </select>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-lg border border-krishi-border bg-krishi-border" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((item) => {
            const delta = item.marketBenchmark - item.askingPrice;
            const isBelow = delta > 0;
            return (
              <Card key={item.id} className="space-y-3">
                <div className="h-24 rounded-md bg-emerald-100" />
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-krishi-dark">{item.cropNameBn}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs ${gradeClass[item.grade] || gradeClass.C}`}>Grade {item.grade}</span>
                </div>
                <p className="text-sm text-krishi-muted">
                  {item.farmerName} | {item.district} | {item.quantityKg.toLocaleString('bn-BD')} kg
                </p>
                <Badge variant={isBelow ? 'success' : 'danger'}>
                  ৳ {Math.abs(delta).toLocaleString('bn-BD')} {isBelow ? 'below market' : 'above market'}
                </Badge>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">View details</Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setSelected(item);
                      setOfferPrice(String(item.askingPrice));
                      setQuantity(String(item.quantityKg));
                    }}
                  >
                    Negotiate
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {pagination.map((p) => (
          <button
            key={p}
            className={`rounded-md border px-3 py-1.5 text-sm ${p === filters.page ? 'border-krishi-dark bg-krishi-dark text-krishi-light' : 'border-krishi-border bg-white text-krishi-dark'}`}
            onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
          >
            {p.toLocaleString('bn-BD')}
          </button>
        ))}
      </div>

      <SlideOver open={!!selected} onClose={() => setSelected(null)} title="Negotiate Offer">
        {selected ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-krishi-border border-[0.5px] bg-krishi-surface p-3 text-sm text-krishi-dark">
              <p>{selected.cropNameBn}</p>
              <p className="text-krishi-muted">Benchmark: ৳ {selected.marketBenchmark.toLocaleString('bn-BD')} /kg</p>
            </div>

            <input
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              className="w-full rounded-md border border-krishi-border border-[0.5px] px-3 py-2 text-sm"
              placeholder="Price / kg"
            />
            <input
              value={quantity}
              max={selected.quantityKg}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-md border border-krishi-border border-[0.5px] px-3 py-2 text-sm"
              placeholder="Quantity kg"
            />
            <textarea
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="h-24 w-full rounded-md border border-krishi-border border-[0.5px] px-3 py-2 text-sm"
              placeholder="Pickup logistics"
            />

            <div className="rounded-md border border-krishi-border border-[0.5px] p-3">
              <p className="text-xs text-krishi-muted">Negotiation history</p>
              <p className="mt-1 text-sm text-krishi-dark">No previous offer thread.</p>
            </div>

            <Button
              className="w-full"
              onClick={() =>
                mutation.mutate({
                  listingId: selected.id,
                  price: offerPrice,
                  qty: quantity,
                  logistics: pickup,
                })
              }
            >
              Submit Offer
            </Button>
          </div>
        ) : null}
      </SlideOver>
    </div>
  );
}

export default function CropListingsPage() {
  return (
    <ErrorBoundary>
      <CropListingsContent />
    </ErrorBoundary>
  );
}
