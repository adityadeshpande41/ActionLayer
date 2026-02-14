# ActionLayer Setup Guide

This guide will help you get ActionLayer up and running in production.

## Quick Start Checklist

- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Set up OpenAI API key
- [ ] (Optional) Configure PostgreSQL database
- [ ] Run the application
- [ ] Create your first user account

## Detailed Setup Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages for both frontend and backend.

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

#### Required Variables

```env
# OpenAI API Key (REQUIRED)
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

#### Recommended Variables

```env
# Session Secret (IMPORTANT for production)
SESSION_SECRET=generate-a-long-random-string-here
```

Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Optional Variables

```env
# Database (optional - uses in-memory storage by default)
DATABASE_URL=postgresql://username:password@localhost:5432/actionlayer

# Server Configuration
PORT=5000
NODE_ENV=production

# File Upload Limits
MAX_FILE_SIZE=10485760
```

### 3. Database Setup (Optional)

If you want persistent storage, set up PostgreSQL:

#### Install PostgreSQL

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql
sudo systemctl start postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE actionlayer;
CREATE USER actionlayer_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE actionlayer TO actionlayer_user;
\q
```

#### Update .env

```env
DATABASE_URL=postgresql://actionlayer_user:your_password@localhost:5432/actionlayer
```

#### Push Schema

```bash
npm run db:push
```

### 4. OpenAI API Setup

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

**Important Notes:**
- You need GPT-4 access for best results
- Monitor your API usage at https://platform.openai.com/usage
- Set up billing limits to avoid unexpected charges

### 5. Run the Application

#### Development Mode

```bash
npm run dev
```

This starts both the backend server and frontend dev server with hot reload.

#### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

### 6. Create Your First User

1. Open your browser to `http://localhost:5000`
2. Click "Register" or navigate to the registration page
3. Create an account with:
   - Username
   - Password
   - Email (optional)

### 7. Create Your First Project

1. After logging in, you'll see the dashboard
2. Click on the project selector in the header
3. Create a new project (e.g., "My First Project")

### 8. Analyze Your First Transcript

1. Navigate to "Transcript Analysis" in the sidebar
2. Choose one of two options:
   - **Upload/Paste Transcript**: Paste meeting notes or upload a .txt/.md/.pdf file
   - **Quick Intake**: Answer guided questions about your meeting
3. Select meeting type (optional)
4. Click "Run Analysis"
5. Wait for AI to process (usually 10-30 seconds)
6. Review the extracted decisions, risks, and action items

## Production Deployment

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong `SESSION_SECRET`
- [ ] Configure PostgreSQL for persistent storage
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS if needed
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database

### Deployment Platforms

#### Replit (Current Platform)

The app is already configured for Replit. Just:
1. Add secrets in the Secrets tab
2. Click "Run"

#### Heroku

```bash
# Install Heroku CLI
heroku create actionlayer

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set OPENAI_API_KEY=sk-your-key
heroku config:set SESSION_SECRET=your-secret

# Deploy
git push heroku main
```

#### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t actionlayer .
docker run -p 5000:5000 --env-file .env actionlayer
```

#### VPS (Ubuntu)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo>
cd actionlayer
npm install
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "actionlayer" -- start
pm2 save
pm2 startup
```

### Security Considerations

1. **API Keys**: Never commit `.env` file to git
2. **Session Secret**: Use a strong random string in production
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Consider adding rate limiting for API endpoints
5. **Input Validation**: All user inputs are validated server-side
6. **File Uploads**: Limited to 10MB by default, only accepts text/pdf

### Monitoring

Consider setting up:
- Error tracking (Sentry, Rollbar)
- Performance monitoring (New Relic, DataDog)
- Uptime monitoring (UptimeRobot, Pingdom)
- Log aggregation (Papertrail, Loggly)

## Troubleshooting

### "OpenAI API key not found"
- Check that `OPENAI_API_KEY` is set in `.env`
- Restart the server after adding the key

### "Database connection failed"
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure database exists and user has permissions

### "Session not persisting"
- Check that `SESSION_SECRET` is set
- Verify cookies are enabled in browser
- In production, ensure `secure: true` matches your HTTPS setup

### "File upload fails"
- Check file size (default limit: 10MB)
- Verify file type (.txt, .md, .pdf)
- Check server logs for detailed error

### "AI analysis takes too long"
- OpenAI API can take 10-30 seconds for complex transcripts
- Check your OpenAI API rate limits
- Consider implementing a queue system for large volumes

## Support

For issues and questions:
- Check the README.md for API documentation
- Review server logs for error details
- Verify all environment variables are set correctly

## Next Steps

Once your setup is complete:
1. Explore the Command Mode for natural language queries
2. Try generating Jira drafts from your analyses
3. Use the Memory page to track decisions over time
4. Customize the settings to match your workflow
5. Integrate with your existing tools (Jira, Slack, etc.)

Happy analyzing! 🚀
