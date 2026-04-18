import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    role?: string;
    sanctumToken?: string;
    user: {
      id?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
    sanctumToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    sanctumToken?: string;
  }
}
