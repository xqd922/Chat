import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { Pool } from 'pg'

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 1 * 60 * 60, // Cache duration in seconds
    },
  },
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
  },
})
