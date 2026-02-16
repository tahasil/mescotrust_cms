import CredentialsProvider from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';
import dbConnect from './db';
import User from '../models/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await dbConnect();

        const user = await User.findOne({ email: credentials.email, isActive: true });
        if (!user) {
          throw new Error('Invalid email or password');
        }

        const isValid = await bcryptjs.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  secret: getNextAuthSecret(),
};

/** Same logic as getNextAuthSecret in middleware – use one place so dev works without .env. */
function getNextAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret !== 'your-secret-here') return secret;
  if (process.env.NODE_ENV === 'development') {
    console.warn('NEXTAUTH_SECRET not set; using dev fallback. Set it in .env.local for production.');
    return 'mescotrust-dev-secret-change-in-production';
  }
  console.error('NEXTAUTH_SECRET is required in production. Set it in .env.local (e.g. openssl rand -base64 32)');
  return secret;
}
