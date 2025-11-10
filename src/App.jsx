import { useState, useEffect, useRef } from 'react'
import Player from './components/Player'
import Login from './components/Login'
import Search from './components/Search'
import { 
  getCodeFromUrl,
  getStoredToken,
  storeToken,
  searchTracks, 
  getTopTracks,
  removeToken 
} from './services/spotifyApi'

function App() {
  const [token, setToken] = useState(null)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [tracks, setTracks] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(70)
  const [showSearch, setShowSearch] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef(null)

  // Initialize token on mount
  useEffect(() => {
    // Check if we're returning from Spotify auth (PKCE flow)
    const code = getCodeFromUrl()
    if (code) {
      console.log('✅ Authorization code received from Spotify!')
      // getAccessToken will handle the code exchange
      handleTokenInitialization()
      return
    }
    
    // Check for error in URL (Spotify redirects back with error)
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')
    
    if (error) {
      console.error('❌ Spotify auth error:', error, errorDescription)
      alert(`Spotify authentication error: ${error}\n${errorDescription || ''}\n\nPlease check your Spotify app settings.`)
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    // Check for stored token
    handleTokenInitialization()
  }, [])
  
  // Handle token initialization
  const handleTokenInitialization = async () => {
    const storedToken = getStoredToken()
    if (storedToken) {
      setToken(storedToken)
      loadInitialTracks(storedToken)
    }
    // If no token and no code, show login screen
  }

  // Load initial tracks (user's top tracks)
  const loadInitialTracks = async (accessToken) => {
    setIsLoading(true)
    try {
      const topTracks = await getTopTracks(accessToken)
      if (topTracks && topTracks.length > 0) {
        setTracks(topTracks)
        setCurrentTrack(topTracks[0])
      } else {
        // Fallback: search for popular songs if no top tracks
        const fallbackTracks = await searchTracks('popular songs 2024', accessToken, 20)
        if (fallbackTracks && fallbackTracks.length > 0) {
          setTracks(fallbackTracks)
          setCurrentTrack(fallbackTracks[0])
        }
      }
    } catch (error) {
      console.error('Error loading initial tracks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search
  const handleSearch = async (query) => {
    if (!token || !query.trim()) return
    
    setIsLoading(true)
    try {
      const searchResults = await searchTracks(query, token, 50)
      if (searchResults && searchResults.length > 0) {
        setTracks(searchResults)
        setCurrentTrack(searchResults[0])
        setShowSearch(false)
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Audio controls
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      if (isPlaying && currentTrack.previewUrl) {
        audioRef.current.play().catch(err => {
          console.error('Play error:', err)
          // If preview is not available, show message
          if (err.name === 'NotAllowedError' || !currentTrack.previewUrl) {
            alert('Preview not available for this track. Some tracks may not have preview URLs.')
            setIsPlaying(false)
          }
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTrack])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleNext = () => {
    if (tracks.length === 0) return
    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id)
    const nextIndex = (currentIndex + 1) % tracks.length
    setCurrentTrack(tracks[nextIndex])
    setCurrentTime(0)
  }

  const handlePrevious = () => {
    if (tracks.length === 0) return
    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id)
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1
    setCurrentTrack(tracks[prevIndex])
    setCurrentTime(0)
  }

  const handleEnded = () => {
    handleNext()
  }

  const handleLogout = () => {
    removeToken()
    setToken(null)
    setTracks([])
    setCurrentTrack(null)
    setIsPlaying(false)
  }

  // Show login if no token
  if (!token) {
    return <Login />
  }

  // Show loading state
  if (isLoading && tracks.length === 0 && token) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-spotify-green mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your music...</p>
        </div>
      </div>
    )
  }

  // Show message if no tracks but have token
  if (token && (!currentTrack || tracks.length === 0) && !isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-center p-8">
          <p className="text-white text-xl mb-4">No tracks available</p>
          <button
            onClick={() => setShowSearch(true)}
            className="px-6 py-3 bg-spotify-green hover:bg-[#1ed760] text-black font-bold rounded-full transition-all"
          >
            Search for Songs
          </button>
        </div>
      </div>
    )
  }

  // Don't render player if no token and no tracks - but we should have shown login or loading
  // This is a safety check
  if (!token) {
    return <Login />
  }
  
  if (!currentTrack && !isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-center p-8">
          <p className="text-white text-xl mb-4">No tracks available</p>
          <button
            onClick={() => setShowSearch(true)}
            className="px-6 py-3 bg-spotify-green hover:bg-[#1ed760] text-black font-bold rounded-full transition-all"
          >
            Search for Songs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <audio
        ref={audioRef}
        src={currentTrack.previewUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <Search
        isOpen={showSearch}
        onSearch={handleSearch}
        onClose={() => setShowSearch(false)}
      />
      <Player
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        currentTime={currentTime}
        duration={currentTrack.duration}
        onSeek={handleSeek}
        onNext={handleNext}
        onPrevious={handlePrevious}
        volume={volume}
        setVolume={setVolume}
        tracks={tracks}
        setCurrentTrack={setCurrentTrack}
        onSearchClick={() => setShowSearch(true)}
      />
      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-black/60 hover:bg-black/80 text-white text-sm rounded-lg backdrop-blur-sm border border-white/10 transition-all"
      >
        Logout
      </button>
    </div>
  )
}

export default App
