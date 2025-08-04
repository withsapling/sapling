import { db } from '../db/db.js'
import { users, tokens, type User } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import type { DatabaseAdapter, CreateUserData } from '@sapling/auth'
import { createHash } from 'node:crypto'

export function createDatabaseAdapter(): DatabaseAdapter {
  return {
    async findUser(providerId: string, provider: string): Promise<User | null> {
      const column = provider === 'google' ? users.googleId : users.githubId
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(column, providerId))
        .limit(1)
      
      return user || null
    },

    async createUser(userData: CreateUserData): Promise<User> {
      const insertData: any = {
        email: userData.email,
        name: userData.name,
        avatarUrl: userData.avatar,
        lastLogin: new Date()
      }

      if (userData.provider === 'google') {
        insertData.googleId = userData.providerId
      } else if (userData.provider === 'github') {
        insertData.githubId = userData.providerId
      }

      const [user] = await db
        .insert(users)
        .values(insertData)
        .returning()

      return user
    },

    async updateUser(id: string, data: Partial<User>): Promise<User> {
      const [user] = await db
        .update(users)
        .set({ ...data, lastLogin: new Date() })
        .where(eq(users.id, id))
        .returning()

      return user
    },

    async createRefreshToken(userId: string, token: string): Promise<void> {
      const tokenHash = createHash('sha256').update(token).digest('hex')
      
      await db.insert(tokens).values({
        userId,
        tokenHash,
        tokenType: 'refresh',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })
    },

    async validateRefreshToken(token: string): Promise<{ userId: string } | null> {
      const tokenHash = createHash('sha256').update(token).digest('hex')
      
      const [tokenRecord] = await db
        .select()
        .from(tokens)
        .where(
          and(
            eq(tokens.tokenHash, tokenHash),
            eq(tokens.tokenType, 'refresh')
          )
        )
        .limit(1)

      if (!tokenRecord || tokenRecord.expiresAt < new Date() || tokenRecord.revokedAt) {
        return null
      }

      return { userId: tokenRecord.userId }
    },

    async revokeRefreshToken(token: string): Promise<void> {
      const tokenHash = createHash('sha256').update(token).digest('hex')
      
      await db
        .update(tokens)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(tokens.tokenHash, tokenHash),
            eq(tokens.tokenType, 'refresh')
          )
        )
    }
  }
}