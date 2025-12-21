# 📝 Rename Vercel Project to "DEMO"

The frontend was deployed to Vercel but linked to an existing project "chat-client". To rename it to "DEMO":

## Option 1: Rename in Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Find your project**: "chat-client" or "aseesys-projects/chat-client"
3. **Go to Settings**: Click on the project → **Settings** tab
4. **General Settings**: Scroll to **Project Name**
5. **Rename**: Change from "chat-client" to "demo"
6. **Save**: Click **Save**

## Option 2: Create New Project

If you want a completely fresh project:

1. **Delete .vercel directory**:

   ```bash
   rm -rf chat-client/.vercel
   ```

2. **Deploy with new project**:

   ```bash
   cd chat-client
   vercel
   ```

   When prompted:
   - **Link to existing project?** → No
   - **What's your project's name?** → `demo`
   - Continue with deployment

## Option 3: Use Vercel Dashboard to Create New Project

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New"** → **Project**
3. **Import Git Repository**: Select your GitHub repo
4. **Configure Project**:
   - **Project Name**: `demo`
   - **Root Directory**: `chat-client`
   - **Framework Preset**: Other (static)
5. **Deploy**

---

**Note**: The project name doesn't affect functionality - it's just for organization in Vercel dashboard. The deployment URL is automatically generated.
