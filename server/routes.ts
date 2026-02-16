import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcryptjs";
import { 
  insertUserSchema, insertPostSchema,
  insertSnackRequestSchema, insertSnackRatingSchema, insertSnackReportSchema,
} from "@shared/schema";
import { getActiveChallengesForUniversity, submitChallengeVote } from "./challenges";
import { v2 as cloudinary } from "cloudinary";
import { 
  attemptMatch, 
  cancelSnackRequest, 
  submitRating, 
  reportUser, 
  blockUser,
  extendSnackSession,
} from "./snack-matching";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
        cb(new Error("Only image uploads are allowed"));
        return;
      }
      cb(null, true);
    },
  });
  // Auth Setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "nerdds_secret_key",
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
      proxy: process.env.NODE_ENV === "production", // Trust Render's proxy
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Routes
  app.post(api.auth.signup.path, async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username); // This is risky if username is passed manually, but we generate it.
      // Actually frontend shouldn't pass username. We generate it.
      // Let's modify the input handling.
      
      const userData = req.body;
      
      // Auto-generate username
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `nerd_${randomSuffix}`;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const newUser = await storage.createUser({
        ...userData,
        username,
        password: hashedPassword,
        points: 0,
        level: "Fresher",
        followersCount: 0,
        followingCount: 0,
        isBlocked: false,
      });

      req.login(newUser, (err) => {
        if (err) return next(err);
        res.status(201).json(newUser);
      });
    } catch (err) {
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.status(200).send();
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    res.json(req.user);
  });

  // Universities
  app.get(api.universities.list.path, async (req, res) => {
    const unis = await storage.getUniversities();
    res.json(unis);
  });

  // Uploads
  app.post("/api/uploads", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    if (!req.file) return res.status(400).json({ message: "Image required" });
    
    try {
      // Upload to Cloudinary
      const uploadPromise = new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "campus-connect",
            resource_type: "image",
            transformation: [
              { width: 1200, height: 1200, crop: "limit" },
              { quality: "auto:good" },
              { fetch_format: "auto" }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result.secure_url);
            else reject(new Error("Upload failed"));
          }
        );
        uploadStream.end(req.file!.buffer);
      });

      const imageUrl = await uploadPromise;
      res.status(201).json({ url: imageUrl });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Posts
  app.get(api.posts.list.path, async (req, res) => {
    const universityId = req.query.universityId
      ? Number(req.query.universityId)
      : undefined;

    const posts = await storage.getPosts(universityId);
    res.json(posts);
  });

  app.get(api.posts.get.path, async (req, res) => {
    const post = await storage.getPost(Number(req.params.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.post(api.posts.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    try {
      const user = req.user as any;
      const normalizedTags = Array.isArray(req.body?.tags)
        ? req.body.tags
        : req.body?.tags
          ? [String(req.body.tags)]
          : undefined;
      const payload = {
        ...req.body,
        type: req.body?.type ?? "text",
        tags: normalizedTags,
      };
      const validatedData = insertPostSchema.parse(payload);

      const post = await storage.createPost({
        ...validatedData,
        authorId: user.id,
        universityId: user.universityId,
        likesCount: 0,
        commentsCount: 0,
        savesCount: 0
      });
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path?.[0],
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  app.post(api.posts.like.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;
    const likesCount = await storage.toggleLike(user.id, Number(req.params.id));
    res.json({ likesCount });
  });

  // Comments
  app.get(api.comments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const comments = await storage.getComments(Number(req.params.postId));
    res.json(comments);
  });
  
  app.post(api.comments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;
    const comment = await storage.createComment({
      postId: Number(req.params.postId),
      authorId: user.id,
      content: req.body.content,
    });
    res.status(201).json(comment);
  });

  // Users
  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // Explore
  app.get(api.explore.data.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;
    const exploreData = await storage.getExploreData(user.id);
    res.json(exploreData);
  });

  // Seed Data
  if ((await storage.getUniversities()).length === 0) {
    await storage.createUniversity("NUST", "nust");
    await storage.createUniversity("LUMS", "lums");
    await storage.createUniversity("FAST", "fast");
    await storage.createUniversity("COMSATS", "comsats");
    await storage.createUniversity("GIKI", "giki");
  }

  // Challenges
  app.get(api.challenges.active.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;
    const university = await storage.getUniversity(user.universityId);
    if (!university) return res.status(404).json({ message: "University not found" });

    const challenges = await getActiveChallengesForUniversity(university, user.id);
    const refreshedUser = await storage.getUser(user.id);

    res.json({
      campus: university,
      userPoints: refreshedUser?.points ?? 0,
      challenges,
    });
  });

  app.post(api.challenges.submit.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;

    try {
      const payload = api.challenges.submit.input.parse(req.body ?? {});
      const roundId = Number(req.params.roundId);
      if (!Number.isFinite(roundId)) {
        return res.status(400).json({ message: "Invalid round id" });
      }

      const result = await submitChallengeVote({
        roundId,
        userId: user.id,
        optionKey: payload.optionKey,
        resultKey: payload.resultKey,
        timeMs: payload.timeMs,
      });

      if (!result) {
        return res.status(404).json({ message: "Challenge round not found" });
      }

      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Snack Routes
  app.post(api.snack.createRequest.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    
    try {
      const user = req.user as any;
      const validatedData = insertSnackRequestSchema.parse(req.body);

      // Check if user already has an active request
      const existingRequest = await storage.getMyActiveSnackRequest(user.id);
      if (existingRequest) {
        return res.status(400).json({ message: "You already have an active snack request" });
      }

      // Check if user is already in an active session
      const existingSession = await storage.getMyActiveSnackSession(user.id);
      if (existingSession) {
        return res.status(400).json({ message: "You are already in an active snack session" });
      }

      // Create the request
      const request = await storage.createSnackRequest({
        snackType: validatedData.snackType,
        topic: validatedData.topic ?? null,
        duration: validatedData.duration,
        tags: validatedData.tags ?? null,
        location: validatedData.location ?? null,
        createdBy: user.id,
        status: "waiting",
      });

      // Attempt to find a match
      const matchResult = await attemptMatch(request.id);

      if (matchResult) {
        // Match found!
        return res.status(201).json({
          request,
          matched: true,
          session: matchResult.session,
        });
      } else {
        // No match yet, user is in waiting queue
        return res.status(201).json({
          request,
          matched: false,
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path?.[0],
        });
      }
      console.error("Snack request creation error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.snack.cancelRequest.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;

    try {
      const requestId = Number(req.params.id);
      const success = await cancelSnackRequest(requestId, user.id);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Request not found or cannot be cancelled" });
      }
    } catch (err) {
      console.error("Cancel snack request error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.snack.getMatchStatus.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;

    try {
      const activeRequest = await storage.getMyActiveSnackRequest(user.id);
      const activeSession = await storage.getMyActiveSnackSession(user.id);

      res.json({
        hasActiveRequest: !!activeRequest,
        request: activeRequest,
        hasActiveSession: !!activeSession,
        session: activeSession,
      });
    } catch (err) {
      console.error("Get match status error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.snack.rate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;

    try {
      const validatedData = insertSnackRatingSchema.parse(req.body);
      const session = await submitRating(
        validatedData.sessionId,
        user.id,
        validatedData.rating
      );

      if (session) {
        res.json({ success: true, session });
      } else {
        res.status(404).json({ message: "Session not found or you are not part of this session" });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path?.[0],
        });
      }
      console.error("Submit rating error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.snack.report.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;

    try {
      const validatedData = insertSnackReportSchema.parse({
        ...req.body,
        reporterId: user.id,
      });

      await reportUser(
        user.id,
        validatedData.reportedId,
        validatedData.sessionId || null,
        validatedData.reason,
        validatedData.description || null
      );

      res.status(201).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path?.[0],
        });
      }
      console.error("Report user error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.snack.block.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;

    try {
      const { userId } = z.object({ userId: z.number() }).parse(req.body);
      await blockUser(user.id, userId);
      res.json({ success: true });
    } catch (err) {
      console.error("Block user error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.snack.getMessages.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;

    try {
      const sessionId = Number(req.params.sessionId);
      const session = await storage.getSnackSession(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Verify user is part of session
      if (session.user1Id !== user.id && session.user2Id !== user.id) {
        return res.status(403).json({ message: "You are not part of this session" });
      }

      const messages = await storage.getSnackMessages(sessionId);
      res.json(messages);
    } catch (err) {
      console.error("Get snack messages error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.snack.sendMessage.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;

    try {
      const sessionId = Number(req.params.sessionId);
      const { content } = z.object({ content: z.string().min(1).max(500) }).parse(req.body);

      const session = await storage.getSnackSession(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Verify user is part of session
      if (session.user1Id !== user.id && session.user2Id !== user.id) {
        return res.status(403).json({ message: "You are not part of this session" });
      }

      // Verify session is active
      if (session.status === "ended") {
        return res.status(400).json({ message: "This session has ended" });
      }

      const message = await storage.createSnackMessage({
        sessionId,
        senderId: user.id,
        content,
      });

      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path?.[0],
        });
      }
      console.error("Send snack message error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.snack.extendSession.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    const user = req.user as any;

    try {
      const sessionId = Number(req.params.sessionId);
      const session = await storage.getSnackSession(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Verify user is part of session
      if (session.user1Id !== user.id && session.user2Id !== user.id) {
        return res.status(403).json({ message: "You are not part of this session" });
      }

      const extendedSession = await extendSnackSession(sessionId);

      if (extendedSession) {
        res.json({ success: true, session: extendedSession });
      } else {
        res.status(400).json({ message: "Cannot extend session" });
      }
    } catch (err) {
      console.error("Extend session error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  return httpServer;
}
