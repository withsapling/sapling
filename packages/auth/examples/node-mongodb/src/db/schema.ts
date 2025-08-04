import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  id?: string;
  googleId?: string;
  githubId?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Token {
  _id?: ObjectId;
  id?: string;
  userId: string;
  tokenHash: string;
  tokenType: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
  revokedAt?: Date;
}

export type NewUser = Omit<User, '_id' | 'id' | 'createdAt'> & {
  createdAt?: Date;
};

export type NewToken = Omit<Token, '_id' | 'id' | 'createdAt'> & {
  createdAt?: Date;
};
