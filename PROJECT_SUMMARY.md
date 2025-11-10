# Playlist Slider - Interactive Music Player

## Project Overview
A modern, responsive web application that allows users to search for songs, build custom playlists, and enjoy an immersive music playback experience with dynamic visual theming. The app features a beautiful glassmorphism design with real-time color adaptation based on album artwork.

## Live Demo
🔗 [View on GitHub Pages](https://Sentan1.github.io/Spotify/)

## Technologies Used
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **APIs**: Deezer API (for song search and metadata)
- **Design**: Glassmorphism, CSS Animations, Dynamic Theming
- **Deployment**: GitHub Pages with GitHub Actions CI/CD

## Key Features

### 🎵 Music Search & Discovery
- Real-time song search with autocomplete suggestions
- Search results display with album art, artist, and duration
- Debounced input for optimal performance
- Search result caching for instant repeated searches

### 📋 Dynamic Playlist Management
- Add songs to playlist with one click
- Remove songs from playlist
- Visual card slider with 3D perspective effects
- Real-time playlist counter

### 🎨 Dynamic Visual Theming
- Background adapts to currently playing song's album cover
- Color palette extracted from album artwork
- Smooth color transitions throughout the UI
- Glassmorphism design with backdrop blur effects

### 🎮 Audio Playback
- HTML5 audio player integration
- Play/pause controls
- Previous/next song navigation
- Real-time progress tracking
- Auto-advance to next song
- Time indicators (elapsed/remaining)

### 💎 Modern UI/UX
- Fully responsive design (mobile, tablet, desktop)
- Transparent glass panels with blur effects
- Smooth animations and transitions
- Dark theme with cyan/blue/purple gradient accents
- Intuitive user interface

## Technical Highlights

### Performance Optimizations
- **Request Cancellation**: Uses AbortController to cancel overlapping API requests
- **Result Caching**: Implements Map-based caching for instant repeated searches
- **Color Caching**: Caches extracted colors from album art to avoid recalculation
- **Optimized Canvas Processing**: Uses smaller canvas size and pixel sampling for faster color extraction
- **requestAnimationFrame**: Smooth progress bar updates instead of setInterval
- **Debounced Search**: 250ms debounce for optimal balance between responsiveness and performance

### Advanced Features
- **PKCE Flow Ready**: Architecture supports OAuth 2.0 with PKCE for future premium API integration
- **CORS Handling**: Multiple proxy fallbacks for reliable API access
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Dynamic CSS Generation**: Generates CSS rules dynamically for variable-length playlists

### Design Patterns
- **Modular Code Structure**: Separated concerns (search, playback, theming)
- **Event-Driven Architecture**: Efficient event listeners with proper cleanup
- **State Management**: Centralized state management for playlist and playback
- **Progressive Enhancement**: Works without JavaScript for basic structure

## Challenges Overcome

1. **CORS Restrictions**: Implemented multiple proxy fallbacks to bypass browser CORS limitations
2. **Performance**: Optimized color extraction and search functionality for smooth user experience
3. **Dynamic Theming**: Developed algorithm to extract dominant colors from album art and apply them throughout the UI
4. **Real-time Updates**: Implemented efficient progress tracking without performance degradation
5. **Search Optimization**: Added caching and request cancellation to handle rapid user input

## Future Enhancements
- Integration with YouTube API for full-length song playback
- Spotify Web API integration for premium features
- User authentication and saved playlists
- Social sharing features
- Playlist export/import functionality

## Project Statistics
- **Lines of Code**: ~800+ (JavaScript + CSS)
- **API Integrations**: 1 (Deezer API)
- **Browser Compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Responsive Breakpoints**: 3 (Desktop, Tablet, Mobile)

## Development Process
1. Initial prototype with static playlist
2. Integration of Deezer API for real song data
3. Implementation of search functionality
4. Dynamic playlist management
5. Performance optimization and caching
6. UI/UX enhancements with glassmorphism
7. Deployment to GitHub Pages

## Skills Demonstrated
- Frontend Development (HTML, CSS, JavaScript)
- API Integration and CORS handling
- Performance Optimization
- Responsive Web Design
- UI/UX Design
- Git Version Control
- CI/CD with GitHub Actions
- Problem Solving and Debugging

---

**Built with ❤️ using modern web technologies**

