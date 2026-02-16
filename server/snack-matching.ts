import { db } from "./db";
import {
  snackRequests,
  snackSessions,
  snackBlocks,
  snackReports,
  users,
  type SnackRequest,
  type SnackSession,
  type User,
} from "@shared/schema";
import { eq, and, ne, sql, desc, inArray } from "drizzle-orm";

/**
 * Snack Matching Service
 * Handles the core matching logic for Snack requests
 */

interface MatchResult {
  session: SnackSession;
  matchedUser: User;
}

/**
 * Calculate tag similarity score between two arrays of tags
 */
function calculateTagSimilarity(tags1: string[] | null, tags2: string[] | null): number {
  if (!tags1 || !tags2 || tags1.length === 0 || tags2.length === 0) {
    return 0;
  }

  const set1 = new Set(tags1.map((t) => t.toLowerCase()));
  const set2 = new Set(tags2.map((t) => t.toLowerCase()));
  const intersection = new Set(Array.from(set1).filter((x) => set2.has(x)));

  // Jaccard similarity: intersection / union
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);
  return intersection.size / union.size;
}

/**
 * Get list of blocked user IDs for a given user
 */
async function getBlockedUserIds(userId: number): Promise<number[]> {
  const blockedByMe = await db
    .select({ blockedId: snackBlocks.blockedId })
    .from(snackBlocks)
    .where(eq(snackBlocks.blockerId, userId));

  const blockedMe = await db
    .select({ blockerId: snackBlocks.blockerId })
    .from(snackBlocks)
    .where(eq(snackBlocks.blockedId, userId));

  return [
    ...blockedByMe.map((b) => b.blockedId),
    ...blockedMe.map((b) => b.blockerId),
  ];
}

/**
 * Get list of reported user IDs (to avoid matching)
 */
async function getReportedUserIds(userId: number): Promise<number[]> {
  const reported = await db
    .select({ reportedId: snackReports.reportedId })
    .from(snackReports)
    .where(eq(snackReports.reporterId, userId));

  return reported.map((r) => r.reportedId);
}

/**
 * Find the best matching request for a given snack request
 */
async function findBestMatch(request: SnackRequest): Promise<SnackRequest | null> {
  // Get blocked and reported users
  const blockedIds = await getBlockedUserIds(request.createdBy);
  const reportedIds = await getReportedUserIds(request.createdBy);
  const excludedUserIds = [
    request.createdBy,
    ...blockedIds,
    ...reportedIds,
  ].filter((id, index, self) => self.indexOf(id) === index);

  // Get user's university
  const [creator] = await db
    .select()
    .from(users)
    .where(eq(users.id, request.createdBy));

  if (!creator) return null;

  // Find waiting requests with same snackType
  const waitingRequests = await db
    .select()
    .from(snackRequests)
    .where(
      and(
        eq(snackRequests.snackType, request.snackType),
        eq(snackRequests.status, "waiting"),
        ne(snackRequests.id, request.id),
        inArray(snackRequests.createdBy, 
          db.select({ id: users.id })
            .from(users)
            .where(
              and(
                eq(users.universityId, creator.universityId),
                sql`${users.id} NOT IN (${sql.join(excludedUserIds.map(id => sql`${id}`), sql`, `)})`
              )
            )
        )
      )
    )
    .orderBy(desc(snackRequests.createdAt));

  if (waitingRequests.length === 0) return null;

  // Score and rank matches
  const scoredMatches = waitingRequests.map((candidate) => {
    let score = 0;

    // Tag similarity (weighted 60%)
    const tagSimilarity = calculateTagSimilarity(request.tags, candidate.tags);
    score += tagSimilarity * 0.6;

    // Duration match (weighted 20%)
    if (request.duration === candidate.duration) {
      score += 0.2;
    }

    // Location match (weighted 20%)
    if (
      request.location &&
      candidate.location &&
      request.location.toLowerCase() === candidate.location.toLowerCase()
    ) {
      score += 0.2;
    }

    // Topic similarity (bonus 10%)
    if (
      request.topic &&
      candidate.topic &&
      request.topic.toLowerCase().includes(candidate.topic.toLowerCase())
    ) {
      score += 0.1;
    }

    return { request: candidate, score };
  });

  // Sort by score descending
  scoredMatches.sort((a, b) => b.score - a.score);

  // Return best match if score > threshold (0.3)
  if (scoredMatches.length > 0 && scoredMatches[0].score >= 0.3) {
    return scoredMatches[0].request;
  }

  // If no good matches, return first waiting request (basic FIFO)
  return waitingRequests[0] || null;
}

/**
 * Create a snack session between two matched users
 */
async function createSnackSession(
  request1: SnackRequest,
  request2: SnackRequest
): Promise<SnackSession> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + request1.duration * 60 * 1000);

  const [session] = await db
    .insert(snackSessions)
    .values({
      user1Id: request1.createdBy,
      user2Id: request2.createdBy,
      requestId1: request1.id,
      requestId2: request2.id,
      snackType: request1.snackType,
      topic: request1.topic || request2.topic,
      duration: request1.duration,
      startedAt: now,
      expiresAt: expiresAt,
      status: "active",
    })
    .returning();

  return session;
}

