# Deployment Configuration Guide

## Overview
This guide explains how to deploy the Online Auction Platform with the backend on Render and frontend on Vercel.

## Backend Deployment (Render)

### 1. Environment Variables
Add these in your Render dashboard:
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `EMAIL_USER`: Your email for notifications
- `EMAIL_PASS`: Your email password/app password
- `NODE_ENV`: `production`

### 2. Build Command
```
npm install
```

### 3. Start Command
```
node server.js
```

### 4. CORS Configuration
The backend is configured to accept requests from:
- `https://online-auction-platform-for-collect-seven.vercel.app`
- `http://localhost:3000` (for local development)

**Update in server.js if your Vercel URL is different!**

## Frontend Deployment (Vercel)

### 1. Project Settings
- **Framework Preset:** Create React App
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

### 2. Environment Variables
Add these in Vercel Project Settings → Environment Variables:

#### Production Variables:
```
CI=false
REACT_APP_API_URL=https://online-auction-platform-for-collectible.onrender.com/api
```

**Important:** Replace the `REACT_APP_API_URL` with your actual Render backend URL!

### 3. Deployment Steps
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your repository
5. Set Root Directory to `frontend`
6. Add environment variables
7. Click "Deploy"

### 4. After Deployment
1. Get your Vercel deployment URL
2. Update the CORS configuration in `backend/server.js`:
   ```javascript
   const corsOptions = {
     origin: ["https://your-vercel-url.vercel.app", "http://localhost:3000"],
     ...
   };
   ```
3. Redeploy your backend on Render

## Testing the Deployment

1. Open your Vercel frontend URL
2. Try to register/login
3. Check browser console for errors
4. Check Render logs for backend errors

## Common Issues

### Network Error / CORS Error
**Problem:** Frontend can't connect to backend
**Solution:**
1. Verify the `REACT_APP_API_URL` in Vercel matches your Render backend URL
2. Ensure CORS is configured with your Vercel URL in backend/server.js
3. Check that both deployments are successful

### Build Fails on Vercel
**Problem:** ESLint warnings cause build failure
**Solution:**
- Ensure `CI=false` is set in Vercel environment variables
- Check that `cross-env` is in devDependencies

### Socket.io Connection Issues
**Problem:** Real-time features not working
**Solution:**
- Verify Socket.io CORS configuration includes your Vercel URL
- Check that WebSocket connections are allowed on both platforms

## Local Development

### Backend (.env file in backend folder):
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=your_stripe_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
PORT=5000
```

### Frontend (.env file in frontend folder):
```
REACT_APP_API_URL=http://localhost:5000/api
CI=false
```

### Running Locally:
1. Backend: `cd backend && npm start`
2. Frontend: `cd frontend && npm start`

## URLs

- **Backend (Render):** https://online-auction-platform-for-collectible.onrender.com
- **Frontend (Vercel):** https://online-auction-platform-for-collect-seven.vercel.app
- **API Endpoint:** https://online-auction-platform-for-collectible.onrender.com/api

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Render logs
3. Verify all environment variables are set correctly
4. Ensure CORS URLs match your actual deployment URLs
