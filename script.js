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

// Search functionality
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch();
  }
});

// Real-time search (debounced)
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  if (query.length > 2) {
    searchTimeout = setTimeout(() => performSearch(), 500);
  } else {
    searchResults.innerHTML = '';
  }
});

async function performSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    searchResults.innerHTML = '';
    return;
  }

  searchResults.innerHTML = '<div class="loading">Searching...</div>';

  try {
    // Using Deezer API (free, no auth required for search)
    const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=10`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      displaySearchResults(data.data);
    } else {
      searchResults.innerHTML = '<div class="no-results">No results found</div>';
    }
  } catch (error) {
    console.error('Search error:', error);
    searchResults.innerHTML = '<div class="error">Error searching. Please try again.</div>';
  }
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
    preview: track.preview, // 30-second preview
    link: track.link // Deezer link (for full playback via iframe or external)
  };

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
  
  // Load and play audio
  if (song.preview) {
    audioPlayer.src = song.preview;
    audioPlayer.load();
    audioPlayer.play().catch(err => {
      console.error('Playback error:', err);
      showNotification('Preview not available. Some songs only have 30-second previews.');
    });
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
  clearInterval(progressInterval);
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
  clearInterval(progressInterval);
  const progressEl = document.querySelector('.song-info.active .progress');
  if (progressEl) {
    progressEl.style.width = '0%';
  }
}

function startProgressTracking() {
  clearInterval(progressInterval);
  
  const activeSongInfo = document.querySelector('.song-info.active');
  if (!activeSongInfo) return;
  
  const progressEl = activeSongInfo.querySelector('.progress');
  const elapsedSpan = activeSongInfo.querySelector('.elapsed');
  const remainingSpan = activeSongInfo.querySelector('.remaining');
  const song = playlist[currentIndex];
  
  progressInterval = setInterval(() => {
    if (audioPlayer.readyState >= 2) {
      const current = audioPlayer.currentTime;
      const duration = audioPlayer.duration || song.duration;
      const progress = (current / duration) * 100;
      
      progressEl.style.width = progress + '%';
      elapsedSpan.textContent = formatTime(current);
      remainingSpan.textContent = formatTime(Math.max(0, duration - current));
      
      // Auto-advance when preview ends (30 seconds)
      if (current >= duration - 0.5) {
        nextSong();
      }
    }
  }, 100);
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

// Color theming functions
function preloadCardColors() {
  const cards = document.querySelectorAll('.card');
  let cardsLoaded = 0;

  cards.forEach((card) => {
    const img = card.querySelector('img');
    if (!img) return;

    getAverageColor(img, (ar, ag, ab) => {
      card.dataset.avgR = ar;
      card.dataset.avgG = ag;
      card.dataset.avgB = ab;

      const [dr, dg, db] = shiftLightness(ar, ag, ab, -0.3);
      card.dataset.darkR = dr;
      card.dataset.darkG = dg;
      card.dataset.darkB = db;

      card.style.backgroundColor = `rgb(${ar}, ${ag}, ${ab})`;
      card.style.borderColor = `rgba(${dr}, ${dg}, ${db}, 0.5)`;

      cardsLoaded++;
      if (cardsLoaded === cards.length && playlist.length > 0) {
        updateActiveSong(currentIndex);
      }
    });
  });
}

function applySoftTheme(card) {
  const ar = parseInt(card.dataset.avgR || 200);
  const ag = parseInt(card.dataset.avgG || 200);
  const ab = parseInt(card.dataset.avgB || 200);

  const dr = parseInt(card.dataset.darkR || 70);
  const dg = parseInt(card.dataset.darkG || 70);
  const db = parseInt(card.dataset.darkB || 70);

  const container = document.querySelector('.container');
  const body = document.querySelector('body');
  const player = document.querySelector('.player');

  const [lr1, lg1, lb1] = shiftLightness(ar, ag, ab, 0.4);
  const [lr2, lg2, lb2] = shiftLightness(ar, ag, ab, 0.2);
  body.style.background = `linear-gradient(135deg, rgb(${lr1},${lg1},${lb1}) 0%, rgb(${lr2},${lg2},${lb2}) 100%)`;

  const [cr, cg, cb] = shiftLightness(ar, ag, ab, 0.6);
  container.style.backgroundColor = `rgba(${cr},${cg},${cb}, 0.95)`;
  container.style.borderColor = `rgba(${dr}, ${dg}, ${db}, 0.3)`;

  const [pr, pg, pb] = shiftLightness(ar, ag, ab, 0.5);
  player.style.backgroundColor = `rgba(${pr}, ${pg}, ${pb}, 0.7)`;
  player.style.borderColor = `rgba(${dr}, ${dg}, ${db}, 0.3)`;

  const leftH1 = document.querySelector('.left-side h1');
  const leftP = document.querySelector('.left-side p');
  leftH1.style.background = `linear-gradient(135deg, rgb(${dr}, ${dg}, ${db}) 0%, rgb(${Math.min(dr + 30, 255)}, ${Math.min(dg + 30, 255)}, ${Math.min(db + 30, 255)}) 100%)`;
  leftH1.style.webkitBackgroundClip = 'text';
  leftH1.style.webkitTextFillColor = 'transparent';
  leftH1.style.backgroundClip = 'text';
  
  leftP.style.color = `rgba(${dr}, ${dg}, ${db}, 0.8)`;

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
    detail.style.color = `rgba(${dr}, ${dg}, ${db}, 0.7)`;
  });
  
  timeIndicators.forEach(indicator => {
    indicator.style.color = `rgba(${dr}, ${dg}, ${db}, 0.6)`;
  });

  const controls = document.querySelectorAll('.controls button');
  controls.forEach((btn) => {
    btn.style.color = `rgb(${dr}, ${dg}, ${db})`;
    btn.style.borderColor = `rgba(${dr}, ${dg}, ${db}, 0.3)`;
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

function getAverageColor(img, cb) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const tempImg = new Image();
  tempImg.crossOrigin = 'Anonymous';
  tempImg.src = img.src;

  tempImg.onload = function() {
    c.width = tempImg.width;
    c.height = tempImg.height;
    ctx.drawImage(tempImg, 0, 0);
    try {
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let rSum = 0, gSum = 0, bSum = 0;
      const totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }

      cb(Math.floor(rSum / totalPixels), Math.floor(gSum / totalPixels), Math.floor(bSum / totalPixels));
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
