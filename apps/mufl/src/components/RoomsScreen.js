// RoomsScreen.js - Simplified component with disabled recents tab

import React, { useState, useCallback, useEffect } from 'react';
import './RoomsScreen.css';
import './SelectionScreen.css';
import axios from 'axios';

import RadioTuner from './RadioTuner';
import RoomLoader from './RoomLoader';
import StationCard from './StationCard';
import { useEnhancedRoomFeed } from '../hooks/useEnhancedRoomFeed';
import { 
  formatNumber, 
  MIN_SIMILARITY, 
  MAX_SIMILARITY 
} from './radioUtils';
import InfoIconModal from './InfoIconModal';

// Set base URL for API requests
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// Tab component
const TabButton = ({ active, onClick, children, disabled = false }) => (
  <button
    className={`tab-button ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

// Loading progress component
const LoadingProgress = ({ loadingState }) => {
  const { initialLoad, similarArtists, roomGeneration, progress } = loadingState;
  
  if (initialLoad) {
    return (
      <div className="loading-progress">
        <div className="loading-progress-content">
          <div className="loading-spinner"></div>
          <h3>Setting up your radio stations...</h3>
          <div className="loading-steps">
            <div className={`loading-step ${similarArtists ? 'active' : ''}`}>
              Fetching similar artists from Last.fm
            </div>
            <div className="loading-step">
              Getting artist images from Apple Music
            </div>
            <div className="loading-step">
              Generating personalized radio stations
            </div>
          </div>
          {progress > 0 && (
            <div className="loading-progress-bar">
              <div 
                className="loading-progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
              <span className="loading-progress-text">{Math.round(progress)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (roomGeneration) {
    return (
      <div className="loading-progress simple">
        <div className="loading-spinner"></div>
        <p>Generating new stations...</p>
      </div>
    );
  }
  
  return null;
};

// Utility functions for generating fake room data
const generateRandomVolume = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomSimilarity = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomStationName = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};

// Generate trending rooms with Spotify artists
const generateTrendingRooms = async (count = 8) => {
  try {
    // Fetch popular artists from Spotify (using pop genre as trending)
    const res = await axios.get('/api/spotify/artists', { 
      params: { 
        genre: 'pop',
        limit: count * 6 // Get enough artists to fill multiple rooms with 6 each
      } 
    });
    
    const allArtists = res.data.filter(artist => 
      artist.image && artist.image !== 'fallback.jpg' && !artist.image.includes('/api/placeholder/')
    );
    
    const rooms = [];
    
    for (let i = 0; i < count; i++) {
      const volume = generateRandomVolume(600, 3300);
      const similarity = generateRandomSimilarity(-1000, 300);
      
      // Get 6 random artists for this room
      const roomArtists = allArtists
        .sort(() => 0.5 - Math.random())
        .slice(0, 6)
        .map((artist, idx) => ({
          ...artist,
          volume: Math.floor(Math.random() * 6) + 1,
          isSelected: false,
          count: 1
        }));
      
      rooms.push({
        id: `trending-${i}`,
        name: generateRandomStationName(), // Random 4-letter name
        volume,
        similarity,
        freqNumber: `${volume}.${Math.abs(similarity)}${similarity < 0 ? '-' : ''}`,
        artists: roomArtists,
        listeners: Math.floor(Math.random() * 10000) + 1000,
        minutes: [15, 30, 45, 60][Math.floor(Math.random() * 4)],
        userCount: Math.floor(Math.random() * 100) + 10,
        dominantGenre: 'Pop',
        showGenreBadge: true
      });
    }
    
    return rooms;
  } catch (error) {
    // Fallback to mock data
    return Array.from({ length: count }, (_, i) => ({
      id: `trending-${i}`,
      name: generateRandomStationName(),
      volume: generateRandomVolume(600, 3300),
      similarity: generateRandomSimilarity(-1000, 300),
      artists: Array.from({ length: 6 }, (_, j) => ({
        id: `trending-artist-${i}-${j}`,
        name: `Trending Artist ${j + 1}`,
        image: '/api/placeholder/200/200',
        volume: Math.floor(Math.random() * 6) + 1
      })),
      listeners: Math.floor(Math.random() * 10000) + 1000,
      minutes: 30,
      userCount: Math.floor(Math.random() * 100) + 10
    }));
  }
};

// Main RoomsScreen Component with enhanced similarity support and tabs
const RoomsScreen = ({ 
  selectedArtists = [], 
  onJoinRoom = () => {}, 
  onBack = () => {} 
}) => {
  // Single source of truth for all tuner state
  const [tuner, setTuner] = useState({
    volume: 1326,
    similarity: 80, // Default to 80 as per spec
    activeSection: 'volume'
  });

  // Tab state
  const [activeTab, setActiveTab] = useState('tuned'); // 'tuned', 'trending', 'recents' (disabled)
  const [trendingRooms, setTrendingRooms] = useState([]);
  const [tabLoading, setTabLoading] = useState({
    trending: false
  });

  // Use the enhanced hook to get rooms and manage data
  const { 
    rooms, 
    isLoading, 
    loadingState, 
    error, 
    currentSimilarity,
    handleSimilarityChange,
    handleVolumeChange,
    regenerateRooms,
    getSimilarityRangeInfo
  } = useEnhancedRoomFeed(selectedArtists);

  // State for selected room
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Auto-select target room when rooms change
  useEffect(() => {
    if (rooms.length > 0 && activeTab === 'tuned') {
      // Find the target room (the one with exact landed frequency)
      const targetRoom = rooms.find(room => room.isTargetRoom);
      if (targetRoom) {
        setSelectedRoom(targetRoom);
      } else {
        // If no target room, select the first one
        setSelectedRoom(rooms[0]);
      }
    } else {
      setSelectedRoom(null);
    }
  }, [rooms, activeTab]);
  
  // Handle tuner value changes
  const handleTunerChange = useCallback(payload => {
    setTuner(current => ({
      ...current,
      ...payload
    }));
    
    // Handle mode-specific changes only for tuned tab
    if (activeTab === 'tuned') {
      if (payload.activeSection === 'similarity' && payload.similarity !== undefined) {
        // In similarity mode, we also need to pass the landed frequency (volume)
        const landedVolume = payload.landedFreq;
        handleSimilarityChange(payload.similarity, landedVolume);
      } else if (payload.activeSection === 'volume' && payload.volume !== undefined) {
        // In volume mode, we need to pass the landed frequency (similarity)
        const landedSimilarity = payload.landedFreq;
        handleVolumeChange(payload.volume, landedSimilarity);
      }
    }
  }, [handleSimilarityChange, handleVolumeChange, activeTab]);

  // Handle tab changes
  const handleTabChange = useCallback(async (tab) => {
    if (tab === activeTab) return;
    if (tab === 'recents') return; // Recents tab is disabled
    
    setActiveTab(tab);
    
    // Load data for trending tab
    if (tab === 'trending' && trendingRooms.length === 0) {
      setTabLoading(prev => ({ ...prev, trending: true }));
      try {
        const trending = await generateTrendingRooms(8);
        setTrendingRooms(trending);
      } catch (error) {
      }
      setTabLoading(prev => ({ ...prev, trending: false }));
    }
  }, [activeTab, trendingRooms.length]);

  // NEW: Enhanced room joining with artist data
  const handleJoinRoom = useCallback((station) => {
    
    // Create comprehensive room data object
    const roomData = {
      id: station.id,
      name: station.name,
      volume: station.volume,
      similarity: station.similarity,
      artists: station.artists || [],
      listeners: station.listeners,
      userCount: station.userCount,
      dominantGenre: station.dominantGenre,
      freqNumber: station.freqNumber
    };
    
    // Pass the full room data to the parent component
    onJoinRoom(roomData);
  }, [onJoinRoom]);
  
  // Get range info for current similarity
  const rangeInfo = getSimilarityRangeInfo(currentSimilarity);

  // Get current rooms based on active tab
  const getCurrentRooms = () => {
    switch (activeTab) {
      case 'trending':
        return trendingRooms;
      default:
        return rooms;
    }
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'trending':
        return tabLoading.trending;
      default:
        return isLoading;
    }
  };

  // Show main loading screen if initial load
  if (loadingState.initialLoad) {
    return <RoomLoader isLoading={true} onBack={onBack} progress={loadingState.progress} />;
  }

  return (
    <div className="radio-rooms-container">
      <button className="back-button" onClick={onBack}>← Back</button>
      <div className="radio-info-button">
      <InfoIconModal
  title="Rooms"
  modalId="rooms-screen-modal"
  iconSize={32}         /* still large */
  showButtonText={false}
  steps={[
    {
      title: "Pick Artists",
      content: "Users pick artists in the previous screen and find rooms of users that made similar picks"
    },
    {
      title: "Room Cards",
      content: "In these rooms, users share 30 second song snippets from the Apple Music API and swipe on them. (Each listening to a different song)."
    },
    {
      title: "Infinite Rooms",
      content: "As you scroll down for more rooms, they will get more and more dissimilar to your picks, so you'll never run out of rooms, but your selected artists might not show up, just related artists to your picks. For this demo there are limited rooms."
    },
    {
      title: "Trending",
      content: "Find rooms by choosing artists or visit the Trending and Recents rooms tab. For this Demo, only the Tuned Stations tab will work."
    }
  ]}
/>
      </div>

      <div className={`tuner-container ${activeTab !== 'tuned' ? 'disabled' : ''}`}>
        <div className="tuner-wrapper">
          <RadioTuner 
            initialVolume={tuner.volume}
            initialSimilarity={tuner.similarity}
            onChange={handleTunerChange}
            rulerWidth={1600}
            disabled={activeTab !== 'tuned'}
          />
        </div>
      </div>
      
      {/* Show selected artists below the tuner */}
      {selectedArtists.length > 0 && (
        <div className={`selected-artists-container ${activeTab !== 'tuned' ? 'disabled' : ''}`}>
          <h2>Selected Artists</h2>
          <div className="selected-artists-list">
            {selectedArtists.map(artist => (
              <div key={artist.id} className="selected-artist-card">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="selected-artist-image"
                />
                <span className="selected-artist-name">{artist.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs-navigation">
          <TabButton 
            active={activeTab === 'tuned'} 
            onClick={() => handleTabChange('tuned')}
          >
            Tuned Stations
          </TabButton>
          <TabButton 
            active={activeTab === 'trending'} 
            onClick={() => handleTabChange('trending')}
          >
            Trending
          </TabButton>
          <TabButton 
            active={activeTab === 'recents'} 
            onClick={() => handleTabChange('recents')}
            disabled={true}
          >
            Recents
          </TabButton>
        </div>
      </div>

      {/* Show info messages only for tuned tab */}
      {activeTab === 'tuned' && (
        <>
          {/* Show landed volume info when in similarity mode */}
          {tuner.activeSection === 'similarity' && selectedRoom && (
            <div className="mode-info-message">
              <p>
                Tuned to similarity {currentSimilarity} 
                {selectedRoom.isTargetRoom && (
                  <span> • Landed on volume {selectedRoom.volume} • Selected station: {selectedRoom.name}</span>
                )}
              </p>
            </div>
          )}

          {/* Show landed similarity info when in volume mode */}
          {tuner.activeSection === 'volume' && selectedRoom && (
            <div className="mode-info-message">
              <p>
                Tuned to volume {tuner.volume} 
                {selectedRoom.isTargetRoom && (
                  <span> • Landed on similarity {selectedRoom.similarity} • Selected station: {selectedRoom.name}</span>
                )}
              </p>
            </div>
          )}
        </>
      )}

      {/* Error message */}
      {error && activeTab === 'tuned' && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={regenerateRooms} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      <div className="feed-section">
        {/* Loading indicator */}
        {getCurrentLoading() && <RoomLoader isLoading={true} />}
        
        <div className="stations-list">
          {getCurrentRooms().map((station, index) => (
            <StationCard
              key={station.id}
              station={station}
              onJoinRoom={handleJoinRoom}
              isCurrentStation={selectedRoom?.id === station.id && activeTab === 'tuned'}
              activeSection={tuner.activeSection}
              selectedArtists={selectedArtists}
              stationIndex={index}
              totalStations={getCurrentRooms().length}
              isInteractive={activeTab === 'tuned'}
            />
          ))}
          
          {!getCurrentLoading() && getCurrentRooms().length === 0 && !error && (
            <div className="no-stations-message">
              <p>
                {activeTab === 'tuned' 
                  ? "No stations found. Try adjusting the tuner or check your selection."
                  : `No ${activeTab} stations available.`
                }
              </p>
              {activeTab === 'tuned' && (
                <button 
                  className="retry-button"
                  onClick={regenerateRooms}
                >
                  Regenerate Stations
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomsScreen;