# Redirect Debugging Guide

If the redirect isn't working, check these:

## 1. Verify Redirect URI in Spotify Dashboard

The redirect URI in your Spotify app **MUST EXACTLY MATCH** what the app is sending.

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. Click "Edit Settings"
4. Check "Redirect URIs" section
5. Make sure you have: `https://Sentan1.github.io/Spotify/`

**Important**: 
- Must include the trailing `/`
- Must be `https://` (not `http://`)
- Must match exactly (case-sensitive)

## 2. Check Console Output

When you click login, check the console for:
- `REDIRECT_URI:` - Should be `https://Sentan1.github.io/Spotify/`
- `Full Auth URL:` - Copy this entire URL
- `URL length:` - Should be reasonable (not too long)

## 3. Test the Auth URL Manually

1. Copy the `Full Auth URL` from console
2. Paste it directly in your browser address bar
3. Press Enter
4. If it works, you'll see Spotify login page
5. If it shows an error, check what Spotify says

## 4. Common Spotify Errors

### "Invalid redirect_uri"
- The redirect URI in Spotify Dashboard doesn't match
- Fix: Add `https://Sentan1.github.io/Spotify/` to Spotify Dashboard

### "Invalid client_id"
- The Client ID is wrong
- Fix: Check GitHub Secrets

### "redirect_uri_mismatch"
- The redirect URI doesn't match exactly
- Fix: Make sure both have trailing `/` and match exactly

## 5. Quick Test

Try this URL directly (replace YOUR_CLIENT_ID):
```
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=token&redirect_uri=https://Sentan1.github.io/Spotify/&scope=user-read-private%20user-read-email
```

If this works, the issue is with how the app is building the URL.
If this doesn't work, the issue is with Spotify app configuration.

