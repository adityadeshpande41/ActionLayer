# Multiple Follow-Up Emails Feature

## Overview
Enhanced the follow-up email generation to create multiple targeted emails for different stakeholders instead of a single generic email.

## What Changed

### Before
- Single generic follow-up email for all stakeholders
- One-size-fits-all approach
- Less actionable for specific roles

### After
- **4 Targeted Emails** generated based on analysis content:

#### 1. General Summary Email 📧
- **Recipients**: All Stakeholders
- **Content**: Executive summary of meeting outcomes
- **Includes**: High-level decisions, action items count, risks overview
- **Tone**: Professional, concise, suitable for everyone

#### 2. Risk Alert Email ⚠️
- **Recipients**: Product Owners, Risk Managers
- **Generated**: Only if High or Medium severity risks exist
- **Content**: Detailed risk breakdown with:
  - Risk severity, impact, and likelihood
  - Mitigation strategies
  - Risk owners
  - Urgent call-to-action for critical items
- **Tone**: Professional and urgent for high-severity items

#### 3. Blockers & Dependencies Email 🚧
- **Recipients**: Team Leads, Engineering Managers
- **Generated**: Only if blockers or dependencies identified
- **Content**: 
  - Each blocker with owner and priority
  - What's blocking what
  - Requests for immediate action
  - Escalation suggestions
- **Tone**: Action-oriented with clear call-to-action

#### 4. Action Items Email ✅
- **Recipients**: Action Item Owners/Assignees
- **Generated**: Only if action items exist
- **Content**:
  - All action items with owners and priorities
  - Grouped by owner when possible
  - Deadlines and urgency indicators
  - Confirmation request
- **Tone**: Friendly but professional

## UI Changes

### Email Display
- Each email shown in a separate card with color-coded left border:
  - **Blue**: General Summary
  - **Red**: Risk Alert
  - **Orange**: Blockers
  - **Primary**: Action Items

### Features per Email Card
- Email type icon and title
- Recipient list clearly displayed
- Subject line preview
- Full email body with proper formatting
- Individual "Copy" button for each email
- Color-coded backgrounds matching email type

### Summary Header
- Shows total number of emails generated
- Example: "4 targeted emails generated"

## Technical Implementation

### Backend (`server/services/openai.ts`)
- `generateFollowUpEmail()` now returns object with 4 email types
- Each email generated with specific prompt for its audience
- Conditional generation (only creates emails when relevant data exists)
- Uses GPT-4o with JSON response format
- Temperature: 0.7 for general, 0.6 for focused emails

### Frontend (`client/src/pages/analyze.tsx`)
- Changed `followUpEmail` state to `followUpEmails`
- Updated handler to show count of generated emails
- New UI section with multiple email cards
- Each card styled according to email type

### API Response Structure
```json
{
  "emails": {
    "general": {
      "subject": "...",
      "body": "...",
      "recipients": "All Stakeholders"
    },
    "risks": {
      "subject": "⚠️ Risk Alert: ...",
      "body": "...",
      "recipients": "Product Owners, Risk Managers"
    } | null,
    "blockers": {
      "subject": "🚧 Action Required: ...",
      "body": "...",
      "recipients": "Team Leads, Engineering Managers"
    } | null,
    "actions": {
      "subject": "✅ Action Items from Meeting",
      "body": "...",
      "recipients": "Action Item Owners"
    } | null
  }
}
```

## Benefits

1. **Targeted Communication**: Each stakeholder gets only relevant information
2. **Actionable**: Clear next steps for each recipient group
3. **Time-Saving**: No need to manually create separate emails
4. **Professional**: Appropriate tone and content for each audience
5. **Flexible**: Only generates emails when relevant data exists

## Usage

1. Run an analysis (transcript, intake, or command)
2. Click "Generate Follow-Up" button
3. System generates 1-4 emails based on analysis content
4. Review each email in its dedicated card
5. Copy individual emails to send to respective stakeholders

## Example Scenario

After analyzing a client meeting with risks and blockers:
- **General email** → Send to entire team and client
- **Risk email** → Forward to product owner for immediate attention
- **Blocker email** → Send to engineering manager to unblock team
- **Action items email** → Send to all assignees with their tasks

This ensures everyone gets the information they need without information overload.
