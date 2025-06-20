import React, { useState, useEffect, useLayoutEffect } from 'react';
import InfoIconModal from './InfoIconModal';


// quick local placeholders ― no API required
const generatePlaceholderArtists = (count = 6) =>
  Array.from({ length: count }, (_, i) => ({
    id: `ph-${i}`,
    name: `Artist ${i + 1}`,
    image: null,                  // forces SVG fallback
    volume: Math.floor(Math.random() * 6) + 1,
    picks: Math.floor(Math.random() * 15) + 1,
  }));

const RoomModal = ({ isOpen, onClose, station, onJoinRoom }) => {
  const [modalArtists, setModalArtists] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true

  // Get API base URL

  // 1) Synchronously clear out previous artists BEFORE paint:
// whenever the modal opens, load six placeholders – no network calls
useLayoutEffect(() => {
  if (isOpen) {
    setLoading(false);
    setModalArtists(generatePlaceholderArtists(6));
  }
}, [isOpen]);



  // Helper function to validate if an image URL is real (same as TopComponent)
  const hasValidImage = (artist) => {
    return artist.image && 
           artist.image !== 'fallback.jpg' && 
           artist.image !== '/placeholder-200.png' &&
           !artist.image.includes('placeholder') &&
                    !artist.image.includes('picsum') &&
                    !artist.image.includes('scdn.co') &&
                      artist.image.startsWith('http');
  };

  // Generate artist avatar SVG (same as TopComponent)
// Greyscale avatar – one flat circle + two simple face strokes
// very simple grey user-icon avatar  – no backend needed
const generateArtistSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* outer circle */}
    <circle cx="50" cy="50" r="45" fill="#4b5563" />        {/* gray-600 */}
    {/* head */}
    <circle cx="50" cy="38" r="18" fill="#d1d5db" />        {/* gray-300 */}
    {/* shoulders */}
    <path
      d="M20 80a30 18 0 0 1 60 0Z"
      fill="#d1d5db"
    />
  </svg>
);


  // Volume Icon (same as TopComponent)
  const VolumeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8V12H6L10 16V4L6 8H2Z" fill="white"/>
      <path d="M12.5 10C12.5 8.23 11.48 6.71 10 5.91V14.09C11.48 13.29 12.5 11.77 12.5 10Z" fill="white"/>
      <path d="M10 2V4.09C12.84 4.99 15 7.27 15 10C15 12.73 12.84 15.01 10 15.91V18C14.05 17.04 17 13.83 17 10C17 6.17 14.05 2.96 10 2Z" fill="white"/>
    </svg>
  );

  // Volume Bar Component (same as TopComponent)
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

  if (!isOpen || !station) return null;
  
  // Always display "vvvv . ss" from explicit props
  const volumePart = String(station.volume ?? '0000').padStart(4, '0');
  const similarityPart = String(Math.round(Math.abs(station.similarity ?? 0))).padStart(2, '0');
  
  // 4-letter code derived from station name or volume
  const stationCode = station.name || station.code || `K${volumePart.slice(0,3)}`;
  
  return (
<div className="absolute top-0 right-0 mt-8 mr-4" style={{ zIndex: 60000 }}>
<div className="relative rounded-2xl p-6 w-96 max-w-[90vw] border border-white/10 shadow-xl overflow-hidden">
        {/* Updated background to match TopComponent gradient */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-black"></div>
          <div className="absolute inset-0 border border-white/10 rounded-2xl"></div>
        </div>
        
        {/* Glass effect background elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        
        {/* Close button and Info Icon */}
        <div className="absolute top-3 right-3 flex items-center gap-2" style={{ zIndex: 31000 }}>
          <InfoIconModal 
            title="Room Browsing"
            steps={[
              {
                title: "Room Navigation",
                content: "Users will be able to browse and join different rooms even as they already in a room.\n\nSo if a user isn't feeling a room, they can search for rooms that may have higher volume or similarity."
              }
            ]}
            iconSize={16}
            iconColor="#FFA500"
            showButtonText={false}
            sidePanel={true}
          />
          <button 
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Header with enhanced prominence for room title/number */}
        <div className="flex flex-col items-center mb-5 relative z-10">
          <div className="p-4 w-full bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 transform transition-transform">
            <div className="flex flex-col items-center">
              <div className="text-3xl font-mono font-bold text-white mb-2">{stationCode}</div>
              <div className="font-mono flex items-baseline">
                <span className="text-2xl font-bold text-white">{volumePart}</span>
                <span className="text-xl text-gray-400 mx-1">.</span>
                <span className="text-xl text-gray-300">{similarityPart}</span>
                {station.similarity < 0 && <span className="text-xl text-gray-300">-</span>}
              </div>
              <div className="mt-2 h-0.5 w-24 bg-white/30"></div>
            </div>
          </div>
        </div>
        
        {/* Artist Grid */}
        <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-4 mb-5 relative z-10">
          <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3 font-medium">Active Artists</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <div className="text-sm text-gray-300">Loading artists...</div>
              </div>
            </div>
          ) : modalArtists.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {modalArtists.slice(0, 6).map((artist, index) => {
                return (
                  <div key={artist.id || `artist-${index}`} className="flex flex-col items-center space-y-2">
                    {/* Artist Circle - Updated to match TopComponent style */}
                    <div className="relative">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white shadow-lg">
                        {hasValidImage(artist) ? (
                          <img 
                            src={artist.image} 
                            alt={artist.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If image fails to load, show SVG fallback
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
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
                      
                      {/* Bottom right text instead of circle - UPDATED to match TopComponent */}
                      <div className="absolute bottom-0 right-0 bg-black/80 text-white text-xs font-bold px-1 py-0.5 rounded backdrop-blur-sm">
                        x{artist.picks || artist.count || Math.floor(Math.random() * 10) + 1}
                      </div>
                    </div>
                    
                    {/* Artist name */}
                    <div className="text-xs text-white text-center truncate w-full max-w-[60px]" title={artist.name}>
                      {artist.name}
                    </div>
                    
                    {/* Volume bars - Updated to match TopComponent style */}
                    <div className="flex items-center justify-center">
                      <VolumeBar volume={artist.volume} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-400">No artists available</div>
            </div>
          )}
        </div>
        
        {/* Join button */}
        <div className="flex justify-center relative z-10">
          <button 
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white py-2.5 rounded-full text-sm font-medium hover:bg-white/20 transition-all"
            onClick={() => {
              onJoinRoom(station);
              onClose();
            }}
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomModal; 