# Mufl - Social Music Platform

A comprehensive social music platform featuring Rooms and Threads experiences, built with React and modern web technologies.

## 🎵 Features

### Rooms
- Interactive music rooms by genre (Hip-Hop, Indie, Aesthetic Rap, etc.)
- Real-time music discovery and sharing
- Genre-based community spaces

### Threads
- Music-focused social conversations
- Thread-based discussions around artists and songs
- Enhanced audio rating system

### Additional Features
- Apple Music API integration
- Spotify API integration
- Last.fm integration
- Interactive pitch deck viewer
- Responsive design

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- API keys for:
  - Spotify (Client ID & Secret)
  - Apple Music (Developer Token)
  - Last.fm (API Key & Shared Secret)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Website
```

2. Set up environment variables:

For Rooms app:
```bash
cd Rooms/Mufl
cp .env.example .env
# Edit .env with your actual API keys
```

For Threads app:
```bash
cd Threads/muffle-threads/src/backend
cp .env.example .env
# Edit .env with your actual API keys
```

3. Install dependencies:

For Rooms:
```bash
cd Rooms/Mufl
npm install
```

For Threads:
```bash
cd Threads/muffle-threads
npm install
```

### Running the Applications

#### Main Landing Page
Open `index.html` in your browser to access the main investor portal and navigation.

#### Rooms App
```bash
cd Rooms/Mufl
npm start
```

#### Threads App
```bash
cd Threads/muffle-threads
npm run dev
```

## 📁 Project Structure

```
Website/
├── index.html              # Main landing page
├── assets/                 # Videos, images, pitch deck
├── Rooms/Mufl/            # Rooms React application
├── Threads/muffle-threads/ # Threads React application
└── README.md
```

## 🔑 API Configuration

### Required Environment Variables

#### Rooms App (.env)
```
REACT_APP_APPLE_DEVELOPER_TOKEN=your_token
REACT_APP_APPLE_API_BASE_URL=https://api.music.apple.com/v1/catalog/us
REACT_APP_SPOTIFY_CLIENT_ID=your_client_id
REACT_APP_SPOTIFY_CLIENT_SECRET=your_client_secret
REACT_APP_LASTFM_API_KEY=your_api_key
REACT_APP_LASTFM_SHARED_SECRET=your_shared_secret
```

#### Threads App (.env)
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
APPLE_DEVELOPER_TOKEN=your_token
APPLE_API_BASE_URL=https://api.music.apple.com/v1/catalog/us
```

### Getting API Keys

1. **Spotify**: Register at [Spotify Developer Dashboard](https://developer.spotify.com/)
2. **Apple Music**: Register at [Apple Developer Portal](https://developer.apple.com/)
3. **Last.fm**: Register at [Last.fm API](https://www.last.fm/api/account/create)

## 🛡️ Security

- All sensitive API keys are stored in environment variables
- `.env` files are gitignored to prevent accidental commits
- Production builds exclude development logging

## 📱 Technologies Used

- **Frontend**: React, HTML5, CSS3, JavaScript
- **APIs**: Spotify Web API, Apple Music API, Last.fm API
- **Build Tools**: Create React App, Vite
- **Styling**: Tailwind CSS, Custom CSS

## 🎯 Demo

The application includes:
- Interactive prototype launches from the main page
- Video demonstrations of key features
- Comprehensive pitch deck viewer
- Mobile-responsive design

## 📄 License

This project is proprietary. All rights reserved.

## 👥 Contact

For questions about this project, please reach out through the appropriate channels.