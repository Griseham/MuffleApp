// StationCard.js - Updated with Professional Icons and Duration Text

import React from 'react';
import './StationCard.css';
import ArtistCarousel from './ArtistCarousel';
import InfoIconModal from './InfoIconModal';

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

// Professional SVG icons for metadata
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const VolumeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Enhanced Circle for artist with selection count, outline, and real image
const ArtistCircle = ({ name, volume, isSelected = false, count = 0, isSeed = false, image }) => {
  // Default placeholder image
  const placeholderImage = 'https://via.placeholder.com/300';
  
  return (
    <div className="artist-avatar-wrapper">
      {/* Count badge - positioned outside the avatar container as simple text */}
      {count > 1 && (
        <div className="artist-selection-count neon-glow">
          x{count}
        </div>
      )}
      
      <div className="artist-avatar">
        {/* Artist image with fallback */}
        <div 
          className="artist-image" 
          style={{ 
            backgroundImage: `url(${image || placeholderImage})`,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Selection outline - neon green border ONLY for seed artists (originally selected) */}
          {isSeed && (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '50%',
                border: '3px solid #00ff88',
                opacity: 0.8,
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.6)'
              }}
            />
          )}
        </div>
        
        {/* Volume indicator - REMOVED */}
        {/* <div className="artist-volume-indicator">{volume}</div> */}
      </div>
    </div>
  );
};

