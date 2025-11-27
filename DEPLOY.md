# Deployment Instructions (Vercel)

Your project is configured to be deployed on **Vercel**.

## Prerequisites
1.  **GitHub Account**: You need to push this code to a GitHub repository.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com) using your GitHub account.

## Steps to Deploy

### 1. Push Code to GitHub
Create a new repository on GitHub and push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

### 2. Import Project in Vercel
1.  Go to your Vercel Dashboard.
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your GitHub repository.
4.  **Framework Preset**: It should auto-detect "Angular" or "Other". If not, select **Angular**.
5.  **Root Directory**: Leave as `./`.

### 3. Configure Environment Variables
**CRITICAL**: Before clicking "Deploy", scroll down to **Environment Variables** and add the following:

| Name | Value |
|------|-------|
| `MAIL_USERNAME` | `kastroguru@gmail.com` |
| `MAIL_PASSWORD` | `uqoa qzwe nmde edmp` |
| `FIREBASE_CREDENTIALS` | *(Copy the entire content of `backend/serviceAccountKey.json` and paste it here as a single line)* |

### 4. Deploy
Click **Deploy**. Vercel will:
1.  Build your Angular frontend.
2.  Set up the Python backend as serverless functions.
3.  Give you a live URL (e.g., `astro-key.vercel.app`).

## Troubleshooting
- If the build fails, check the "Build Logs" in Vercel.
- If the backend fails (500 Error), check the "Functions" logs in Vercel.
