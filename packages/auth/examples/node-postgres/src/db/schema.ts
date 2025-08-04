import {
    boolean,
    foreignKey,
    integer,
    jsonb,
    pgTable,
    serial,
    text,
    timestamp,
    uuid,
  } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  googleId: text("google_id").unique(),
  githubId: text("github_id").unique(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const tokens = pgTable("tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  tokenType: text("token_type").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
  revokedAt: timestamp("revoked_at"),
});


export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;
