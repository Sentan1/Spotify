import { X } from 'lucide-react'

const TrackList = ({ tracks, currentTrack, setCurrentTrack, onClose }) => {
  return (
    <div className="w-80 h-full bg-black/50 backdrop-blur-xl border-l border-white/10 flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">Playlist</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 transition-colors text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {tracks.map((track, index) => (
          <button
            key={track.id}
            onClick={() => setCurrentTrack(track)}
            className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors ${
              currentTrack.id === track.id ? 'bg-white/10' : ''
            }`}
          >
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={track.imageUrl} 
                alt={track.album}
                className="w-full h-full object-cover"
              />
              {currentTrack.id === track.id && (
                <div className="absolute inset-0 bg-spotify-green/30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-spotify-green" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className={`text-sm font-medium truncate ${
                currentTrack.id === track.id ? 'text-spotify-green' : 'text-white'
              }`}>
                {track.title}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {track.artist}
              </p>
            </div>
            <div className="text-xs text-gray-500 flex-shrink-0">
              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default TrackList

