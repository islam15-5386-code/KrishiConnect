'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Dialog, DialogPanel } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Badge, Button, Card, DataTable, PageHeader, StatCard } from '@/components/ui';
import { useAdvisoryTickets } from '@/hooks/useAdvisoryTickets';
import type { AdvisoryTicket } from '@/types/api.types';

const tabs = ['all', 'open', 'escalated', 'resolved'];

function statusVariant(status: string) {
  if (status === 'open') return 'info';
  if (status === 'escalated') return 'danger';
  return 'success';
}

function AdvisoryContent() {
  const router = useRouter();
  const [status, setStatus] = useState('all');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setStatus(params.get('status') || 'all');
  }, []);

  const { data: tickets = [], isLoading } = useAdvisoryTickets(status);
  const [selected, setSelected] = useState<AdvisoryTicket | null>(null);

  const escalatedCount = tickets.filter((t) => t.status === 'escalated').length;

  const columns = useMemo<ColumnDef<AdvisoryTicket>[]>(
    () => [
      { accessorKey: 'id', header: 'Ticket ID' },
      { accessorKey: 'farmer', header: 'Farmer' },
      { accessorKey: 'cropProblem', header: 'Crop/Problem' },
      { accessorKey: 'district', header: 'District' },
      {
        accessorKey: 'officerName',
        header: 'Assigned Officer',
        cell: ({ row }) => {
          const v = row.original.officerName;
          if (!v) {
            return (
              <div className="text-sm text-red-600">
                Unassigned <button className="ml-2 underline">Assign</button>
              </div>
            );
          }
          return <span>{v}</span>;
        },
      },
      { accessorKey: 'submittedAt', header: 'Submitted' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <Badge variant={statusVariant(row.original.status) as any}>{row.original.status}</Badge>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button variant="outline" className="px-2 py-1 text-xs" onClick={() => setSelected(row.original)}>
            View
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Advisory Tickets" subtitle="টিকিট স্ট্যাটাস, অফিসার এবং সমাধান পর্যবেক্ষণ" />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total tickets MTD" value={tickets.length.toLocaleString('bn-BD')} changeText="Month to date" />
        <StatCard label="Resolution rate %" value="87%" changeText="+3.2%" changeType="positive" />
        <StatCard label="Avg response time" value="2.8h" changeText="-0.5h" changeType="positive" />
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`rounded-md border px-3 py-1 text-sm ${status === tab ? 'border-krishi-dark bg-krishi-dark text-krishi-light' : 'border-krishi-border bg-white text-krishi-dark'}`}
              onClick={() => {
                setStatus(tab);
                router.push(`/admin/advisory?status=${tab}`);
              }}
            >
              {tab}
              {tab === 'escalated' && escalatedCount > 0 ? (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{escalatedCount.toLocaleString('bn-BD')}</span>
              ) : null}
            </button>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="h-80 animate-pulse rounded-lg border border-krishi-border bg-krishi-border" />
      ) : (
        <DataTable columns={columns} data={tickets} />
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/35" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-[600px] rounded-lg border border-krishi-border border-[0.5px] bg-white p-5">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-krishi-dark">Ticket #{selected.id.toLocaleString('bn-BD')}</h3>
                  <p className="text-sm text-krishi-muted">{selected.cropProblem}</p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-krishi-dark">Image Gallery</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(selected.images?.length ? selected.images : ['a', 'b', 'c']).map((img, idx) => (
                      <button key={idx} className="h-20 rounded-md border border-krishi-border bg-krishi-surface text-xs text-krishi-muted">
                        {typeof img === 'string' ? 'Image' : `Image ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-krishi-border border-[0.5px] p-3">
                  <p className="text-sm font-medium text-krishi-dark">Advisory thread</p>
                  <div className="mt-2 space-y-1 text-sm text-krishi-muted">
                    {(selected.thread || [{ sender: 'Officer', message: 'প্রাথমিক পরামর্শ প্রদান করা হয়েছে', timestamp: 'Now' }]).map((t, idx) => (
                      <p key={idx}>{t.sender}: {t.message}</p>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-krishi-dark">Assign officer</label>
                  <select className="w-full rounded-md border border-krishi-border border-[0.5px] px-3 py-2 text-sm">
                    <option>Officer A</option>
                    <option>Officer B</option>
                    <option>Officer C</option>
                  </select>
                </div>

                <div className="rounded-md border border-krishi-border border-[0.5px] p-3">
                  <p className="text-sm font-medium text-krishi-dark">Escalation history</p>
                  <p className="mt-1 text-sm text-krishi-muted">No escalation events recorded.</p>
                </div>
              </div>
            ) : null}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}

export default function AdminAdvisoryPage() {
  return (
    <ErrorBoundary>
      <AdvisoryContent />
    </ErrorBoundary>
  );
}
