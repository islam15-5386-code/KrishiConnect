import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api';

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'OTP',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          return null;
        }

        const response = await fetch(`${API_URL}/v1/auth/verify-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            phone_number: credentials.phone,
            code: credentials.otp,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const payload = await response.json();
        const data = payload?.data || payload;

        if (!data?.user || !data?.token) {
          return null;
        }

        return {
          id: String(data.user.id),
          name: data.user.full_name || data.user.name || `User ${data.user.id}`,
          role: data.user.role,
          sanctumToken: data.token,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.sanctumToken = (user as any).sanctumToken;
      }
      return token;
    },
    session({ session, token }) {
      (session as any).role = token.role;
      (session as any).sanctumToken = token.sanctumToken;
      return session;
    },
  },
});
