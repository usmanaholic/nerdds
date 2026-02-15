# Cloudinary Setup Guide

## Why Cloudinary?
Your image posts were disappearing because uploaded files were stored locally on ephemeral/temporary storage. With Cloudinary, images are uploaded to a cloud CDN and persist permanently with fast global delivery.

## Setup Steps

### 1. Create a Free Cloudinary Account
1. Go to [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Sign up for a free account (no credit card required)
3. Verify your email

### 2. Get Your Credentials
1. After logging in, go to your [Dashboard](https://cloudinary.com/console)
2. You'll see three important values:
   - **Cloud Name** (e.g., `dbxyz123`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123`)

### 3. Add Credentials Locally

Update your `.env` file with the actual values:

```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 4. Add Credentials to Production (Render/Replit/etc.)

**For Render:**
1. Go to your service dashboard
2. Navigate to "Environment" tab
3. Add these three environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Save and redeploy

**For Replit:**
1. Click the "Secrets" (🔒) tab in the left sidebar
2. Add each variable as a secret
3. Restart your app

**For other platforms:**
- Add them to your deployment's environment variables section

### 5. Test It
1. Restart your local dev server: `npm run dev`
2. Create a new post with an image
3. The image will upload to Cloudinary and display a URL like:
   ```
   https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/campus-connect/abcdef.jpg
   ```

## Features Included
- ✅ **Auto-optimization**: Images are automatically compressed for web
- ✅ **Responsive format**: Delivers WebP/AVIF where supported
- ✅ **Size limit**: Max 1200x1200px to reduce storage
- ✅ **Organized**: All uploads go to `campus-connect` folder
- ✅ **Persistent**: Images never disappear after server restarts

## Free Tier Limits
- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month

This is more than enough for a university social media app!

## Troubleshooting

**"Upload failed" error:**
- Check that all three environment variables are set correctly
- Ensure there are no extra spaces in the values
- Verify your credentials at https://cloudinary.com/console

**Images still using old `/uploads/` paths:**
- These are old posts before Cloudinary was set up
- New posts will use Cloudinary URLs
- Old images won't load unless you have the local files

**Want to migrate old images?**
- You'd need to re-upload them through the app or write a migration script
