# End-to-End Testing Guide

## 🎯 Complete Workflow Validation

This guide walks you through testing the complete Performance Management Tool workflow from admin setup to team member usage.

---

## Prerequisites

### 1. Setup Database
```bash
# Install dependencies
npm install

# Set up .env
cp .env.example .env
# Edit .env and set DATABASE_URL and AUTH_SECRET

# Run migrations
npx prisma migrate dev

# Seed database
npm run prisma:seed
```

### 2. Start Server
```bash
npm run dev
```

Open http://localhost:3000

---

## Test Scenario: Complete Performance Review Cycle

### Phase 1: Admin Setup (15 minutes)

#### Step 1: Login as Admin
1. Go to http://localhost:3000/login
2. Email: `admin@performancemgmt.com`
3. Password: `Admin@123`
4. Click "Sign In"

**Expected**: Redirect to Admin Dashboard

#### Step 2: Create Team Members
1. Navigate to "Users" in navbar
2. Click "Add User"
3. Create 3 users:

**User 1 - Developer:**
- Name: `John Doe`
- Email: `john@example.com`
- Password: `Test@123`
- Role: `Developer (WIS)`

**User 2 - Developer:**
- Name: `Jane Smith`
- Email: `jane@example.com`
- Password: `Test@123`
- Role: `Developer (WIS)`

**User 3 - QC Engineer:**
- Name: `Bob Johnson`
- Email: `bob@example.com`
- Password: `Test@123`
- Role: `QC Engineer`

**Expected**: Users appear in the table

#### Step 3: Create a Team
1. Navigate to "Teams" in navbar
2. Click "Create Team"
3. Fill in:
   - Name: `Engineering Team`
   - Description: `Core development team`
   - Members: Select John Doe and Jane Smith
4. Click "Create Team"

**Expected**: Team card appears with 2 members

#### Step 4: Create Goals
1. Navigate to "Goals" in navbar
2. Create Goal 1:
   - Title: `Improve API Performance`
   - Weightage: `40`
   - Description: `Reduce API response time by 30% through optimization and caching`
3. Create Goal 2:
   - Title: `Code Quality Improvements`
   - Weightage: `30`
   - Description: `Increase code coverage to 80% and reduce technical debt`
4. Create Goal 3:
   - Title: `Feature Development`
   - Weightage: `30`
   - Description: `Deliver 3 major features this quarter`

**Expected**: 3 goals appear in the table

#### Step 5: Assign Goals to Users
1. Click "Assign" on "Improve API Performance"
2. Select users: John Doe, Jane Smith
3. Select cycle: Current quarter (should be auto-created by seed)
4. Due date: Set to end of current month
5. Click "Assign to 2 User(s)"

Repeat for other goals, assigning to different users:
- Code Quality → John Doe
- Feature Development → Jane Smith, Bob Johnson

**Expected**: Assignment count updates in goals table

---

### Phase 2: Team Member Activity (10 minutes)

#### Step 6: Login as Team Member
1. Logout from admin account
2. Login as John Doe:
   - Email: `john@example.com`
   - Password: `Test@123`

**Expected**: Redirect to Team Member Dashboard

#### Step 7: View Dashboard
1. Check stats cards:
   - Active Goals: Should show 2
   - Current Level: Should show level from seed
   - Needs Attention: Should show 2 (no evidence yet)

**Expected**: Dashboard shows assigned goals

#### Step 8: Add Evidence
1. Click "Add Evidence" on "Improve API Performance"
2. Fill in evidence:
   ```
   Implemented Redis caching for frequently accessed endpoints.
   Reduced average API response time from 450ms to 280ms (38% improvement).
   Deployed to production and monitoring shows consistent performance gains.
   ```
3. Add links:
   - `https://github.com/company/repo/pull/123`
   - `https://grafana.company.com/dashboard/api-performance`
4. Click "Add Evidence"

**Expected**: Evidence appears in timeline

#### Step 9: Add More Evidence
1. Go back to Dashboard
2. Click "Add Evidence" on "Code Quality Improvements"
3. Fill in:
   ```
   Increased test coverage from 65% to 78%.
   Refactored authentication module, reducing complexity by 40%.
   Fixed 15 critical code smells identified by SonarQube.
   ```
4. Add link: `https://sonarqube.company.com/project/overview`
5. Click "Add Evidence"

**Expected**: Evidence count updates on dashboard

#### Step 10: View Leaderboard
1. Navigate to "Leaderboard"
2. Check your ranking
3. View score breakdown

**Expected**: 
- Shows ranking among WIS role
- Score breakdown visible
- Scoring explanation at bottom

---

### Phase 3: Admin Rating (10 minutes)

#### Step 11: Login as Admin
1. Logout from John's account
2. Login as admin again

#### Step 12: Review Evidence
1. Navigate to "Ratings"
2. Filter by "John Doe"
3. Review evidence shown inline for each goal

**Expected**: See evidence John added

#### Step 13: Submit Ratings
1. For "Improve API Performance":
   - Rating: `Exceeds Expectations`
   - Notes: `Excellent work on performance optimization. Exceeded the 30% target with 38% improvement. Great documentation and monitoring setup.`
   - Click "Submit Rating"

2. For "Code Quality Improvements":
   - Rating: `Meets Expectations`
   - Notes: `Good progress on test coverage. Continue working towards 80% goal.`
   - Click "Submit Rating"

