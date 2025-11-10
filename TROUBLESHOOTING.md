# Troubleshooting White Screen Issue

If you're seeing a plain white screen, follow these steps:

## Step 1: Check GitHub Actions Build Status

1. Go to: https://github.com/Sentan1/Spotify/actions
2. Click on the latest workflow run
3. Check if there are any red X marks (errors)
4. If there are errors, click on the failed step to see the error message

## Step 2: Check Browser Console

1. Open your site: https://Sentan1.github.io/Spotify/
2. Press `F12` (or right-click → Inspect)
3. Go to the **Console** tab
4. Look for any red error messages
5. Take a screenshot or copy the error messages

## Step 3: Verify GitHub Secrets

Make sure you've added these secrets:
- Go to: https://github.com/Sentan1/Spotify/settings/secrets/actions
- You should see:
  - `VITE_SPOTIFY_CLIENT_ID`
  - `VITE_SPOTIFY_REDIRECT_URI`

If they're missing, add them:
1. Click "New repository secret"
2. Name: `VITE_SPOTIFY_CLIENT_ID`
3. Value: Your Spotify Client ID
4. Click "Add secret"
5. Repeat for `VITE_SPOTIFY_REDIRECT_URI` with value: `https://Sentan1.github.io/Spotify/`

## Step 4: Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for any files with red status codes (404, 500, etc.)
5. Check if `index.html` loads successfully

## Step 5: Common Issues

### Issue: "Failed to fetch" or CORS errors
- **Solution**: Make sure your Spotify Redirect URI matches exactly: `https://Sentan1.github.io/Spotify/`

### Issue: Build fails with "VITE_SPOTIFY_CLIENT_ID is not defined"
- **Solution**: Add the GitHub Secrets (Step 3)

### Issue: 404 errors for JS/CSS files
- **Solution**: The base path might be wrong. Check `vite.config.js` - it should be `/Spotify/`

### Issue: Blank page but no errors
- **Solution**: 
  1. Clear browser cache (Ctrl+Shift+Delete)
  2. Try incognito/private mode
  3. Check if JavaScript is enabled in your browser

## Step 6: Manual Re-deploy

If nothing works, try triggering a new deployment:

1. Go to: https://github.com/Sentan1/Spotify/actions
2. Click "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select "main" branch
5. Click "Run workflow"
6. Wait for it to complete

## Still Not Working?

Share:
1. Screenshot of the browser console errors
2. Screenshot of the GitHub Actions build log
3. Any error messages you see

This will help identify the exact issue!

