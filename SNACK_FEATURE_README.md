# Snack Feature - Implementation Guide

## Overview

**Snack** is an Uber-style social matching system for campus students. Users can create a "Snack Request" and get matched with another compatible user in real-time for short, time-limited interactions (10-30 minutes).

The goal is to enable low-pressure, structured micro-connections between students.

---

## Features Implemented

### ✅ Backend

1. **Database Schema** (in `shared/schema.ts`)
   - `snackRequests` - User requests with type, topic, duration, tags, location
   - `snackSessions` - Active/ended sessions between two matched users
   - `snackMessages` - Chat messages within sessions
   - `snackBlocks` - User blocking functionality
   - `snackReports` - Safety reporting system
   - Updated `users` table with `snackScore` and `snackCount`

2. **Matching Service** (`server/snack-matching.ts`)
   - Smart matching algorithm based on:
     - Same snack type
     - Tag similarity (Jaccard similarity)
     - Same campus/university
     - Duration preferences
     - Location matching
   - Automatic blocking of previously reported/blocked users
   - Rating system with automatic score calculation
   - Session extension (adds 10 minutes)

3. **REST API Routes** (`server/routes.ts`)
   - `POST /api/snack/request` - Create snack request
   - `DELETE /api/snack/request/:id` - Cancel request
   - `GET /api/snack/match-status` - Check active request/session
   - `POST /api/snack/rate` - Rate a session (1-5 stars)
   - `POST /api/snack/report` - Report a user
   - `POST /api/snack/block` - Block a user
   - `GET /api/snack/session/:sessionId/messages` - Get session messages
   - `POST /api/snack/session/:sessionId/message` - Send message
   - `POST /api/snack/session/:sessionId/extend` - Extend session

4. **Socket.io Real-Time** (`server/socket.ts`)
   - Real-time matching notifications
   - Live chat messaging
   - Typing indicators
   - Session expiration alerts
   - Extension requests
   - User join/leave notifications

5. **Storage Layer** (`server/storage.ts`)
   - `createSnackRequest()` - Create request
   - `getMyActiveSnackRequest()` - Get user's active request
   - `getSnackSession()` - Get session with users
   - `getMyActiveSnackSession()` - Get user's active session
   - `getSnackMessages()` - Fetch messages
   - `createSnackMessage()` - Send message

---

### ✅ Frontend

1. **React Hooks** (`client/src/hooks/`)
   - `use-snack.ts` - API calls for all snack endpoints
   - `use-snack-socket.ts` - Socket.io connection management

2. **Components** (`client/src/components/`)
   - `create-snack-dialog.tsx` - Modal to create snack request
   - `snack-waiting-screen.tsx` - Waiting queue UI with animated loader
   - `snack-active-session.tsx` - Active chat session with timer
   - `snack-summary-modal.tsx` - Post-session rating & actions

3. **Page** (`client/src/pages/`)
   - `snack.tsx` - Main Snack page with:
     - Hero section
     - User stats (snack count, score, minutes)
     - Snack type selection grid
     - "How it works" guide

4. **Navigation**
   - Added "Snack" link with Sparkles icon to main navigation

---

## Snack Types

| Type     | Emoji | Description          |
|----------|-------|----------------------|
| Study    | 📚    | Find a study buddy   |
| Chill    | 😌    | Casual hangout       |
| Debate   | 💬    | Discuss ideas        |
| Game     | 🎮    | Play together        |
| Activity | ⚡    | Do something         |
| Campus   | 🏫    | Explore campus       |

---

## User Flow

### 1. Create Request
- User selects snack type, duration (10/15/30 min), topic, location, tags
- Request is created and added to matching queue
- If match found immediately → go to session
- If no match → show waiting screen

### 2. Waiting Queue
- Displays animated loader with request details
- Polls every 3 seconds for matches via Socket.io
- User can cancel request anytime

### 3. Active Session
- Real-time chat with countdown timer
- Typing indicators
- Actions: Extend session, Add friend, Report user
- Auto-expires after duration

### 4. Post-Session
- Rate the experience (1-5 stars)
- Option to add as friend
- Option to report or block user
- View session stats

---

## Matching Algorithm

The matching algorithm in `server/snack-matching.ts` scores potential matches based on:

