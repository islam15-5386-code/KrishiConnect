import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-krishi-surface">
      <Sidebar />
      <main className="ml-[180px] flex-1 overflow-y-auto bg-krishi-surface p-5">{children}</main>
    </div>
  );
}
