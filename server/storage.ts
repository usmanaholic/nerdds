import { db } from "./db";
import {
  users, universities, posts, comments, likes, follows, directMessages,
  type User, type InsertUser, type University, type Post, type Comment, type DirectMessage,
  type InsertPost, type InsertComment, type InsertMessage
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Auth & Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { points: number; level: string; followersCount: number; followingCount: number; isBlocked: boolean }): Promise<User>;
  sessionStore: session.Store;
  
  // Universities
  getUniversities(): Promise<University[]>;
  getUniversity(id: number): Promise<University | undefined>;
  getUniversityBySlug(slug: string): Promise<University | undefined>;
  createUniversity(name: string, slug: string): Promise<University>;
  
  // Posts
  getPosts(universityId?: number, tag?: string, cursor?: string): Promise<(Post & { author: User })[]>;
  getPost(id: number): Promise<(Post & { author: User }) | undefined>;
  createPost(post: InsertPost & { likesCount: number; commentsCount: number; savesCount: number }): Promise<Post>;
  toggleLike(userId: number, postId: number): Promise<number>; // returns new likes count
  
  // Comments
  getComments(postId: number): Promise<(Comment & { author: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Follows
  toggleFollow(followerId: number, followingId: number): Promise<void>;
  
  // Messages
  getRecentConversations(userId: number): Promise<User[]>;
  getMessages(user1Id: number, user2Id: number): Promise<DirectMessage[]>;
  createMessage(message: InsertMessage): Promise<DirectMessage>;

  // Gamification
  updateUserPoints(userId: number, points: number): Promise<void>;

  // Explore
  getExploreData(userId: number): Promise<{
    trending: (Post & { author: User })[];
    suggestedUsers: User[];
    hotTopics: Array<{ hashtag: string; count: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async initialize(): Promise<void> {
    // Ensure session table exists before app starts
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL
        )
        WITH (OIDS=FALSE);
      `);
      
      await pool.query(`
        ALTER TABLE "session" ADD PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
      `).catch(() => {/* Index might already exist */});
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
      `);
      
    } catch (err) {
      console.error('❌ Session table creation failed:', err);
      // Don't throw - let the app start anyway
    }
  }

  // Auth & Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { username: string; points: number; level: string; followersCount: number; followingCount: number; isBlocked: boolean }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Universities
  async getUniversities(): Promise<University[]> {
    return await db.select().from(universities);
  }

  async getUniversity(id: number): Promise<University | undefined> {
    const [uni] = await db.select().from(universities).where(eq(universities.id, id));
    return uni;
  }

  async getUniversityBySlug(slug: string): Promise<University | undefined> {
    const [uni] = await db.select().from(universities).where(eq(universities.slug, slug));
    return uni;
  }
  
  async createUniversity(name: string, slug: string): Promise<University> {
    const [uni] = await db.insert(universities).values({ name, slug }).returning();
    return uni;
  }

  // Posts
  async getPosts(universityId?: number, tag?: string, cursor?: string): Promise<(Post & { author: User })[]> {
    let query = db.select({
      id: posts.id,
      authorId: posts.authorId,
      universityId: posts.universityId,
      content: posts.content,
      image: posts.image,
      type: posts.type,
      tags: posts.tags,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      savesCount: posts.savesCount,
      createdAt: posts.createdAt,
      author: users,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(20);

    if (universityId) {
      query = query.where(eq(posts.universityId, universityId)) as any;
    }
    
    // Simple implementation - ignores tag/cursor for MVP speed, can add later
    const results = await query;
    return results.map(r => ({
      ...r,
      author: r.author,
    }));
  }

  async getPost(id: number): Promise<(Post & { author: User }) | undefined> {
    const [result] = await db.select({
      id: posts.id,
      authorId: posts.authorId,
      universityId: posts.universityId,
      content: posts.content,
      image: posts.image,
      type: posts.type,
      tags: posts.tags,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      savesCount: posts.savesCount,
      createdAt: posts.createdAt,
      author: users,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id));
    
    if (!result) return undefined;
    return { ...result, author: result.author };
  }

  async createPost(post: InsertPost & { authorId: number; universityId: number; likesCount: number; commentsCount: number; savesCount: number }): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    await this.updateUserPoints(post.authorId, 10); // +10 points for posting
    return newPost;
  }

  async toggleLike(userId: number, postId: number): Promise<number> {
    const [existing] = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    
    if (existing) {
      await db.delete(likes).where(eq(likes.id, existing.id));
      await db.update(posts).set({ likesCount: sql`likes_count - 1` }).where(eq(posts.id, postId));
    } else {
      await db.insert(likes).values({ userId, postId });
      await db.update(posts).set({ likesCount: sql`likes_count + 1` }).where(eq(posts.id, postId));
      
      // Get post author to give points
      const post = await this.getPost(postId);
      if (post && post.authorId !== userId) {
         await this.updateUserPoints(post.authorId, 2); // +2 points for receiving like
      }
    }
    
    const [updatedPost] = await db.select().from(posts).where(eq(posts.id, postId));
    return updatedPost.likesCount;
  }

  // Comments
  async getComments(postId: number): Promise<(Comment & { author: User })[]> {
    const results = await db.select({
      id: comments.id,
      postId: comments.postId,
      authorId: comments.authorId,
      content: comments.content,
      createdAt: comments.createdAt,
      author: users,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));

    return results.map(r => ({ ...r, author: r.author }));
  }

  async createComment(comment: InsertComment & { authorId: number }): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    await this.updateUserPoints(comment.authorId, 3); // +3 for commenting
    await db.update(posts).set({ commentsCount: sql`comments_count + 1` }).where(eq(posts.id, comment.postId));
    return newComment;
  }
  
  // Follows
  async toggleFollow(followerId: number, followingId: number): Promise<void> {
    const [existing] = await db.select().from(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    
    if (existing) {
      await db.delete(follows).where(eq(follows.id, existing.id));
      await db.update(users).set({ followingCount: sql`following_count - 1` }).where(eq(users.id, followerId));
      await db.update(users).set({ followersCount: sql`followers_count - 1` }).where(eq(users.id, followingId));
    } else {
      await db.insert(follows).values({ followerId, followingId });
      await db.update(users).set({ followingCount: sql`following_count + 1` }).where(eq(users.id, followerId));
      await db.update(users).set({ followersCount: sql`followers_count + 1` }).where(eq(users.id, followingId));
    }
  }

  // Messages
  async getRecentConversations(userId: number): Promise<User[]> {
    // This is complex in SQL, for MVP simplify: get users who I messaged or messaged me recently
    // Simplified: Just list all users from same university for now (Chat List MVP)
    const user = await this.getUser(userId);
    if (!user) return [];
    
    const uniUsers = await db.select().from(users)
      .where(and(eq(users.universityId, user.universityId), sql`${users.id} != ${userId}`))
      .limit(20);
      
    return uniUsers;
  }
  
  async getMessages(user1Id: number, user2Id: number): Promise<DirectMessage[]> {
    return await db.select().from(directMessages)
      .where(
        sql`(${directMessages.senderId} = ${user1Id} AND ${directMessages.receiverId} = ${user2Id}) OR (${directMessages.senderId} = ${user2Id} AND ${directMessages.receiverId} = ${user1Id})`
      )
      .orderBy(directMessages.createdAt);
  }

  async createMessage(message: InsertMessage & { senderId: number }): Promise<DirectMessage> {
    const [msg] = await db.insert(directMessages).values(message).returning();
    return msg;
  }

  // Gamification
  async updateUserPoints(userId: number, pointsToAdd: number): Promise<void> {
    await db.update(users)
      .set({ points: sql`points + ${pointsToAdd}` })
      .where(eq(users.id, userId));
      
    // Check for level up
    const user = await this.getUser(userId);
    if (user) {
      let newLevel = "Fresher";
      if (user.points >= 700) newLevel = "Uni Legend";
      else if (user.points >= 300) newLevel = "Campus Star";
      else if (user.points >= 100) newLevel = "Active Student";
      
      if (newLevel !== user.level) {
        await db.update(users).set({ level: newLevel }).where(eq(users.id, userId));
      }
    }
  }

  // Explore
  async getExploreData(userId: number): Promise<{
    trending: (Post & { author: User })[];
    suggestedUsers: User[];
    hotTopics: Array<{ hashtag: string; count: number }>;
  }> {
    const currentUser = await this.getUser(userId);
    if (!currentUser) {
      return { trending: [], suggestedUsers: [], hotTopics: [] };
    }

    // Get trending posts (most liked/commented in last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trendingResults = await db.select({
      id: posts.id,
      authorId: posts.authorId,
      universityId: posts.universityId,
      content: posts.content,
      image: posts.image,
      type: posts.type,
      tags: posts.tags,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      savesCount: posts.savesCount,
      createdAt: posts.createdAt,
      author: users,
    })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(
        and(
          eq(posts.universityId, currentUser.universityId),
          sql`${posts.createdAt} > ${oneDayAgo}`
        )
      )
      .orderBy(sql`${posts.likesCount} + ${posts.commentsCount} * 2 DESC`)
      .limit(10);

    const trending = trendingResults.map(r => ({
      ...r,
      author: r.author,
    }));

    // Get suggested users (from same university, most followers, not following)
    const suggestedUsersResults = await db.select().from(users)
      .where(
        and(
          eq(users.universityId, currentUser.universityId),
          sql`${users.id} != ${userId}`,
          sql`${users.followersCount} > 0`
        )
      )
      .orderBy(desc(users.followersCount))
      .limit(6);

    // Get hot topics (extract hashtags from posts)
    const allPostsForHashtags = await db.select({ tags: posts.tags })
      .from(posts)
      .where(eq(posts.universityId, currentUser.universityId))
      .limit(100);

    const hashtagMap = new Map<string, number>();
    allPostsForHashtags.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          const hashtag = tag.toLowerCase();
          hashtagMap.set(hashtag, (hashtagMap.get(hashtag) || 0) + 1);
        });
      }
    });

    const hotTopics = Array.from(hashtagMap.entries())
      .map(([hashtag, count]) => ({ hashtag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      trending,
      suggestedUsers: suggestedUsersResults,
      hotTopics,
    };
  }
}

export const storage = new DatabaseStorage();
