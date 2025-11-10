// Spotify API Service
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || ''
// For GitHub Pages, use the full URL including pathname
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 
  (window.location.origin + window.location.pathname.replace(/\/$/, ''))
const SCOPES = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state streaming user-read-currently-playing'

// Get access token from URL hash
export const getTokenFromUrl = () => {
  const hash = window.location.hash
    .substring(1)
    .split('&')
    .reduce((initial, item) => {
      const parts = item.split('=')
      initial[parts[0]] = decodeURIComponent(parts[1])
      return initial
    }, {})
  
  window.location.hash = ''
  return hash.access_token
}

// Get stored token
export const getStoredToken = () => {
  return localStorage.getItem('spotify_access_token')
}

// Store token
export const storeToken = (token) => {
  localStorage.setItem('spotify_access_token', token)
}

// Remove token
export const removeToken = () => {
  localStorage.removeItem('spotify_access_token')
}

// Check if token is expired (simple check - in production, check expiry time)
export const isTokenExpired = () => {
  // For simplicity, we'll refresh on each session
  // In production, you'd check the token expiry time
  return false
}

// Get access token
export const getAccessToken = () => {
  // Check if CLIENT_ID is configured
  if (!CLIENT_ID || CLIENT_ID.trim() === '') {
    console.error('Spotify Client ID is not configured. Please set VITE_SPOTIFY_CLIENT_ID environment variable.')
    console.error('Current CLIENT_ID value:', CLIENT_ID)
    alert('Spotify Client ID is not configured. Please check your environment variables or GitHub Secrets.')
    return null
  }
  
  const token = getTokenFromUrl() || getStoredToken()
  
  if (token && !isTokenExpired()) {
    storeToken(token)
    return token
  }
  
  // Redirect to Spotify login
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`
  
  console.log('Redirecting to Spotify...')
  console.log('CLIENT_ID:', CLIENT_ID ? `${CLIENT_ID.substring(0, 8)}...` : 'EMPTY')
  console.log('REDIRECT_URI:', REDIRECT_URI)
  console.log('Full Auth URL:', authUrl)
  
  // Try multiple methods to ensure redirect happens
  try {
    // Method 1: window.location.replace (preferred - doesn't add to history)
    window.location.replace(authUrl)
  } catch (e) {
    console.warn('window.location.replace failed, trying window.location.href:', e)
    try {
      // Method 2: window.location.href (fallback)
      window.location.href = authUrl
    } catch (e2) {
      console.error('Both redirect methods failed:', e2)
      // Method 3: window.open as last resort (might be blocked by popup blocker)
      window.open(authUrl, '_self')
    }
  }
  
  return null
}

// Check if Spotify is configured
export const isSpotifyConfigured = () => {
  return CLIENT_ID && CLIENT_ID.trim() !== ''
}

// Make API request
const makeRequest = async (endpoint, token) => {
  try {
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.status === 401) {
      // Token expired, re-authenticate
      removeToken()
      getAccessToken()
      return null
    }
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

// Search for tracks
export const searchTracks = async (query, token, limit = 50) => {
  if (!query || !token) return []
  
  const endpoint = `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`
  const data = await makeRequest(endpoint, token)
  
  if (!data || !data.tracks) return []
  
  return data.tracks.items.map(track => ({
    id: track.id,
    title: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    duration: Math.floor(track.duration_ms / 1000),
    imageUrl: track.album.images[0]?.url || track.album.images[1]?.url || '',
    previewUrl: track.preview_url || '',
    spotifyUri: track.uri,
    externalUrl: track.external_urls.spotify
  }))
}

// Get featured/new releases
export const getFeaturedPlaylists = async (token, limit = 20) => {
  const endpoint = `/browse/featured-playlists?limit=${limit}`
  const data = await makeRequest(endpoint, token)
  
  if (!data || !data.playlists) return []
  
  // Get tracks from first playlist
  if (data.playlists.items.length > 0) {
    return getPlaylistTracks(data.playlists.items[0].id, token)
  }
  
  return []
}

// Get playlist tracks
export const getPlaylistTracks = async (playlistId, token) => {
  const endpoint = `/playlists/${playlistId}/tracks?limit=50`
  const data = await makeRequest(endpoint, token)
  
  if (!data || !data.items) return []
  
  return data.items
    .filter(item => item.track && item.track.preview_url)
    .map(item => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists.map(a => a.name).join(', '),
      album: item.track.album.name,
      duration: Math.floor(item.track.duration_ms / 1000),
      imageUrl: item.track.album.images[0]?.url || item.track.album.images[1]?.url || '',
      previewUrl: item.track.preview_url || '',
      spotifyUri: item.track.uri,
      externalUrl: item.track.external_urls.spotify
    }))
}

// Get user's saved tracks
export const getSavedTracks = async (token, limit = 50) => {
  const endpoint = `/me/tracks?limit=${limit}`
  const data = await makeRequest(endpoint, token)
  
  if (!data || !data.items) return []
  
  return data.items.map(item => ({
    id: item.track.id,
    title: item.track.name,
    artist: item.track.artists.map(a => a.name).join(', '),
    album: item.track.album.name,
    duration: Math.floor(item.track.duration_ms / 1000),
    imageUrl: item.track.album.images[0]?.url || item.track.album.images[1]?.url || '',
    previewUrl: item.track.preview_url || '',
    spotifyUri: item.track.uri,
    externalUrl: item.track.external_urls.spotify
  }))
}

// Get user's top tracks
export const getTopTracks = async (token, limit = 50) => {
  const endpoint = `/me/top/tracks?limit=${limit}&time_range=medium_term`
  const data = await makeRequest(endpoint, token)
  
  if (!data || !data.items) return []
  
  return data.items.map(track => ({
    id: track.id,
    title: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    duration: Math.floor(track.duration_ms / 1000),
    imageUrl: track.album.images[0]?.url || track.album.images[1]?.url || '',
    previewUrl: track.preview_url || '',
    spotifyUri: track.uri,
    externalUrl: track.external_urls.spotify
  }))
}

// Get recommendations based on seed tracks
export const getRecommendations = async (seedTracks, token, limit = 50) => {
  if (!seedTracks || seedTracks.length === 0) return []
  
  const seedIds = seedTracks.slice(0, 5).join(',')
  const endpoint = `/recommendations?seed_tracks=${seedIds}&limit=${limit}`
  const data = await makeRequest(endpoint, token)
  
  if (!data || !data.tracks) return []
  
  return data.tracks.map(track => ({
    id: track.id,
    title: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    duration: Math.floor(track.duration_ms / 1000),
    imageUrl: track.album.images[0]?.url || track.album.images[1]?.url || '',
    previewUrl: track.preview_url || '',
    spotifyUri: track.uri,
    externalUrl: track.external_urls.spotify
  }))
}

