import { useState } from 'react'
import { Music, Copy, ExternalLink } from 'lucide-react'
import { getAccessToken, getStoredToken, isSpotifyConfigured } from '../services/spotifyApi'

const Login = () => {
  const [showAuthUrl, setShowAuthUrl] = useState(false)
  const [authUrl, setAuthUrl] = useState('')
  
  // Get the auth URL for direct link fallback
  const getAuthUrl = () => {
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || ''
    const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 
      (window.location.origin + window.location.pathname.replace(/\/$/, ''))
    const SCOPES = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state streaming user-read-currently-playing'
    
    if (!CLIENT_ID) return null
    return `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`
  }
  
  const handleLogin = (e) => {
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
    const url = getAuthUrl()
    if (url) {
      setAuthUrl(url)
      setShowAuthUrl(true)
      console.log('📋 Auth URL displayed on page for copying')
      console.log('Full Auth URL:', url)
    }
    
    // Always try to get access token (it will redirect if needed)
    try {
      const result = getAccessToken()
      console.log('getAccessToken returned:', result ? 'TOKEN' : 'NULL')
      
      if (result) {
        console.log('✅ Already have token, reloading page...')
        window.location.reload()
      } else {
        console.log('⏳ Redirect initiated...')
      }
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
  const computedAuthUrl = getAuthUrl()

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

