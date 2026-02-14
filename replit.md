# ActionLayer - Turn talk into tasks

## Overview
ActionLayer is a modern SaaS PM command center that transforms meeting transcripts into structured decisions, risks, and action items. Built with React + TypeScript + Tailwind CSS + shadcn/ui.

## Project Architecture
- **Frontend**: React (Vite) with wouter routing, shadcn/ui components, Tailwind CSS
- **Backend**: Express.js (minimal - mostly frontend mock data)
- **State**: Local state with mock data (no database needed for current MVP)
- **Theme**: Electric violet primary (#8B5CF6) with neon lime highlight accents, dark mode support

## Pages
1. `/` - Dashboard (PM Command Center with metrics, risk drift, dependency chains, recent runs)
2. `/analyze` - Transcript Analysis (upload/paste transcript or quick intake, analysis results with 7 sub-tabs)
3. `/command` - Command Mode (chat/voice input, AI response with intent/plan/actions)
4. `/memory` - Project Memory (timeline, filters, risk drift, cross-call insights)
5. `/settings` - Settings (toggles, theme, data export)

## Key Components
- `components/app-sidebar.tsx` - Left sidebar with navigation
- `components/app-header.tsx` - Top header with project selector, search, notifications, theme toggle, user menu
- `components/theme-provider.tsx` - Dark/light theme management
- `lib/mock-data.ts` - All mock data for the application

## Design Tokens
- Primary: 271 91% 65% (electric violet)
- Highlight: 84 85% 50% (neon lime - used sparingly for badges/CTAs)
- Font: Inter (sans), JetBrains Mono (mono)

## Running
- `npm run dev` starts both Express backend and Vite frontend
- Frontend binds to port 5000
