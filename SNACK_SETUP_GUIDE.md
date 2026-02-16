# Snack Feature - Quick Setup Guide

## Installation Steps

### 1. Database Migration

The new Snack feature requires additional database tables. Run the migration:

```bash
npm run db:push
```

This will create:
- `snack_requests` table
- `snack_sessions` table
- `snack_messages` table
- `snack_blocks` table
- `snack_reports` table

And update the `users` table with:
- `snack_score` column
- `snack_count` column

### 2. Start the Server

```bash
npm run dev
```

The server will start on port 5000 with Socket.io enabled.

### 3. Access the Feature

Navigate to: **http://localhost:5000/snack**

---

## File Structure

### Backend (Server)
```
server/
├── snack-matching.ts      ← Matching algorithm & business logic
├── routes.ts             ← REST API endpoints (Snack section added)
├── socket.ts             ← Socket.io real-time handlers
├── storage.ts            ← Database queries (Snack methods added)
└── index.ts              ← Socket.io initialization added
```

### Shared
```
shared/
├── schema.ts             ← Database schema (Snack tables added)
└── routes.ts             ← API route definitions (Snack routes added)
```

### Frontend (Client)
```
client/src/
├── hooks/
│   ├── use-snack.ts           ← API hooks for Snack
│   └── use-snack-socket.ts    ← Socket.io connection hook
├── components/
│   ├── create-snack-dialog.tsx      ← Create request modal
│   ├── snack-waiting-screen.tsx     ← Waiting queue UI
│   ├── snack-active-session.tsx     ← Active chat session
│   ├── snack-summary-modal.tsx      ← Post-session rating
│   └── layout-shell.tsx             ← Updated navigation
├── pages/
│   └── snack.tsx                     ← Main Snack page
└── App.tsx                           ← Route added
```

---

## Testing Checklist

### ✅ Basic Flow
1. Create two user accounts from the same university
2. Navigate to `/snack` on both browsers
3. Create matching requests (same type, similar tags)
4. Verify match is found instantly
5. Test chat functionality
6. Wait for session to expire
7. Rate the session

### ✅ Matching Algorithm
- [ ] Same snack type matches
- [ ] Similar tags improve matching
- [ ] Different universities don't match
- [ ] Blocked users don't match
- [ ] FIFO works when no good matches

### ✅ Real-time Features
- [ ] Match notification appears
- [ ] Chat messages sync
- [ ] Typing indicator works
- [ ] Timer counts down
- [ ] Session expires correctly

### ✅ Safety Features
- [ ] Can report a user
- [ ] Can block a user
- [ ] Blocked users excluded from future matches

### ✅ Rating System
- [ ] Can rate 1-5 stars
- [ ] SnackScore updates correctly
- [ ] SnackCount increments

---

## Common Issues

### "No match found"
**Solution:** Create a second request from another account with:
- Same university
- Same snack type
- At least one matching tag

### Socket connection fails
**Solution:** Check browser console for errors. Ensure:
- Server is running on port 5000
- No CORS issues
- Socket.io client version matches server

### TypeScript errors
**Solution:** Run:
```bash
npm install
```

All dependencies are already in package.json.

---

## Feature Toggle

To disable Snack temporarily, comment out in `App.tsx`:

```tsx
// <Route path="/snack" component={SnackPage} />
```

And remove from navigation in `layout-shell.tsx`:

```tsx
// { icon: Sparkles, label: "Snack", href: "/snack" },
```

---

## Next Steps

1. ✅ Deploy to production
2. ✅ Monitor for bugs
3. ✅ Collect user feedback
4. Future: Add push notifications
5. Future: Video/voice calls

---

## Support

For issues, refer to:
- `SNACK_FEATURE_README.md` - Full documentation
- Backend code: `server/snack-matching.ts`
- Frontend page: `client/src/pages/snack.tsx`

**Happy Snacking! 🍿✨**
