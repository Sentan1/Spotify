// Global state
let playlist = [];
let currentIndex = 0;
let isPaused = false;
let progressInterval = null;
let searchTimeout = null;

// DOM elements
const audioPlayer = document.getElementById('audioPlayer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const cardsContainer = document.getElementById('cardsContainer');
const radioInputs = document.getElementById('radioInputs');
const playerContent = document.getElementById('playerContent');
const controlsContainer = document.getElementById('controlsContainer');
const extraControls = document.getElementById('extraControls');
const songCount = document.getElementById('songCount');
const prevButton = document.getElementById('prev');
const pauseButton = document.getElementById('pause');
const nextButton = document.getElementById('next');
const favoriteButton = document.getElementById('favorite');

// Show modal on load
window.onload = () => {
  document.getElementById("notificationModal").style.display = "flex";
};

function closeModal() {
  document.getElementById("notificationModal").style.display = "none";
}

document.getElementById("notificationModal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// Search cache and request cancellation (must be defined first)
const searchCache = new Map();
let currentSearchController = null;

// Search functionality
searchBtn.addEventListener('click', () => {
  if (currentSearchController) {
    currentSearchController.abort();
  }
  performSearch(false);
});

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    if (currentSearchController) {
      currentSearchController.abort();
    }
    performSearch(false);
  }
});

// Real-time search with suggestions (debounced) - optimized
let lastQuery = '';
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  
  // Cancel previous search if still running
  if (currentSearchController) {
    currentSearchController.abort();
    currentSearchController = null;
  }
  
  const query = e.target.value.trim();
  
  // Skip if same query
  if (query === lastQuery) return;
  lastQuery = query;
  
  // Hide suggestions if input is cleared
  const suggestionsContainer = document.getElementById('suggestionsContainer');
  if (suggestionsContainer) {
    suggestionsContainer.style.display = 'none';
  }
  
  if (query.length > 2) {
    // Show suggestions as user types - faster debounce
    searchTimeout = setTimeout(() => {
      performSearch(true); // Show suggestions
    }, 250);
  } else {
    searchResults.innerHTML = '';
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }
  }
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  const suggestionsContainer = document.getElementById('suggestionsContainer');
  if (suggestionsContainer && !suggestionsContainer.contains(e.target) && e.target !== searchInput) {
    suggestionsContainer.style.display = 'none';
  }
});