1. **Tag Similarity (60%)** - Jaccard similarity of user tags
2. **Duration Match (20%)** - Same duration preference
3. **Location Match (20%)** - Same campus location
4. **Topic Bonus (10%)** - Similar topics

**Safety Filters:**
- Blocked users are excluded
- Previously reported users are excluded
- Must be from same university

**Fallback:** If no good match (score < 0.3), uses FIFO (first in, first out).

---

## Database Migration

To apply the new schema, run:

```bash
npm run db:push
```

This will create the following tables:
- `snack_requests`
- `snack_sessions`
- `snack_messages`
- `snack_blocks`
- `snack_reports`

And add columns to `users`:
- `snack_score` (integer, default 0)
- `snack_count` (integer, default 0)

---

## Environment Variables

No additional environment variables needed. Socket.io uses the same server port.

---

## Testing the Feature

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Create Two Test Accounts
- Register two users from the same university
- Navigate to `/snack` on both accounts

### 3. Test Matching
- User 1: Create a "Chill" snack with tag "coffee"
- User 2: Create a "Chill" snack with tag "coffee"
- They should match immediately

### 4. Test Chat
- Send messages back and forth
- Test typing indicators
- Test extend session feature

### 5. Test Rating
- Wait for session to expire OR manually end
- Rate the session (1-5 stars)
- Check that snackScore is updated

---

## Code Structure

```
server/
  ├── snack-matching.ts       # Core matching algorithm
  ├── routes.ts              # REST API endpoints
  ├── socket.ts              # Socket.io handlers
  └── storage.ts             # Database queries

shared/
  └── schema.ts              # Database schema & types
  └── routes.ts              # API route definitions

client/src/
  ├── hooks/
  │   ├── use-snack.ts       # API hooks
  │   └── use-snack-socket.ts # Socket.io hook
  ├── components/
  │   ├── create-snack-dialog.tsx
  │   ├── snack-waiting-screen.tsx
  │   ├── snack-active-session.tsx
  │   └── snack-summary-modal.tsx
  └── pages/
      └── snack.tsx           # Main page
```

---

## Security & Safety

1. **Blocking** - Users can block anyone; matching algorithm respects blocks
2. **Reporting** - Report inappropriate behavior; saved to database for moderation
3. **Session Privacy** - Only session participants can view messages
4. **Auto-Expiration** - Sessions automatically end after duration
5. **No Cross-University Matching** - Users only match within their campus

---

## Performance Considerations

1. **Indexed Fields** - `snackType` and `status` are indexed in queries
2. **Polling** - Match status polled every 3 seconds (configurable)
3. **Socket Rooms** - Each session has its own room for efficient broadcasting
4. **Message Pagination** - Currently loads all messages (add pagination for scale)

---

## Future Enhancements

- [ ] Push notifications for matches
- [ ] Advanced filters (year, major, interests)
- [ ] Video/voice calls via WebRTC
- [ ] Location-based matching (GPS)
- [ ] Snack history & analytics
- [ ] Admin moderation dashboard
- [ ] Machine learning-based matching
- [ ] Group snacks (3-4 people)
- [ ] Scheduled snacks
- [ ] Integration with university events

---

## Troubleshooting

### Match Not Found
- Ensure both users are from same university
- Check that request status is "waiting"
- Verify no blocks between users

### Socket Disconnects
- Check browser console for errors
- Ensure Socket.io client version matches server
- Verify CORS settings in production

### Messages Not Sending
- Verify session is active (not ended)
- Check that user is part of session
- Ensure Socket.io connection is established

---

## API Examples

### Create Request
```typescript
POST /api/snack/request
{
  "snackType": "study",
  "topic": "Linear Algebra",
  "duration": 15,
  "tags": ["math", "help"],
  "location": "Library"
}
```

### Rate Session
```typescript
POST /api/snack/rate
{
  "sessionId": 42,
  "rating": 5
}
```

### Send Message
```typescript
POST /api/snack/session/42/message
{
  "content": "Hey! Ready to study?"
}
```

---

## Credits

Built with:
- **Backend**: Express.js, Socket.io, Drizzle ORM, PostgreSQL
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Real-time**: Socket.io

---

## License

Part of the Campus-Connect (nerdds) platform.

---

**Ready to Snack! 🍿✨**
