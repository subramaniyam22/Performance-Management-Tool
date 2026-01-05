# Performance Management Tool

A production-ready web application for managing employee performance with RBAC, goals tracking, performance ratings, dashboards, leaderboards, AI coaching, and automated email reminders.

## 🚀 Features

### Core Functionality
- **Role-Based Access Control (RBAC)**: 4 roles (Admin, WIS/Developer, QC, PC)
- **Goals Management**: Create, assign, and track goals with custom fields
- **Performance Ratings**: 5-level rating system with time-series tracking
- **Evidence Capture**: Team members log impact with links and attachments
- **Dashboards**: Role-specific dashboards with metrics and insights
- **Leaderboard**: Fair comparison with explainable scoring
- **AI Coach**: RAG-powered chatbot for performance guidance
- **Email Reminders**: Automated nudges and weekly summaries
- **Career Progression**: Level frameworks with tenure estimates

### Security & Compliance
- Argon2 password hashing
- Rate limiting on auth endpoints
- 6-hour sliding session expiration
- CSRF protection
- Comprehensive audit logging
- Security headers

## 📋 Prerequisites

- Node.js 24 (Active LTS)
- PostgreSQL database
- Email provider (Resend or AWS SES)
- S3-compatible object storage (for user photos)
- OpenAI API key (for AI coach)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd "Performance Management Tool"
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/performance_mgmt"

# Auth (generate secret: openssl rand -base64 32)
AUTH_SECRET="your-generated-secret"
AUTH_URL="http://localhost:3000"

# Email (Resend)
EMAIL_API_KEY="re_your_api_key"
EMAIL_FROM="Performance Management <noreply@yourdomain.com>"

# Object Storage (S3)
STORAGE_ENDPOINT="https://your-bucket.s3.amazonaws.com"
STORAGE_BUCKET="performance-mgmt-photos"
STORAGE_ACCESS_KEY="your-access-key"
STORAGE_SECRET_KEY="your-secret-key"

# AI (OpenAI)
AI_API_KEY="sk-your-openai-api-key"
AI_MODEL="gpt-4"
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Seed initial data
npm run prisma:seed
```

The seed script creates:
- Admin user: `admin@performancemgmt.com` / `Admin@123`
- Level frameworks for all roles
- Current quarter cycle
- Sample engineering team

**⚠️ IMPORTANT: Change the admin password after first login!**

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (app)/               # Team member pages
│   │   ├── dashboard/
│   │   ├── goals/
│   │   ├── evidence/
│   │   ├── leaderboard/
│   │   ├── target/
│   │   ├── coach/
│   │   └── profile/
│   ├── (admin)/             # Admin pages
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── users/
│   │       ├── teams/
│   │       ├── goals/
│   │       ├── ratings/
│   │       └── levels/
│   ├── api/                 # API routes
│   └── globals.css
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Layout components
│   └── features/            # Feature-specific components
├── lib/
│   ├── auth.ts              # Auth.js configuration
│   ├── prisma.ts            # Prisma client
│   ├── rbac.ts              # RBAC permissions
│   ├── scoring.ts           # Scoring algorithm
│   ├── audit.ts             # Audit logging
│   ├── rate-limit.ts        # Rate limiting
│   ├── utils.ts             # Utilities
│   └── validations.ts       # Zod schemas
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Seed script
│   └── migrations/
├── jobs/
│   ├── nightly-insights.ts  # Nightly job
│   └── weekly-summary.ts    # Weekly email job
└── types/
    └── next-auth.d.ts       # TypeScript definitions
```

## 🎯 User Roles & Permissions

### Admin
- Manage users (create, edit, deactivate, delete, change roles)
- Create and manage teams
- Create goals and assign to users
- Submit performance ratings
- View all dashboards and reports
- Manage level frameworks
- Access audit logs

### WIS (Developer) / QC / PC
- View assigned goals
- Add evidence/impact logs
- View own ratings and history
- Access personal dashboard
- View leaderboard
- Use AI coach
- Set target rating
- Manage notification preferences

## 📊 Scoring Algorithm

The scoring system is transparent and explainable:

### 1. Goal Score (0-1.0)
- Based on weighted average of ratings
- Rating values: Does Not Meet (0.2), Improvement Needed (0.4), Meets (0.6), Exceeds (0.8), Outstanding (1.0)
- Formula: Σ(weightage × ratingScore) / 100

