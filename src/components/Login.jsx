import { useState, useEffect } from 'react'
import { Music, Copy, ExternalLink } from 'lucide-react'
import { getAccessToken, getStoredToken, isSpotifyConfigured } from '../services/spotifyApi'

const Login = () => {
  const [showAuthUrl, setShowAuthUrl] = useState(false)
  const [authUrl, setAuthUrl] = useState('')
  
  // Get the auth URL for direct link fallback (PKCE flow)
  const getAuthUrl = async () => {
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || ''
    // Ensure redirect URI ends with / for GitHub Pages (must match spotifyApi.js)
    let REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
    if (!REDIRECT_URI) {
      const origin = window.location.origin
      const pathname = window.location.pathname
      const basePath = pathname.endsWith('/') ? pathname : pathname + '/'
      REDIRECT_URI = origin + basePath
    } else {
      REDIRECT_URI = REDIRECT_URI.endsWith('/') ? REDIRECT_URI : REDIRECT_URI + '/'
    }
    const SCOPES = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state streaming user-read-currently-playing'
    
    if (!CLIENT_ID) return null
    
    // Generate PKCE values
    const generateRandomString = (length) => {
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      const values = crypto.getRandomValues(new Uint8Array(length))
      return values.reduce((acc, x) => acc + possible[x % possible.length], '')
    }
    
    const sha256 = async (plain) => {
      const encoder = new TextEncoder()
      const data = encoder.encode(plain)
      return window.crypto.subtle.digest('SHA-256', data)
    }
    
    const base64encode = (input) => {
      return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
    }
    
    const codeVerifier = generateRandomString(64)
    const hashed = await sha256(codeVerifier)
    const codeChallenge = base64encode(hashed)
    const state = generateRandomString(16)
    
    // Store for later use (must match what spotifyApi.js expects)
    localStorage.setItem('code_verifier', codeVerifier)
    localStorage.setItem('spotify_auth_state', state)
    localStorage.setItem('spotify_redirect_uri', REDIRECT_URI) // Store exact redirect URI used
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      show_dialog: 'true'
    })
    return `https://accounts.spotify.com/authorize?${params.toString()}`
  }
  
  const handleLogin = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🔵 Login button clicked')
    const configured = isSpotifyConfigured()
    console.log('Spotify configured:', configured)
    
    // Check if already have token
    const storedToken = getStoredToken()
    if (storedToken) {
      console.log('✅ Already have token, reloading...')
      window.location.reload()
      return
    }
    
    // If not configured, show error
    if (!configured) {
      alert('Spotify Client ID is not configured. Please check GitHub Secrets and redeploy.')
      return
    }
    
    // Get the auth URL and show it
    try {
      const url = await getAuthUrl()
      if (url) {
        setAuthUrl(url)
        setShowAuthUrl(true)
        console.log('📋 Auth URL displayed on page for copying')
        console.log('Full Auth URL:', url)
      }
      
      // Always try to get access token (it will redirect to Spotify if needed)
      const result = await getAccessToken()
      console.log('getAccessToken returned:', result ? 'TOKEN' : 'NULL')
      
      if (result) {
        console.log('✅ Already have token, reloading page...')
        window.location.reload()
        return
      }
      
      // If we get here and result is null, getAccessToken should have redirected
      // But if we're still here, the redirect didn't work
      console.warn('Redirect should have happened but we are still here')
      console.log('Auth URL was:', url)
      alert('Redirect failed. Please try clicking the direct link below or copy the URL manually.')
    } catch (error) {
      console.error('❌ Error during login:', error)
      alert('Error during login: ' + error.message)
    }
  }
  
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(authUrl)
    alert('Auth URL copied to clipboard!')
  }
  
  const handleOpenUrl = () => {
    window.open(authUrl, '_blank')
  }

  const isConfigured = isSpotifyConfigured()
  const [computedAuthUrl, setComputedAuthUrl] = useState(null)
  
  // Pre-generate auth URL on mount
  useEffect(() => {
    if (isConfigured) {
      getAuthUrl().then(url => setComputedAuthUrl(url))
    }
  }, [isConfigured])

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-spotify-green via-spotify-dark to-black">
      <div className="text-center p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="p-4 rounded-full bg-spotify-green">
            <Music size={48} className="text-black" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Spotify Study Companion
        </h1>
        <p className="text-gray-300 mb-8 text-lg">
          Connect to Spotify to access millions of songs
        </p>
        {!isConfigured ? (
          <div className="w-full py-4 px-8 bg-red-600 text-white font-bold rounded-full text-lg mb-4">
            ⚠️ Spotify Client ID Not Configured
          </div>
        ) : (
          <>
            <button
              onClick={handleLogin}
              className="w-full py-4 px-8 bg-spotify-green hover:bg-[#1ed760] text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-spotify-green/50 text-lg"
            >
              Login with Spotify
            </button>
            {showAuthUrl && authUrl && (
              <div className="mt-4 p-4 bg-black/60 rounded-lg border border-white/10">
                <p className="text-white text-sm mb-2 font-semibold">Auth URL (copy this if redirect doesn't work):</p>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={authUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-xs font-mono"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded transition-colors"
                    title="Copy URL"
                  >
                    <Copy size={16} className="text-white" />
                  </button>
                  <button
                    onClick={handleOpenUrl}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink size={16} className="text-white" />
                  </button>
                </div>
                <a
                  href={authUrl}
                  className="block text-center text-sm text-spotify-green hover:text-[#1ed760] underline"
                >
                  Or click here to open directly
                </a>
              </div>
            )}
            {computedAuthUrl && !showAuthUrl && (
              <a
                href={computedAuthUrl}
                className="block mt-2 text-center text-sm text-gray-400 hover:text-white underline"
                onClick={(e) => {
                  console.log('Direct link clicked, redirecting to:', computedAuthUrl)
                }}
              >
                Or click here if button doesn't work
              </a>
            )}
          </>
        )}
        {!isConfigured ? (
          <div className="text-red-400 text-sm mt-4 space-y-2">
            <p>Please configure your Spotify Client ID:</p>
            <ol className="list-decimal list-inside text-left space-y-1">
              <li>Go to GitHub → Settings → Secrets → Actions</li>
              <li>Add secret: <code className="bg-black/30 px-1 rounded">VITE_SPOTIFY_CLIENT_ID</code></li>
              <li>Add your Spotify Client ID as the value</li>
              <li>Redeploy the app</li>
            </ol>
          </div>
        ) : (
          <p className="text-gray-400 text-sm mt-6">
            You'll be redirected to Spotify to authorize this app
          </p>
        )}
      </div>
    </div>
  )
}

export default Login

