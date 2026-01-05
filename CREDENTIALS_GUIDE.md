# Step-by-Step Guide: Getting Required Credentials

## 📧 Step 1: Email Provider Setup (Resend - Recommended)

### Why Resend?
- Free tier: 100 emails/day, 3,000/month
- Simple API, great for transactional emails
- Easy setup, no domain verification required initially

### How to Get Resend API Key:

1. **Go to Resend**
   - Visit: https://resend.com
   - Click "Sign Up" (or "Start for Free")

2. **Create Account**
   - Sign up with your email
   - Verify your email address

3. **Get API Key**
   - After login, go to "API Keys" in the dashboard
   - Click "Create API Key"
   - Name it: `Performance Management Tool`
   - Copy the API key (starts with `re_`)
   - **IMPORTANT**: Save it immediately, you can't see it again!

4. **Choose Sender Email**
   - **Option A (Quick)**: Use Resend's test domain
     - Sender: `onboarding@resend.dev`
     - No setup needed, works immediately
   
   - **Option B (Professional)**: Use your own domain
     - You'll need to add DNS records
     - Follow Resend's domain verification guide
     - Sender: `noreply@yourdomain.com`

### What to Provide Me:
```bash
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Performance Management <onboarding@resend.dev>
# Or if using custom domain:
# EMAIL_FROM=Performance Management <noreply@yourdomain.com>
```

---

## 🤖 Step 2: AI Provider Setup (OpenAI - Recommended)

### Why OpenAI?
- Most reliable and well-documented
- GPT-4 provides best quality responses
- GPT-3.5-turbo is faster and cheaper

### How to Get OpenAI API Key:

1. **Go to OpenAI**
   - Visit: https://platform.openai.com
   - Click "Sign up" (or "Log in" if you have account)

2. **Create Account**
   - Sign up with email or Google
   - Verify your email

3. **Add Payment Method**
   - Go to "Settings" → "Billing"
   - Add a credit card
   - **Note**: OpenAI charges per usage
   - GPT-3.5-turbo: ~$0.002 per 1K tokens (very cheap)
   - GPT-4: ~$0.03 per 1K tokens (higher quality)

4. **Create API Key**
   - Go to "API keys" in left sidebar
   - Click "Create new secret key"
   - Name it: `Performance Management Tool`
   - Copy the key (starts with `sk-`)
   - **IMPORTANT**: Save it immediately!

5. **Set Usage Limits (Recommended)**
   - Go to "Settings" → "Limits"
   - Set monthly budget (e.g., $10/month for testing)
   - This prevents unexpected charges

### What to Provide Me:
```bash
AI_PROVIDER=openai
AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AI_MODEL=gpt-3.5-turbo
# Or for better quality (more expensive):
# AI_MODEL=gpt-4
```

### Cost Estimate:
- **GPT-3.5-turbo**: ~$1-5/month for typical usage
- **GPT-4**: ~$10-30/month for typical usage

---

## 📦 Step 3: Object Storage Setup (AWS S3 - Optional but Recommended)

### Why AWS S3?
- Industry standard, very reliable
- Free tier: 5GB storage, 20,000 GET requests/month
- Works with many compatible services

### Option A: AWS S3 (Recommended)

#### How to Get AWS S3 Credentials:

1. **Create AWS Account**
   - Visit: https://aws.amazon.com
   - Click "Create an AWS Account"
   - Provide email, password, account name
   - Add payment method (free tier available)
   - Verify phone number

2. **Create S3 Bucket**
   - Go to AWS Console: https://console.aws.amazon.com
   - Search for "S3" in services
   - Click "Create bucket"
   - Bucket name: `performance-mgmt-files-[your-name]` (must be globally unique)
   - Region: Choose closest to you (e.g., `us-east-1`)
   - **Uncheck** "Block all public access" (we'll use signed URLs)
   - Click "Create bucket"

3. **Create IAM User for API Access**
   - Search for "IAM" in AWS Console
   - Click "Users" → "Add users"
   - Username: `performance-mgmt-app`
   - Access type: Check "Programmatic access"
   - Click "Next: Permissions"
   - Click "Attach existing policies directly"
   - Search and select: `AmazonS3FullAccess`
   - Click through to "Create user"
   - **IMPORTANT**: Download the CSV with credentials or copy:
     - Access Key ID
     - Secret Access Key

4. **Configure CORS (Important!)**
   - Go to your S3 bucket
   - Click "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)"
   - Click "Edit" and paste:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
   - Click "Save changes"

#### What to Provide Me:
```bash
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_BUCKET=performance-mgmt-files-yourname
STORAGE_ACCESS_KEY=AKIAXXXXXXXXXXXXXXXX
STORAGE_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STORAGE_REGION=us-east-1
```

### Option B: Cloudflare R2 (Alternative - Cheaper)

#### Why R2?
- No egress fees (AWS charges for downloads)
- 10GB free storage
- S3-compatible API

#### How to Get R2 Credentials:

1. **Create Cloudflare Account**
   - Visit: https://cloudflare.com
   - Sign up for free account

2. **Enable R2**
   - Go to R2 in dashboard
   - Click "Purchase R2"
   - Enable (free tier available)

3. **Create Bucket**
   - Click "Create bucket"
   - Name: `performance-mgmt-files`
   - Click "Create bucket"

4. **Get API Token**
   - Go to "Manage R2 API Tokens"
   - Click "Create API token"
   - Name: `Performance Management Tool`
   - Permissions: "Object Read & Write"
   - Copy Access Key ID and Secret Access Key

#### What to Provide Me:
```bash
STORAGE_PROVIDER=r2
STORAGE_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
STORAGE_BUCKET=performance-mgmt-files
STORAGE_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STORAGE_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STORAGE_REGION=auto
```

---

## 🎯 Quick Start Option (For Testing)

### If you want to start ASAP without full setup:

**Minimal Setup (Email + AI only):**
1. Get Resend API key (5 minutes)
2. Get OpenAI API key (10 minutes)
3. Skip storage for now (can add later)

**What to provide:**
```bash
# Email (Required)
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Performance Management <onboarding@resend.dev>

# AI (Required)
AI_PROVIDER=openai
AI_API_KEY=sk-xxxxxxxxxxxx
AI_MODEL=gpt-3.5-turbo

# Storage (Optional - can skip for now)
# STORAGE_PROVIDER=
# STORAGE_ENDPOINT=
# STORAGE_BUCKET=
# STORAGE_ACCESS_KEY=
# STORAGE_SECRET_KEY=
# STORAGE_REGION=
```

---

## 📝 How to Provide Credentials to Me

### Option 1: Paste in Chat (Recommended)
Just paste the credentials in this format:

```
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Performance Management <onboarding@resend.dev>

AI_PROVIDER=openai
AI_API_KEY=sk-xxxxxxxxxxxx
AI_MODEL=gpt-3.5-turbo

STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_BUCKET=your-bucket-name
STORAGE_ACCESS_KEY=AKIAXXXXXXXXXXXX
STORAGE_SECRET_KEY=xxxxxxxxxxxxxxxx
STORAGE_REGION=us-east-1
```

### Option 2: Create .env.local File
1. Create file: `.env.local` in project root
2. Paste credentials in that file
3. Tell me "credentials are in .env.local"

---

## ⚠️ Security Notes

1. **Never commit credentials to Git**
   - `.env.local` is already in `.gitignore`
   - Don't share credentials publicly

2. **Rotate keys if exposed**
   - If you accidentally expose a key, delete it immediately
   - Create a new one

3. **Use environment variables in production**
   - When deploying to Render, add these as environment variables
   - Don't hardcode in files

---

## 🕐 Time Estimates

| Task | Time |
|------|------|
| Resend setup | 5 minutes |
| OpenAI setup | 10 minutes |
| AWS S3 setup | 20 minutes |
| Cloudflare R2 setup | 15 minutes |
| **Total (all services)** | **35-50 minutes** |
| **Total (email + AI only)** | **15 minutes** |

---

## ❓ Troubleshooting

### "I don't have a credit card for OpenAI"
- **Alternative**: Use Anthropic Claude (also requires payment)
- **Alternative**: Use local LLM (more complex setup)
- **Option**: Skip AI Coach for now, implement later

### "AWS is too complex"
- **Alternative**: Use Cloudflare R2 (simpler)
- **Alternative**: Skip storage for now
- **Note**: App works without storage, just no photo uploads

### "I don't want to spend money"
- **Email**: Resend free tier (100/day) is enough for testing
- **AI**: OpenAI free trial gives $5 credit (enough for testing)
- **Storage**: AWS free tier (5GB) or skip for now

---

## ✅ Checklist

Before providing credentials, make sure you have:

- [ ] Resend account created
- [ ] Resend API key copied
- [ ] Sender email decided
- [ ] OpenAI account created
- [ ] OpenAI API key copied
- [ ] Model chosen (gpt-3.5-turbo or gpt-4)
- [ ] (Optional) S3 bucket created
- [ ] (Optional) S3 credentials copied

---

## 🚀 Ready?

Once you have the credentials, paste them in the chat in this format:

```
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_your_key_here
EMAIL_FROM=Performance Management <onboarding@resend.dev>

AI_PROVIDER=openai
AI_API_KEY=sk_your_key_here
AI_MODEL=gpt-3.5-turbo

# Optional (if you set up storage)
STORAGE_PROVIDER=s3
STORAGE_BUCKET=your-bucket-name
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_REGION=us-east-1
```

**I'll then immediately start implementing all remaining features!**

---

**Need help with any step? Just ask!**
