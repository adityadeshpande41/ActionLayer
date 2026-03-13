# 🚀 Render Deployment Guide - ActionLayer

## ✅ Pre-Deployment Checklist

### Code is Production Ready
- ✅ Multi-user authentication working
- ✅ Per-user Google Calendar integration
- ✅ Per-user Jira integration
- ✅ All features tested locally
- ✅ Database schema updated
- ✅ Build scripts configured
- ✅ Environment variables documented

---

## Step 1: Prepare for Deployment

### 1.1 Generate Session Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Save this output - you'll need it for Render environment variables.

### 1.2 Have Your OpenAI API Key Ready
Make sure you have your OpenAI API key: `sk-proj-...`

---

## Step 2: Create Render Account & Services

### 2.1 Sign Up for Render
1. Go to https://render.com
2. Sign up with GitHub (recommended) or email
3. Verify your email

### 2.2 Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Name: `actionlayer-db`
3. Database: `actionlayer`
4. User: `actionlayer_user`
5. Region: Choose closest to your users
6. Plan: **Free** (for testing) or **Starter** (for production)
7. Click "Create Database"
8. **IMPORTANT**: Copy the "Internal Database URL" - you'll need this!

### 2.3 Initialize Database Schema
Once the database is created:
1. Go to the database dashboard
2. Click "Connect" → "External Connection"
3. Use a PostgreSQL client or run:
```bash
psql <EXTERNAL_DATABASE_URL>
```
4. Copy and paste the entire contents of `db/migrations/postgres_init.sql`
5. Execute the SQL to create all tables

---

## Step 3: Deploy Web Service

### 3.1 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your ActionLayer repository
4. Configure:
   - **Name**: `actionlayer`
   - **Region**: Same as database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (for testing) or Starter ($7/month)

### 3.2 Add Environment Variables
Click "Advanced" → "Add Environment Variable" and add these:

```env
NODE_ENV=production
PORT=5001
DATABASE_URL=<YOUR_INTERNAL_DATABASE_URL_FROM_STEP_2.2>
DATABASE_SSL=true
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
SESSION_SECRET=<YOUR_GENERATED_SECRET_FROM_STEP_1.1>
MAX_FILE_SIZE=10485760
```

**Important**: Use the **Internal Database URL** from your Render PostgreSQL database!

### 3.3 Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://actionlayer.onrender.com`

---

## Step 4: Configure Google Calendar (After Deployment)

### 4.1 Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your ActionLayer project
3. Go to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID
5. Under "Authorized redirect URIs", add:
   ```
   https://your-app.onrender.com/api/calendar/google/callback
   ```
   (Replace `your-app.onrender.com` with your actual Render URL)
6. Click "Save"

### 4.2 Add Google Credentials to Render
1. Download your `google-credentials.json` from Google Cloud Console
2. Copy the entire JSON content
3. In Render dashboard, go to your web service
4. Environment → Add Environment Variable:
   - **Key**: `GOOGLE_CREDENTIALS`
   - **Value**: Paste the entire JSON (as a single line or formatted)
5. Save changes
6. Render will automatically redeploy

---

## Step 5: Test Your Deployment

### 5.1 Access Your App
1. Go to your Render URL: `https://your-app.onrender.com`
2. You should see the ActionLayer landing page

### 5.2 Test Registration
1. Click "Register"
2. Create a test account
3. Verify you're redirected to the dashboard

### 5.3 Test Google Calendar
1. Go to Settings
2. Click "Connect Google Calendar"
3. Sign in with Google
4. Grant permissions
5. Verify you're redirected back and events are imported

### 5.4 Test Jira
1. Go to Settings
2. Enter your Jira credentials
3. Click "Connect Jira"
4. Verify connection is successful

### 5.5 Test Core Features
1. Create a project
2. Analyze a transcript
3. View dashboard
4. Check calendar
5. Try command mode

---

## Step 6: Production Configuration

### 6.1 Custom Domain (Optional)
1. In Render dashboard, go to your web service
2. Settings → Custom Domain
3. Add your domain (e.g., `app.yourdomain.com`)
4. Follow DNS configuration instructions
5. Update Google Calendar redirect URI to use your custom domain

### 6.2 Enable Auto-Deploy
1. Settings → Build & Deploy
2. Enable "Auto-Deploy" for your main branch
3. Every push to main will automatically deploy

### 6.3 Set Up Health Checks
Render automatically monitors your app, but you can customize:
1. Settings → Health & Alerts
2. Configure health check path: `/api/auth/me`
3. Set up email alerts

---

## Environment Variables Reference

### Required
```env
NODE_ENV=production
PORT=5001
DATABASE_URL=<postgres-connection-string>
DATABASE_SSL=true
OPENAI_API_KEY=sk-proj-...
SESSION_SECRET=<32-byte-hex-string>
```

### Optional
```env
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
GOOGLE_CREDENTIALS=<json-string>
```