### 2. Evidence Score (0-0.2)
- **Recency** (40%): Days since last evidence
- **Completeness** (30%): Number of evidence entries
- **Quality** (30%): Presence of metrics and links

### 3. Trend Adjustment (±0.1)
- Compares recent rating trends
- Bonus for improving trends
- Penalty for declining trends

### Final Score
`Total = GoalScore + EvidenceScore + TrendAdjustment`

Each user's leaderboard entry shows the complete breakdown.

## 🤖 AI Coach

The AI coach uses RAG (Retrieval-Augmented Generation) to provide personalized guidance:

- Fetches user's goals, ratings, evidence, and level framework
- Answers questions about performance improvement
- Provides specific, actionable advice
- Never invents company policy
- Explicitly states reasoning

Example questions:
- "How can I move from Meets to Exceeds?"
- "What evidence should I add for my API development goal?"
- "Why is my standing lower than expected?"
- "How can I reach the next level faster?"

## 📧 Email Reminders

Users can configure:
- Email opt-in/out
- Frequency (daily, weekly, none)
- Quiet hours (no emails during specified hours)

Reminder types:
- Missing evidence nudges (14+ days)
- Upcoming due dates
- Weekly performance summary

All emails include opt-out links.

## 🚀 Deployment to Render

### Prerequisites
1. Render account
2. PostgreSQL database (Render Postgres or external)
3. Environment variables configured

### Deployment Steps

1. **Create PostgreSQL Database** (if using Render Postgres)
   - Go to Render Dashboard → New → PostgreSQL
   - Copy the internal database URL

2. **Create Web Service**
   - Go to Render Dashboard → New → Web Service
   - Connect your Git repository
   - Configure:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment**: Node
     - Add all environment variables from `.env.example`

3. **Create Cron Jobs**
   
   **Nightly Insights**:
   - Go to Render Dashboard → New → Cron Job
   - **Command**: `npm run jobs:nightly`
   - **Schedule**: `0 2 * * *` (2 AM daily)
   
   **Weekly Summary**:
   - Go to Render Dashboard → New → Cron Job
   - **Command**: `npm run jobs:weekly`
   - **Schedule**: `0 9 * * 1` (9 AM every Monday)

4. **Environment Variables**
   Set these in Render dashboard for all services:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL` (your Render web service URL)
   - `EMAIL_API_KEY`
   - `EMAIL_FROM`
   - `STORAGE_*` variables
   - `AI_API_KEY`
   - `AI_MODEL`

5. **Deploy**
   - Push to your Git repository
   - Render will automatically build and deploy
   - Migrations run automatically on build

### Using render.yaml (Recommended)

Create `render.yaml` in your repository root (see DEPLOYMENT.md for full example).

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests (when implemented)
npm test
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate:dev` - Run migrations (dev)
- `npm run prisma:migrate` - Run migrations (production)
- `npm run prisma:seed` - Seed database
- `npm run prisma:studio` - Open Prisma Studio
- `npm run jobs:nightly` - Run nightly insights job
- `npm run jobs:weekly` - Run weekly summary job

## 🔒 Security Best Practices

1. **Change default admin password** immediately after first login
2. **Use strong AUTH_SECRET** (generate with `openssl rand -base64 32`)
3. **Enable HTTPS** in production (Render provides this automatically)
4. **Rotate API keys** regularly
5. **Monitor audit logs** for suspicious activity
6. **Keep dependencies updated** (`npm audit` in CI)

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Ensure migrations have run: `npm run prisma:migrate`

### Authentication Issues
- Verify `AUTH_SECRET` is set
- Check `AUTH_URL` matches your deployment URL
- Clear browser cookies and try again

### Email Not Sending
- Verify `EMAIL_API_KEY` is valid
- Check Resend dashboard for delivery status
- Ensure `EMAIL_FROM` domain is verified

### AI Coach Not Working
- Verify `AI_API_KEY` is valid
- Check OpenAI API quota and billing
- Review server logs for API errors

## 📚 Additional Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [Prisma Schema](./prisma/schema.prisma) - Database schema
- [API Documentation](./docs/API.md) - API endpoints (coming soon)

## 🤝 Support

For issues or questions:
1. Check troubleshooting section above
2. Review audit logs for errors
3. Check server logs in Render dashboard
4. Contact system administrator

## 📄 License

Proprietary - All rights reserved

---

**Built with**: Next.js 16, TypeScript, Prisma, PostgreSQL, Auth.js, Tailwind CSS, shadcn/ui, Recharts, OpenAI
