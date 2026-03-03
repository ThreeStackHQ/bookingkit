import NextAuth, { type NextAuthResult } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, workspaces } from '@bookingkit/db';
import { eq } from 'drizzle-orm';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}

const result: NextAuthResult = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
        name: { type: 'text' },
        mode: { type: 'text' },
      },
      async authorize(credentials) {
        const creds = z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().optional(),
          mode: z.enum(['login', 'signup']).optional().default('login'),
        }).safeParse(credentials);

        if (!creds.success) return null;
        const { email, password, name, mode } = creds.data;

        if (mode === 'signup') {
          const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (existing.length > 0) return null;

          const passwordHash = await bcrypt.hash(password, 12);
          const [user] = await db.insert(users).values({
            email,
            name: name ?? email.split('@')[0],
            passwordHash,
          }).returning();

          const baseSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
          const slug = baseSlug + '-' + Math.random().toString(36).slice(2, 6);
          await db.insert(workspaces).values({
            ownerId: user.id,
            name: (name ?? email.split('@')[0]) + "'s Workspace",
            slug,
            plan: 'free',
          });

          return { id: user.id, email: user.email, name: user.name };
        }

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login', newUser: '/signup' },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});

export const handlers: NextAuthResult['handlers'] = result.handlers;
export const auth: NextAuthResult['auth'] = result.auth;
export const signIn: NextAuthResult['signIn'] = result.signIn;
export const signOut: NextAuthResult['signOut'] = result.signOut;
