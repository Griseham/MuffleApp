# Muffle Platform

A comprehensive social music platform featuring two main applications:

## Applications

### 🎵 Mufl (Rooms)
Located in `apps/mufl/`
- Interactive music rooms and social discovery
- React application with Tailwind CSS
- Run with: `npm run dev:mufl`

### 🧵 Threads  
Located in `apps/threads/`
- Music discussion threads and community features
- React + Vite application
- Run with: `npm run dev:threads`

## Shared Resources
- `shared/assets/` - Common images, videos, and media files
- `server.js` - Main backend server
- `threadsRoutes.cjs` - API routes for Threads functionality

## Development

```bash
# Install dependencies
npm install

# Run individual apps
npm run dev:mufl     # Start Mufl (Rooms) app
npm run dev:threads  # Start Threads app

# Build apps
npm run build:mufl
npm run build:threads

# Start backend server
npm start
```

## Structure
```
├── apps/
│   ├── mufl/          # Rooms application
│   └── threads/       # Threads application
├── shared/
│   └── assets/        # Shared media files
├── server.js          # Backend server
└── package.json       # Main project config
```

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

For Mufl app:
```bash
cd apps/mufl
cp .env.example .env
# Edit .env with your actual API keys
```

For Threads app:
```bash
cd apps/threads/src/backend
cp .env.example .env
# Edit .env with your actual API keys
```

3. Install dependencies:
```bash
npm install
cd apps/mufl && npm install
cd ../threads && npm install
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