async function performSearch(showSuggestions = false) {
  const query = searchInput.value.trim();
  if (!query) {
    searchResults.innerHTML = '';
    return;
  }

  // Check cache first
  const cacheKey = `${query}_${showSuggestions}`;
  if (searchCache.has(cacheKey)) {
    const cachedData = searchCache.get(cacheKey);
    if (showSuggestions) {
      displaySuggestions(cachedData);
    } else {
      displaySearchResults(cachedData);
    }
    return;
  }

  // Cancel previous search
  if (currentSearchController) {
    currentSearchController.abort();
  }
  currentSearchController = new AbortController();

  if (!showSuggestions) {
    searchResults.innerHTML = '<div class="loading">Searching...</div>';
  }

  try {
    const apiUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${showSuggestions ? 5 : 10}`;
    
    // Create fetch with timeout and abort signal
    const timeoutId = setTimeout(() => currentSearchController?.abort(), 5000);
    
    let data = null;
    
    // Try direct API call first (fastest)
    try {
      const directResponse = await fetch(apiUrl, {
        signal: currentSearchController.signal,
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (directResponse.ok) {
        data = await directResponse.json();
        clearTimeout(timeoutId);
      }
    } catch (directError) {
      if (directError.name === 'AbortError') throw directError;
      // Direct failed, will try proxy
    }
    
    // If direct failed, use fastest proxy
    if (!data || data.error) {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
      
      try {
        const response = await fetch(proxyUrl, {
          signal: currentSearchController.signal,
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const proxyData = await response.json();
        
        // Handle proxy response format
        if (proxyData.contents) {
          data = JSON.parse(proxyData.contents);
        } else if (proxyData.data) {
          data = proxyData;
        } else {
          data = proxyData;
        }
        
        clearTimeout(timeoutId);
      } catch (proxyError) {
        if (proxyError.name === 'AbortError') throw proxyError;
        clearTimeout(timeoutId);
        throw new Error('Unable to connect to search service');
      }
    }
    
    // Check for API errors
    if (data && data.error) {
      throw new Error(data.error.message || 'API error');
    }

    if (data && data.data && data.data.length > 0) {
      // Cache the results
      searchCache.set(cacheKey, data.data);
      // Limit cache size
      if (searchCache.size > 50) {
        const firstKey = searchCache.keys().next().value;
        searchCache.delete(firstKey);
      }
      
      if (showSuggestions) {
        displaySuggestions(data.data);
      } else {
        displaySearchResults(data.data);
      }
    } else {
      if (!showSuggestions) {
        searchResults.innerHTML = '<div class="no-results">No results found. Try a different search term.</div>';
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      // Request was cancelled, ignore
      return;
    }
    console.error('Search error:', error);
    if (!showSuggestions) {
      searchResults.innerHTML = `<div class="error">Error: ${error.message || 'Search failed'}. Please try again.</div>`;
    }
  } finally {
    currentSearchController = null;
  }
}

// Display suggestions as user types
function displaySuggestions(tracks) {
  if (!tracks || tracks.length === 0) return;
  
  const suggestionsHTML = tracks.map(track => `
    <div class="suggestion-item" onclick="selectSuggestion('${track.title.replace(/'/g, "\\'")}', '${track.artist.name.replace(/'/g, "\\'")}')">
      <img src="${track.album.cover_small || track.album.cover_medium}" alt="${track.title}" class="suggestion-image">
      <div class="suggestion-info">
        <div class="suggestion-title">${track.title}</div>
        <div class="suggestion-artist">${track.artist.name}</div>
      </div>
    </div>
  `).join('');
  
  // Show suggestions above search results
  let suggestionsContainer = document.getElementById('suggestionsContainer');
  if (!suggestionsContainer) {
    suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'suggestionsContainer';
    suggestionsContainer.className = 'suggestions-container';
    searchInput.parentElement.appendChild(suggestionsContainer);
  }
  
  suggestionsContainer.innerHTML = suggestionsHTML;
  suggestionsContainer.style.display = 'block';
}

// Select a suggestion
window.selectSuggestion = function(title, artist) {
  searchInput.value = `${title} ${artist}`;
  document.getElementById('suggestionsContainer').style.display = 'none';
  performSearch(false);
}


function displaySearchResults(tracks) {
  searchResults.innerHTML = tracks.map(track => `
    <div class="search-result-item">
      <img src="${track.album.cover_medium}" alt="${track.title}" class="result-image">
      <div class="result-info">
        <div class="result-title">${track.title}</div>
        <div class="result-artist">${track.artist.name}</div>
        <div class="result-duration">${formatTime(track.duration)}</div>
      </div>
      <button class="add-btn" onclick="addToPlaylist(${JSON.stringify(track).replace(/"/g, '&quot;')})">
        ➕ Add
      </button>
    </div>
  `).join('');
}

// Add song to playlist
window.addToPlaylist = function(track) {
  // Check if already in playlist
  if (playlist.some(song => song.id === track.id)) {
    showNotification('Song already in playlist!');
    return;
  }

  const song = {
    id: track.id,
    title: track.title,
    artist: track.artist.name,
    album: track.album.title,
    cover: track.album.cover_medium || track.album.cover_big || track.album.cover,
    duration: track.duration,
    preview: track.preview, // 30-second preview from Deezer
    link: track.link, // Deezer link
    // Try to get full track - Deezer API doesn't provide full audio, but we can try YouTube
    fullTrack: null // Will be populated if we find a full version
  };
  
  // Try to find full track on YouTube (for full-length playback)
  try {
    // This will be handled when playing - we'll search YouTube for the full track
    song.youtubeSearch = `${track.title} ${track.artist.name}`;
  } catch (e) {
    console.log('Could not set up YouTube search');
  }

  playlist.push(song);
  updatePlaylist();
  showNotification(`Added "${song.title}" to playlist!`);
  
  // Clear search if desired
  // searchInput.value = '';
  // searchResults.innerHTML = '';
}

// Remove song from playlist
function removeFromPlaylist(index) {
  playlist.splice(index, 1);
  if (currentIndex >= playlist.length) {
    currentIndex = Math.max(0, playlist.length - 1);
  }
  updatePlaylist();
  if (playlist.length > 0) {
    updateActiveSong(currentIndex);
  } else {
    stopPlayback();
  }
}

// Update playlist UI
function updatePlaylist() {
  songCount.textContent = `${playlist.length} ${playlist.length === 1 ? 'Song' : 'Songs'}`;
  
  // Update cards
  cardsContainer.innerHTML = '';
  radioInputs.innerHTML = '';
  
  if (playlist.length === 0) {
    playerContent.innerHTML = `
      <div class="empty-playlist">
        <p>Your playlist is empty</p>
        <p class="empty-subtitle">Search for songs to get started!</p>
      </div>
    `;
    controlsContainer.style.display = 'none';
    extraControls.style.display = 'none';
    return;
  }

  controlsContainer.style.display = 'flex';
  extraControls.style.display = 'flex';

  // Generate radio inputs and cards
  playlist.forEach((song, index) => {
    // Radio input
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'slider';
    radio.id = `item-${index + 1}`;
    if (index === currentIndex) radio.checked = true;
    radioInputs.appendChild(radio);

    // Card
    const card = document.createElement('div');
    card.className = 'card';
    card.id = `song-${index + 1}`;
    card.innerHTML = `<img src="${song.cover}" alt="${song.title}" crossorigin="anonymous">`;
    cardsContainer.appendChild(card);
  });

  // Generate player content
  playerContent.innerHTML = playlist.map((song, index) => `
    <div class="song-info ${index === currentIndex ? 'active' : ''}" data-index="${index}">
      <div class="title">${song.title}</div>
      <div class="song-details">
        <span class="artist">${song.artist}</span>
        <span class="duration">${formatTime(song.duration)}</span>
      </div>
      <div class="time-indicator">
        <span class="elapsed">0:00</span>
        <span class="remaining">${formatTime(song.duration)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress" style="width: 0%"></div>
      </div>
      <button class="remove-btn" onclick="removeFromPlaylist(${index})" title="Remove from playlist">✕</button>
    </div>
  `).join('');

  // Update slider CSS for dynamic number of items
  updateSliderCSS();
  
  // Preload colors and apply theme
  if (playlist.length > 0) {
    preloadCardColors();
    updateActiveSong(currentIndex);
  }
}

// Update slider CSS for dynamic playlist
function updateSliderCSS() {
  const style = document.getElementById('dynamicSliderStyle') || document.createElement('style');
  style.id = 'dynamicSliderStyle';
  
  let css = '';
  playlist.forEach((_, index) => {
    const current = index + 1;
    const prev = index === 0 ? playlist.length : index;
    const next = index === playlist.length - 1 ? 1 : index + 2;
    
    css += `
      #item-${current}:checked ~ .cards #song-${prev} {
        transform: translateX(-45%) scale(0.75) rotateY(15deg);
        opacity: 0.3;
        z-index: 0;
      }
      #item-${current}:checked ~ .cards #song-${next} {
        transform: translateX(45%) scale(0.75) rotateY(-15deg);
        opacity: 0.3;
        z-index: 0;
      }
      #item-${current}:checked ~ .cards #song-${current} {
        transform: translateX(0) scale(1) rotateY(0deg);
        opacity: 1;
        z-index: 1;
      }
    `;
  });
  
  style.textContent = css;
  if (!document.getElementById('dynamicSliderStyle')) {
    document.head.appendChild(style);
  }
}

// Audio playback functions
function playSong(index) {
  if (index < 0 || index >= playlist.length) return;
  
  const song = playlist[index];
  currentIndex = index;
  
  // Update UI
  updateActiveSong(index);
  
  // Try to play full track via YouTube, fallback to preview
  // Note: For full-length playback, we'd need YouTube API or similar service
  // For now, we'll use the preview and show a message
  if (song.preview) {
    audioPlayer.src = song.preview;
    audioPlayer.load();
    audioPlayer.play().catch(err => {
      console.error('Playback error:', err);
      showNotification('Preview not available. Some songs only have 30-second previews.');
    });
    
    // Show notification about preview length
    if (song.duration > 30) {
      showNotification('Playing 30-second preview. Full tracks require premium API access.');
    }
  } else {
    showNotification('Audio preview not available for this song.');
  }
  
  isPaused = false;
  pauseButton.textContent = '▐▐';
  startProgressTracking();
}

function pausePlayback() {
  audioPlayer.pause();
  isPaused = true;
  pauseButton.textContent = '►';
  if (progressInterval) {
    cancelAnimationFrame(progressInterval);
    progressInterval = null;
  }
}

function resumePlayback() {
  audioPlayer.play();
  isPaused = false;
  pauseButton.textContent = '▐▐';
  startProgressTracking();
}

function stopPlayback() {
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  isPaused = false;
  if (progressInterval) {
    cancelAnimationFrame(progressInterval);
    progressInterval = null;
  }
  const progressEl = document.querySelector('.song-info.active .progress');
  if (progressEl) {
    progressEl.style.width = '0%';
  }
}

function startProgressTracking() {
  // Cancel any existing animation frame
  if (progressInterval) {
    cancelAnimationFrame(progressInterval);
    progressInterval = null;
  }
  
  const activeSongInfo = document.querySelector('.song-info.active');
  if (!activeSongInfo) return;
  
  const progressEl = activeSongInfo.querySelector('.progress');
  const elapsedSpan = activeSongInfo.querySelector('.elapsed');
  const remainingSpan = activeSongInfo.querySelector('.remaining');
  const song = playlist[currentIndex];
  
  // Use requestAnimationFrame for smoother updates
  let lastUpdate = 0;
  const updateProgress = (timestamp) => {
    if (timestamp - lastUpdate >= 100) { // Update every 100ms
      if (audioPlayer.readyState >= 2 && !isPaused) {
        const current = audioPlayer.currentTime;
        const duration = audioPlayer.duration || song.duration;
        const progress = (current / duration) * 100;
        
        if (progressEl) progressEl.style.width = progress + '%';
        if (elapsedSpan) elapsedSpan.textContent = formatTime(current);
        if (remainingSpan) remainingSpan.textContent = formatTime(Math.max(0, duration - current));
        
        // Auto-advance when preview ends (30 seconds)
        if (current >= duration - 0.5) {
          nextSong();
          return;
        }
      }
      lastUpdate = timestamp;
    }
    if (!isPaused) {
      progressInterval = requestAnimationFrame(updateProgress);
    }
  };
  
  progressInterval = requestAnimationFrame(updateProgress);
}

// Player controls
prevButton.addEventListener('click', () => {
  if (playlist.length === 0) return;
  prevSong();
});

nextButton.addEventListener('click', () => {
  if (playlist.length === 0) return;
  nextSong();
});

pauseButton.addEventListener('click', () => {
  if (playlist.length === 0) return;
  if (isPaused) {
    resumePlayback();
  } else {
    pausePlayback();
  }
});

favoriteButton.addEventListener('click', function() {
  this.classList.toggle('favorited');
});

function prevSong() {
  if (playlist.length === 0) return;
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  playSong(currentIndex);
}

function nextSong() {
  if (playlist.length === 0) return;
  currentIndex = (currentIndex + 1) % playlist.length;
  playSong(currentIndex);
}

function updateActiveSong(index) {
  // Update radio buttons
  const radios = document.querySelectorAll('input[name="slider"]');
  radios.forEach((radio, i) => {
    radio.checked = (i === index);
  });
  
  // Update song info display
  const songInfos = document.querySelectorAll('.song-info');
  songInfos.forEach((info, i) => {
    if (i === index) {
      info.classList.add('active');
    } else {
      info.classList.remove('active');
    }
  });
  
  // Apply theme
  const card = document.getElementById(`song-${index + 1}`);
  if (card) {
    applySoftTheme(card);
  }
}

// Helper functions
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Color cache for performance
const colorCache = new Map();

// Color theming functions - optimized
function preloadCardColors() {
  const cards = document.querySelectorAll('.card');
  let cardsLoaded = 0;
  const totalCards = cards.length;

  cards.forEach((card, index) => {
    const img = card.querySelector('img');
    if (!img) {
      cardsLoaded++;
      if (cardsLoaded === totalCards && playlist.length > 0) {
        updateActiveSong(currentIndex);
      }
      return;
    }

    const imgSrc = img.src;
    
    // Check cache first
    if (colorCache.has(imgSrc)) {
      const cached = colorCache.get(imgSrc);
      card.dataset.avgR = cached.avgR;
      card.dataset.avgG = cached.avgG;
      card.dataset.avgB = cached.avgB;
      card.dataset.darkR = cached.darkR;
      card.dataset.darkG = cached.darkG;
      card.dataset.darkB = cached.darkB;
      card.style.backgroundColor = `rgb(${cached.avgR}, ${cached.avgG}, ${cached.avgB})`;
      card.style.borderColor = `rgba(${cached.darkR}, ${cached.darkG}, ${cached.darkB}, 0.5)`;
      
      cardsLoaded++;
      if (cardsLoaded === totalCards && playlist.length > 0) {
        updateActiveSong(currentIndex);
      }
      return;
    }

    // Use smaller canvas for faster processing
    getAverageColor(img, (ar, ag, ab) => {
      const [dr, dg, db] = shiftLightness(ar, ag, ab, -0.3);
      
      // Cache the colors
      colorCache.set(imgSrc, { avgR: ar, avgG: ag, avgB: ab, darkR: dr, darkG: dg, darkB: db });
      
      card.dataset.avgR = ar;
      card.dataset.avgG = ag;
      card.dataset.avgB = ab;
      card.dataset.darkR = dr;
      card.dataset.darkG = dg;
      card.dataset.darkB = db;

      card.style.backgroundColor = `rgb(${ar}, ${ag}, ${ab})`;
      card.style.borderColor = `rgba(${dr}, ${dg}, ${db}, 0.5)`;

      cardsLoaded++;
      if (cardsLoaded === totalCards && playlist.length > 0) {
        updateActiveSong(currentIndex);
      }
    }, 50); // Smaller sample size for speed
  });
}

function applySoftTheme(card) {
  const ar = parseInt(card.dataset.avgR || 200);
  const ag = parseInt(card.dataset.avgG || 200);
  const ab = parseInt(card.dataset.avgB || 200);

  const dr = parseInt(card.dataset.darkR || 70);
  const dg = parseInt(card.dataset.darkG || 70);
  const db = parseInt(card.dataset.darkB || 70);

  // Get the current song's cover image
  const currentSong = playlist[currentIndex];
  const coverImage = currentSong ? (currentSong.cover || currentSong.album?.cover_big || currentSong.album?.cover_medium) : null;

  // Use requestAnimationFrame for smooth transitions
  requestAnimationFrame(() => {
    const container = document.querySelector('.container');
    const body = document.querySelector('body');
    const player = document.querySelector('.player');

    // Set background image with overlay
    if (coverImage) {
      body.style.backgroundImage = `url(${coverImage})`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundAttachment = 'fixed';
    }

    const [lr1, lg1, lb1] = shiftLightness(ar, ag, ab, 0.3);
    const [lr2, lg2, lb2] = shiftLightness(ar, ag, ab, 0.1);
    
    // Add overlay gradient on top of background image
    body.style.background = coverImage 
      ? `linear-gradient(135deg, rgba(${lr1},${lg1},${lb1}, 0.85) 0%, rgba(${lr2},${lg2},${lb2}, 0.9) 100%), url(${coverImage})`
      : `linear-gradient(135deg, rgb(${lr1},${lg1},${lb1}) 0%, rgb(${lr2},${lg2},${lb2}) 100%)`;
    body.style.backgroundSize = coverImage ? 'cover, cover' : 'cover';
    body.style.backgroundPosition = 'center, center';
    body.style.backgroundAttachment = 'fixed, fixed';

    const [cr, cg, cb] = shiftLightness(ar, ag, ab, 0.5);
    container.style.backgroundColor = `rgba(${cr},${cg},${cb}, 0.15)`;
    container.style.borderColor = `rgba(${dr}, ${dg}, ${db}, 0.2)`;

    const [pr, pg, pb] = shiftLightness(ar, ag, ab, 0.3);
    player.style.backgroundColor = `rgba(${pr}, ${pg}, ${pb}, 0.2)`;
    player.style.borderColor = `rgba(${dr}, ${dg}, ${db}, 0.2)`;

    const leftH1 = document.querySelector('.left-side h1');
    const leftP = document.querySelector('.left-side p');
    leftH1.style.background = `linear-gradient(135deg, rgb(${dr}, ${dg}, ${db}) 0%, rgb(${Math.min(dr + 30, 255)}, ${Math.min(dg + 30, 255)}, ${Math.min(db + 30, 255)}) 100%)`;
    leftH1.style.webkitBackgroundClip = 'text';
    leftH1.style.webkitTextFillColor = 'transparent';
    leftH1.style.backgroundClip = 'text';
    
    leftP.style.color = `rgba(${dr}, ${dg}, ${db}, 0.9)`;

    const progress = document.querySelectorAll('.progress');
    progress.forEach((fill) => {
      fill.style.background = `linear-gradient(90deg, rgb(${dr}, ${dg}, ${db}) 0%, rgb(${Math.min(dr + 40, 255)}, ${Math.min(dg + 40, 255)}, ${Math.min(db + 40, 255)}) 100%)`;
    });

    const titles = document.querySelectorAll('.song-info .title');
    const details = document.querySelectorAll('.song-details');
    const timeIndicators = document.querySelectorAll('.time-indicator');
    
    titles.forEach(title => {
      title.style.color = `rgb(${dr}, ${dg}, ${db})`;
    });
    
    details.forEach(detail => {
      detail.style.color = `rgba(${dr}, ${dg}, ${db}, 0.8)`;
    });
    
    timeIndicators.forEach(indicator => {
      indicator.style.color = `rgba(${dr}, ${dg}, ${db}, 0.7)`;
    });

    const controls = document.querySelectorAll('.controls button');
    controls.forEach((btn) => {
      btn.style.color = `rgb(${dr}, ${dg}, ${db})`;
      btn.style.borderColor = `rgba(${dr}, ${dg}, ${db}, 0.3)`;
    });
  });
}

function shiftLightness(r, g, b, factor) {
  if (factor < -1) factor = -1;
  if (factor > 1) factor = 1;

  let { h, s, l } = rgbToHsl(r, g, b);
  l = l + factor * l;
  if (l < 0) l = 0;
  if (l > 1) l = 1;

  let { rr, gg, bb } = hslToRgb(h, s, l);
  return [Math.round(rr), Math.round(gg), Math.round(bb)];
}

function getAverageColor(img, cb, sampleSize = 100) {
  // Use cached if available
  if (colorCache.has(img.src)) {
    const cached = colorCache.get(img.src);
    cb(cached.avgR, cached.avgG, cached.avgB);
    return;
  }

  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const tempImg = new Image();
  tempImg.crossOrigin = 'Anonymous';
  tempImg.src = img.src;

  tempImg.onload = function() {
    // Use smaller canvas for faster processing
    const maxSize = sampleSize;
    const scale = Math.min(maxSize / tempImg.width, maxSize / tempImg.height, 1);
    c.width = Math.floor(tempImg.width * scale);
    c.height = Math.floor(tempImg.height * scale);
    
    ctx.drawImage(tempImg, 0, 0, c.width, c.height);
    try {
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let rSum = 0, gSum = 0, bSum = 0;
      const totalPixels = data.length / 4;

      // Sample every 4th pixel for even faster processing
      for (let i = 0; i < data.length; i += 16) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }

      const sampledPixels = totalPixels / 4;
      cb(Math.floor(rSum / sampledPixels), Math.floor(gSum / sampledPixels), Math.floor(bSum / sampledPixels));
    } catch {
      cb(200, 200, 200);
    }
  };

  tempImg.onerror = function() {
    cb(200, 200, 200);
  };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  let l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { rr: r * 255, gg: g * 255, bb: b * 255 };
}

// Make removeFromPlaylist available globally
window.removeFromPlaylist = removeFromPlaylist;
