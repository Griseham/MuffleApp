import React, { useMemo, useState, useEffect } from "react";
import TopRadio from './TopRadio';
import RoomModal from './RoomModal';
import InfoIconModal from './InfoIconModal';

// Your Selections Tab Component - Design 7 (Split View)
const YourSelectionsTab = ({ yourSelections = [] }) => {
  
  const MusicNoteIcon = ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM21 16c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // SwipeIndicators component for vote display
  const SwipeIndicators = ({ type, counts }) => {
    const baseColor = type === 'left' ? 'text-red-400' : 'text-green-400';
    
    const safeCounts = {
      1: counts[1] || 0,
      2: counts[2] || 0,
      3: counts[3] || 0
    };
      
    return (
      <div className="flex items-center gap-2">
        {/* Single Arrow */}
        <div className={`flex items-center ${baseColor}`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            {type === 'left' ? (
              <path d="M5 12L10 7M5 12L10 17" />
            ) : (
              <path d="M19 12L14 7M19 12L14 17" />
            )}
          </svg>
          <span className="text-xs ml-1">{safeCounts[1]}</span>
        </div>
        
        {/* Double Arrow */}
        <div className={`flex items-center ${baseColor}`}>
          <svg viewBox="0 0 28 24" className="w-5 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            {type === 'left' ? (
              <>
                <path d="M5 12L10 7M5 12L10 17" />
                <path d="M13 12L18 7M13 12L18 17" />
              </>
            ) : (
              <>
                <path d="M20 12L15 7M20 12L15 17" />
                <path d="M12 12L7 7M12 12L7 17" />
              </>
            )}
          </svg>
          <span className="text-xs ml-1">{safeCounts[2]}</span>
        </div>
        
        {/* Triple Arrow */}
        <div className={`flex items-center ${baseColor}`}>
          <svg viewBox="0 0 36 24" className="w-6 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            {type === 'left' ? (
              <>
                <path d="M5 12L10 7M5 12L10 17" />
                <path d="M13 12L18 7M13 12L18 17" />
                <path d="M21 12L26 7M21 12L26 17" />
              </>
            ) : (
              <>
                <path d="M23 12L18 7M23 12L18 17" />
                <path d="M15 12L10 7M15 12L10 17" />
                <path d="M7 12L2 7M7 12L2 17" />
              </>
            )}
          </svg>
          <span className="text-xs ml-1">{safeCounts[3]}</span>
        </div>
      </div>
    );
  };

  // Helper to check if image URL is valid
  const hasValidImage = (imageUrl) => {
    return imageUrl && 
           imageUrl !== 'fallback.jpg' && 
           imageUrl !== '/placeholder-200.png' &&
           !imageUrl.includes('placeholder') &&
           !imageUrl.includes('picsum') &&
           imageUrl.startsWith('http');
  };

  return (
    <div className="your-selections-container">
      <div className="your-selections-header">
        <div className="flex items-center">
          <div className="your-selections-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
          <h3 className="your-selections-title">
            Your Selections ({yourSelections.length})
          </h3>
        </div>
      </div>

      <div className="your-selections-content">
        {yourSelections.length > 0 ? (
          yourSelections.map((selection) => (
            <div key={selection.id} className="your-selection-card">
              <div className="selection-left">
                <div className="selection-artwork">
                  {hasValidImage(selection.artworkUrl) ? (
                    <img 
                      src={selection.artworkUrl} 
                      alt={selection.track}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="artwork-fallback"
                    style={{ display: hasValidImage(selection.artworkUrl) ? 'none' : 'flex' }}
                  >
                    <MusicNoteIcon size={16} className="text-gray-400" />
                  </div>
                </div>
                <div className="selection-info">
                  <h4 className="selection-title">{selection.track}</h4>
                  <p className="selection-artist">{selection.artist}</p>
                </div>
              </div>
              
              <div className="selection-right">
                <div className="selection-votes">
                  <SwipeIndicators type="left" counts={selection.leftCounts || { 1: 0, 2: 0, 3: 0 }} />
                  <div className="vote-separator"></div>
                  <SwipeIndicators type="right" counts={selection.rightCounts || { 1: 0, 2: 0, 3: 0 }} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <MusicNoteIcon size={32} className="text-gray-600" />
            </div>
            <p className="empty-title">No selections yet</p>
            <p className="empty-subtitle">
              Songs you add from the Widget will appear here with their voting results
            </p>
          </div>
        )}
      </div>

      <style>{`
       .your-selections-container {
          height: 100%;
          max-height: 350px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .your-selections-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .your-selections-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          color: white;
        }

        .your-selections-title {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

       .your-selections-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }

        .your-selection-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 3px solid white;
          border-radius: 8px;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .your-selection-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }

        .selection-left {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
        }

        .selection-artwork {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
          margin-right: 12px;
          flex-shrink: 0;
          position: relative;
        }

        .artwork-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
        }

        .selection-info {
          min-width: 0;
          flex: 1;
        }

        .selection-title {
          font-weight: 600;
          color: white;
          font-size: 14px;
          margin: 0 0 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .selection-artist {
          font-size: 12px;
          color: #888;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .selection-right {
          flex-shrink: 0;
        }

        .selection-votes {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vote-separator {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          text-align: center;
          padding: 20px;
        }

        .empty-icon {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-title {
          color: #888;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .empty-subtitle {
          color: #666;
          font-size: 14px;
          max-width: 300px;
          line-height: 1.4;
        }

        /* Scrollbar styles */
        .your-selections-content::-webkit-scrollbar {
          width: 6px;
        }

        .your-selections-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }

        .your-selections-content::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

const TopComponent = ({ 
  volume, 
  similarity, 
  activeTab, 
  setActiveTab,
  roomNumber = '', // NEW – pretty frequency string "1326.-057"
  roomName = '', // NEW – 4-letter room name like "WXYZ"
  isExpanded = true,
  onToggleExpand = () => {},
  stationArtists = [], // Room artists from the station
  poolArtists = [], // NEW: All artists from the pool (room + related)
  onStationChange = () => {}, // New prop to notify parent when station changes
  yourSelections = [] // NEW: Array of songs you've added from Widget with voting data
}) => {
  // State for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  
  // State for displaying volume/similarity values
  const [currentValues, setCurrentValues] = useState({
    volume: volume || 1326,
    similarity: similarity || 46
  });

  // NEW: Update current values whenever props change
  useEffect(() => {
    setCurrentValues({ volume, similarity });
  }, [volume, similarity]);

  const radarArtists = useMemo(() => {
    let artists = [];
  
    if (poolArtists.length === 0) {
      artists = stationArtists.map(artist => ({
        ...artist,
        volume: artist.volume || Math.floor(Math.random() * 6) + 1,
        isSeed: true // Mark room artists as seed artists
      }));
    } else {
      // Use all pool artists (room + related) for radar display
      artists = poolArtists.map(artist => ({
        id: artist.id,
        name: artist.name,
        image: artist.image,
        volume: artist.volume || Math.floor(Math.random() * 6) + 1,
        isSeed: artist.isRoomArtist, // Mark room artists as seed artists
        count: artist.otherUsers > 0 ? artist.otherUsers : Math.floor(Math.random() * 8) + 8, // Use 8–15 range
        exponents: artist.exponents || 0
      }));
    }
  
    // Deduplicate any accidental duplicate IDs:
    const uniqueArtists = Array.from(
      new Map(artists.map(a => [a.id, a])).values()
    );
  
    // Allow more artists for scrolling — up to 20
    return uniqueArtists.slice(0, 20);
  }, [poolArtists, stationArtists]);
  
  // Format numbers with proper padding - UPDATED to keep sign
  const formatNumber = (num) =>
    `${num < 0 ? '-' : ''}${Math.abs(num).toString().padStart(4,'0')}`;
  
  // Toggle expanded/collapsed state
  const toggleExpanded = () => {
    const next = !isExpanded;
    onToggleExpand(next);
    if (!next) {
      // on collapse, clear active tab
      setActiveTab(null);
    } else {
      // on expand, if no tab selected, default to RADIO
      if (!activeTab) {
        setActiveTab('radio');
      }
    }
  };

  // Volume Icon - Grayscale version
  const VolumeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8V12H6L10 16V4L6 8H2Z" fill="white"/>
      <path d="M12.5 10C12.5 8.23 11.48 6.71 10 5.91V14.09C11.48 13.29 12.5 11.77 12.5 10Z" fill="white"/>
      <path d="M10 2V4.09C12.84 4.99 15 7.27 15 10C15 12.73 12.84 15.01 10 15.91V18C14.05 17.04 17 13.83 17 10C17 6.17 14.05 2.96 10 2Z" fill="white"/>
    </svg>
  );
  
  // Helper function to validate if an image URL is real
  const hasValidImage = (artist) => {
    return artist.image && 
           artist.image !== 'fallback.jpg' && 
           artist.image !== '/placeholder-200.png' &&
           !artist.image.includes('placeholder') &&
           !artist.image.includes('picsum') &&
           artist.image.startsWith('http');
  };

  // Generate artist avatar SVG (same as ArtistPool.js) - MOVED useEffect out
  const generateArtistSVG = (artist, index) => {
    const gradients = [
      { start: '#667eea', end: '#764ba2' },
      { start: '#f093fb', end: '#f5576c' },
      { start: '#4facfe', end: '#00f2fe' },
      { start: '#fa709a', end: '#fee140' },
      { start: '#a8edea', end: '#fed6e3' },
      { start: '#ffecd2', end: '#fcb69f' },
      { start: '#ff9a9e', end: '#fecfef' },
      { start: '#a18cd1', end: '#fbc2eb' },
      { start: '#fad0c4', end: '#ffd1ff' },
      { start: '#ffeaa7', end: '#fab1a0' }
    ];
    
    const gradient = gradients[index % gradients.length];
    const gradientId = `radar-gradient-${artist.id || index}`;
    
    return (
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: gradient.start, stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: gradient.end, stopOpacity: 1}} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill={`url(#${gradientId})`}/>
        <circle cx="50" cy="35" r="15" fill="white" opacity="0.9"/>
        <path d="M20,75 Q50,55 80,75 L80,85 Q50,65 20,85 Z" fill="white" opacity="0.9"/>
      </svg>
    );
  };
  
  // Artist Circle Component - LARGER size with text instead of circle
  const ArtistCircle = ({ artist, index }) => (
    <div className="relative">
      {/* Main artist circle - LARGER SIZE for 3 columns */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white shadow-lg">
        {hasValidImage(artist) ? (
          <img 
            src={artist.image} 
            alt={artist.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide the image and show the SVG fallback
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
            onLoad={() => {
            }}
          />
        ) : null}
        
        {/* Fallback SVG - shown if no valid image or image fails to load */}
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ display: hasValidImage(artist) ? 'none' : 'flex' }}
        >
          {generateArtistSVG(artist, index)}
        </div>
      </div>
      
      {/* Bottom right text instead of circle */}
      <div className="absolute bottom-0 right-0 bg-black/80 text-white text-xs font-bold px-1 py-0.5 rounded backdrop-blur-sm">
        x{artist.count || Math.floor(Math.random() * 8) + 8}
      </div>
    </div>
  );
  
  // Volume Bar Component - Grayscale version
  const VolumeBar = ({ volume }) => {
    const level = Math.max(1, Math.min(6, volume || 1));
    
    return (
      <div className="flex items-center gap-1">
        <VolumeIcon />
        <div className="flex items-center gap-[2px] h-5 ml-1">
          {Array.from({ length: 6 }).map((_, i) => {
            const barHeight = i < 3 ? 3 + (i * 2.25) : 7.5 - ((i - 3) * 1.5);
            return (
              <div
                key={i}
                className={`w-[3px] rounded-t-sm transition-all ${i < level ? 'bg-white shadow-[0_0_3px_rgba(255,255,255,0.7)]' : 'bg-gray-700'}`}
                style={{ height: `${barHeight}px` }}
              />
            );
          })}
        </div>
      </div>
    );
  };
  
  // Artist Cell Component - LARGER for 3-column layout
  const ArtistCell = ({ artist, index }) => (
    <div className="flex flex-col items-center cursor-pointer transition-all duration-150 hover:scale-105 space-y-3 w-full max-w-[100px] mx-auto">
      <div className="relative flex-shrink-0">
        <ArtistCircle artist={artist} index={index} />
      </div>
      <div className="text-white text-sm font-medium w-full text-center px-1 leading-tight">
        <div className="truncate max-w-[90px] mx-auto">
          {artist.name || 'Unknown'}
        </div>
      </div>
      <div className="flex-shrink-0">
        <VolumeBar volume={artist.volume} />
      </div>
    </div>
  );

  

  // Expand/Collapse arrow icon
  const ExpandCollapseIcon = ({ isExpanded }) => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
    >
      <path 
        d="M7 10L12 15L17 10" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="w-full pt-6 pb-4 relative mobile-top-component" style={{ padding: '0 20px', boxSizing: 'border-box' }}>
      {/* Room Modal */}
      <RoomModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        station={selectedStation}
        onJoinRoom={(station) => {
          // Here you would navigate to the room or update state as needed
        }}
      />
      
      <div className="relative">
        {/* Updated Background to match BottomContainer */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-black"></div>
          <div className="absolute inset-0 border border-white/10 rounded-2xl"></div>
        </div>
        
        <div className="relative px-4 py-4 md:p-6">
        {/* Top Section with expand/collapse button - MOBILE OPTIMIZED */}
          <div className={`mb-6 ${isExpanded ? 'mobile-header-expanded' : 'mobile-header-collapsed'} transition-all duration-300`}>
          <div className="flex items-baseline justify-between w-full">
          <div>
          <div className="font-mono font-bold text-white tracking-wide leading-none
                whitespace-nowrap
                text-[clamp(1.75rem,4.5vw,4rem)]">   {/* 28 px → ~64 px */}
      {roomName || '----'}
    </div>
  </div>
  
  <div className="flex items-center">
    <div className="text-right">
    <div className="font-mono font-bold text-gray-100 leading-none whitespace-nowrap
                text-[clamp(1.5rem,4vw,3.5rem)]">
        <span className="text-white">
          {formatNumber(currentValues.volume)}
        </span>
        <span className="text-white text-xl sm:text-2xl md:text-3xl align-middle mx-1">·</span>
        <span className="text-gray-400">
          {formatNumber(currentValues.similarity)}
        </span>
      </div>
    </div>
    
    <button 
      className="ml-4 p-3 rounded-full hover:bg-white/10 transition duration-200 focus:outline-none top-expand-collapse"
      onClick={toggleExpanded}
      aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
    >
      <ExpandCollapseIcon isExpanded={isExpanded} />
    </button>
  </div>
</div>
          </div>
          
          {/* Content area - FIXED height optimized for radio tab */}
          <div
  className={`mt-2 mb-6 overflow-hidden transition-all duration-300 w-full ${
    isExpanded ? 'opacity-100 h-[252px] md:h-[280px]' : 'opacity-0 h-0'
  }`}
>

            {/* Complete radio component */}
            {activeTab === 'radio' && (
              <div className="h-full w-full">
                <TopRadio
                  initialVolume={currentValues.volume}
                  initialSimilarity={currentValues.similarity}
                  onFrequencyLanded={(station) => {
                    // update header numbers

                    // pop the modal with artists / listeners, etc.
                    setSelectedStation(station);
                    setModalOpen(true);
                  }}
                />
              </div>
            )}

            {/* Your Selections Content */}
            {activeTab === 'yourPicks' && (
              <div className="h-full w-full">
                <YourSelectionsTab yourSelections={yourSelections} />
              </div>
            )}

            {/* Radar Content - 3-column layout with proper scrolling */}
            {activeTab === 'radar' && (
              <div className="h-full overflow-y-scroll overflow-x-hidden">
                <div className="pb-6">
                  {radarArtists.length > 0 ? (
                    <div className="px-3">
                      <div className="grid grid-cols-3 gap-x-4 gap-y-6 mobile-radar-grid">
                        {radarArtists.map((artist, idx) => (
                          <ArtistCell key={`${artist.id}-${idx}`} artist={artist} index={idx} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8 px-4">
                      <div className="mb-2">No artist data available</div>
                      <div className="text-xs">Artists will appear here once the pool is populated</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Tabs - Always visible - MOBILE OPTIMIZED */}
<div className="flex items-center justify-center space-x-8 h-8">            <button
  className={`relative flex items-center gap-2 ${activeTab === 'radio' ? 'text-white' : 'text-gray-500'}`}
  onClick={() => {
                if (activeTab === 'radio' && isExpanded) {
                  // Collapse if clicking the same active tab
                  onToggleExpand(false);
                  setActiveTab(null);
                } else {
                  // Expand and set tab
                  if (!isExpanded) onToggleExpand(true);
                  setActiveTab('radio');
                }
              }}
            >
  <span className="text-lg font-bold tracking-wider">RADIO</span>
  <InfoIconModal
                title="Radio"
                modalId="top-radio-modal"
                steps={[
                  {
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFA500" strokeWidth="2">
                      <circle cx="12" cy="12" r="2" />
                      <path d="M12 1v6m0 6v6" />
                      <path d="M1 12h6m6 0h6" />
                    </svg>,
                    title: "Radio Functionality",
                    content: `The radio is also available within rooms, making it easier for users to flow through multiple rooms.

There are many reasons not to stay in one room:
• Maybe a user didn't like any of the other user's recommendations
• Perhaps the room lost a lot of similarity score over time (because the users who made similar picks as you are leaving or the artists you picked are not getting good ratings)
• Or maybe the volume got way lower (meaning users with higher volumes left and lower volume users came in)

For example, if the number of the room I am in is 2221.700, then i got lucky because i found a pretty high volume room that is very close to my taste and artist selections.

If i use the radio and scroll by volume, i might find a room like 2732.800, this is good because not only does the room have a higher volume it also has a higher similarity.

This is meant to incentivise users to constantly look for better rooms instead of feeling like they are stuck in one.`},
{
  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFA500" strokeWidth="2">
    <path d="M9 12l2 2 4-4" />
    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.74 0 5.23 1.23 6.88 3.17" />
  </svg>,
  title: "Edge Cases",
  content: `What if a user just adds songs to multiple rooms and just keeps joining and leaving?

- If they don't listen to any other user's song recommendations, their picks might not be seen at all
- However, if they do eventually stop and listen, then their recommendations might just have lower priority in the queue

This is not to say that the users who keep joining and leaving wont have their songs listened to at all, but it mostly depends on how many songs are even in the room's queue.

We expect most users to join rooms, listen to many song recommendations and maybe only add one song to the queue, so this allows us to value each song recommendation.

However that could be wrong, but we'd have to find out during playtesting.`
}
]}
iconSize={14}
iconColor="#FFA500"
showButtonText={false}
sidePanel={true}
/>
</button>

<button
className={`relative flex items-center gap-2 ${activeTab === 'yourPicks' ? 'text-white' : 'text-gray-500'}`}onClick={() => {
if (activeTab === 'radar' && isExpanded) {
// Collapse if clicking the same active tab
onToggleExpand(false);
setActiveTab(null);
} else {
// Expand and set tab
if (!isExpanded) onToggleExpand(true);
setActiveTab('radar');
}
}}
>
<span className="text-lg font-bold tracking-wider">RADAR</span>
<InfoIconModal
title="Radar"
modalId="top-radar-modal"
steps={[
{
  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFA500" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>,
  title: "Radar",
  content: "The radar still shows the top artists in this room by displaying how many users in this room have picked that artist from the selection screen and a volume representing how their songs (recommended by users) are being received/rated. Should update in real time."
}
]}
iconSize={14}
iconColor="#FFA500"
showButtonText={false}
sidePanel={true}
/>
</button>

<button
className={`relative flex items-center gap-2 ${activeTab === 'radar' ? 'text-white' : 'text-gray-500'}`}onClick={() => {
if (activeTab === 'yourPicks' && isExpanded) {
// Collapse if clicking the same active tab
onToggleExpand(false);
setActiveTab(null);
} else {
// Expand and set tab
if (!isExpanded) onToggleExpand(true);
setActiveTab('yourPicks');
}
}}
>
<span className="text-lg font-bold tracking-wider">YOUR PICKS</span>
<InfoIconModal
title="Your Selections"
modalId="top-yourpicks-modal"
steps={[
{
  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFA500" strokeWidth="2">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
  </svg>,
  title: "Your Selections",
  content: "This tab shows how your song recommendations were received by other users."
}
]}
iconSize={14}
iconColor="#FFA500"
showButtonText={false}
sidePanel={true}
/>
{yourSelections.length > 0 && (
<span className="ml-1 px-1.5 py-0.5 bg-white text-black text-xs rounded-full font-bold">
{yourSelections.length}
</span>
)}
</button>

</div>
</div>
</div>

<style>{`
@keyframes fade-in {
from {
opacity: 0;
transform: translateY(10px);
}
to {
opacity: 1;
transform: translateY(0);
}
}

.animate-fade-in {
animation: fade-in 0.3s ease-out forwards;
}

.custom-scrollbar {
/* keep the gutter whether the thumb is visible or not */
scrollbar-gutter: stable;   /* modern browsers - reserve space for scrollbar */
}

/* Custom scrollbar styles */
.custom-scrollbar::-webkit-scrollbar {
width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
background: rgba(255, 255, 255, 0.1);
border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
background: white;
border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
background: #e0e0e0;
}

/* MOBILE OPTIMIZATIONS */
@media (max-width: 480px) {
/* Mobile tabs override desktop styling */
.flex.items-center.justify-center.space-x-8.h-8 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  gap: 8px;
  padding: 0 4px;
}

.flex.items-center.justify-center.space-x-8.h-8 button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 44px;
  padding: 8px 4px;
}

.flex.items-center.justify-center.space-x-8.h-8 button span {
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 0.5px;
  line-height: 1.2;
  text-align: center;
}
.mobile-top-component {
padding: 0 12px !important;
}

/* Mobile Header Styles */
.mobile-header-expanded {
height: 64px;
}

.mobile-header-collapsed {
  height: 20px;        /* slimmer collapsed bar */
}

.mobile-header-collapsed + .flex.items-center.justify-center.space-x-8.h-8 {
  margin-top: 4px !important;   
}


.mobile-header-flex {
gap: 8px;
}

.mobile-room-name-container {
flex: 0 0 auto;
min-width: 0;
}

.mobile-room-name {
  font-weight: bold;
  font-size: 24px;
  line-height: 1.1;
  color: white;
  letter-spacing: 0.5px;
}

.mobile-frequency-container {
flex: 1;
justify-content: flex-end;
gap: 8px;
}

.mobile-frequency-display {
  font-weight: bold;
  font-size: 20px;
  line-height: 1.1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mobile-volume-number {
color: white;
}

.mobile-frequency-dot {
color: white;
font-size: 16px;
margin: 0 2px;
}

.mobile-similarity-number {
color: #9ca3af;
}

.mobile-expand-button {
width: 44px;
height: 44px;
padding: 10px;
border-radius: 50%;
background: rgba(255, 255, 255, 0.1);
border: none;
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
transition: all 0.2s;
touch-action: manipulation;
flex-shrink: 0;
}

.mobile-expand-button:hover {
background: rgba(255, 255, 255, 0.15);
}

/* Mobile Tabs Container */
.mobile-tabs-container {
display: flex;
justify-content: space-between;
align-items: center;
height: 44px;
gap: 8px;
padding: 0 4px;
}

.mobile-tab-button {
flex: 1;
display: flex;
align-items: center;
justify-content: center;
gap: 4px;
min-height: 44px;
padding: 8px 4px;
border: none;
background: none;
cursor: pointer;
transition: all 0.2s;
touch-action: manipulation;
position: relative;
}

.mobile-tab-active {
color: white;
}

.mobile-tab-inactive {
color: #6b7280;
}

.mobile-tab-text {
font-size: 12px;
font-weight: bold;
letter-spacing: 0.5px;
line-height: 1.2;
text-align: center;
}

.mobile-tab-badge {
position: absolute;
top: 4px;
right: 2px;
background: white;
color: black;
font-size: 10px;
font-weight: bold;
padding: 2px 6px;
border-radius: 10px;
min-width: 16px;
height: 16px;
display: flex;
align-items: center;
justify-content: center;
line-height: 1;
}

/* Mobile Radar Grid */
.mobile-radar-grid {
grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
gap: 16px !important;
}

/* Info icon adjustments for mobile */
.mobile-tab-button .info-icon-modal {
margin-left: 2px;
}
}

/* Tablet optimizations */
@media (max-width: 768px) and (min-width: 481px) {
.grid-cols-3 {
grid-template-columns: repeat(3, minmax(0, 1fr));
gap: 1rem;
}
}

/* Original mobile breakpoint */
@media (max-width: 420px) {
.top-expand-collapse {
width: 44px;
height: 44px;
touch-action: manipulation;
}
}

/* Desktop fallback styles for non-mobile classes */
@media (min-width: 481px) {
.mobile-header-expanded,
.mobile-header-collapsed {
height: auto;
}

.mobile-room-name {
font-size: clamp(24px, 5vw, 48px);
}

.mobile-frequency-display {
font-size: clamp(20px, 4vw, 40px);
}

.mobile-tabs-container {
justify-content: center;
gap: 32px;
}

.mobile-tab-button {
flex: none;
gap: 8px;
}

.mobile-tab-text {
font-size: 18px;
}

.mobile-expand-button {
width: auto;
height: auto;
padding: 12px;
border-radius: 12px;
}
}
`}</style>
</div>
);
};

export default TopComponent;