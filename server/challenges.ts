import { db } from "./db";
import { storage } from "./storage";
import {
  challengeDefinitions,
  challengeRounds,
  challengeVotes,
  challengeLeaderboardEntries,
  users,
  type ChallengeDefinition,
  type ChallengeRound,
  type University,
} from "@shared/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

type ChallengeOption = {
  key: string;
  label: string;
  emoji?: string;
};

type ChallengeQuestion = {
  prompt: string;
  options: string[];
};

type ChallengeResultOption = {
  key: string;
  label: string;
  blurb?: string;
};

type ChallengeConfig = {
  prompt?: string;
  options?: ChallengeOption[];
  questions?: ChallengeQuestion[];
  personalityResults?: ChallengeResultOption[];
  cadenceLabel?: string;
  points?: number;
  correctOptionKey?: string;
  historyOptionKey?: string;
  leaderboard?: boolean;
};

type ChallengeTemplate = {
  key: string;
  title: string;
  description: string;
  cadence: "daily" | "weekly" | "monthly" | "exam";
  kind: "vote" | "scale" | "quiz" | "result";
  config: ChallengeConfig;
};

const campusProfiles: Record<string, {
  departments: string[];
  thisOrThat: { prompt: string; options: [string, string] };
  confession: string;
  hotTake: string;
}> = {
  nust: {
    departments: ["SEECS", "SMME", "NBS", "NICE", "S3H", "Other"],
    thisOrThat: { prompt: "C1 chai vs Coffee Lounge?", options: ["C1 Chai", "Coffee Lounge"] },
    confession: "Most overrated society on campus?",
    hotTake: "8AM classes should be banned.",
  },
  lums: {
    departments: ["SSE", "SDSB", "HSS", "LAW", "Other"],
    thisOrThat: { prompt: "Podcasts vs late-night playlists?", options: ["Podcasts", "Playlists"] },
    confession: "Which dining hall is overhyped?",
    hotTake: "Attendance should be optional.",
  },
  fast: {
    departments: ["CS", "SE", "EE", "AI", "Other"],
    thisOrThat: { prompt: "Lab grind vs project sprint?", options: ["Lab Grind", "Project Sprint"] },
    confession: "Most overrated lab on campus?",
    hotTake: "Surprise quizzes ruin learning.",
  },
  comsats: {
    departments: ["CS", "SE", "EE", "BBA", "Other"],
    thisOrThat: { prompt: "Cafe 1 vs Cafe 2?", options: ["Cafe 1", "Cafe 2"] },
    confession: "Which block feels like a maze?",
    hotTake: "No presentations after 3PM.",
  },
  giki: {
    departments: ["CS", "EE", "ME", "CE", "Mgmt", "Other"],
    thisOrThat: { prompt: "Mess meal vs midnight snack?", options: ["Mess Meal", "Midnight Snack"] },
    confession: "Most overrated society on campus?",
    hotTake: "Labs should count as attendance.",
  },
};

function getCampusProfile(slug: string) {
  return campusProfiles[slug] ?? {
    departments: ["CS", "EE", "BBA", "Design", "Other"],
    thisOrThat: { prompt: "Hostel life vs Day scholar?", options: ["Hostel Life", "Day Scholar"] },
    confession: "Most overrated society on campus?",
    hotTake: "Attendance should not exist.",
  };
}

