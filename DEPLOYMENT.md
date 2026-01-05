# Deployment Guide - Performance Management Tool

## Quick Start (Local Development)

### Prerequisites
- Node.js 24 (Active LTS)
- PostgreSQL database
- Git

### Step 1: Install Dependencies
```bash
cd "Performance Management Tool"
npm install
```

### Step 2: Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env and set:
DATABASE_URL="postgresql://user:password@localhost:5432/performance_mgmt"
AUTH_SECRET="<generate with: openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"
```

### Step 3: Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data
npm run prisma:seed
```

**Default Admin Credentials:**
- Email: `admin@performancemgmt.com`
- Password: `Admin@123`

⚠️ **IMPORTANT**: Change this password after first login!

### Step 4: Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Render

### Prerequisites
- Render account ([render.com](https://render.com))
- Git repository with your code
- PostgreSQL database (Render Postgres or external)

### Option A: Using render.yaml (Recommended)

1. **Push Code to Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up or log in

3. **Create PostgreSQL Database**
   - Dashboard → New → PostgreSQL
   - Name: `performance-mgmt-db`
   - Plan: Free (or Starter)
   - Copy the **Internal Database URL**

4. **Create Web Service from Blueprint**
   - Dashboard → New → Blueprint
   - Connect your Git repository
   - Render will detect `render.yaml`
   - Review services:
     - Web Service (performance-mgmt-web)
     - Cron Job (nightly insights)
     - Cron Job (weekly summary)

5. **Set Environment Variables**
   
   In the Render dashboard, set these for the Web Service:
   
   ```
   DATABASE_URL=<your-internal-database-url>
   AUTH_SECRET=<generate-random-32-char-string>
   AUTH_URL=https://your-app-name.onrender.com
   EMAIL_API_KEY=<optional-for-now>
   EMAIL_FROM=Performance Management <noreply@yourdomain.com>
   AI_API_KEY=<optional-for-now>
   AI_MODEL=gpt-4
   ```

   **Generate AUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

6. **Deploy**
   - Click "Apply"
   - Render will:
     - Install dependencies
     - Run Prisma migrations
     - Build Next.js
     - Start the application

7. **Seed Database**
   
   After first deployment, run seed manually:
   - Go to Web Service → Shell
   - Run: `npm run prisma:seed`

8. **Access Your App**
   - URL: `https://your-app-name.onrender.com`
   - Login with admin credentials
   - **Change the default password immediately!**

### Option B: Manual Setup

If you prefer manual setup instead of render.yaml:

1. **Create PostgreSQL Database**
   - Dashboard → New → PostgreSQL
   - Copy Internal Database URL

2. **Create Web Service**
   - Dashboard → New → Web Service
   - Connect Git repository
   - Configure:
     - **Name**: performance-mgmt-web
     - **Environment**: Node
     - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Free (or Starter)

3. **Set Environment Variables** (same as above)

4. **Create Cron Jobs** (Optional)
   
   **Nightly Insights:**
   - Dashboard → New → Cron Job
   - **Name**: performance-mgmt-nightly
   - **Command**: `npm run jobs:nightly`
   - **Schedule**: `0 2 * * *` (2 AM daily)
   
   **Weekly Summary:**
   - Dashboard → New → Cron Job
   - **Name**: performance-mgmt-weekly
   - **Command**: `npm run jobs:weekly`
   - **Schedule**: `0 9 * * 1` (9 AM Monday)

---

## Post-Deployment Checklist

### 1. Verify Deployment
- [ ] App loads at Render URL
- [ ] Can access login page
- [ ] Can login with admin credentials
- [ ] Dashboard loads correctly

### 2. Security
- [ ] Change default admin password
- [ ] Verify AUTH_SECRET is set and random
- [ ] Verify AUTH_URL matches your domain
- [ ] Test HTTPS is working

### 3. Database
- [ ] Migrations ran successfully
- [ ] Seed data exists (check users table)
- [ ] Can create new users

### 4. Functionality
- [ ] User registration works
- [ ] Login/logout works
- [ ] Admin can create users
- [ ] Team members can view dashboard
- [ ] Evidence capture works
- [ ] Leaderboard displays

### 5. Optional Features
- [ ] Set up email provider (Resend)
- [ ] Set up AI provider (OpenAI)
- [ ] Set up object storage (S3)
- [ ] Configure cron jobs

---

## Environment Variables Reference

### Required
```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
AUTH_SECRET=<32-character-random-string>
AUTH_URL=https://your-app.onrender.com
```

### Optional (Email)
```bash
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_your_api_key
EMAIL_FROM=Performance Management <noreply@yourdomain.com>
```

### Optional (AI Coach)
```bash
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-key
AI_MODEL=gpt-4
AI_BASE_URL=https://api.openai.com/v1
```

### Optional (Object Storage)
```bash
STORAGE_ENDPOINT=https://bucket.s3.amazonaws.com
STORAGE_BUCKET=performance-mgmt-photos
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_REGION=us-east-1
```

### Optional (Rate Limiting)
```bash
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW_MS=900000
RATE_LIMIT_RESET_MAX=3
RATE_LIMIT_RESET_WINDOW_MS=3600000
SESSION_MAX_AGE=21600
```

---

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Verify all dependencies are in package.json
- Ensure Prisma schema is valid: `npx prisma validate`

### Database Connection Issues
- Verify DATABASE_URL is correct
- Use **Internal Database URL** from Render Postgres
- Check database is running

### App Crashes on Start
- Check logs in Render dashboard
- Verify migrations ran: `npx prisma migrate status`
- Check AUTH_SECRET is set

### Can't Login
- Verify seed ran successfully
- Check database has users: `SELECT * FROM "User";`
- Verify AUTH_SECRET matches across deployments
- Clear browser cookies

### Migrations Don't Run
- Manually run in Shell: `npx prisma migrate deploy`
- Check migration files exist in `prisma/migrations/`
- Verify DATABASE_URL has write permissions

---

## Monitoring & Maintenance

### View Logs
- Render Dashboard → Your Service → Logs
- Filter by severity
- Download logs for analysis

### Database Management
- Use Prisma Studio: `npx prisma studio`
- Or connect with psql:
  ```bash
  psql <DATABASE_URL>
  ```

### Performance
- Monitor response times in Render dashboard
- Check database query performance
- Optimize slow queries

### Backups
- Render Postgres includes automatic backups
- Configure backup retention in database settings
- Test restore process periodically

---

## Scaling

### When to Upgrade
- Free tier: Good for testing (sleeps after inactivity)
- Starter tier: Production use, always on
- Standard tier: Higher traffic, better performance

### Horizontal Scaling
- Render auto-scales web services
- Configure in service settings
- Monitor CPU and memory usage

### Database Scaling
- Upgrade Postgres plan for more storage/connections
- Consider connection pooling (PgBouncer)
- Optimize queries and indexes

---

## Support

### Resources
- [Render Documentation](https://render.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

### Common Issues
- Check FINAL_STATUS.md for known limitations
- Review audit logs for admin actions
- Check server logs for errors

---

**You're ready to deploy! 🚀**