/**
 * Main matching function - attempts to find and create a match
 */
export async function attemptMatch(requestId: number): Promise<MatchResult | null> {
  // Get the request
  const [request] = await db
    .select()
    .from(snackRequests)
    .where(eq(snackRequests.id, requestId));

  if (!request || request.status !== "waiting") {
    return null;
  }

  // Find best match
  const matchedRequest = await findBestMatch(request);

  if (!matchedRequest) {
    return null;
  }

  // Create session
  const session = await createSnackSession(request, matchedRequest);

  // Update both requests to matched
  await db
    .update(snackRequests)
    .set({ status: "matched", matchedAt: new Date() })
    .where(inArray(snackRequests.id, [request.id, matchedRequest.id]));

  // Get matched user info
  const [matchedUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, matchedRequest.createdBy));

  return {
    session,
    matchedUser,
  };
}

/**
 * Cancel a snack request
 */
export async function cancelSnackRequest(requestId: number, userId: number): Promise<boolean> {
  const result = await db
    .update(snackRequests)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(snackRequests.id, requestId),
        eq(snackRequests.createdBy, userId),
        eq(snackRequests.status, "waiting")
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * End a snack session
 */
export async function endSnackSession(sessionId: number): Promise<boolean> {
  const result = await db
    .update(snackSessions)
    .set({ status: "ended", endedAt: new Date() })
    .where(
      and(
        eq(snackSessions.id, sessionId),
        eq(snackSessions.status, "active")
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Extend a snack session (adds 10 minutes)
 */
export async function extendSnackSession(sessionId: number): Promise<SnackSession | null> {
  const [session] = await db
    .select()
    .from(snackSessions)
    .where(eq(snackSessions.id, sessionId));

  if (!session || session.status !== "active") {
    return null;
  }

  const newExpiresAt = new Date(session.expiresAt.getTime() + 10 * 60 * 1000);

  const [updatedSession] = await db
    .update(snackSessions)
    .set({ 
      expiresAt: newExpiresAt,
      status: "extended",
      duration: session.duration + 10,
    })
    .where(eq(snackSessions.id, sessionId))
    .returning();

  return updatedSession;
}

/**
 * Submit rating for a session
 */
export async function submitRating(
  sessionId: number,
  userId: number,
  rating: number
): Promise<SnackSession | null> {
  const [session] = await db
    .select()
    .from(snackSessions)
    .where(eq(snackSessions.id, sessionId));

  if (!session) return null;

  const isUser1 = session.user1Id === userId;
  const isUser2 = session.user2Id === userId;

  if (!isUser1 && !isUser2) return null;

  const updateField = isUser1 ? { ratingUser1: rating } : { ratingUser2: rating };

  const [updatedSession] = await db
    .update(snackSessions)
    .set(updateField)
    .where(eq(snackSessions.id, sessionId))
    .returning();

  // Update user snack scores if both ratings are submitted
  if (
    (isUser1 && updatedSession.ratingUser2 !== null) ||
    (isUser2 && updatedSession.ratingUser1 !== null)
  ) {
    await updateSnackScores(updatedSession);
  }

  return updatedSession;
}

/**
 * Update snack scores for both users after ratings are complete
 */
async function updateSnackScores(session: SnackSession): Promise<void> {
  if (session.ratingUser1 === null || session.ratingUser2 === null) return;

  // Update user1's snack score
  const [user1] = await db.select().from(users).where(eq(users.id, session.user1Id));
  if (user1) {
    const newCount = (user1.snackCount || 0) + 1;
    const currentTotal = (user1.snackScore || 0) * (user1.snackCount || 0);
    const newScore = Math.round((currentTotal + session.ratingUser2) / newCount);

    await db
      .update(users)
      .set({ snackScore: newScore, snackCount: newCount })
      .where(eq(users.id, session.user1Id));
  }

  // Update user2's snack score
  const [user2] = await db.select().from(users).where(eq(users.id, session.user2Id));
  if (user2) {
    const newCount = (user2.snackCount || 0) + 1;
    const currentTotal = (user2.snackScore || 0) * (user2.snackCount || 0);
    const newScore = Math.round((currentTotal + session.ratingUser1) / newCount);

    await db
      .update(users)
      .set({ snackScore: newScore, snackCount: newCount })
      .where(eq(users.id, session.user2Id));
  }
}

/**
 * Block a user
 */
export async function blockUser(blockerId: number, blockedId: number): Promise<void> {
  await db
    .insert(snackBlocks)
    .values({ blockerId, blockedId })
    .onConflictDoNothing();
}

/**
 * Report a user
 */
export async function reportUser(
  reporterId: number,
  reportedId: number,
  sessionId: number | null,
  reason: string,
  description: string | null
): Promise<void> {
  await db.insert(snackReports).values({
    reporterId,
    reportedId,
    sessionId,
    reason,
    description,
  });
}