export function getChallengeTemplatesForUniversity(uni: University): ChallengeTemplate[] {
  const profile = getCampusProfile(uni.slug);

  return [
    {
      key: "mood",
      title: "Campus Mood",
      description: "Vote daily and see the energy shift.",
      cadence: "daily",
      kind: "vote",
      config: {
        prompt: "Today’s Campus Energy",
        points: 2,
        historyOptionKey: "vibing",
        options: [
          { key: "dead", label: "Dead", emoji: "😴" },
          { key: "chill", label: "Chill", emoji: "😐" },
          { key: "grind", label: "Academic Grind", emoji: "📚" },
          { key: "vibing", label: "Vibing", emoji: "🎉" },
          { key: "midterm", label: "Midterm Survival", emoji: "💀" },
        ],
      },
    },
    {
      key: "dept",
      title: "Department Wars",
      description: "Weekly rivalry for campus pride.",
      cadence: "weekly",
      kind: "vote",
      config: {
        prompt: "Which department runs this campus?",
        points: 2,
        options: profile.departments.map((dept) => ({ key: dept.toLowerCase().replace(/\s+/g, "-"), label: dept })),
      },
    },
    {
      key: "this-or-that",
      title: "This or That",
      description: "Daily micro-poll, instant results.",
      cadence: "daily",
      kind: "vote",
      config: {
        prompt: profile.thisOrThat.prompt,
        points: 2,
        options: [
          { key: "option-a", label: profile.thisOrThat.options[0] },
          { key: "option-b", label: profile.thisOrThat.options[1] },
        ],
      },
    },
    {
      key: "confession",
      title: "Confession Heat",
      description: "Anonymous agree or disagree. No chaos, just heat.",
      cadence: "daily",
      kind: "vote",
      config: {
        prompt: profile.confession,
        points: 2,
        options: [
          { key: "agree", label: "Agree" },
          { key: "disagree", label: "Disagree" },
        ],
      },
    },
    {
      key: "stress",
      title: "Campus Stress Meter",
      description: "Exam-mode pulse check.",
      cadence: "exam",
      kind: "scale",
      config: {
        prompt: "How stressed are you right now?",
        points: 1,
        options: [
          { key: "1", label: "1" },
          { key: "2", label: "2" },
          { key: "3", label: "3" },
          { key: "4", label: "4" },
          { key: "5", label: "5" },
        ],
      },
    },
    {
      key: "brain-flex",
      title: "Brain Flex Challenge",
      description: "Weekly quick-fire academic flex.",
      cadence: "weekly",
      kind: "quiz",
      config: {
        prompt: "Quick logic: If 2x + 6 = 14, what is x?",
        points: 4,
        leaderboard: true,
        correctOptionKey: "b",
        options: [
          { key: "a", label: "2" },
          { key: "b", label: "4" },
          { key: "c", label: "6" },
          { key: "d", label: "8" },
        ],
      },
    },
    {
      key: "meme",
      title: "Meme Battle",
      description: "Two memes enter. One meme wins.",
      cadence: "weekly",
      kind: "vote",
      config: {
        prompt: "Which meme wins this week?",
        points: 2,
        options: [
          { key: "meme-a", label: "Meme A" },
          { key: "meme-b", label: "Meme B" },
        ],
      },
    },
    {
      key: "personality",
      title: "Campus Personality Test",
      description: "Three taps. Find your campus type.",
      cadence: "monthly",
      kind: "result",
      config: {
        prompt: "What type of student are you?",
        points: 1,
        questions: [
          {
            prompt: "Pick your study rhythm",
            options: ["Late-night grind", "Plan ahead", "Group study", "Silent solo"],
          },
          {
            prompt: "Your deadline style",
            options: ["Last-night warrior", "Two-day sprint", "One-week buffer", "Always early"],
          },
          {
            prompt: "Your campus vibe",
            options: ["Society kid", "Library ghost", "Event hopper", "Lab captain"],
          },
        ],
        personalityResults: [
          { key: "grinder", label: "The Grinder", blurb: "Focused, consistent, unstoppable." },
          { key: "ghost", label: "The Ghost", blurb: "Low-key, high-impact." },
          { key: "society", label: "The Society Kid", blurb: "Leads, hosts, connects." },
          { key: "last-night", label: "The Last-Night Warrior", blurb: "Thrives under pressure." },
        ],
        options: [
          { key: "grinder", label: "The Grinder" },
          { key: "ghost", label: "The Ghost" },
          { key: "society", label: "The Society Kid" },
          { key: "last-night", label: "The Last-Night Warrior" },
        ],
      },
    },
    {
      key: "rising-star",
      title: "Rising Star Spotlight",
      description: "Weekly campus MVP, powered by you.",
      cadence: "weekly",
      kind: "vote",
      config: {
        prompt: "Campus Star of the Week",
        points: 1,
        options: [{ key: "cheer", label: "Send a cheer" }],
      },
    },
    {
      key: "hot-take",
      title: "Hot Take Arena",
      description: "Vote, then see the heat map.",
      cadence: "weekly",
      kind: "vote",
      config: {
        prompt: profile.hotTake,
        points: 2,
        options: [
          { key: "agree", label: "Agree" },
          { key: "disagree", label: "Disagree" },
        ],
      },
    },
  ];
}

