# InstaFlow (Insta Automate) 🚀

A modern, production-ready Instagram Automation, Scheduling, and Analytics platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma**, and the official **Meta Instagram Graph API (v21.0)**.

Designed with a sleek, Stitch-inspired Studio interface, InstaFlow enables creators and businesses to compose, preview, schedule, and publish single-image posts, multi-slide carousels, and video Reels with real-time analytics and enterprise-grade security.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Required Environment Variables](#2-required-environment-variables)
3. [Database Setup & Prisma Migrations](#3-database-setup--prisma-migrations)
4. [Meta Developer App Setup Requirements](#4-meta-developer-app-setup-requirements)
5. [Local Development Instructions](#5-local-development-instructions)
6. [Production Deployment Instructions](#6-production-deployment-instructions)
7. [List of Implemented Features](#7-list-of-implemented-features)
8. [Features Requiring Additional Meta API Permissions](#8-features-requiring-additional-meta-api-permissions)
9. [Automated Testing Suite](#9-automated-testing-suite)

---

## 1. Project Structure

```
insta-automate/
├── prisma/
│   └── schema.prisma             # PostgreSQL schema (Users, Accounts, Posts, Media, Analytics)
├── public/
│   └── uploads/                  # Local media storage directory for uploaded assets
├── scripts/
│   ├── worker.ts                 # Dedicated background publisher queue worker
│   ├── test-instagram.ts         # Meta Graph API connectivity & profile test script
│   ├── test-real-publish.ts      # Live Instagram media container & publishing test script
│   ├── test-analytics.ts         # Account & media insights telemetry test script
│   ├── test-webhook.ts           # Webhook challenge & HMAC-SHA256 signature test suite
│   ├── test-error-handling.ts    # 29 automated tests verifying user-friendly error handling
│   └── verify-credentials.ts     # Meta access token & permission verification script
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── api/                  # Backend REST API Endpoints
│   │   │   ├── account/          # Account profile & disconnect endpoints
│   │   │   ├── analytics/        # Instagram insights & performance metrics
│   │   │   ├── auth/             # NextAuth credentials, OAuth initiate & callback
│   │   │   ├── cron/             # Scheduled post execution endpoint (secured by CRON_SECRET)
│   │   │   ├── media/upload/     # Binary magic-byte validated media upload route
│   │   │   ├── notifications/    # User notification dispatch & query endpoints
│   │   │   ├── posts/            # Post CRUD, publish now, and reschedule endpoints
│   │   │   ├── queue/            # Background job queue status & dispatch endpoints
│   │   │   ├── settings/         # System settings & live/demo mode toggle
│   │   │   ├── test/             # Instagram diagnostic endpoints
│   │   │   └── webhooks/         # Meta Graph API webhook subscription & ingestion
│   │   ├── auth/                 # Authentication pages (Login, Signup)
│   │   ├── dashboard/            # Studio Dashboard Sub-Pages
│   │   │   ├── activity/         # Published posts timeline & audit log
│   │   │   ├── analytics/        # Visual performance graphs, reach & engagement KPIs
│   │   │   ├── calendar/         # Monthly interactive publishing calendar
│   │   │   ├── create/           # Studio Post Composer & live mobile simulator
│   │   │   ├── drafts/           # Saved drafts management
│   │   │   ├── media/            # Uploaded asset library & gallery
│   │   │   ├── scheduled/        # Upcoming queued posts with reschedule/delete options
│   │   │   └── settings/         # Meta credentials, OAuth connection, & demo mode toggle
│   │   ├── globals.css           # Tailwind CSS directives & custom design tokens
│   │   ├── layout.tsx            # Root HTML layout with Session & Toast providers
│   │   └── page.tsx              # Public landing page with direct dashboard entry
│   ├── components/               # Modular UI Components
│   │   ├── composer/             # Post Studio suite (CaptionEditor, FeedSimulator, etc.)
│   │   ├── dashboard/            # Layout shell (Sidebar, Header, StatsCards)
│   │   ├── notifications/        # Notification bell dropdown & unread badge
│   │   └── providers/            # Client-side NextAuth & Toast notification context
│   ├── config/
│   │   └── instagram.ts          # Central Meta Graph API endpoints & scope constants
│   ├── lib/                      # Core Business & Infrastructure Services
│   │   ├── auth.ts               # NextAuth options & credential verification
│   │   ├── crypto.ts             # AES-256-GCM encryption/decryption for OAuth tokens
│   │   ├── csrf.ts               # Origin and referer header verification for mutating requests
│   │   ├── demo/                 # Mock dataset & simulated responses for Demo Mode
│   │   ├── errors.ts             # Central user-friendly error formatting & idempotency engine
│   │   ├── instagram/            # Instagram Graph API client, token storage & types
│   │   ├── prisma.ts             # Prisma client singleton with fallback resilience
│   │   ├── queue/                # In-memory & DB-backed background publisher worker
│   │   ├── rateLimit.ts          # Token-bucket / sliding window rate limiter
│   │   └── storage/              # Modular storage engine (local disk & AWS S3 adapter)
│   └── middleware.ts             # NextAuth route protection & session guards
├── .env.example                  # Environment variable reference template
├── package.json                  # Dependencies, engine bounds & CLI npm scripts
├── tailwind.config.ts            # Tailwind CSS configuration & extended color palette
└── tsconfig.json                 # TypeScript compiler configuration with @/* path aliases
```

---

## 2. Required Environment Variables

Copy `.env.example` to `.env` and configure the values before running the application:

```bash
cp .env.example .env
```

| Variable                         | Description                                                          | Example / Default                                                    | Required In                 |
| :------------------------------- | :------------------------------------------------------------------- | :------------------------------------------------------------------- | :-------------------------- |
| `DATABASE_URL`                   | PostgreSQL connection string                                         | `postgresql://user:pass@localhost:5432/insta_automate?schema=public` | Production & Live DB        |
| `NEXTAUTH_SECRET`                | Random 32+ character string used for session signing                 | `openssl rand -base64 32`                                            | All Environments            |
| `NEXTAUTH_URL`                   | Canonical URL where NextAuth is hosted                               | `http://localhost:3000`                                              | All Environments            |
| `NEXT_PUBLIC_APP_URL`            | Public hostname used for CSRF checks and OAuth redirect URIs         | `http://localhost:3000`                                              | All Environments            |
| `DEMO_MODE`                      | Set to `"true"` for simulated mock data; `"false"` for live Meta API | `false`                                                              | All Environments            |
| `ENCRYPTION_KEY`                 | 32-character key for AES-256-GCM token encryption at rest            | `openssl rand -hex 16` (32 hex chars)                                | Production                  |
| `CRON_SECRET`                    | Bearer token to protect scheduled publishing cron endpoints          | Custom secure secret string                                          | Production                  |
| `INSTAGRAM_ACCESS_TOKEN`         | Long-lived Meta User/Page Access Token                               | Obtained from Meta Developer Portal                                  | Live Meta API Mode          |
| `META_APP_ID`                    | Your Meta Developer App ID                                           | Numeric ID (e.g., `2125514704722542`)                                | Live Meta API Mode          |
| `META_APP_SECRET`                | Your Meta Developer App Secret (kept strictly server-side)           | 32-character hexadecimal string                                      | Live Meta API Mode          |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Custom string used during Meta Webhook subscription verification     | Custom secret string                                                 | Webhooks                    |
| `GRAPH_API_VERSION`              | Version of Meta Graph API to target                                  | `v21.0`                                                              | All Environments            |
| `STORAGE_TYPE`                   | Storage adapter for uploads (`local` or `s3`)                        | `local`                                                              | All Environments            |
| `UPLOAD_DIR`                     | Local disk directory where uploaded media is stored                  | `./public/uploads`                                                   | When `STORAGE_TYPE="local"` |

---

## 3. Database Setup & Prisma Migrations

InstaFlow uses **Prisma ORM** with **PostgreSQL** (compatible with local PostgreSQL, Supabase, Neon, AWS RDS, or Railway).

### Step 1: Start PostgreSQL

Ensure your PostgreSQL instance is running and create the target database:

```sql
CREATE DATABASE insta_automate;
```

### Step 2: Generate the Prisma Client

Generate the TypeScript client bindings from [`prisma/schema.prisma`](prisma/schema.prisma):

```bash
npx prisma generate
```

### Step 3: Run Database Migrations

**For Local Development:**
Apply the schema and generate an initial migration history:

```bash
npx prisma migrate dev --name init
```

_(Alternative for rapid prototyping without creating migration files:)_

```bash
npx prisma db push
```

**For Production:**
Apply all pending migrations safely:

```bash
npx prisma migrate deploy
```

### Step 4: Inspecting Data (Prisma Studio)

To visually inspect your database tables and records in a web browser:

```bash
npx prisma studio
```

---

## 4. Meta Developer App Setup Requirements

To connect a live Instagram account and publish content, you must configure a Meta Developer App.

### 4.1 Prerequisites

1. **Instagram Professional Account**: The Instagram account must be set to a **Business** or **Creator** account (personal accounts are not supported by the Meta Graph API).
2. **Connected Facebook Page**: The Instagram Professional account must be connected to a Facebook Page where you hold administrative access.

### 4.2 Creating the Meta App

1. Go to the [Meta for Developers Portal](https://developers.facebook.com/).
2. Click **Create App** and choose the **Business** app type.
3. Under **Add products to your app**, add:
   - **Instagram Graph API**
   - **Facebook Login for Business**

### 4.3 Configuring Valid OAuth Redirect URIs

In the Meta App Dashboard, navigate to **Facebook Login for Business** -> **Settings**:

- Add the following to **Valid OAuth Redirect URIs**:
  - Development: `http://localhost:3000/api/auth/instagram/callback`
  - Production: `https://your-domain.com/api/auth/instagram/callback`

### 4.4 Required Permissions & Scopes

When initiating the OAuth handshake or generating an access token, ensure the following scopes are approved:

| Scope                       | Purpose                                                                   |
| :-------------------------- | :------------------------------------------------------------------------ |
| `instagram_basic`           | Access Instagram profile info, account ID, and existing media list        |
| `instagram_content_publish` | Direct publishing of photos, videos, carousels, and Reels                 |
| `instagram_manage_insights` | Retrieve account reach, impressions, profile views, and media metrics     |
| `pages_show_list`           | List Facebook Pages associated with the user                              |
| `pages_read_engagement`     | Read Page engagement data needed to discover connected Instagram accounts |

### 4.5 Webhook Subscriptions (Optional for Real-Time Telemetry)

In your Meta App Dashboard under **Instagram** -> **Webhooks**:

1. Set the **Callback URL** to: `https://your-domain.com/api/webhooks/instagram`
2. Set the **Verify Token** to the exact value of your `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` environment variable.
3. Subscribe to the following fields: `feed`, `comments`, `story_insights`.

---

## 5. Local Development Instructions

### Step 1: Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd insta-automate
npm install
```

### Step 2: Configure Environment Variables

```bash
cp .env.example .env.local
# Open .env.local and populate NEXTAUTH_SECRET, DATABASE_URL, and Meta API keys
```

### Step 3: Initialize Database

```bash
npx prisma generate
npx prisma db push
```

### Step 4: Run the Development Server

```bash
npm run dev
```

The application will be live at [http://localhost:3000](http://localhost:3000).

### Step 5: (Optional) Run Background Publisher Worker

If you are testing scheduled post publishing locally:

```bash
npm run worker
```

This starts a local polling daemon that checks for due posts every 30 seconds.

---

## 6. Production Deployment Instructions

### 6.1 Pre-Deployment Verification

Before deploying, verify code quality and build validity:

```bash
npm run lint          # Validates ESLint rules
npm run test:errors   # Validates all 29 user-friendly error handlers
npm run build         # Validates TypeScript and compiles Next.js production build
```

### 6.2 Deployment Options

#### Option A: Vercel (Recommended for Serverless)

1. Push your repository to GitHub / GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Set all environment variables from your `.env` in the Vercel Project Settings.
4. Set the Build Command to: `prisma generate && next build`
5. Deploy.

#### Option B: Docker / Node.js Standalone Server

1. Build the production application:
   ```bash
   npm run build
   ```
2. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Start the Node.js production server:
   ```bash
   npm run start
   ```

### 6.3 Scheduling Worker Execution in Production

In a serverless environment like Vercel, long-running Node processes (`npm run worker`) cannot run indefinitely. Choose one of two production scheduling setups:

1. **HTTP Cron Invocation (Recommended)**:
   Configure an external scheduler (e.g., [cron-job.org](https://cron-job.org), Vercel Cron, GitHub Actions, or AWS EventBridge) to send a periodic request:
   ```http
   POST https://your-domain.com/api/cron/publish-scheduled
   Authorization: Bearer <YOUR_CRON_SECRET>
   ```
2. **Dedicated Background Service**:
   On a VPS or containerized platform (e.g., Railway, Render, AWS ECS), run the persistent worker script:
   ```bash
   CRON_SECRET=<token> npm run worker
   ```

### 6.4 Media Storage in Production

When deploying to serverless platforms with ephemeral file systems, configure S3-compatible cloud storage:

- Set `STORAGE_TYPE="s3"`
- Ensure uploaded assets are publicly accessible via HTTPS so the Meta Graph API crawler can download them during container creation.

---

## 7. List of Implemented Features

### Studio & Content Creation

- **Multi-Format Composer**: Single Image, Multi-Slide Carousel (up to 10 items), Video Reels, and Stories.
- **Interactive Feed Simulator**: Live mobile preview displaying exact Instagram card rendering, light/dark mode preview, and slide navigation.
- **Smart Caption Editor**: Real-time 2,200 character ceiling countdown, hashtag extractor, @mention detector, and emoji selector.
- **Binary Magic-Byte Media Upload**: File upload engine inspecting raw binary headers (JPEG, PNG, WebP, MP4, MOV) to prevent polyglot attacks and MIME spoofing.
- **Scheduling Controls**: Intuitive date/time picker with Meta API rule enforcement (>10 min lead time, <75 days in advance) and 1-click quick-fix buttons.

### Publishing & Automation

- **Direct Meta Graph API v21.0 Publishing**: Automated two-step container creation and media publish workflow.
- **Multi-Item Carousel Containers**: Creates individual item containers before binding them into a single carousel container.
- **Background Publishing Worker**: Queue polling system that executes scheduled posts on time.
- **Duplicate Publishing Prevention**: Cryptographic SHA-256 post content signatures preventing double-posting within 120 seconds.
- **Calendar & Queue Management**: Interactive monthly publishing calendar and scheduled post list with reschedule and cancellation controls.

### Analytics & Insights

- **Account-Level Performance**: Track Total Impressions, Accounts Reached, Profile Views, and Follower Count over 30-day windows.
- **Per-Post Telemetry**: Retrieve post reach, saved count, likes, comments, and engagement rates for published content.
- **Visual Trend Charts**: Interactive charts displaying impressions and reach trends over time.

### Security & Fault Tolerance

- **Zero-Secret Leakage**: OAuth tokens and App Secrets are stored exclusively server-side; client API responses are sanitized.
- **AES-256-GCM Token Encryption**: Long-lived access tokens are encrypted at rest.
- **CSRF Defense**: Strict `Origin` and `Referer` header validation on all mutating routes.
- **Token-Bucket Rate Limiting**: Tiered rate limits across API endpoints with standard RFC headers.
- **User-Friendly Error Engine**: Maps raw Meta Graph API codes, expired tokens, permission faults, and network failures into actionable user guidance.
- **Webhook Security**: Webhook challenge verification and HMAC-SHA256 signature validation.

---

## 8. Features Requiring Additional Meta API Permissions

While InstaFlow provides full publishing, scheduling, and analytics with standard business scopes, certain advanced features require additional Meta App Review and permissions:

| Advanced Feature                   | Required Meta Permission                    | Description                                                                                                  |
| :--------------------------------- | :------------------------------------------ | :----------------------------------------------------------------------------------------------------------- |
| **Automated Comment Moderation**   | `instagram_manage_comments`                 | Read, reply to, and automatically hide or delete comments on published posts.                                |
| **Direct Message (DM) Automation** | `instagram_manage_messages`                 | Read incoming Instagram Direct Messages and send automated bot or AI replies.                                |
| **Mention & Tag Tracking**         | `instagram_manage_events` / Webhooks        | Receive real-time webhook notifications when other users tag or mention your account in captions or stories. |
| **Live Video Broadcasting**        | `instagram_live_broadcast`                  | Create and manage live video broadcast streams directly from the web studio.                                 |
| **Detailed Audience Demographics** | App Review for `Page Public Content Access` | Access granular country, gender, and age demographic breakdowns for followers.                               |
| **Multi-Organization Switching**   | `business_management`                       | Manage multiple distinct Meta Business Manager portfolios and enterprise ad accounts.                        |

---

## 9. Automated Testing Suite

InstaFlow includes a suite of verification scripts located in [`scripts/`](scripts/):

```bash
# Run the 29-test comprehensive user-friendly error handling suite
npm run test:errors

# Run Meta Webhook challenge and HMAC-SHA256 signature verification tests
npm run test:webhook

# Test live Meta Graph API connection and profile discovery
npm run test:instagram

# Test live account and media analytics metric retrieval
npm run test:analytics

# Test direct Instagram image container creation and publishing
npm run test:publish

# Verify code style and formatting
npm run lint
npm run format:check
```

---

## License

This project is licensed under the MIT License.
