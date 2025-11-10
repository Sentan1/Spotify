import { Music } from 'lucide-react'
import { getAccessToken, getStoredToken, isSpotifyConfigured } from '../services/spotifyApi'

const Login = () => {
  const handleLogin = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Login button clicked')
    console.log('Spotify configured:', isSpotifyConfigured())
    
    // Always try to get access token (it will redirect if needed)
    try {
      const result = getAccessToken()
      // If we get here and result is null, redirect should have happened
      // If result is a token, we already have one
      if (result) {
        console.log('Already have token')
        // Reload to show the player
        window.location.reload()
      }
    } catch (error) {
      console.error('Error during login:', error)
      alert('Error during login. Please check the console for details.')
    }
  }

  const isConfigured = isSpotifyConfigured()

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
          <button
            onClick={handleLogin}
            className="w-full py-4 px-8 bg-spotify-green hover:bg-[#1ed760] text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-spotify-green/50 text-lg"
          >
            Login with Spotify
          </button>
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

