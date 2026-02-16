import { z } from 'zod';
import { 
  insertUserSchema, insertPostSchema, insertCommentSchema, insertMessageSchema, 
  insertSnackRequestSchema, insertSnackRatingSchema, insertSnackReportSchema,
  users, universities, posts, comments, directMessages,
  snackRequests, snackSessions, snackMessages,
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    signup: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  universities: {
    list: {
      method: 'GET' as const,
      path: '/api/universities' as const,
      responses: {
        200: z.array(z.custom<typeof universities.$inferSelect>()),
      },
    },
  },
  posts: {
    list: {
      method: 'GET' as const,
      path: '/api/posts' as const,
      input: z.object({
        universityId: z.coerce.number().optional(),
        tag: z.string().optional(),
        cursor: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof posts.$inferSelect & { author: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/posts' as const,
      input: insertPostSchema,
      responses: {
        201: z.custom<typeof posts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/posts/:id' as const,
      responses: {
        200: z.custom<typeof posts.$inferSelect & { author: typeof users.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    like: {
      method: 'POST' as const,
      path: '/api/posts/:id/like' as const,
      responses: {
        200: z.object({ likesCount: z.number() }),
      },
    },
  },
  explore: {
    data: {
      method: 'GET' as const,
      path: '/api/explore' as const,
      responses: {
        200: z.object({
          trending: z.array(z.custom<typeof posts.$inferSelect & { author: typeof users.$inferSelect }>()),
          suggestedUsers: z.array(z.custom<typeof users.$inferSelect>()),
          hotTopics: z.array(z.object({
            hashtag: z.string(),
            count: z.number(),
          })),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  comments: {
    list: {
      method: 'GET' as const,
      path: '/api/posts/:postId/comments' as const,
      responses: {
        200: z.array(z.custom<typeof comments.$inferSelect & { author: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/posts/:postId/comments' as const,
      input: insertCommentSchema.pick({ content: true }),
      responses: {
        201: z.custom<typeof comments.$inferSelect>(),
      },
    },
  },
  users: {
    get: {
      method: 'GET' as const,
      path: '/api/users/:username' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    follow: {
      method: 'POST' as const,
      path: '/api/users/:id/follow' as const,
      responses: {
        200: z.void(),
      },
    },
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages' as const, // Recent conversations
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/messages/:userId' as const,
      responses: {
        200: z.array(z.custom<typeof directMessages.$inferSelect>()),
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/messages' as const,
      input: insertMessageSchema,
      responses: {
        201: z.custom<typeof directMessages.$inferSelect>(),
      },
    },
  },
  challenges: {
    active: {
      method: 'GET' as const,
      path: '/api/challenges/active' as const,
      responses: {
        200: z.object({
          campus: z.object({
            id: z.number(),
            name: z.string(),
            slug: z.string(),
          }),
          userPoints: z.number(),
          challenges: z.array(z.object({
            roundId: z.number(),
            key: z.string(),
            title: z.string(),
            description: z.string().nullable(),
            cadence: z.string(),
            kind: z.string(),
            prompt: z.string().nullable(),
            expiresAt: z.string(),
            options: z.array(z.object({
              key: z.string(),
              label: z.string(),
              emoji: z.string().optional(),
              count: z.number(),
              percent: z.number(),
            })).optional(),
            history: z.array(z.object({
              label: z.string(),
              value: z.number(),
            })).optional(),
            leaderboard: z.array(z.object({
              userId: z.number(),
              username: z.string(),
              score: z.number(),
              timeMs: z.number().nullable(),
            })).optional(),
            meta: z.object({
              correctOptionKey: z.string().optional(),
              risingStar: z.object({
                userId: z.number(),
                username: z.string(),
                points: z.number(),
                cheers: z.number(),
              }).optional(),
              personalityResults: z.array(z.object({
                key: z.string(),
                label: z.string(),
                blurb: z.string().optional(),
              })).optional(),
              questions: z.array(z.object({
                prompt: z.string(),
                options: z.array(z.string()),
              })).optional(),
            }).optional(),
            userVote: z.string().nullable(),
          })),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/challenges/:roundId/submit' as const,
      input: z.object({
        optionKey: z.string().optional(),
        resultKey: z.string().optional(),
        timeMs: z.number().int().positive().optional(),
      }),
      responses: {
        200: z.object({
          userPoints: z.number(),
          challenge: z.object({
            roundId: z.number(),
            key: z.string(),
            title: z.string(),
            description: z.string().nullable(),
            cadence: z.string(),
            kind: z.string(),
            prompt: z.string().nullable(),
            expiresAt: z.string(),
            options: z.array(z.object({
              key: z.string(),
              label: z.string(),
              emoji: z.string().optional(),
              count: z.number(),
              percent: z.number(),
            })).optional(),
            history: z.array(z.object({
              label: z.string(),
              value: z.number(),
            })).optional(),
            leaderboard: z.array(z.object({
              userId: z.number(),
              username: z.string(),
              score: z.number(),
              timeMs: z.number().nullable(),
            })).optional(),
            meta: z.object({
              correctOptionKey: z.string().optional(),
              risingStar: z.object({
                userId: z.number(),
                username: z.string(),
                points: z.number(),
                cheers: z.number(),
              }).optional(),
              personalityResults: z.array(z.object({
                key: z.string(),
                label: z.string(),
                blurb: z.string().optional(),
              })).optional(),
              questions: z.array(z.object({
                prompt: z.string(),
                options: z.array(z.string()),
              })).optional(),
            }).optional(),
            userVote: z.string().nullable(),
          }),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  snack: {
    createRequest: {
      method: 'POST' as const,
      path: '/api/snack/request' as const,
      input: insertSnackRequestSchema,
      responses: {
        201: z.object({
          request: z.custom<typeof snackRequests.$inferSelect>(),
          matched: z.boolean(),
          session: z.custom<typeof snackSessions.$inferSelect & { 
            user1: typeof users.$inferSelect; 
            user2: typeof users.$inferSelect;
          }>().optional(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    cancelRequest: {
      method: 'DELETE' as const,
      path: '/api/snack/request/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    getMatchStatus: {
      method: 'GET' as const,
      path: '/api/snack/match-status' as const,
      responses: {
        200: z.object({
          hasActiveRequest: z.boolean(),
          request: z.custom<typeof snackRequests.$inferSelect>().optional(),
          hasActiveSession: z.boolean(),
          session: z.custom<typeof snackSessions.$inferSelect & { 
            user1: typeof users.$inferSelect; 
            user2: typeof users.$inferSelect;
          }>().optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    rate: {
      method: 'POST' as const,
      path: '/api/snack/rate' as const,
      input: insertSnackRatingSchema,
      responses: {
        200: z.object({ 
          success: z.boolean(),
          session: z.custom<typeof snackSessions.$inferSelect>(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    report: {
      method: 'POST' as const,
      path: '/api/snack/report' as const,
      input: insertSnackReportSchema,
      responses: {
        201: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    block: {
      method: 'POST' as const,
      path: '/api/snack/block' as const,
      input: z.object({ userId: z.number() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
    getMessages: {
      method: 'GET' as const,
      path: '/api/snack/session/:sessionId/messages' as const,
      responses: {
        200: z.array(z.custom<typeof snackMessages.$inferSelect & { sender: typeof users.$inferSelect }>()),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    sendMessage: {
      method: 'POST' as const,
      path: '/api/snack/session/:sessionId/message' as const,
      input: z.object({ content: z.string().min(1).max(500) }),
      responses: {
        201: z.custom<typeof snackMessages.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    extendSession: {
      method: 'POST' as const,
      path: '/api/snack/session/:sessionId/extend' as const,
      responses: {
        200: z.object({ 
          success: z.boolean(),
          session: z.custom<typeof snackSessions.$inferSelect>(),
        }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
