// RoomsScreen.js - Enhanced with Artist Selection Indicators and Count Badges

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import './RoomsScreen.css';
import './SelectionScreen.css';

import RadioTuner from './RadioTuner';
import RoomLoader from './RoomLoader';
import ArtistCarousel from './ArtistCarousel';
import { useEnhancedBandFeed } from '../hooks/bandFeed';
import { 
  formatNumber, 
  MIN_SIMILARITY, 
  MAX_SIMILARITY 
} from './radioUtils';

// Parse display number correctly
const parseDisplayNumber = (displayNumber) => {
  if (!displayNumber) return { volume: 0, similarity: 0 };
  
  const parts = displayNumber.split('.');
  const volume = parseInt(parts[0], 10);
  
  // Handle negative similarity (stored with - in the string)
  const simPart = parts[1] || '0';
  const isNegative = simPart.includes('-');
  const simValue = simPart.replace('-', '');
  const similarity = parseInt(simValue, 10) * (isNegative ? -1 : 1);
  
  return { volume, similarity };
};

// Use SVG instead of icon library for professional black icons
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 9C11.21 9 13 7.21 13 5C13 2.79 11.21 1 9 1C6.79 1 5 2.79 5 5C5 7.21 6.79 9 9 9ZM9 11C6.33 11 1 12.34 1 15V17H17V15C17 12.34 11.67 11 9 11Z" fill="#888888"/>
  </svg>
);

const RecommendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 7.5L12.5 5L13.5 1.5L10 4L6.5 1.5L7.5 5L5 7.5H8.5L10 11L11.5 7.5H15Z" fill="#888888"/>
    <path d="M4 8.5H1V16.5H4V8.5Z" fill="#888888"/>
    <path d="M7.5 8.5H4.5V16.5H7.5V8.5Z" fill="#888888"/>
    <path d="M11 8.5H8V16.5H11V8.5Z" fill="#888888"/>
    <path d="M14.5 8.5H11.5V16.5H14.5V8.5Z" fill="#888888"/>
  </svg>
);

const TimeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 1C4.58 1 1 4.58 1 9C1 13.42 4.58 17 9 17C13.42 17 17 13.42 17 9C17 4.58 13.42 1 9 1ZM9 15C5.69 15 3 12.31 3 9C3 5.69 5.69 3 9 3C12.31 3 15 5.69 15 9C15 12.31 12.31 15 9 15Z" fill="#888888"/>
    <path d="M9.5 5H8V9.71L12.15 12.14L13 10.87L9.5 8.87V5Z" fill="#888888"/>
  </svg>
);

const VolumeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 8V12H6L10 16V4L6 8H2Z" fill="#4ade80"/>
    <path d="M12.5 10C12.5 8.23 11.48 6.71 10 5.91V14.09C11.48 13.29 12.5 11.77 12.5 10Z" fill="#4ade80"/>
    <path d="M10 2V4.09C12.84 4.99 15 7.27 15 10C15 12.73 12.84 15.01 10 15.91V18C14.05 17.04 17 13.83 17 10C17 6.17 14.05 2.96 10 2Z" fill="#4ade80"/>
  </svg>
);

// Enhanced SVG Circle for artist with selection count and outline
const ArtistCircle = ({ name, volume, isSelected = false, selectionCount = 0 }) => {
  return (
    <div className="artist-avatar">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main circle */}
        <circle cx="32" cy="32" r="32" fill="#2D2D2D"/>
        
        {/* Selection outline - green border when selected */}
        {isSelected && (
          <circle 
            cx="32" 
            cy="32" 
            r="30" 
            fill="none" 
            stroke="#4ade80" 
            strokeWidth="3"
            opacity="0.8"
          />
        )}
        
        {/* Artist silhouette */}
        <path d="M32 48C37.5228 48 42 43.5228 42 38C42 32.4772 37.5228 28 32 28C26.4772 28 22 32.4772 22 38C22 43.5228 26.4772 48 32 48Z" fill="#222222"/>
        <path d="M32 28C35.3137 28 38 25.3137 38 22C38 18.6863 35.3137 16 32 16C28.6863 16 26 18.6863 26 22C26 25.3137 28.6863 28 32 28Z" fill="#222222"/>
        
        {/* Volume indicator circle */}
        <circle cx="48" cy="50" r="12" fill="#4ade80" fillOpacity="0.1"/>
      </svg>
      
      {/* Volume indicator */}
      <div className="artist-volume-indicator">{volume}</div>
      
      {/* Selection count badge - bottom left */}
      {selectionCount > 0 && (
        <div className="artist-selection-count">
          x{selectionCount}
        </div>
      )}
    </div>
  );
};

