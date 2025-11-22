# Deployment Guide for Skills Management Hub

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod

# Your app will be available at: https://your-app-name.vercel.app
```

### Option 2: Netlify
```bash
# Build the app
npm run build

# Deploy to Netlify
npx netlify deploy --prod --dir=out
```

### Option 3: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## 🗄️ Database Setup (Supabase)

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Get your project URL and API key

2. **Run SQL Setup:**
   - Copy contents from `supabase-setup.sql`
   - Run in Supabase SQL editor

3. **Add Environment Variables:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

## 🔧 Production Configuration

### Update package.json
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev"
  }
}
```

### Environment Variables (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 📱 Access Points

### Admin Access:
- **URL**: `https://your-app.vercel.app/admin/login`
- **Features**: Full skill management, member management, assignments

### Member Access:
- **URL**: `https://your-app.vercel.app/member/login`
- **Features**: View assigned skills, track progress

### Registration:
- **URL**: `https://your-app.vercel.app/register`
- **Features**: New member registration

## 🔒 Security Features

- **Row Level Security (RLS)** enabled
- **Role-based access** (admin/member)
- **Secure authentication** via Supabase
- **Data isolation** between users

## 📊 Monitoring

- **Vercel Analytics** (built-in)
- **Supabase Dashboard** for database monitoring
- **Error tracking** via Vercel

## 🚀 Go Live Checklist

- [ ] Deploy to Vercel
- [ ] Set up Supabase database
- [ ] Run SQL setup script
- [ ] Add environment variables
- [ ] Test admin login
- [ ] Test member registration
- [ ] Test skill assignment flow
- [ ] Verify member can see assigned skills
- [ ] Set up custom domain (optional)

## 💰 Cost Breakdown

### Vercel (Free Tier):
- ✅ Unlimited personal projects
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN

### Supabase (Free Tier):
- ✅ 500MB database
- ✅ 50,000 monthly active users
- ✅ 2GB bandwidth
- ✅ Real-time subscriptions

**Total Cost: $0/month** for small to medium usage!



