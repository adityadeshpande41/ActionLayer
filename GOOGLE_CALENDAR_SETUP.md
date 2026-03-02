# Google Calendar Integration Setup Guide

## Overview

ActionLayer now supports Google Calendar integration! Sync your ActionLayer calendar events with Google Calendar for seamless scheduling.

## Features

✅ **Sync to Google Calendar** - Push ActionLayer events to Google Calendar  
✅ **Import from Google** - Import existing Google Calendar events  
✅ **OAuth 2.0 Authentication** - Secure authentication flow  
✅ **Two-way visibility** - Keep both calendars in sync  
✅ **Event details preserved** - Title, description, location, attendees, reminders  

---

## Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `ActionLayer Calendar`
4. Click "Create"

### Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (unless you have Google Workspace)
3. Click "Create"

**Fill in the required information:**
- App name: `ActionLayer`
- User support email: Your email
- Developer contact: Your email

**Add Scopes:**
1. Click "Add or Remove Scopes"
2. Find and select: `https://www.googleapis.com/auth/calendar.events`
3. Click "Update"

**Add Test Users:**
1. Click "Add Users"
2. Add your email address
3. Click "Save and Continue"

### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth Client ID"
3. Choose "Desktop app" as application type
4. Name it: `ActionLayer Desktop Client`
5. Click "Create"

**Download Credentials:**
1. Click the download icon (⬇️) next to your newly created OAuth client
2. Save the file as `google-credentials.json`
3. Move it to your ActionLayer project root directory

---

## Installation

### 1. Place Credentials File

```bash
# Make sure google-credentials.json is in your project root
ls google-credentials.json
```

### 2. Restart Server

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

The server will detect the credentials file and enable Google Calendar integration.

---

## Usage

### Connect Google Calendar

1. Open ActionLayer in your browser: `http://localhost:5001`
2. Go to the Calendar page
3. Look for "Connect Google Calendar" button
4. Click it - a browser window will open
5. Sign in with your Google account
6. Grant calendar permissions
7. You'll be redirected back to ActionLayer

### Sync Event to Google Calendar

1. Create an event in ActionLayer
2. Click the "Sync to Google" button on the event
3. The event will appear in your Google Calendar
4. You'll get a link to view it in Google Calendar

### Import from Google Calendar

1. Click "Import from Google Calendar"
2. Select date range
3. Events from Google Calendar will be imported to ActionLayer

---

## API Endpoints

### Check Google Calendar Status
```
GET /api/calendar/google/status
```

Response:
```json
{
  "configured": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### Authenticate with Google
```
POST /api/calendar/google/auth
Body: { "code": "authorization_code" }
```

### Sync Event to Google Calendar
```
POST /api/calendar/:eventId/sync-to-google
```

### Import from Google Calendar
```
POST /api/calendar/google/import/:projectId
Body: { "startDate": "2024-01-01", "endDate": "2024-12-31" }
```

---

## How It Works

### Authentication Flow

1. User clicks "Connect Google Calendar"
2. Opens Google OAuth consent screen
3. User grants permissions
4. Google returns authorization code
5. Server exchanges code for access token
6. Token saved to `google-token.json`
7. Future requests use saved token

### Event Sync

**ActionLayer → Google Calendar:**
```
1. User creates event in ActionLayer
2. Event saved to SQLite database
3. User clicks "Sync to Google"
4. Server converts event to Google Calendar format
5. Creates event via Google Calendar API
6. Google Calendar ID stored in event description
```

**Google Calendar → ActionLayer:**
```
1. User clicks "Import from Google"
2. Server fetches events from Google Calendar API
3. Converts Google events to ActionLayer format
4. Saves to SQLite database
5. Events appear in ActionLayer calendar
```

---

## Troubleshooting

### "Google Calendar not configured"

**Solution:** Make sure `google-credentials.json` exists in project root

```bash
ls google-credentials.json
```

### "Failed to authenticate"

**Solutions:**
1. Check that you added your email as a test user in OAuth consent screen
2. Make sure Google Calendar API is enabled
3. Try deleting `google-token.json` and re-authenticating

### "Token expired"

**Solution:** Delete token and re-authenticate

```bash
rm google-token.json
# Restart server and reconnect
```

### "Insufficient permissions"

**Solution:** Make sure you granted calendar.events scope

1. Go to Google Cloud Console
2. OAuth consent screen → Edit app
3. Verify `calendar.events` scope is added

---

## Security Notes

⚠️ **Important:**

- `google-credentials.json` contains your OAuth client secret
- `google-token.json` contains access tokens to your calendar
- Both files are in `.gitignore` - never commit them
- Each user needs their own credentials
- Tokens grant access to calendar data - keep them secure

### Revoking Access

To revoke ActionLayer's access to your Google Calendar:

1. Go to [Google Account Permissions](https://myaccount.google.com/permissions)
2. Find "ActionLayer"
3. Click "Remove Access"
4. Delete `google-token.json` from your project

---

## Limitations

### Current Limitations:

- Manual sync (not automatic)
- One-way sync per action (either to or from Google)
- No conflict resolution
- No recurring events support yet
- Desktop OAuth only (not web OAuth)

### Future Enhancements:

- Automatic bidirectional sync
- Webhook support for real-time updates
- Recurring events
- Multiple calendar support
- Conflict resolution
- Web OAuth flow

---

## Example Workflow

### Scenario: Schedule a Jira Story Deadline

1. Run analysis on meeting transcript
2. Generate Jira stories
3. Click "Schedule Deadline" on a story
4. Event created in ActionLayer calendar
5. Click "Sync to Google" on the event
6. Deadline now in both calendars
7. Get Google Calendar reminders
8. View in Google Calendar mobile app

---

## Development

### Testing Locally

```bash
# Start server
npm run dev

# Check status
curl http://localhost:5001/api/calendar/google/status

# Create test event
curl -X POST http://localhost:5001/api/calendar \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "...",
    "title": "Test Event",
    "eventType": "meeting",
    "startDate": "2024-02-15T10:00:00Z"
  }'

# Sync to Google
curl -X POST http://localhost:5001/api/calendar/{eventId}/sync-to-google
```

### Code Structure

```
server/
├── services/
│   └── google-calendar.ts    # Google Calendar service
└── routes/
    └── calendar.ts            # Calendar routes with Google sync

client/
└── src/
    └── lib/
        └── api.ts             # API client with Google methods
```

---

## Support

If you encounter issues:

1. Check server logs for errors
2. Verify credentials file is valid JSON
3. Ensure Google Calendar API is enabled
4. Check OAuth consent screen configuration
5. Try re-authenticating

For more help, check the [Google Calendar API documentation](https://developers.google.com/calendar/api/guides/overview).

---

## Summary

✅ Google Calendar integration is now available!  
✅ Sync ActionLayer events to Google Calendar  
✅ Import Google Calendar events to ActionLayer  
✅ Secure OAuth 2.0 authentication  
✅ Keep your calendars in sync  

**Next Steps:**
1. Create Google Cloud project
2. Download credentials
3. Place in project root
4. Restart server
5. Connect and sync!

Happy scheduling! 📅
