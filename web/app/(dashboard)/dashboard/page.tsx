'use client';

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Card, PageHeader, StatCard } from '@/components/ui';
import { usePrices } from '@/hooks/usePrices';

const chartData = [
  { day: 'Sat', procurement: 180 },
  { day: 'Sun', procurement: 120 },
  { day: 'Mon', procurement: 260 },
  { day: 'Tue', procurement: 210 },
  { day: 'Wed', procurement: 280 },
  { day: 'Thu', procurement: 195 },
  { day: 'Fri', procurement: 300 },
];

const activities = [
  { text: 'নতুন আলোচনার অনুরোধ এসেছে', at: new Date(Date.now() - 1000 * 60 * 8), color: 'bg-krishi-green' },
  { text: 'ধান তালিকা আপডেট করা হয়েছে', at: new Date(Date.now() - 1000 * 60 * 42), color: 'bg-krishi-yellow' },
  { text: 'চুক্তি সফলভাবে সম্পন্ন হয়েছে', at: new Date(Date.now() - 1000 * 60 * 90), color: 'bg-emerald-500' },
  { text: 'মূল্য সতর্কতা পাঠানো হয়েছে', at: new Date(Date.now() - 1000 * 60 * 140), color: 'bg-blue-500' },
];

function DashboardContent() {
  const { data: prices, isLoading } = usePrices();

  const stats = useMemo(
    () => [
      { label: 'Total procurement BDT', value: '৳ 14,20,000', changeText: '+8.3% this week', changeType: 'positive' as const },
      { label: 'Active listings', value: '86', changeText: '+12 new', changeType: 'positive' as const },
      { label: 'Pending negotiations', value: '19', changeText: '-3 from yesterday', changeType: 'neutral' as const },
      { label: 'Completed deals', value: '52', changeText: '+6 completed', changeType: 'positive' as const },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Company Dashboard" subtitle="প্রতিদিনের সংগ্রহ, বাজারদর এবং কার্যক্রম" />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-base font-medium text-krishi-dark">7-Day Procurement</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap={18}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#5A9A5A', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#F4F8F4' }}
                  contentStyle={{ borderRadius: 10, borderColor: '#D8ECD8', borderWidth: 0.5 }}
                />
                <Bar
                  dataKey="procurement"
                  radius={[6, 6, 0, 0]}
                  fill="#C0DD97"
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const isHigh = payload.procurement >= 260;
                    return (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={isHigh ? '#4ADE80' : '#C0DD97'}
                        rx={6}
                      />
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-base font-medium text-krishi-dark">Market Price Table</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-10 animate-pulse rounded-md bg-krishi-border" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-krishi-border border-[0.5px]">
              <table className="w-full text-sm">
                <thead className="bg-krishi-surface">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-krishi-dark">Crop</th>
                    <th className="px-3 py-2 text-left font-medium text-krishi-dark">Price/kg</th>
                    <th className="px-3 py-2 text-left font-medium text-krishi-dark">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {(prices || []).map((p: any, i: number) => {
                    const positive = Number(p.changePercent || 0) >= 0;
                    return (
                      <tr key={`${p.crop}-${i}`} className="border-t border-krishi-border border-[0.5px]">
                        <td className="px-3 py-2 text-krishi-dark">{p.crop}</td>
                        <td className="px-3 py-2 text-krishi-dark">৳ {Number(p.pricePerKg || 0).toLocaleString('bn-BD')}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-1 text-xs ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {positive ? '▲' : '▼'} {Math.abs(Number(p.changePercent || 0)).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-base font-medium text-krishi-dark">Activity Feed</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {activities.map((a, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-md border border-krishi-border border-[0.5px] bg-krishi-surface p-3">
              <span className={`h-2.5 w-2.5 rounded-full ${a.color}`} />
              <div className="flex-1">
                <p className="text-sm text-krishi-dark">{a.text}</p>
                <p className="text-xs text-krishi-muted">{formatDistanceToNow(a.at, { addSuffix: true })}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