**Expected**: Success checkmark appears

#### Step 14: Rate Other Users
1. Switch to "Jane Smith"
2. Rate her goals:
   - Improve API Performance: `Meets Expectations`
   - Feature Development: `Exceeds Expectations`

3. Switch to "Bob Johnson"
4. Rate his goal:
   - Feature Development: `Meets Expectations`

**Expected**: All ratings submitted successfully

---

### Phase 4: Verify Results (5 minutes)

#### Step 15: Check Leaderboard as Team Member
1. Logout from admin
2. Login as John Doe
3. Navigate to Leaderboard

**Expected**: 
- John should rank #1 (has "Exceeds" rating)
- Score breakdown shows higher goal score
- Evidence score reflected

#### Step 16: Check Dashboard Updates
1. Go to Dashboard
2. Check goals list

**Expected**:
- Goals show current ratings
- "Needs Attention" count is 0

#### Step 17: View Profile
1. Navigate to Profile
2. Check career progression

**Expected**: Shows current level and next level

---

### Phase 5: Password Reset (5 minutes)

#### Step 18: Test Password Reset
1. Logout
2. Click "Forgot password?" on login page
3. Enter: `john@example.com`
4. Click "Send Reset Link"

**Expected**: Success message + token in console (dev mode)

#### Step 19: Reset Password
1. Copy token from console
2. Go to reset link (or click link shown)
3. Enter new password: `NewTest@123`
4. Confirm password
5. Click "Reset Password"

**Expected**: Success message → redirect to login

#### Step 20: Login with New Password
1. Email: `john@example.com`
2. Password: `NewTest@123`
3. Click "Sign In"

**Expected**: Successfully logged in

---

## 🎯 Verification Checklist

### Admin Features
- [ ] Can create users with different roles
- [ ] Can edit user information
- [ ] Can delete users
- [ ] Can create teams
- [ ] Can add/remove team members
- [ ] Can create goals with weightage
- [ ] Can assign goals to multiple users
- [ ] Can submit ratings with notes
- [ ] Dashboard shows correct metrics
- [ ] Can see at-risk goals

### Team Member Features
- [ ] Dashboard shows assigned goals
- [ ] Can add evidence with text and links
- [ ] Evidence appears in timeline
- [ ] Can view all goals
- [ ] Leaderboard shows correct ranking
- [ ] Score breakdown is visible
- [ ] Profile shows career info
- [ ] Can view notification preferences

### Authentication
- [ ] Login works
- [ ] Registration works
- [ ] Logout works
- [ ] Forgot password generates token
- [ ] Reset password works
- [ ] Can login with new password
- [ ] Wrong password fails
- [ ] Rate limiting works (try 6 failed logins)

### Data Integrity
- [ ] Ratings appear in leaderboard
- [ ] Evidence count updates correctly
- [ ] Weightage totals make sense
- [ ] Audit logs created (check database)
- [ ] Soft delete works (users not actually deleted)

---

## 🐛 Common Issues

### Issue: "Database connection failed"
**Solution**: Check DATABASE_URL in .env

### Issue: "Auth secret not set"
**Solution**: Generate with `openssl rand -base64 32` and add to .env

### Issue: "No goals assigned"
**Solution**: Make sure you clicked "Assign" after creating goals

### Issue: "Leaderboard empty"
**Solution**: Need at least one rating submitted

### Issue: "Can't see evidence"
**Solution**: Make sure you're logged in as the user who owns the goal

---

## 📊 Database Verification

### Check Data in Prisma Studio
```bash
npx prisma studio
```

**Verify:**
1. Users table has 4 users (admin + 3 created)
2. Goals table has 3 goals
3. GoalAssignment table has assignments
4. EvidenceLog table has evidence entries
5. RatingEvent table has ratings
6. AuditLog table has admin actions
7. PasswordResetToken table has tokens (if tested)

---

## 🎓 Advanced Testing

### Test Edge Cases
1. **Duplicate Email**: Try creating user with existing email
2. **Invalid Weightage**: Try creating goal with weightage > 100
3. **Expired Token**: Wait 1 hour and try password reset
4. **Concurrent Ratings**: Submit multiple ratings quickly
5. **Long Evidence**: Add evidence with 1000+ characters
6. **Special Characters**: Use special chars in names and descriptions

### Test Performance
1. Create 50 users
2. Create 20 goals
3. Assign all goals to all users
4. Check leaderboard performance
5. Check ratings page load time

### Test Security
1. Try accessing admin pages as team member (should redirect)
2. Try accessing other user's evidence (should fail)
3. Try SQL injection in forms
4. Try XSS in text fields
5. Check CSRF protection

---

## ✅ Success Criteria

Your application is working correctly if:

1. ✅ All admin workflows complete without errors
2. ✅ Team members can add evidence and see it reflected
3. ✅ Ratings update the leaderboard correctly
4. ✅ Password reset flow works end-to-end
5. ✅ No console errors during normal usage
6. ✅ Data persists across page refreshes
7. ✅ Role-based access control works
8. ✅ Audit logs are created for admin actions

---

## 🚀 Ready for Production

Once all tests pass:
1. Review DEPLOYMENT.md
2. Set up production database
3. Configure environment variables
4. Deploy to Render
5. Run seed script on production
6. Test again on production URL
7. Change default admin password!

---

**Happy Testing! 🎉**
