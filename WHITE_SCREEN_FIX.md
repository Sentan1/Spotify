# Fixing White Screen Issue

If you're seeing a white screen, follow these steps:

## Step 1: Check Browser Console (CRITICAL)

1. Open: https://Sentan1.github.io/Spotify/
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab
4. Look for red errors
5. **Take a screenshot** and share what you see

Common errors you might see:
- `Failed to load resource: 404` - Files not found
- `Uncaught SyntaxError` - JavaScript error
- `CORS error` - Cross-origin issue

## Step 2: Check Network Tab

1. In DevTools, go to **Network** tab
2. Refresh the page (F5)
3. Look for files with red status (404, 500, etc.)
4. Check if these files are loading:
   - `index.html` ✅
   - `assets/index-[hash].js` ❓
   - `assets/index-[hash].css` ❓

## Step 3: Verify GitHub Actions Build

1. Go to: https://github.com/Sentan1/Spotify/actions
2. Check if the latest build has a **green checkmark** ✅
3. If it has a **red X** ❌, click it to see the error
4. Share the error message

## Step 4: Check GitHub Secrets

Make sure these secrets exist:
- Go to: https://github.com/Sentan1/Spotify/settings/secrets/actions
- You need:
  - `VITE_SPOTIFY_CLIENT_ID`
  - `VITE_SPOTIFY_REDIRECT_URI`

## Step 5: Try Hard Refresh

1. Press **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
2. Or try **Incognito/Private mode**

## Most Likely Issues:

### Issue 1: Base Path Wrong
If you see 404 errors for JS/CSS files, the base path might be wrong.

**Fix**: Check `vite.config.js` - line 7 should be:
```js
base: process.env.NODE_ENV === 'production' ? '/Spotify/' : '/',
```

Make sure `/Spotify/` matches your repository name exactly (case-sensitive).

### Issue 2: Build Failed
If GitHub Actions shows a red X, the build failed.

**Fix**: Check the error in Actions tab and fix it.

### Issue 3: Missing Secrets
If build succeeds but app doesn't work, secrets might be missing.

**Fix**: Add the GitHub Secrets (Step 4).

## Quick Test

Try visiting this URL directly:
- https://Sentan1.github.io/Spotify/index.html

If that works but the root doesn't, it's a base path issue.

## Still Not Working?

Share:
1. Screenshot of Console errors (F12 → Console)
2. Screenshot of Network tab showing failed requests
3. Screenshot of GitHub Actions build status

This will help identify the exact problem!

