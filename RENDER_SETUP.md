# Render Deployment Guide

## Prerequisites
1. GitHub account with this repo
2. Render account (free tier works)
3. Google OAuth credentials
4. OpenAI API key

## Step 1: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Name: `actionlayer-db`
4. Region: Choose closest to your users
5. Plan: Free (or paid for production)
6. Click "Create Database"
7. **Copy the "Internal Database URL"** - you'll need this

## Step 2: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Click on your OAuth 2.0 Client ID
4. Under "Authorized redirect URIs", add:
   ```
   https://YOUR-APP-NAME.onrender.com/api/calendar/google/callback
   ```
   (Replace YOUR-APP-NAME with your actual Render app name)
5. Click "Save"

## Step 3: Prepare Google Credentials

1. Download your `google-credentials.json` file
2. Copy the entire JSON content (you'll paste it as an environment variable)

## Step 4: Deploy Web Service on Render

1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `actionlayer` (or your preferred name)
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid)

## Step 5: Set Environment Variables

In the Render dashboard, add these environment variables:

```bash
# Required
NODE_ENV=production
PORT=5001

# Database (use Internal Database URL from Step 1)
DATABASE_URL=postgresql://...
DATABASE_SSL=true

# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-random-string-here

# Google Calendar (paste entire JSON from google-credentials.json)
GOOGLE_CREDENTIALS={"web":{"client_id":"...","client_secret":"...","redirect_uris":["https://YOUR-APP-NAME.onrender.com/api/calendar/google/callback"]}}

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### How to Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 6: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Once deployed, visit: `https://YOUR-APP-NAME.onrender.com`

## Step 7: Initialize Database

The database tables will be created automatically on first run. If you need to manually run migrations:

1. Go to Render Dashboard → Your Web Service
2. Click "Shell" tab
3. Run: `npm run db:push` (if you have this script)

## Step 8: Test the Deployment

1. Visit your app URL
2. Register a new account
3. Try uploading a transcript
4. Connect Google Calendar
5. Connect Jira (users enter their own credentials)

## Troubleshooting

### Database Connection Issues
- Make sure you're using the **Internal Database URL** (not External)
- Check that `DATABASE_SSL=true` is set

### Google Calendar Not Working
- Verify redirect URI matches exactly in Google Console
- Check that `GOOGLE_CREDENTIALS` is valid JSON (no line breaks)
- Make sure the redirect URI includes your actual Render app name

### App Crashes on Startup
- Check logs in Render Dashboard
- Verify all environment variables are set
- Ensure `NODE_ENV=production`

## Post-Deployment

### Custom Domain (Optional)
1. Go to your Web Service settings
2. Add custom domain
3. Update Google OAuth redirect URI to use custom domain

### Monitoring
- Check logs in Render Dashboard
- Set up health check monitoring
- Monitor database usage

### Scaling
- Upgrade to paid plan for:
  - No sleep on inactivity
  - More resources
  - Better performance

## Security Notes

- Never commit `.env` files
- Keep `SESSION_SECRET` secure
- Rotate API keys regularly
- Use HTTPS only (Render provides this automatically)
- Consider adding rate limiting for production

## Support

If you encounter issues:
1. Check Render logs
2. Verify environment variables
3. Test locally first with `NODE_ENV=production npm start`
