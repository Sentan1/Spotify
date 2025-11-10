import { useState } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'

const Search = ({ onSearch, onClose, isOpen }) => {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setIsSearching(true)
    await onSearch(query)
    setIsSearching(false)
  }

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-2xl mx-4 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Search Spotify</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <SearchIcon 
              size={20} 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for songs, artists, albums..."
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-spotify-green focus:bg-white/10 transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="w-full mt-4 py-3 bg-spotify-green hover:bg-[#1ed760] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-all"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
        
        <p className="text-gray-400 text-sm mt-4 text-center">
          Search from millions of songs on Spotify
        </p>
      </div>
    </div>
  )
}

export default Search

