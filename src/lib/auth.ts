import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const allowedEmails = (process.env.ALLOWED_EMAILS || 'janskifura@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      const email = user.email.toLowerCase();
      return allowedEmails.includes(email);
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
