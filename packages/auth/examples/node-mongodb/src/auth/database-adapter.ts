import { getDatabase } from '../db/db.js'
import { type User, type Token, type NewUser, type NewToken } from '../db/schema.js'
import type { DatabaseAdapter, CreateUserData } from '@sapling/auth'
import { createHash } from 'node:crypto'
import { ObjectId } from 'mongodb'

export function createDatabaseAdapter(): DatabaseAdapter {
  return {
    async findUser(providerId: string, provider: string): Promise<User | null> {
      const db = await getDatabase()
      const usersCollection = db.collection<User>('users')
      
      // If providerId looks like a MongoDB ObjectId or UUID, search by user ID
      if (providerId.match(/^[0-9a-f]{24}$/i) || providerId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const user = await usersCollection.findOne({ 
          $or: [
            { _id: new ObjectId(providerId) },
            { id: providerId }
          ]
        })
        
        if (user) {
          user.id = user._id?.toString()
        }
        
        return user || null
      }
      
      const query = provider === 'google' 
        ? { googleId: providerId }
        : { githubId: providerId }
      
      const user = await usersCollection.findOne(query)
      
      if (user) {
        user.id = user._id?.toString()
      }
      
      return user || null
    },

    async createUser(userData: CreateUserData): Promise<User> {
      const db = await getDatabase()
      const usersCollection = db.collection<User>('users')
      
      const insertData: NewUser = {
        email: userData.email,
        name: userData.name,
        avatarUrl: userData.avatar,
        role: 'user',
        createdAt: new Date(),
        lastLogin: new Date()
      }

      if (userData.provider === 'google') {
        insertData.googleId = userData.providerId
      } else if (userData.provider === 'github') {
        insertData.githubId = userData.providerId
      }

      const result = await usersCollection.insertOne(insertData as User)
      const user = await usersCollection.findOne({ _id: result.insertedId })
      
      if (!user) {
        throw new Error('Failed to create user')
      }
      
      user.id = user._id?.toString()
      return user
    },

    async updateUser(id: string, data: Partial<User>): Promise<User> {
      const db = await getDatabase()
      const usersCollection = db.collection<User>('users')
      
      const query = id.match(/^[0-9a-f]{24}$/i)
        ? { _id: new ObjectId(id) }
        : { id: id }
      
      const updateData = { ...data, lastLogin: new Date() }
      delete updateData._id
      delete updateData.id
      
      await usersCollection.updateOne(query, { $set: updateData })
      
      const user = await usersCollection.findOne(query)
      
      if (!user) {
        throw new Error('User not found')
      }
      
      user.id = user._id?.toString()
      return user
    },

    async createRefreshToken(userId: string, token: string): Promise<void> {
      const db = await getDatabase()
      const tokensCollection = db.collection<Token>('tokens')
      
      const tokenHash = createHash('sha256').update(token).digest('hex')
      
      const tokenData: NewToken = {
        userId,
        tokenHash,
        tokenType: 'refresh',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date()
      }
      
      await tokensCollection.insertOne(tokenData as Token)
    },

    async validateRefreshToken(token: string): Promise<{ userId: string } | null> {
      const db = await getDatabase()
      const tokensCollection = db.collection<Token>('tokens')
      
      const tokenHash = createHash('sha256').update(token).digest('hex')
      
      const tokenRecord = await tokensCollection.findOne({
        tokenHash,
        tokenType: 'refresh'
      })

      if (!tokenRecord || tokenRecord.expiresAt < new Date() || tokenRecord.revokedAt) {
        return null
      }

      return { userId: tokenRecord.userId }
    },

    async revokeRefreshToken(token: string): Promise<void> {
      const db = await getDatabase()
      const tokensCollection = db.collection<Token>('tokens')
      
      const tokenHash = createHash('sha256').update(token).digest('hex')
      
      await tokensCollection.updateOne(
        {
          tokenHash,
          tokenType: 'refresh'
        },
        {
          $set: { revokedAt: new Date() }
        }
      )
    }
  }
}