const MetadataItem = ({ icon, value, title, label }) => (
  <div className="metadata-item" title={title}>
    {icon}
    <span className="metadata-text">{value}</span>
    <span className="metadata-label">{label}</span>
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

// Enhanced ArtistCarousel component that accepts selection data
const EnhancedArtistCarousel = ({ artists, selectedArtists = [], stationIndex = 0, totalStations = 1 }) => {
  return (
    <ArtistCarousel 
      artists={artists} 
      ArtistCircle={ArtistCircle} 
      ArtistVolumeBar={ArtistVolumeBar} 
    />
  );
};

// Custom SVG icons for the radar info
const RadarIcon = ({ size = 20, color = "#4ade80" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1" fill="none"/>
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke={color} strokeWidth="1.5"/>
    <circle cx="16" cy="8" r="1.5" fill={color}/>
    <circle cx="8" cy="16" r="1" fill={color}/>
    <circle cx="14" cy="14" r="1" fill={color}/>
  </svg>
);

const UsersIcon = ({ size = 20, color = "#FF6B35" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2"/>
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2"/>
  </svg>
);

const VolumeIcon2 = ({ size = 20, color = "#00F5FF" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.3"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke={color} strokeWidth="2"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke={color} strokeWidth="2"/>
  </svg>
);

// Define the radar info steps for the InfoIconModal
const radarInfoSteps = [
  {
    icon: <RadarIcon size={20} color="#4ade80" />,
    title: "Artists",
    color: 'rgba(74, 222, 128, 0.1)',
    iconBg: 'rgba(74, 222, 128, 0.2)',
    content: "The radar shows the most popular artists in the room with a volume and a selected count."
  },
  {
    icon: <UsersIcon size={20} color="#4ade80" />,
    title: "Selected Count",
    color: 'rgba(74, 222, 128, 0.1)',
    iconBg: 'rgba(74, 222, 128, 0.2)',
    content: "The selected x-number count on the top right of each artist represents how many users selected that artist from the previous screen and joined this room. Those counts go down as the users who chose those artists leave."
  },
  {
    icon: <VolumeIcon2 size={20} color="#4ade80" />,
    title: "Artist Volume",
    color: 'rgba(74, 222, 128, 0.1)',
    iconBg: 'rgba(74, 222, 128, 0.2)',
    content: "The volume of each artist represents how their music is being rated by the users in that room."
  }
];

// Helper function to format minutes text
const formatMinutes = (minutes) => {
  if (!minutes) return '0 minutes';
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
};

// RadioStationCard Component with enhanced artist selection indicators and radar info
const StationCard = React.memo(function StationCard({ 
  station, 
  onJoinRoom, 
  isCurrentStation,
  activeSection = 'volume',
  selectedArtists = [],
  stationIndex = 0,
  totalStations = 1,
  isInteractive = true // New prop to control interactivity
}) {
  // Parse and use proper display format for numbers
  const { volume, similarity } = station.freqNumber ? 
    parseDisplayNumber(station.freqNumber) : 
    { volume: station.volume || 0, similarity: station.similarity || 0 };
  
  // Calculate special classes for similarity mode
  const frequencyClass = activeSection === 'volume'
    ? ''
    : similarity < 0 ? 'negative-similarity' : 'positive-similarity';
  
  // Use the artists from the station (they should already be properly generated)
  const displayArtists = station.artists || [];
  
  // Helper to format similarity number correctly
  const formatSimilarity = (sim) => {
    if (sim < 0) {
      return `-${Math.abs(sim)}`;
    }
    return sim.toString();
  };
  
  // Handle card click while allowing interactive elements to work
  const handleCardClick = (e) => {
    if (!isInteractive) return;
    
    // Check if click was on an interactive element
    const target = e.target;
    const isInfoIcon = target.closest('.info-icon-button') || target.closest('[data-info-modal]');
    const isCarouselControl = target.closest('.carousel-arrow') || 
                             target.closest('.carousel-button') || 
                             target.closest('.carousel-dot') ||
                             target.closest('.carousel-controls');
    
    // If not clicking on interactive elements, join the room
    if (!isInfoIcon && !isCarouselControl) {
      onJoinRoom(station);
    }
  };

  return (
    <div 
      className={`station-card ${isCurrentStation ? 'selected' : ''} ${frequencyClass} ${!isInteractive ? 'non-interactive' : ''}`} 
      onClick={handleCardClick}
      style={{ cursor: isInteractive ? 'pointer' : 'default' }}
    >
      {/* Station header */}
      <div className="station-header">
        <div className="station-header-left">
          <div className="station-indicator"></div>
          <span className="station-name">{station.name}</span>
          
          {/* Optional genre badge */}
          {station.showGenreBadge && station.dominantGenre && (
            <div className="genre-badge">
              Genre: {station.dominantGenre}
            </div>
          )}
        </div>
        
        <div className="station-metadata">
          <MetadataItem 
            icon={<UserIcon />}
            value={station.listeners || station.userCount || 0}
            label="users"
            title="Active listeners"
          />
          <MetadataItem 
            icon={<ClockIcon />}
            value={formatMinutes(station.minutes || 30)}
            label="duration"
            title="Session duration"
          />
        </div>
      </div>
      
      <div className="station-content">
        {/* LEFT: big frequency read‑out */}
        <div className="frequency-container">
          <div className={`frequency-number ${frequencyClass}`}>
            {volume}.{formatSimilarity(similarity)}
          </div>
        </div>

        {/* RIGHT: Enhanced Artist carousel with selection indicators and radar info */}
        <div className="artists-container">
          {/* Radar Info Icon positioned in top-right - only show on first station */}
          {stationIndex === 0 && (
            <div 
              style={{
                position: 'absolute',
                top: '6px',
                right: '4px',
                zIndex: 10
              }}
              onClick={(e) => e.stopPropagation()} // Prevent this from triggering room join
              data-info-modal="true" // Add data attribute for easier detection
            >
             <InfoIconModal
  title="Radar"
  steps={radarInfoSteps}
  iconSize={24}          // ⬅️ a bit larger (was 20)
  iconColor="#FFA500"    // ⬅️ orange, same as RadioTuner icons
  buttonText=""
  showButtonText={false}
  modalId="station-radar-modal"
  sidePanel={true}
/>

            </div>
          )}
          
          <EnhancedArtistCarousel 
            artists={displayArtists}
            selectedArtists={selectedArtists}
            stationIndex={stationIndex}
            totalStations={totalStations}
          />
        </div>
      </div>
    </div>
  );
});

const areEqual = (prev, next) =>
  prev.station.id          === next.station.id   &&
  prev.isCurrentStation    === next.isCurrentStation &&
  prev.isInteractive       === next.isInteractive;


export default React.memo(StationCard, areEqual);


