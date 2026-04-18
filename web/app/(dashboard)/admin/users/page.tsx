'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Badge, Button, Card, DataTable, PageHeader, StatCard } from '@/components/ui';
import { useUsers } from '@/hooks/useUsers';
import type { User } from '@/types/api.types';
import api from '@/lib/api';

const roleTabs = ['all', 'farmers', 'officers', 'companies', 'vendors'];

function roleToApi(role: string) {
  if (role === 'farmers') return 'farmer';
  if (role === 'officers') return 'officer';
  if (role === 'companies') return 'company';
  if (role === 'vendors') return 'vendor';
  return 'all';
}

function UsersContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [role, setRole] = useState('all');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setRole(params.get('role') || 'all');
  }, []);

  const { data: users = [], isLoading } = useUsers(roleToApi(role));

  const mutation = useMutation({
    mutationFn: async (payload: { id: number; action: 'verify' | 'suspend' | 'restore' }) => {
      const endpoint = payload.action === 'verify' ? 'verify' : 'suspend';
      return api.patch(`/v1/admin/users/${payload.id}/${endpoint}`, {
        action: payload.action,
      });
    },
    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previous = queryClient.getQueriesData({ queryKey: ['users'] });

      queryClient.setQueriesData({ queryKey: ['users'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((u: User) => {
          if (u.id !== id) return u;
          if (action === 'verify') return { ...u, status: 'active' };
          if (action === 'suspend') return { ...u, status: 'suspended' };
          return { ...u, status: 'active' };
        });
      });

      return { previous };
    },
    onError: (_error, _payload, context) => {
      context?.previous?.forEach(([key, value]: any) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'phone', header: 'Phone' },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const roleValue = row.original.role;
          return <Badge variant={roleValue as any}>{roleValue}</Badge>;
        },
      },
      { accessorKey: 'district', header: 'District' },
      { accessorKey: 'joinedAt', header: 'Joined' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const variant = status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'danger';
          return <Badge variant={variant as any}>{status}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex gap-2">
              <Button variant="outline" className="px-2 py-1 text-xs">View</Button>
              {user.status === 'pending' ? (
                <Button className="px-2 py-1 text-xs" onClick={() => mutation.mutate({ id: user.id, action: 'verify' })}>Verify</Button>
              ) : null}
              {user.status === 'suspended' ? (
                <Button variant="outline" className="px-2 py-1 text-xs" onClick={() => mutation.mutate({ id: user.id, action: 'restore' })}>Restore</Button>
              ) : (
                <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => mutation.mutate({ id: user.id, action: 'suspend' })}>Suspend</Button>
              )}
            </div>
          );
        },
      },
    ],
    [mutation]
  );

  const total = users.length;
  const pending = users.filter((u) => u.status === 'pending').length;
  const suspended = users.filter((u) => u.status === 'suspended').length;

  return (
    <div className="space-y-4">
      <PageHeader title="Admin Users" subtitle="ব্যবহারকারী ভেরিফাই ও স্ট্যাটাস নিয়ন্ত্রণ" />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total users" value={total.toLocaleString('bn-BD')} changeText="Current" />
        <StatCard label="Pending verification" value={pending.toLocaleString('bn-BD')} changeText="Needs attention" changeType="negative" />
        <StatCard label="Suspended" value={suspended.toLocaleString('bn-BD')} changeText="Restricted accounts" changeType="negative" />
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          {roleTabs.map((tab) => (
            <button
              key={tab}
              className={`rounded-md border px-3 py-1 text-sm ${role === tab ? 'border-krishi-dark bg-krishi-dark text-krishi-light' : 'border-krishi-border bg-white text-krishi-dark'}`}
              onClick={() => {
                setRole(tab);
                router.push(`/admin/users?role=${tab}`);
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="h-80 animate-pulse rounded-lg border border-krishi-border bg-krishi-border" />
      ) : (
        <DataTable columns={columns} data={users} />
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ErrorBoundary>
      <UsersContent />
    </ErrorBoundary>
  );
}
