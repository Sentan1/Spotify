# Spotify Study Companion

A beautiful, aesthetic Spotify-like music player designed as a study companion. This app sits on the side of your screen while you work, providing a minimal yet feature-rich music experience with access to **all of Spotify's millions of songs**.

## Features

- 🎵 **Full Music Player Controls**
  - Play/Pause
  - Skip Next/Previous
  - Progress bar with seek functionality
  - Volume control with mute

- 🎨 **Beautiful Aesthetic Design**
  - Blurred album art background
  - Glassmorphism UI elements
  - Smooth animations and transitions
  - Modern, minimal interface

- 📚 **Study-Friendly**
  - Compact sidebar layout
  - Non-intrusive design
  - Track list toggle
  - Clean, distraction-free interface

- 🔍 **Full Spotify Integration**
  - Search any song from Spotify's library
  - Access to millions of tracks
  - Your top tracks
  - Real-time search results

## Getting Started

### Prerequisites

1. Create a Spotify Developer account at [developer.spotify.com](https://developer.spotify.com)
2. Create a new app in the Spotify Dashboard
3. Get your Client ID
4. Add `http://localhost:5173` to your app's Redirect URIs

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173
```

4. Start the development server:
```bash
npm run dev
```

5. The app will open at `http://localhost:5173`
6. Click "Login with Spotify" to authenticate
7. Start searching and playing any song from Spotify!

### Build

```bash
npm run build
```

## Deploy to GitHub Pages

The app is configured for automatic deployment to GitHub Pages. Follow these steps:

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### 2. Set up GitHub Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `VITE_SPOTIFY_CLIENT_ID`: Your Spotify Client ID
   - `VITE_SPOTIFY_REDIRECT_URI`: Your GitHub Pages URL (e.g., `https://username.github.io/Spotify/`)

### 3. Update Spotify App Settings

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Edit your app
3. Add your GitHub Pages URL to **Redirect URIs**:
   - `https://username.github.io/Spotify/` (replace `username` with your GitHub username)

### 4. Deploy

The app will automatically deploy when you push to the `main` branch. You can also manually trigger deployment:

1. Go to **Actions** tab in your repository
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**

Your app will be live at: `https://username.github.io/Spotify/`

### Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
npm install -g gh-pages
npm run deploy
```

Then enable GitHub Pages in repository settings and select the `gh-pages` branch.

## Usage

1. **Login**: Click "Login with Spotify" to connect your account
2. **Search**: Click the "Search Songs" button to find any track
3. **Play**: Use the play/pause button to control playback
4. **Navigate**: Use skip buttons to move between tracks
5. **Playlist**: Toggle the playlist view to see all tracks
6. **Volume**: Adjust volume using the slider

## Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in app details:
   - App name: "Spotify Study Companion"
   - App description: "Study companion music player"
   - Redirect URI: `http://localhost:5173`
4. Copy your Client ID
5. Add it to your `.env` file

## Technologies

- React 18
- Vite
- Tailwind CSS
- Lucide React (Icons)
- Spotify Web API

## Notes

- The app uses Spotify's preview URLs for audio playback (30-second previews)
- For full playback, you would need Spotify Premium and the Web Playback SDK
- Some tracks may not have preview URLs available

## License

MIT

