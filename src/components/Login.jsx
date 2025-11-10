import { Spotify } from 'lucide-react'
import { getAccessToken } from '../services/spotifyApi'

const Login = () => {
  const handleLogin = () => {
    getAccessToken()
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-spotify-green via-spotify-dark to-black">
      <div className="text-center p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="p-4 rounded-full bg-spotify-green">
            <Spotify size={48} className="text-black" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Spotify Study Companion
        </h1>
        <p className="text-gray-300 mb-8 text-lg">
          Connect to Spotify to access millions of songs
        </p>
        <button
          onClick={handleLogin}
          className="w-full py-4 px-8 bg-spotify-green hover:bg-[#1ed760] text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-spotify-green/50 text-lg"
        >
          Login with Spotify
        </button>
        <p className="text-gray-400 text-sm mt-6">
          You'll be redirected to Spotify to authorize this app
        </p>
      </div>
    </div>
  )
}

export default Login