---

## Database Migration Checklist

✅ PostgreSQL database created on Render
✅ Schema initialized with `postgres_init.sql`
✅ All tables created:
  - users (with google_calendar_token, jira_base_url, jira_email, jira_api_token)
  - projects
  - transcripts
  - analyses
  - decisions
  - risks
  - action_items
  - calendar_events
  - user_integrations
✅ Indexes created
✅ Internal Database URL added to environment variables

---

## Common Issues & Solutions

### Issue: "Database connection failed"
**Solution**: 
- Make sure you're using the **Internal Database URL** (not External)
- Verify `DATABASE_SSL=true` is set
- Check database is in the same region as web service

### Issue: "Google Calendar not working"
**Solution**:
- Verify redirect URI in Google Cloud Console matches your Render URL
- Check `GOOGLE_CREDENTIALS` environment variable is set correctly
- Make sure it's valid JSON (no extra spaces or line breaks)

### Issue: "Session not persisting"
**Solution**:
- Verify `SESSION_SECRET` is set
- Check it's a proper 32-byte hex string
- Clear browser cookies and try again

### Issue: "Build failed"
**Solution**:
- Check build logs in Render dashboard
- Verify `package.json` has correct build script
- Make sure all dependencies are in `dependencies` (not `devDependencies`)

### Issue: "App is slow on first load"
**Solution**:
- This is normal on Render Free tier (spins down after inactivity)
- Upgrade to Starter plan for always-on service
- Or use a service like UptimeRobot to ping your app every 5 minutes

---

## Performance Optimization

### For Production Use:

1. **Upgrade to Starter Plan** ($7/month)
   - Always-on (no cold starts)
   - Better performance
   - More resources

2. **Enable CDN** (if using custom domain)
   - Faster static asset delivery
   - Better global performance

3. **Database Connection Pooling**
   - Already configured in the code
   - Handles multiple concurrent users

4. **Monitor Performance**
   - Use Render's built-in metrics
   - Set up alerts for downtime
   - Monitor database usage

---

## Security Checklist

✅ Environment variables not committed to Git
✅ Session secret is strong and unique
✅ Database uses SSL connection
✅ Passwords hashed with bcrypt
✅ HTTP-only cookies enabled
✅ CORS configured properly
✅ File upload size limited
✅ SQL injection protected (using Drizzle ORM)
✅ XSS protected (React escapes by default)

---

## Backup Strategy

### Database Backups
1. Render automatically backs up PostgreSQL databases
2. Free tier: 7-day retention
3. Paid tiers: Longer retention + point-in-time recovery

### Manual Backup
```bash
pg_dump <EXTERNAL_DATABASE_URL> > backup.sql
```

### Restore from Backup
```bash
psql <EXTERNAL_DATABASE_URL> < backup.sql
```

---

## Monitoring & Maintenance

### What to Monitor:
- ✅ App uptime (Render provides this)
- ✅ Database size (check Render dashboard)
- ✅ Error logs (Render Logs tab)
- ✅ OpenAI API usage (OpenAI dashboard)
- ✅ User registrations (database queries)

### Regular Maintenance:
- Review error logs weekly
- Monitor database growth
- Check OpenAI costs
- Update dependencies monthly
- Review user feedback

---

## Cost Estimate

### Free Tier (Testing)
- Web Service: Free (spins down after 15 min inactivity)
- PostgreSQL: Free (1GB storage)
- **Total**: $0/month

### Starter Tier (Production)
- Web Service: $7/month (always-on)
- PostgreSQL: $7/month (10GB storage)
- OpenAI API: ~$10-50/month (depends on usage)
- **Total**: ~$24-64/month

### Professional Tier
- Web Service: $25/month (more resources)
- PostgreSQL: $20/month (50GB storage)
- OpenAI API: ~$50-200/month
- **Total**: ~$95-245/month

---

## Post-Deployment Checklist

✅ App accessible at Render URL
✅ Registration working
✅ Login working
✅ Dashboard loading
✅ Google Calendar connection working
✅ Jira connection working
✅ Transcript analysis working
✅ Calendar events syncing
✅ Settings page accessible
✅ All features tested with real users

---

## Next Steps After Deployment

1. **Share with Beta Users**
   - Send them the Render URL
   - Provide quick start guide
   - Collect feedback

2. **Monitor Usage**
   - Check Render logs
   - Monitor OpenAI costs
   - Track user registrations

3. **Iterate Based on Feedback**
   - Fix bugs
   - Add requested features
   - Improve UX

4. **Scale as Needed**
   - Upgrade plans when needed
   - Add more database storage
   - Optimize performance

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **OpenAI API Docs**: https://platform.openai.com/docs

---

## 🎉 You're Ready to Deploy!

Your ActionLayer is production-ready. Follow the steps above to deploy to Render.

**Estimated deployment time**: 30-45 minutes

**Good luck! 🚀**
