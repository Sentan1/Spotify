// Spotify API Service - Using Authorization Code Flow with PKCE
// This is the recommended flow (Implicit Grant is deprecated)
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || ''

// For GitHub Pages, use the full URL including pathname
// Make sure it ends with / for GitHub Pages
const getRedirectUri = () => {
  if (import.meta.env.VITE_SPOTIFY_REDIRECT_URI) {
    const uri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
    // Ensure it ends with / for GitHub Pages
    return uri.endsWith('/') ? uri : uri + '/'
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
    console.log('Full code:', code)
    
    const codeVerifier = localStorage.getItem('code_verifier')
    const storedRedirectUri = localStorage.getItem('spotify_redirect_uri')
    
    if (!codeVerifier) {
      console.error('❌ Code verifier not found in localStorage')
      console.error('Available localStorage keys:', Object.keys(localStorage))
      alert('Authentication error: Code verifier not found. Please try logging in again.')
      return null
    }
    
    console.log('Code verifier found, length:', codeVerifier.length)
    console.log('Stored redirect URI:', storedRedirectUri)
    console.log('Current REDIRECT_URI:', REDIRECT_URI)
    
    // Use the stored redirect URI if available (must match exactly)
    const redirectUriForExchange = storedRedirectUri || REDIRECT_URI
    console.log('Using redirect URI for exchange:', redirectUriForExchange)
    
    try {
      const token = await exchangeCodeForToken(code, codeVerifier, redirectUriForExchange)
      if (token) {
        console.log('✅ Token stored successfully')
        storeToken(token)
        localStorage.removeItem('code_verifier') // Clean up
        localStorage.removeItem('spotify_auth_state') // Clean up
        localStorage.removeItem('spotify_redirect_uri') // Clean up
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
  
  // Store code verifier for later (CRITICAL - must match in token exchange)
  localStorage.setItem('code_verifier', codeVerifier)
  console.log('✅ Code verifier stored in localStorage, length:', codeVerifier.length)
  
  // Generate state for CSRF protection
  const state = generateRandomString(16)
  localStorage.setItem('spotify_auth_state', state)
  
  // Store the redirect URI used so we can match it exactly later
  // Ensure it ends with / for GitHub Pages
  const redirectUriForAuth = REDIRECT_URI.endsWith('/') ? REDIRECT_URI : REDIRECT_URI + '/'
  localStorage.setItem('spotify_redirect_uri', redirectUriForAuth)
  console.log('✅ Redirect URI stored:', redirectUriForAuth)
  
  // Build authorization URL
  
  const params = new URLSearchParams()
  params.append('response_type', 'code')
  params.append('client_id', CLIENT_ID)
  params.append('scope', SCOPES)
  params.append('redirect_uri', redirectUriForAuth)
  params.append('state', state)
  params.append('code_challenge_method', 'S256')
  params.append('code_challenge', codeChallenge)
  params.append('show_dialog', 'true')
  
  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`
  
  console.log('🔄 Redirecting to Spotify login page...')
  console.log('Redirect URI for auth:', redirectUriForAuth)
  console.log('Code challenge length:', codeChallenge.length)
  console.log('State:', state)
  console.log('Auth URL length:', authUrl.length)
  console.log('Auth URL (first 300 chars):', authUrl.substring(0, 300))
  
  // Store the exact redirect URI used
  localStorage.setItem('spotify_redirect_uri', redirectUriForAuth)
  
  // Redirect to Spotify
  window.location.href = authUrl
}

// Exchange authorization code for access token
const exchangeCodeForToken = async (code, codeVerifier, redirectUri) => {
  const url = 'https://accounts.spotify.com/api/token'
  
  // Use the provided redirect URI (must match EXACTLY what was sent in authorization)
  // If not provided, use the current REDIRECT_URI
  const redirectUriForExchange = redirectUri || REDIRECT_URI
  
  console.log('🔄 Exchanging code for token...')
  console.log('Code:', code ? code.substring(0, 20) + '...' : 'MISSING')
  console.log('Code verifier exists:', !!codeVerifier)
  console.log('Code verifier length:', codeVerifier ? codeVerifier.length : 0)
  console.log('Redirect URI for exchange:', redirectUriForExchange)
  console.log('CLIENT_ID:', CLIENT_ID ? CLIENT_ID.substring(0, 8) + '...' : 'MISSING')
  
  // Build the request body
  const bodyParams = new URLSearchParams()
  bodyParams.append('grant_type', 'authorization_code')
  bodyParams.append('code', code)
  bodyParams.append('redirect_uri', redirectUriForExchange)
  bodyParams.append('client_id', CLIENT_ID)
  bodyParams.append('code_verifier', codeVerifier)
  
  console.log('Request URL:', url)
  console.log('Request params (without code_verifier):', 
    bodyParams.toString().replace(/code_verifier=[^&]+/, 'code_verifier=***'))
  
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
      console.error('❌ Token exchange failed with 400 error')
      console.error('Full error response:', JSON.stringify(data, null, 2))
      const errorMsg = data.error_description || data.error || 'Token exchange failed'
      console.error('Error details:', {
        error: data.error,
        error_description: data.error_description,
        status: response.status,
        redirect_uri_used: redirectUriForExchange,
        code_length: code.length,
        code_verifier_length: codeVerifier ? codeVerifier.length : 0
      })
      
      // Provide helpful error message
      if (data.error === 'invalid_grant') {
        throw new Error('Invalid authorization code. The code may have expired or been used already. Please try logging in again.')
      } else if (data.error === 'invalid_client') {
        throw new Error('Invalid client ID. Please check your Spotify app settings.')
      } else {
        throw new Error(`${data.error}: ${data.error_description || 'Token exchange failed'}`)
      }
    }
    
    console.log('✅ Token received successfully')
    return data.access_token
  } catch (error) {
    console.error('❌ Error in token exchange:', error)
    if (error.message) {
      throw error
    }
    throw new Error('Network error during token exchange. Please check your connection and try again.')
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

