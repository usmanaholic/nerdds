import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import fs from "fs";
import path from "path";
import multer from "multer";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertPostSchema } from "@shared/schema";
import { getActiveChallengesForUniversity, submitChallengeVote } from "./challenges";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadsDir,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "");
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, safeName);
      },
    }),
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
        secure: app.get("env") === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
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
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });

  // Posts
  app.get(api.posts.list.path, async (req, res) => {
    let universityId: number | undefined;
    
    // Check query param first (for public view of specific uni)
    if (req.query.universityId) {
      universityId = Number(req.query.universityId);
    } else if (req.isAuthenticated()) {
      // Fallback to logged-in user's university
      universityId = (req.user as any).universityId;
    }

    if (!universityId) {
      return res.status(400).json({ message: "University ID required" });
    }

    const posts = await storage.getPosts(universityId);
    res.json(posts);
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

  return httpServer;
}
