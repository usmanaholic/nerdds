import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { universities, users, posts, comments, likes, follows } from "../shared/schema";
import bcryptjs from "bcryptjs";
import "dotenv/config";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  try {
    console.log("🌱 Starting seed...");

    // Create universities
    console.log("📚 Creating universities...");
    const unis = await db
      .insert(universities)
      .values([
        { name: "Stanford University", slug: "stanford" },
        { name: "MIT", slug: "mit" },
        { name: "UC Berkeley", slug: "uc-berkeley" },
        { name: "Harvard University", slug: "harvard" },
      ])
      .onConflictDoNothing()
      .returning();

    const stanfordId = unis[0]?.id || 1;
    const mitId = unis[1]?.id || 2;

    // Create users
    console.log("👥 Creating users...");
    const hashedPassword = await bcryptjs.hash("password123", 10);

    const userList = await db
      .insert(users)
      .values([
        {
          email: "alice@stanford.edu",
          password: hashedPassword,
          username: "alice_cs",
          universityId: stanfordId,
          department: "Computer Science",
          semester: "Junior",
          bio: "CS enthusiast, love coding and open source 💻",
          profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
          points: 150,
          level: "Active Student",
          followersCount: 5,
          followingCount: 3,
          isBlocked: false,
        },
        {
          email: "bob@stanford.edu",
          password: hashedPassword,
          username: "bob_design",
          universityId: stanfordId,
          department: "Design",
          semester: "Sophomore",
          bio: "UI/UX designer | Creative thinker 🎨",
          profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
          points: 85,
          level: "Fresher",
          followersCount: 2,
          followingCount: 4,
          isBlocked: false,
        },
        {
          email: "carol@stanford.edu",
          password: hashedPassword,
          username: "carol_bio",
          universityId: stanfordId,
          department: "Biology",
          semester: "Senior",
          bio: "Pre-med student | Always studying 📚",
          profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
          points: 280,
          level: "Campus Star",
          followersCount: 12,
          followingCount: 8,
          isBlocked: false,
        },
        {
          email: "david@mit.edu",
          password: hashedPassword,
          username: "david_phys",
          universityId: mitId,
          department: "Physics",
          semester: "Junior",
          bio: "Quantum mechanics researcher 🔬",
          profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
          points: 420,
          level: "Campus Star",
          followersCount: 8,
          followingCount: 5,
          isBlocked: false,
        },
        {
          email: "emma@stanford.edu",
          password: hashedPassword,
          username: "emma_startup",
          universityId: stanfordId,
          department: "Entrepreneurship",
          semester: "Junior",
          bio: "Founder & startup enthusiast 🚀",
          profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
          points: 350,
          level: "Campus Star",
          followersCount: 25,
          followingCount: 10,
          isBlocked: false,
        },
      ])
      .onConflictDoNothing()
      .returning();

    const aliceId = userList[0]?.id || 1;
    const bobId = userList[1]?.id || 2;
    const carolId = userList[2]?.id || 3;
    const davidId = userList[3]?.id || 4;
    const emmaId = userList[4]?.id || 5;

    // Create posts
    console.log("📝 Creating posts...");
    await db
      .insert(posts)
      .values([
        {
          authorId: aliceId,
          universityId: stanfordId,
          content:
            "Just finished my first AI project! So excited about machine learning 🤖 #AI #MachineLearning",
          image: null,
          type: "text",
          tags: ["Study"],
          likesCount: 12,
          commentsCount: 3,
          savesCount: 5,
        },
        {
          authorId: bobId,
          universityId: stanfordId,
          content:
            "New UI design system for our college app is live! Check it out and give feedback 🎨",
          image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500",
          type: "image",
          tags: ["Event", "Announcement"],
          likesCount: 28,
          commentsCount: 8,
          savesCount: 15,
        },
        {
          authorId: carolId,
          universityId: stanfordId,
          content:
            "Campus Coffee Meetup Tomorrow @ 3 PM in the library! All bio students welcome ☕",
          image: null,
          type: "event",
          tags: ["Event", "Fun"],
          likesCount: 45,
          commentsCount: 18,
          savesCount: 20,
        },
        {
          authorId: davidId,
          universityId: mitId,
          content:
            "MIT Physics Seminar this Friday! Dr. Smith will discuss quantum entanglement 🔬",
          image: null,
          type: "event",
          tags: ["Study", "Announcement"],
          likesCount: 56,
          commentsCount: 12,
          savesCount: 25,
        },
        {
          authorId: emmaId,
          universityId: stanfordId,
          content:
            "Startup pitch competition next week! Looking for teammates to build something cool together 🚀 DM me!",
          image: null,
          type: "text",
          tags: ["Event", "Announcement"],
          likesCount: 89,
          commentsCount: 24,
          savesCount: 45,
        },
        {
          authorId: aliceId,
          universityId: stanfordId,
          content:
            "Weekend study session anyone? Working on algorithms homework. Need some company and coffee ☕📚",
          image: null,
          type: "text",
          tags: ["Study"],
          likesCount: 18,
          commentsCount: 7,
          savesCount: 8,
        },
        {
          authorId: bobId,
          universityId: stanfordId,
          content:
            "Meme time: When the professor says 'this will be on the exam' 😂 #StudentLife",
          image:
            "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=500",
          type: "meme",
          tags: ["Fun"],
          likesCount: 134,
          commentsCount: 42,
          savesCount: 67,
        },
        {
          authorId: carolId,
          universityId: stanfordId,
          content:
            "Just got accepted to the summer research program! Dreams do come true 🎉✨",
          image: null,
          type: "text",
          tags: ["Fun"],
          likesCount: 67,
          commentsCount: 19,
          savesCount: 32,
        },
        {
          authorId: emmaId,
          universityId: stanfordId,
          content:
            "Open source contribution roadmap 2024: Let's collaborate on something meaningful! Join our GitHub org 🛠️",
          image: null,
          type: "text",
          tags: ["Study"],
          likesCount: 92,
          commentsCount: 31,
          savesCount: 48,
        },
        {
          authorId: davidId,
          universityId: mitId,
          content:
            "Hackathon results are out! Our team won 2nd place with an AI weather prediction model 🏆",
          image: null,
          type: "text",
          tags: ["Event", "Fun"],
          likesCount: 156,
          commentsCount: 38,
          savesCount: 71,
        },
      ])
      .onConflictDoNothing()
      .returning();

    // Create some follow relationships
    console.log("👥 Creating follows...");
    await db
      .insert(follows)
      .values([
        { followerId: aliceId, followingId: emmaId },
        { followerId: aliceId, followingId: carolId },
        { followerId: bobId, followingId: aliceId },
        { followerId: bobId, followingId: davidId },
        { followerId: carolId, followingId: emmaId },
        { followerId: davidId, followingId: aliceId },
        { followerId: emmaId, followingId: carolId },
      ])
      .onConflictDoNothing();

    // Create some likes
    console.log("👍 Creating likes...");
    const postsFromDb = await db.query.posts.findMany();
    if (postsFromDb.length > 0) {
      const likesToAdd = [];
      for (let i = 0; i < Math.min(5, postsFromDb.length); i++) {
        likesToAdd.push({ userId: aliceId, postId: postsFromDb[i].id });
        likesToAdd.push({ userId: bobId, postId: postsFromDb[i].id });
      }
      await db.insert(likes).values(likesToAdd).onConflictDoNothing();
    }

    // Create some comments
    console.log("💬 Creating comments...");
    const firstPost = postsFromDb[0];
    if (firstPost) {
      await db
        .insert(comments)
        .values([
          {
            postId: firstPost.id,
            authorId: bobId,
            content: "This looks amazing! Can't wait to see the project 🚀",
          },
          {
            postId: firstPost.id,
            authorId: carolId,
            content: "Great work Alice! Love your enthusiasm for AI",
          },
          {
            postId: firstPost.id,
            authorId: emmaId,
            content: "Would love to collaborate on this!",
          },
        ])
        .onConflictDoNothing();
    }

    console.log("✅ Seed completed successfully!");
    console.log("\n📊 Dummy Data Summary:");
    console.log("- 4 Universities");
    console.log("- 5 Users");
    console.log("- 10 Posts");
    console.log("- 7 Follows");
    console.log("- Multiple likes and comments");
    console.log(
      "\n💡 You can now log in with:\nEmail: alice@stanford.edu\nPassword: password123"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
