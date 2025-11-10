import { useState } from 'react'
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Search } from 'lucide-react'
import TrackList from './TrackList'

const Player = ({
  currentTrack,
  isPlaying,
  setIsPlaying,
  currentTime,
  duration,
  onSeek,
  onNext,
  onPrevious,
  volume,
  setVolume,
  tracks,
  setCurrentTrack,
  onSearchClick
}) => {
  const [showTrackList, setShowTrackList] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (isMuted || volume === 0) {
      setVolume(70)
      setIsMuted(false)
    } else {
      setIsMuted(true)
      setVolume(0)
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url(${currentTrack.imageUrl})`,
          filter: 'blur(40px) brightness(0.3)',
          transform: 'scale(1.1)'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />
      
      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex">
        {/* Sidebar Player - Compact Design */}
        <div className="w-80 h-full bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col">
          {/* Song Image */}
          <div className="p-6 flex-shrink-0">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl group">
              <img 
                src={currentTrack.imageUrl} 
                alt={currentTrack.album}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          </div>

          {/* Song Info */}
          <div className="px-6 pb-4 flex-shrink-0">
            <h2 className="text-white text-xl font-bold mb-1 truncate">
              {currentTrack.title}
            </h2>
            <p className="text-gray-300 text-sm mb-1 truncate">
              {currentTrack.artist}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {currentTrack.album}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pb-2 flex-shrink-0">
            <div className="relative">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-spotify-green transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={onPrevious}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white hover:text-spotify-green"
                aria-label="Previous"
              >
                <SkipBack size={24} />
              </button>
              
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-4 rounded-full bg-spotify-green hover:bg-[#1ed760] transition-all transform hover:scale-110 shadow-lg shadow-spotify-green/50"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause size={28} className="text-black" fill="currentColor" />
                ) : (
                  <Play size={28} className="text-black ml-1" fill="currentColor" />
                )}
              </button>
              
              <button
                onClick={onNext}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white hover:text-spotify-green"
                aria-label="Next"
              >
                <SkipForward size={24} />
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div className="px-6 py-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white hover:text-spotify-green"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
              <div className="flex-1 relative">
                <div className="h-1 bg-white/10 rounded-full">
                  <div 
                    className="h-full bg-white/60 rounded-full transition-all"
                    style={{ width: `${volume}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Search and Track List Toggle */}
          <div className="px-6 py-4 mt-auto flex-shrink-0 border-t border-white/10 space-y-2">
            <button
              onClick={onSearchClick}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-spotify-green/20 hover:bg-spotify-green/30 transition-colors text-white border border-spotify-green/30"
            >
              <Search size={18} />
              <span className="text-sm font-medium">Search Songs</span>
            </button>
            <button
              onClick={() => setShowTrackList(!showTrackList)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white"
            >
              <Music size={18} />
              <span className="text-sm font-medium">
                {showTrackList ? 'Hide' : 'Show'} Playlist
              </span>
            </button>
          </div>
        </div>

        {/* Track List Sidebar */}
        {showTrackList && (
          <TrackList
            tracks={tracks}
            currentTrack={currentTrack}
            setCurrentTrack={setCurrentTrack}
            onClose={() => setShowTrackList(false)}
          />
        )}
      </div>
    </div>
  )
}

export default Player

