import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createServiceClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'メールアドレス',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const supabase = createServiceClient()
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (!user || !user.password_hash) return null

        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const supabase = createServiceClient()
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email!)
          .single()

        if (!existing) {
          await supabase.from('users').insert({
            email: user.email,
            name: user.name,
            avatar_url: user.image,
            provider: 'google',
          })
        }
      }
      return true
    },
  },
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
    }
  }
}