function getCadenceWindow(cadence: ChallengeTemplate["cadence"], now: Date) {
  const start = new Date(now);
  if (cadence === "weekly") {
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  if (cadence === "monthly") {
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { start: monthStart, end: monthEnd };
  }

  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
}

async function ensureDefinitions(university: University, templates: ChallengeTemplate[]) {
  const existing = await db.select().from(challengeDefinitions).where(eq(challengeDefinitions.universityId, university.id));
  const existingMap = new Map(existing.map((def) => [def.key, def]));

  const definitions: ChallengeDefinition[] = [];
  for (const template of templates) {
    const current = existingMap.get(template.key);
    if (!current) {
      const [created] = await db
        .insert(challengeDefinitions)
        .values({
          universityId: university.id,
          key: template.key,
          title: template.title,
          description: template.description,
          cadence: template.cadence,
          kind: template.kind,
          config: template.config,
          isActive: true,
        })
        .returning();
      definitions.push(created);
    } else {
      const [updated] = await db
        .update(challengeDefinitions)
        .set({
          title: template.title,
          description: template.description,
          cadence: template.cadence,
          kind: template.kind,
          config: template.config,
          isActive: true,
        })
        .where(eq(challengeDefinitions.id, current.id))
        .returning();
      definitions.push(updated);
    }
  }

  return definitions;
}

async function getOrCreateRound(definition: ChallengeDefinition, now: Date) {
  const config = definition.config as ChallengeConfig;
  const cadence = definition.cadence as ChallengeTemplate["cadence"];
  const { start, end } = getCadenceWindow(cadence, now);

  const [existing] = await db
    .select()
    .from(challengeRounds)
    .where(and(eq(challengeRounds.definitionId, definition.id), eq(challengeRounds.startsAt, start)));

  if (existing) {
    return existing as ChallengeRound;
  }

  const [created] = await db
    .insert(challengeRounds)
    .values({
      definitionId: definition.id,
      universityId: definition.universityId,
      startsAt: start,
      endsAt: end,
      status: "active",
    })
    .returning();

  return created as ChallengeRound;
}

async function buildChallengeCard(definition: ChallengeDefinition, round: ChallengeRound, userId: number) {
  const config = definition.config as ChallengeConfig;
  const options = config.options ?? [];

  const counts = await db
    .select({
      optionKey: challengeVotes.optionKey,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(challengeVotes)
    .where(eq(challengeVotes.roundId, round.id))
    .groupBy(challengeVotes.optionKey);

  const total = counts.reduce((sum, row) => sum + row.count, 0);
  const countMap = new Map(counts.map((row) => [row.optionKey, row.count]));

  const optionsWithCounts = options.map((option) => {
    const count = countMap.get(option.key) ?? 0;
    const percent = total === 0 ? 0 : Math.round((count / total) * 100);
    return { ...option, count, percent };
  });

  const [userVote] = await db
    .select()
    .from(challengeVotes)
    .where(and(eq(challengeVotes.roundId, round.id), eq(challengeVotes.userId, userId)))
    .limit(1);

  let history: { label: string; value: number }[] | undefined;
  if (definition.key === "mood" && config.historyOptionKey) {
    const recentRounds = await db
      .select()
      .from(challengeRounds)
      .where(eq(challengeRounds.definitionId, definition.id))
      .orderBy(desc(challengeRounds.startsAt))
      .limit(7);

    history = [];
    for (const recentRound of recentRounds.reverse()) {
      const [countRow] = await db
        .select({
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(challengeVotes)
        .where(and(eq(challengeVotes.roundId, recentRound.id), eq(challengeVotes.optionKey, config.historyOptionKey)));

      const [totalRow] = await db
        .select({
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(challengeVotes)
        .where(eq(challengeVotes.roundId, recentRound.id));

      const totalVotes = totalRow?.count ?? 0;
      const count = countRow?.count ?? 0;
      const value = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
      const label = new Date(recentRound.startsAt).toLocaleDateString("en-US", { weekday: "short" });
      history.push({ label, value });
    }
  }

  let leaderboard: { userId: number; username: string; score: number; timeMs: number | null }[] | undefined;
  if (config.leaderboard) {
    const entries = await db
      .select({
        userId: challengeLeaderboardEntries.userId,
        username: users.username,
        score: challengeLeaderboardEntries.score,
        timeMs: challengeLeaderboardEntries.timeMs,
      })
      .from(challengeLeaderboardEntries)
      .innerJoin(users, eq(challengeLeaderboardEntries.userId, users.id))
      .where(eq(challengeLeaderboardEntries.roundId, round.id))
      .orderBy(challengeLeaderboardEntries.timeMs)
      .limit(10);
    leaderboard = entries.map((entry) => ({
      ...entry,
      timeMs: entry.timeMs ?? null,
    }));
  }

  let risingStar;
  if (definition.key === "rising-star") {
    const [star] = await db
      .select({
        userId: users.id,
        username: users.username,
        points: users.points,
      })
      .from(users)
      .where(eq(users.universityId, definition.universityId))
      .orderBy(desc(users.points))
      .limit(1);

    const [cheerCount] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(challengeVotes)
      .where(eq(challengeVotes.roundId, round.id));

    if (star) {
      risingStar = {
        userId: star.userId,
        username: star.username,
        points: star.points,
        cheers: cheerCount?.count ?? 0,
      };
    }
  }

  return {
    roundId: round.id,
    key: definition.key,
    title: definition.title,
    description: definition.description,
    cadence: definition.cadence,
    kind: definition.kind,
    prompt: config.prompt ?? null,
    expiresAt: round.endsAt.toISOString(),
    options: optionsWithCounts,
    history,
    leaderboard,
    meta: {
      correctOptionKey: config.correctOptionKey,
      risingStar,
      personalityResults: config.personalityResults,
      questions: config.questions,
    },
    userVote: userVote?.optionKey ?? null,
  };
}

export async function getActiveChallengesForUniversity(university: University, userId: number) {
  const templates = getChallengeTemplatesForUniversity(university);
  const definitions = await ensureDefinitions(university, templates);
  const now = new Date();

  const rounds = await Promise.all(definitions.map((definition) => getOrCreateRound(definition, now)));

  const challengeCards = [] as Awaited<ReturnType<typeof buildChallengeCard>>[];
  for (let i = 0; i < definitions.length; i += 1) {
    const card = await buildChallengeCard(definitions[i], rounds[i], userId);
    challengeCards.push(card);
  }

  return challengeCards;
}

export async function submitChallengeVote(params: {
  roundId: number;
  userId: number;
  optionKey?: string;
  resultKey?: string;
  timeMs?: number;
}) {
  const { roundId, userId, optionKey, resultKey, timeMs } = params;
  const [round] = await db.select().from(challengeRounds).where(eq(challengeRounds.id, roundId));
  if (!round) return null;

  const [definition] = await db.select().from(challengeDefinitions).where(eq(challengeDefinitions.id, round.definitionId));
  if (!definition) return null;

  const config = definition.config as ChallengeConfig;
  const voteKey = resultKey ?? optionKey;
  if (!voteKey) {
    throw new Error("optionKey or resultKey is required");
  }

  const [existingVote] = await db
    .select()
    .from(challengeVotes)
    .where(and(eq(challengeVotes.roundId, roundId), eq(challengeVotes.userId, userId)));

  if (!existingVote) {
    await db.insert(challengeVotes).values({ roundId, userId, optionKey: voteKey });

    const points = config.points ?? 1;
    const isQuiz = definition.kind === "quiz";
    if (isQuiz && config.correctOptionKey) {
      const earned = voteKey === config.correctOptionKey ? points : 1;
      await storage.updateUserPoints(userId, earned);

      if (voteKey === config.correctOptionKey && config.leaderboard && timeMs) {
        const [existingEntry] = await db
          .select()
          .from(challengeLeaderboardEntries)
          .where(and(eq(challengeLeaderboardEntries.roundId, roundId), eq(challengeLeaderboardEntries.userId, userId)));

        if (!existingEntry) {
          await db.insert(challengeLeaderboardEntries).values({
            roundId,
            userId,
            score: 1,
            timeMs,
          });
        } else if (existingEntry.timeMs && timeMs < existingEntry.timeMs) {
          await db
            .update(challengeLeaderboardEntries)
            .set({ timeMs, score: existingEntry.score + 1 })
            .where(eq(challengeLeaderboardEntries.id, existingEntry.id));
        }
      }
    } else {
      await storage.updateUserPoints(userId, points);
    }
  }

  const challenge = await buildChallengeCard(definition, round, userId);
  const [user] = await db.select({ points: users.points }).from(users).where(eq(users.id, userId));

  return {
    challenge,
    userPoints: user?.points ?? 0,
  };
}
