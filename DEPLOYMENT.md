# GitHub Pages Deployment Guide

## Quick Setup

1. **Enable GitHub Pages with GitHub Actions**
   - Go to your repo → Settings → Pages
   - Source: Select "GitHub Actions"

2. **Add GitHub Secrets**
   - Go to Settings → Secrets and variables → Actions
   - Add `VITE_SPOTIFY_CLIENT_ID` (your Spotify Client ID)
   - Add `VITE_SPOTIFY_REDIRECT_URI` (your GitHub Pages URL)

3. **Update Spotify Redirect URI**
   - Go to [Spotify Dashboard](https://developer.spotify.com/dashboard)
   - Add your GitHub Pages URL: `https://YOUR_USERNAME.github.io/Spotify/`

4. **Push to main branch**
   - The app will automatically deploy!

## Customizing the Base Path

If your repository has a different name, update `vite.config.js`:

```js
base: process.env.NODE_ENV === 'production' ? '/YOUR_REPO_NAME/' : '/',
```

Replace `YOUR_REPO_NAME` with your actual repository name.

## Your Live URL

After deployment, your app will be available at:
`https://YOUR_USERNAME.github.io/Spotify/`

## Troubleshooting

- **404 errors**: Make sure the base path in `vite.config.js` matches your repo name
- **Spotify login not working**: Verify the redirect URI in Spotify Dashboard matches your GitHub Pages URL exactly
- **Build fails**: Check that GitHub Secrets are set correctly

