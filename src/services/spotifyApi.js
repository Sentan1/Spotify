// Spotify API Service
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || ''
// For GitHub Pages, use the full URL including pathname
// Make sure it ends with / for GitHub Pages
const getRedirectUri = () => {
  if (import.meta.env.VITE_SPOTIFY_REDIRECT_URI) {
    return import.meta.env.VITE_SPOTIFY_REDIRECT_URI
  }
  // Auto-detect for GitHub Pages
  const origin = window.location.origin
  const pathname = window.location.pathname
  // Ensure it ends with / for GitHub Pages
  const basePath = pathname.endsWith('/') ? pathname : pathname + '/'
  return origin + basePath
}
const REDIRECT_URI = getRedirectUri()
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
  console.log('=== getAccessToken called ===')
  console.log('CLIENT_ID exists:', !!CLIENT_ID)
  console.log('CLIENT_ID length:', CLIENT_ID ? CLIENT_ID.length : 0)
  console.log('CLIENT_ID value (first 10 chars):', CLIENT_ID ? CLIENT_ID.substring(0, 10) : 'EMPTY')
  
  // Check if CLIENT_ID is configured
  if (!CLIENT_ID || CLIENT_ID.trim() === '') {
    console.error('❌ Spotify Client ID is not configured!')
    console.error('Current CLIENT_ID value:', CLIENT_ID)
    console.error('Environment variable VITE_SPOTIFY_CLIENT_ID is not set or empty')
    alert('Spotify Client ID is not configured.\n\nPlease:\n1. Add VITE_SPOTIFY_CLIENT_ID to GitHub Secrets\n2. Redeploy the app\n\nCheck console for details.')
    return null
  }
  
  console.log('✅ CLIENT_ID is configured')
  
  const token = getTokenFromUrl() || getStoredToken()
  console.log('Token from URL:', !!getTokenFromUrl())
  console.log('Stored token:', !!getStoredToken())
  
  if (token && !isTokenExpired()) {
    console.log('✅ Using existing token')
    storeToken(token)
    return token
  }
  
  // Redirect to Spotify login
  // Using 'token' for Implicit Grant Flow (client-side only, no server needed)
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&show_dialog=true`
  
  console.log('🔄 Preparing to redirect to Spotify...')
  console.log('CLIENT_ID:', `${CLIENT_ID.substring(0, 8)}...`)
  console.log('REDIRECT_URI:', REDIRECT_URI)
  console.log('Encoded REDIRECT_URI:', encodeURIComponent(REDIRECT_URI))
  console.log('Full Auth URL:', authUrl)
  console.log('URL length:', authUrl.length)
  
  // Verify the URL is valid
  try {
    new URL(authUrl)
    console.log('✅ Auth URL is valid')
  } catch (e) {
    console.error('❌ Auth URL is invalid:', e)
    alert('Invalid redirect URL. Please check your configuration.')
    return null
  }
  
  console.log('Redirecting NOW to Spotify login page...')
  console.log('Target URL:', authUrl)
  
  // Store redirect attempt in sessionStorage for debugging
  sessionStorage.setItem('spotify_redirect_attempt', JSON.stringify({
    timestamp: Date.now(),
    redirectUri: REDIRECT_URI,
    clientId: CLIENT_ID.substring(0, 8) + '...',
    authUrl: authUrl
  }))
  
  // CRITICAL: Redirect to Spotify's login page
  // This should take you to accounts.spotify.com, NOT back to GitHub Pages
  // The redirect_uri parameter is where Spotify sends you BACK after login
  try {
    // Use window.location.href for immediate redirect
    window.location.href = authUrl
  } catch (error) {
    console.error('Redirect error:', error)
    // Fallback: try window.location.replace
    window.location.replace(authUrl)
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

