# Hugging Face API Setup Guide

## Step 1: Create Hugging Face Account
1. Go to [Hugging Face](https://huggingface.co/join)
2. Sign up for a free account
3. Verify your email address

## Step 2: Generate API Token
1. Navigate to your profile settings
2. Click on "Access Tokens" in the left sidebar
3. Click "New token"
4. Give it a name (e.g., "ClimateDAO")
5. Select "Read" permissions (sufficient for inference API)
6. Click "Generate a token"
7. Copy the token (starts with `hf_`)

## Step 3: Configure Environment
1. Copy `frontend/env.example` to `frontend/.env`
2. Replace `hf_your_api_key_here` with your actual token:

```bash
VITE_HF_API_KEY=hf_your_actual_token_here
```

## Step 4: Test the Integration
1. Start the development server: `npm run dev`
2. Go to the Create Proposal page
3. Fill in proposal details
4. Click "Analyze with AI"
5. Verify that AI analysis works without errors

## Troubleshooting
- **401 Unauthorized**: Check that your API token is correct
- **429 Rate Limited**: You've exceeded the free tier limits
- **500 Server Error**: Hugging Face service is temporarily down

## Free Tier Limits
- 1000 requests per month
- 30 seconds timeout per request
- No concurrent requests

For production use, consider upgrading to a paid plan.
