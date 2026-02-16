import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const universities = pgTable("universities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  username: text("username").notNull().unique(),
  universityId: integer("university_id").notNull(),
  department: text("department"),
  semester: text("semester"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  points: integer("points").default(0).notNull(),
  level: text("level").default("Fresher").notNull(),
  followersCount: integer("followers_count").default(0).notNull(),
  followingCount: integer("following_count").default(0).notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  snackScore: integer("snack_score").default(0),
  snackCount: integer("snack_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(),
  universityId: integer("university_id").notNull(),
  content: text("content").notNull(),
  image: text("image"),
  type: text("type").notNull(), // text, image, event, study, meme, poll
  tags: text("tags").array(), // Fun, Event, Study, Announcement
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  savesCount: integer("saves_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
});

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull(),
  targetUserId: integer("target_user_id"),
  targetPostId: integer("target_post_id"),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challengeDefinitions = pgTable("challenge_definitions", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").notNull(),
  key: text("key").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  cadence: text("cadence").notNull(),
  kind: text("kind").notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challengeRounds = pgTable("challenge_rounds", {
  id: serial("id").primaryKey(),
  definitionId: integer("definition_id").notNull(),
  universityId: integer("university_id").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challengeVotes = pgTable("challenge_votes", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull(),
  userId: integer("user_id").notNull(),
  optionKey: text("option_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challengeLeaderboardEntries = pgTable("challenge_leaderboard_entries", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull(),
  userId: integer("user_id").notNull(),
  score: integer("score").default(0).notNull(),
  timeMs: integer("time_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Snack Feature Tables
export const snackRequests = pgTable("snack_requests", {
  id: serial("id").primaryKey(),
  createdBy: integer("created_by").notNull(),
  snackType: text("snack_type").notNull(), // study, chill, debate, game, activity, campus
  topic: text("topic"),
  duration: integer("duration").notNull(), // 10, 15, 30 minutes
  tags: text("tags").array(),
  location: text("location"),
  status: text("status").default("waiting").notNull(), // waiting, matched, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  matchedAt: timestamp("matched_at"),
});

export const snackSessions = pgTable("snack_sessions", {
  id: serial("id").primaryKey(),
  user1Id: integer("user_1_id").notNull(),
  user2Id: integer("user_2_id").notNull(),
  requestId1: integer("request_id_1").notNull(),
  requestId2: integer("request_id_2").notNull(),
  snackType: text("snack_type").notNull(),
  topic: text("topic"),
  duration: integer("duration").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status").default("active").notNull(), // active, ended, extended
  ratingUser1: integer("rating_user_1"),
  ratingUser2: integer("rating_user_2"),
  endedAt: timestamp("ended_at"),
});

export const snackBlocks = pgTable("snack_blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull(),
  blockedId: integer("blocked_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const snackReports = pgTable("snack_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull(),
  reportedId: integer("reported_id").notNull(),
  sessionId: integer("session_id"),
  reason: text("reason").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const snackMessages = pgTable("snack_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  university: one(universities, {
    fields: [users.universityId],
    references: [universities.id],
  }),
  posts: many(posts),
}));

export const postRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  university: one(universities, {
    fields: [posts.universityId],
    references: [universities.id],
  }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentRelations = relations(comments, ({ one }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));

export const likeRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
}));

export const messageRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [directMessages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const snackRequestRelations = relations(snackRequests, ({ one }) => ({
  creator: one(users, {
    fields: [snackRequests.createdBy],
    references: [users.id],
  }),
}));

export const snackSessionRelations = relations(snackSessions, ({ one, many }) => ({
  user1: one(users, {
    fields: [snackSessions.user1Id],
    references: [users.id],
    relationName: "snackUser1",
  }),
  user2: one(users, {
    fields: [snackSessions.user2Id],
    references: [users.id],
    relationName: "snackUser2",
  }),
  messages: many(snackMessages),
}));

export const snackMessageRelations = relations(snackMessages, ({ one }) => ({
  sender: one(users, {
    fields: [snackMessages.senderId],
    references: [users.id],
  }),
  session: one(snackSessions, {
    fields: [snackMessages.sessionId],
    references: [snackSessions.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users, {
  universityId: z.coerce.number(),
}).omit({
  id: true,
  createdAt: true,
  points: true,
  level: true,
  followersCount: true,
  followingCount: true,
  isBlocked: true,
  username: true, // auto-generated
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  likesCount: true,
  commentsCount: true,
  savesCount: true,
  authorId: true, // set by session
  universityId: true, // set by session
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  authorId: true, // set by session
});

export const insertMessageSchema = createInsertSchema(directMessages).omit({
  id: true,
  createdAt: true,
  senderId: true, // set by session
});

export const insertSnackRequestSchema = createInsertSchema(snackRequests, {
  duration: z.number().refine((val) => [10, 15, 30].includes(val), {
    message: "Duration must be 10, 15, or 30 minutes",
  }),
  snackType: z.enum(["study", "chill", "debate", "game", "activity", "campus"]),
}).omit({
  id: true,
  createdAt: true,
  createdBy: true, // set by session
  status: true,
  matchedAt: true,
});

export const insertSnackRatingSchema = z.object({
  sessionId: z.number(),
  rating: z.number().min(1).max(5),
});

export const insertSnackReportSchema = createInsertSchema(snackReports).omit({
  id: true,
  createdAt: true,
  reporterId: true, // set by session
});

export const insertSnackMessageSchema = createInsertSchema(snackMessages).omit({
  id: true,
  createdAt: true,
  senderId: true, // set by session
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type University = typeof universities.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ChallengeDefinition = typeof challengeDefinitions.$inferSelect;
export type ChallengeRound = typeof challengeRounds.$inferSelect;
export type ChallengeVote = typeof challengeVotes.$inferSelect;
export type ChallengeLeaderboardEntry = typeof challengeLeaderboardEntries.$inferSelect;

// Snack Types
export type SnackRequest = typeof snackRequests.$inferSelect;
export type InsertSnackRequest = z.infer<typeof insertSnackRequestSchema>;
export type SnackSession = typeof snackSessions.$inferSelect;
export type SnackMessage = typeof snackMessages.$inferSelect;
export type InsertSnackMessage = z.infer<typeof insertSnackMessageSchema>;
export type SnackReport = typeof snackReports.$inferSelect;
export type InsertSnackReport = z.infer<typeof insertSnackReportSchema>;
export type SnackBlock = typeof snackBlocks.$inferSelect;
export type InsertSnackRating = z.infer<typeof insertSnackRatingSchema>;