const MetadataItem = ({ icon, value, title }) => (
  <div className="metadata-item" title={title}>
    {icon}
    <span>{value}</span>
  </div>
);

// Enhanced volume bars with Design 4 - Progressive Staggered Heights
const ArtistVolumeBar = ({ volume }) => {
  // Ensure volume is between 1-6
  const level = Math.max(1, Math.min(6, volume || 3));
  
  return (
    <div className="artist-volume-display">
      <VolumeIcon />
      <div className="artist-volume-bars">
        {Array.from({ length: 6 }).map((_, i) => {
          // Progressive staggered heights for Design 4
          const barHeight = 5 + (i * 3); // 5px, 8px, 11px, 14px, 17px, 20px
          return (
            <div
              key={i}
              className={`volume-bar ${i < level ? 'active' : ''}`}
              style={{
                height: `${barHeight}px`,
                alignSelf: 'flex-end'  // bottom-align so bars "grow" up
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// Helper function to generate artist selection data for each station
const generateArtistSelectionData = (artists, selectedArtists, stationIndex, totalStations) => {
  // Create a map of selected artist names for quick lookup
  const selectedArtistNames = new Set(selectedArtists.map(a => a.name.toLowerCase()));
  
  // Calculate how many selected artists should appear in this station
  // Higher stations (lower index) get more selected artists
  const selectionProbability = Math.max(0.1, 1 - (stationIndex / totalStations));
  const maxSelectedInStation = Math.min(selectedArtists.length, Math.ceil(selectedArtists.length * selectionProbability));
  
  // Randomly select which selected artists appear in this station
  const selectedArtistsInStation = selectedArtists
    .slice(0, maxSelectedInStation)
    .sort(() => Math.random() - 0.5);
  
  // Generate enhanced artist data with selection info
  return artists.map((artist, index) => {
    // Check if this artist matches any selected artist (fuzzy matching)
    const matchedSelectedArtist = selectedArtistsInStation.find(selected => 
      selected.name.toLowerCase().includes(artist.name.toLowerCase().split(' ')[0]) ||
      artist.name.toLowerCase().includes(selected.name.toLowerCase().split(' ')[0])
    );
    
    // If no direct match, randomly assign some artists as "selected" based on position
    const isRandomlySelected = !matchedSelectedArtist && 
      selectedArtistsInStation.length > 0 && 
      index < selectedArtistsInStation.length && 
      Math.random() < 0.3;
    
    const isSelected = matchedSelectedArtist || isRandomlySelected;
    const selectionCount = isSelected ? Math.floor(Math.random() * 12) + 1 : 0; // Random count 1-12
    
    return {
      ...artist,
      isSelected,
      selectionCount
    };
  });
};

// Enhanced ArtistCarousel component that accepts selection data
const EnhancedArtistCarousel = ({ artists, selectedArtists = [], stationIndex = 0, totalStations = 1 }) => {
  // Generate artist selection data
  const enhancedArtists = useMemo(() => 
    generateArtistSelectionData(artists, selectedArtists, stationIndex, totalStations),
    [artists, selectedArtists, stationIndex, totalStations]
  );
  
  return (
    <ArtistCarousel 
      artists={enhancedArtists} 
      ArtistCircle={ArtistCircle} 
      ArtistVolumeBar={ArtistVolumeBar} 
    />
  );
};

// RadioStationCard Component with enhanced artist selection indicators
const RadioStationCard = React.memo(function RadioStationCard({ 
  station, 
  onJoinRoom, 
  isCurrentStation,
  activeSection = 'volume',
  artists = [],
  selectedArtists = [],
  stationIndex = 0,
  totalStations = 1
}) {
  // Parse and use proper display format for numbers
  const { volume, similarity } = station.freqNumber ? 
    parseDisplayNumber(station.freqNumber) : 
    { volume: station.volume || 0, similarity: station.similarity || 0 };
  
  // Calculate special classes for similarity mode
  const frequencyClass = activeSection === 'volume'
    ? ''
    : similarity < 0 ? 'negative-similarity' : 'positive-similarity';
  
  // Create artist placeholders if no artists are provided
  const placeholderPool = useMemo(() => {
    const placeholders = [];
    for (let i = 1; i <= 20; i++) {
      placeholders.push({
        id: `placeholder-${i}`,
        name: `Artist ${i}`,
        volume: Math.floor(Math.random() * 6) + 1, // Random volume between 1-6
      });
    }
    return placeholders;
  }, []);
  
  // Use real similarArtists when we have them
  const displayArtists = artists.length > 0 ? artists : placeholderPool;
  
  return (
    <div 
      className={`station-card ${isCurrentStation ? 'selected' : ''} ${frequencyClass}`} 
      onClick={() => onJoinRoom(station)}
    >
      {/* Station header */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-indicator"></div>
          <span className="station-name">{station.name}</span>
        </div>
        
        <div className="station-metadata">
          <MetadataItem icon={<UserIcon />} value={station.listeners || station.userCount || 0} title="Listeners" />
          <MetadataItem icon={<TimeIcon />} value={`${station.minutes || 30}m`} title="Duration" />
        </div>
      </div>
      
      <div className="station-content">
        {/* LEFT: big frequency read‑out */}
        <div className="frequency-container">
          <div className={`frequency-number ${frequencyClass}`}>
            {volume}.{formatNumber(similarity)}
          </div>
        </div>

        {/* RIGHT: Enhanced Artist carousel with selection indicators */}
        <EnhancedArtistCarousel 
          artists={displayArtists}
          selectedArtists={selectedArtists}
          stationIndex={stationIndex}
          totalStations={totalStations}
        />
      </div>
    </div>
  );
});

// Main RoomsScreen Component with enhanced similarity support
const RoomsScreen = ({ 
  selectedArtists = [], 
  similarArtists = [],
  onJoinRoom = () => {}, 
  onBack = () => {} 
}) => {
  // State for similar artists fetched from Last.fm
  const [fetchedSimilarArtists, setFetchedSimilarArtists] = useState([]);
  
  // Fetch similar artists when selectedArtists changes
  useEffect(() => {
    async function loadSimilarArtists() {
      if (selectedArtists.length === 0) {
        setFetchedSimilarArtists([]);
        return;
      }
      
      try {
        // In a real implementation, you would make an actual API call:
        // const res = await axios.post('/api/lastfm/similar-artists', {
        //   selectedArtists: selectedArtists.map(a => a.name)
        // });
        // setFetchedSimilarArtists(res.data.similarArtists || []);
        
        // For now, we'll simulate similar artists with placeholders
        const mockSimilarArtists = [];
        for (let i = 1; i <= 20; i++) {
          mockSimilarArtists.push({
            id: `similar-${i}`,
            name: `Similar to ${selectedArtists[0]?.name || 'Selection'} ${i}`,
            volume: Math.floor(Math.random() * 6) + 1,
            image: selectedArtists[0]?.image // Use the selected artist's image
          });
        }
        setFetchedSimilarArtists(mockSimilarArtists);
      } catch (err) {
        console.error('Failed to fetch similar artists', err);
      }
    }
    
    loadSimilarArtists();
  }, [selectedArtists]);
  
  // Single source of truth for all tuner state
  const [tuner, setTuner] = useState({
    volume: 1326,
    similarity: 46,
    activeSection: 'volume',
    bandIndex: 4, // Math.floor(1326/300)
    bandFreqs: [],
    landedFreq: null,
    hasPoint: false
  });

  const [selectedStation, setSelectedStation] = useState(null);

  // Use the enhanced hook to get stations based on the current mode and values
  const { feed, isLoading, regenerateRooms } = useEnhancedBandFeed(
    tuner.activeSection,
    tuner.volume,
    tuner.similarity,
    tuner.landedFreq,
    tuner.hasPoint,
    tuner.bandFreqs
  );
  
  // Handle tuner value changes
  const handleTunerChange = useCallback(payload => {
    setTuner(current => ({
      ...current,
      ...payload
    }));
  }, []);
  
  // Effect to handle empty landing areas
  useEffect(() => {
    if (!tuner.hasPoint) {
      // This will trigger a regeneration in the useEnhancedBandFeed hook
    }
  }, [tuner.hasPoint]);

  // Handle station selection
  const handleJoinRoom = useCallback((station) => {
    setSelectedStation(station);
    onJoinRoom(station);
  }, [onJoinRoom]);

  // Check if a station matches the currently landed frequency
  const isStationSelected = useCallback((station) => {
    // Regular selection check
    if (selectedStation?.id === station.id) return true;
    
    // Check for landed frequency match
    if (station.freqNumber && tuner.landedFreq !== null) {
      // For volume mode, check if similarity matches landed freq
      if (tuner.activeSection === 'volume') {
        const { similarity } = parseDisplayNumber(station.freqNumber);
        return similarity === tuner.landedFreq;
      } 
      // For similarity mode, check if freq matches landed freq
      else if (station.freq) {
        return station.freq === tuner.landedFreq;
      }
    }
    
    return false;
  }, [selectedStation, tuner.landedFreq, tuner.activeSection]);

  return (
    <div className="radio-rooms-container">
      <button className="back-button" onClick={onBack}>← Back</button>

      <div className="tuner-container">
        <div className="tuner-wrapper">
          <RadioTuner 
            initialVolume={tuner.volume}
            initialSimilarity={tuner.similarity}
            onChange={handleTunerChange}
            rulerWidth={1600}
          />
        </div>
      </div>
      
      {/* Show selected artists below the tuner */}
      {selectedArtists.length > 0 && (
        <div className="selected-artists-container">
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

      {/* Message when switching to similarity mode */}
      {!isLoading && tuner.activeSection === 'similarity' && feed.length > 0 && (
            <div className="mode-info-message">
              <p>
                Showing stations with similarity values between {Math.max(MIN_SIMILARITY, tuner.similarity - 200)} and {Math.min(MAX_SIMILARITY, tuner.similarity + 200)}
              </p>
            </div>
          )}
          
          {/* Show landed frequency info if applicable */}
          {tuner.landedFreq !== null && (
            <div className="mode-info-message">
              <p>
                {tuner.activeSection === 'volume'
                  ? `Landed on frequency point ${tuner.landedFreq}`
                  : `Landed on similarity point ${tuner.landedFreq}`
                }
              </p>
            </div>
          )}

      <div className="feed-section">
        <RoomLoader isLoading={isLoading} />
        
        <div className="stations-list">
          {feed.map((station, index) => (
            <RadioStationCard
              key={station.id}
              station={station}
              onJoinRoom={handleJoinRoom}
              isCurrentStation={isStationSelected(station)}
              activeSection={tuner.activeSection}
              artists={fetchedSimilarArtists.length > 0 ? fetchedSimilarArtists : similarArtists}
              selectedArtists={selectedArtists}
              stationIndex={index}
              totalStations={feed.length}
            />
          ))}
          
          {!isLoading && feed.length === 0 && (
            <div className="no-stations-message">
              <p>No stations found at this {tuner.activeSection}. Try adjusting the tuner.</p>
              <button 
                className="retry-button"
                onClick={regenerateRooms}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomsScreen;