// ArtistCarousel.js - Carousel component with minimal arrow designs
import React, { useState, useEffect } from 'react';

// Minimal SVG Arrow Components for navigation
const LeftArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="15,18 9,12 15,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RightArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArtistCarousel = ({ artists, ArtistCircle, ArtistVolumeBar }) => {
  // Show 6 artists per page in a 3x2 grid, so 18 artists = 3 pages
  const ARTISTS_PER_PAGE = 6;
  
  // Calculate total number of pages
  const totalPages = Math.ceil(artists.length / ARTISTS_PER_PAGE);
  
  // Current page state
  const [currentPage, setCurrentPage] = useState(0);
  // Animation state
  const [animationDirection, setAnimationDirection] = useState(null);
  
  // Handle previous page click
  const handlePrevPage = (e) => {
    // Stop event propagation to prevent triggering the station card's onClick
    e.stopPropagation();
    
    if (currentPage > 0) {
      setAnimationDirection('slide-right');
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Handle next page click
  const handleNextPage = (e) => {
    // Stop event propagation to prevent triggering the station card's onClick
    e.stopPropagation();
    
    if (currentPage < totalPages - 1) {
      setAnimationDirection('slide-left');
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Reset animation after it completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDirection(null);
    }, 300); // Match this to the CSS transition time
    
    return () => clearTimeout(timer);
  }, [currentPage]);
  
  // Get current page of artists
  const currentArtists = artists.slice(
    currentPage * ARTISTS_PER_PAGE,
    (currentPage + 1) * ARTISTS_PER_PAGE
  );
  
  // Fill remaining slots in a 3x2 grid (6 total slots)
  const filledArtists = [...currentArtists];
  
  // Always fill to 6 slots for the 3x2 grid
  while (filledArtists.length < 6) {
    filledArtists.push({ 
      id: `empty-${filledArtists.length}`, 
      name: '', 
      volume: 0, 
      isEmpty: true 
    });
  }
  
  return (
    <div className="artist-carousel-content">
      {/* Artist grid - always shows 6 slots in 3x2 layout */}
      <div className={`artists-grid ${animationDirection || ''}`}>
        {filledArtists.map((artist, idx) => (
          !artist.isEmpty ? (
            <div key={artist.id || idx} className="artist-cell">
              <div className="artist-info">
                <ArtistCircle 
                  name={artist.name} 
                  volume={artist.volume}
                  isSeed={artist.isSeed}
                  image={artist.image}
                  count={artist.count}
                />
                <ArtistVolumeBar volume={artist.volume} />
              </div>
              <div className="artist-name">{artist.name}</div>
            </div>
          ) : (
            <div key={artist.id} className="artist-cell empty-cell"></div>
          )
        ))}
      </div>
      
      {/* Show controls only if there are multiple pages */}
      {totalPages > 1 && (
        <div className="carousel-controls">
          <button 
            className={`carousel-arrow prev ${currentPage <= 0 ? 'disabled' : ''}`}
            onClick={handlePrevPage}
            disabled={currentPage <= 0}
            aria-label="Previous artists"
          >
            <LeftArrow />
          </button>
          
          {Array.from({ length: Math.min(4, totalPages) }).map((_, idx) => (
            <div 
              key={idx}
              className={`carousel-dot ${idx === currentPage ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setAnimationDirection(idx < currentPage ? 'slide-right' : 'slide-left');
                setCurrentPage(idx);
              }}
            ></div>
          ))}
          
          <button 
            className={`carousel-arrow next ${currentPage >= totalPages - 1 ? 'disabled' : ''}`}
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            aria-label="Next artists"
          >
            <RightArrow />
          </button>
        </div>
      )}
    </div>
  );
};

export default ArtistCarousel;