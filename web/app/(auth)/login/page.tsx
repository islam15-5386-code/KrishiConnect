'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      phone,
      otp,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('লগইন ব্যর্থ হয়েছে');
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-krishi-surface p-4">
      <Card className="w-full max-w-md space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-medium text-krishi-dark">KrishiConnect Login</h1>
          <p className="mt-1 text-sm text-krishi-muted">OTP দিয়ে লগইন করুন</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-md border border-krishi-border border-[0.5px] px-3 py-2 text-sm text-krishi-dark outline-none"
            placeholder="+8801XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="w-full rounded-md border border-krishi-border border-[0.5px] px-3 py-2 text-sm text-krishi-dark outline-none"
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
