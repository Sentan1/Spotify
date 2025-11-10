// Spotify API Service - Using Authorization Code Flow with PKCE
// This is the recommended flow (Implicit Grant is deprecated)
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

// PKCE Helper Functions
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

// Get authorization code from URL query params (PKCE flow)
export const getCodeFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const error = urlParams.get('error')
  
  if (error) {
    console.error('❌ Spotify auth error:', error, urlParams.get('error_description'))
    return null
  }
  
  // Clear the code from URL
  if (code) {
    window.history.replaceState({}, document.title, window.location.pathname)
  }
  
  return code
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

// Get access token using PKCE flow
export const getAccessToken = async () => {
  console.log('=== getAccessToken called (PKCE Flow) ===')
  
  // Check if CLIENT_ID is configured
  if (!CLIENT_ID || CLIENT_ID.trim() === '') {
    console.error('❌ Spotify Client ID is not configured!')
    alert('Spotify Client ID is not configured.\n\nPlease:\n1. Add VITE_SPOTIFY_CLIENT_ID to GitHub Secrets\n2. Redeploy the app')
    return null
  }
  
  // Check for stored token first
  const storedToken = getStoredToken()
  if (storedToken && !isTokenExpired()) {
    console.log('✅ Using existing token')
    return storedToken
  }
  
  // Check if we have an authorization code (returning from Spotify)
  const code = getCodeFromUrl()
  if (code) {
    console.log('✅ Authorization code received, exchanging for token...')
    console.log('Code length:', code.length)
    
    const codeVerifier = localStorage.getItem('code_verifier')
    if (!codeVerifier) {
      console.error('❌ Code verifier not found in localStorage')
      console.error('Available localStorage keys:', Object.keys(localStorage))
      alert('Authentication error: Code verifier not found. Please try logging in again.')
      return null
    }
    
    console.log('Code verifier found, length:', codeVerifier.length)
    
    try {
      const token = await exchangeCodeForToken(code, codeVerifier)
      if (token) {
        console.log('✅ Token stored successfully')
        storeToken(token)
        localStorage.removeItem('code_verifier') // Clean up
        localStorage.removeItem('spotify_auth_state') // Clean up
        return token
      }
    } catch (error) {
      console.error('❌ Error exchanging code for token:', error)
      alert(`Authentication error: ${error.message}\n\nPlease check the console for details.`)
      return null
    }
  }
  
  // No code, need to start authorization flow
  console.log('🔄 Starting PKCE authorization flow...')
  await initiatePKCEFlow()
  return null
}

// Initiate PKCE authorization flow
const initiatePKCEFlow = async () => {
  // Generate code verifier and challenge
  const codeVerifier = generateRandomString(64)
  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64encode(hashed)
  
  // Store code verifier for later
  localStorage.setItem('code_verifier', codeVerifier)
  
  // Generate state for CSRF protection
  const state = generateRandomString(16)
  localStorage.setItem('spotify_auth_state', state)
  
  // Build authorization URL
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
  
  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`
  
  console.log('🔄 Redirecting to Spotify login page...')
  console.log('Auth URL:', authUrl)
  
  // Redirect to Spotify
  window.location.href = authUrl
}

// Exchange authorization code for access token
const exchangeCodeForToken = async (code, codeVerifier) => {
  const url = 'https://accounts.spotify.com/api/token'
  
  console.log('🔄 Exchanging code for token...')
  console.log('Code:', code ? code.substring(0, 20) + '...' : 'MISSING')
  console.log('Code verifier exists:', !!codeVerifier)
  console.log('Redirect URI:', REDIRECT_URI)
  
  const bodyParams = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  })
  
  console.log('Request body params:', bodyParams.toString().replace(/code_verifier=[^&]+/, 'code_verifier=***'))
  
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams,
  }
  
  try {
    const response = await fetch(url, payload)
    const data = await response.json()
    
    console.log('Token exchange response status:', response.status)
    console.log('Token exchange response:', data)
    
    if (!response.ok) {
      console.error('❌ Token exchange failed:', data)
      const errorMsg = data.error_description || data.error || 'Token exchange failed'
      console.error('Error details:', {
        error: data.error,
        error_description: data.error_description,
        status: response.status
      })
      throw new Error(errorMsg)
    }
    
    console.log('✅ Token received successfully')
    return data.access_token
  } catch (error) {
    console.error('❌ Error in token exchange:', error)
    console.error('Error stack:', error.stack)
    throw error
  }
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

