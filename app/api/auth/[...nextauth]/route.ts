import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { User } from '@/lib/types'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('NextAuth: authorize function called with credentials:', {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
          email: credentials?.email
        })

        if (!credentials?.email || !credentials?.password) {
          console.log('NextAuth: Missing credentials')
          return null
        }

        try {
          console.log('NextAuth: Making API call to backend')
          const response = await fetch('https://hedera-quests.com/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          console.log('NextAuth: API response :', response)
          console.log('NextAuth: API response headers:', Object.fromEntries(response.headers.entries()))

          if (!response.ok) {
            const errorText = await response.text()
            console.log('NextAuth: API error response:', errorText)
            return null
          }

          const data = await response.json()
          console.log('NextAuth: API response data:', JSON.stringify(data, null, 2))

          if (!data.token) {
            console.log('NextAuth: No token in response')
            return null
          }

          const isAdmin = data.is_admin || false

          // Create comprehensive user object from response data
          const userData: User = {
            id: String(data.admin?.id || data.user?.id || Date.now()),
            firstName: data.admin?.firstName || data.user?.firstName,
            lastName: data.admin?.lastName || data.user?.lastName,
            username: data.admin?.username || data.user?.username,
            name: (() => {
              if (isAdmin) {
                const firstName = data.admin?.firstName || '';
                const lastName = data.admin?.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                return fullName || data.admin?.username?.replace(/\[.*?\]/g, '').trim() || 'Admin';
              } else {
                const firstName = data.user?.firstName || '';
                const lastName = data.user?.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                return fullName || data.user?.username?.replace(/\[.*?\]/g, '').trim() || 'User';
              }
            })(),
            email: data.admin?.email || data.user?.email || credentials.email,
            bio: data.admin?.bio || data.user?.bio || '',
            avatar: '/logo.png',
            hederaAccountId: null,
            points: isAdmin ? undefined : (data.admin?.total_points || data.user?.total_points || 0),
            level: data.admin?.userLevel?.level || data.user?.userLevel?.level || 1,
            streak: 0,
            joinedAt: data.admin?.created_at || data.user?.created_at || new Date().toISOString(),
            role: isAdmin ? 'admin' : 'user',
            badges: [],
            completedQuests: [],
            userLevel: data.admin?.userLevel || data.user?.userLevel,
            facebookProfile: data.admin?.facebookProfile || data.user?.facebookProfile,
            twitterProfile: data.admin?.twitterProfile || data.user?.twitterProfile,
            discordProfile: data.admin?.discordProfile || data.user?.discordProfile
          };

          return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            image: userData.avatar,
            role: userData.role,
            token: data.token,
            isAdmin,
            userData,
          } as any
        } catch (error) {
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      console.log('NextAuth: JWT callback called', { hasUser: !!user, tokenKeys: Object.keys(token) })
      if (user) {
        token.role = user.role
        token.token = user.token
        token.isAdmin = user.isAdmin
        token.userData = user.userData
        console.log('NextAuth: JWT token updated with user data', { hasUserData: !!user.userData })
      }
      return token
    },
    async session({ session, token }: any) {
      console.log('NextAuth: Session callback called', {
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : [],
        sessionKeys: session ? Object.keys(session) : [],
        hasSessionUser: !!(session && session.user)
      })

      if (token) {
        // Ensure session.user exists
        if (!session.user) {
          session.user = {} as any
        }

        session.user.id = token.sub || token.id
        session.user.role = token.role as string
        session.user.token = token.token as string
        session.user.isAdmin = token.isAdmin as boolean
        session.user.userData = token.userData

        console.log('NextAuth: Session updated with token data', {
          userId: session.user.id,
          userRole: session.user.role,
          hasToken: !!session.user.token,
          hasUserData: !!session.user.userData,
          userDataKeys: session.user.userData ? Object.keys(session.user.userData) : []
        })
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
}

const handler = NextAuth(authOptions)

console.log('NextAuth handler created')

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }