// EnhancedDiscoverySection.jsx
import React, { useState, useEffect } from 'react';
import EnhancedArtistCircle from './EnhancedArtistCircle';

// Function to preload all artist images to avoid showing loading states when switching tabs
const preloadArtistImages = (artistData) => {
  const allDays = artistData.getAllDiscoveryDays();
  const uniqueArtistIds = new Set();
  
  // Collect all unique artist IDs
  allDays.forEach(day => {
    day.artistIds.forEach(id => uniqueArtistIds.add(id));
  });
  
  // Preload each artist's image
  Array.from(uniqueArtistIds).forEach(id => {
    const artist = artistData.getArtist(id);
    if (artist && artist.imageUrl) {
      const img = new Image();
      img.src = artist.imageUrl;
      // We don't need to do anything with the result
      // The image will be cached by the browser
    }
  });
};

const EnhancedDiscoverySection = ({ artistData, styles }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Preload images when the component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadArtistImages(artistData);
      setIsLoading(false);
    }, 100); // Short delay to allow the UI to render first
    
    return () => clearTimeout(timer);
  }, [artistData]);
  
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 0',
      }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '50%',
          border: '2px solid rgba(169, 182, 252, 0.2)',
          borderTopColor: '#a9b6fc',
          animation: 'spin 1s linear infinite',
        }}></div>
      </div>
    );
  }
  
  // Get discovery days
  const discoveryDays = artistData.getAllDiscoveryDays();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {discoveryDays.map((day, idx) => {
        // Get artist objects from IDs (first 4 only) and filter out undefined artists
        const visibleArtists = day.artistIds.slice(0, 4).map(id => 
          artistData.getArtist(id)
        ).filter(artist => artist && artist.id && artist.name);
        
        // Calculate remaining artist count
        const remainingCount = day.artistIds.length > 4 
          ? day.plusCount || Math.min(Math.max(2, day.artistIds.length - 4), 12) 
          : 0;
          
        return (
          <div key={idx} style={{
            ...styles.discoveryDayRow,
            // Ensure each row has a unique key when mapping
          }}>
            {/* Day label */}
            <div style={{
              ...styles.discoveryLabel,
              marginBottom: '0.75rem', // More space below the label
            }}>
              {day.label}
            </div>
            
            {/* Main content row with artists and stats - adjusted for better alignment */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start' // Key change: align to top instead of center
            }}>
              {/* Left side: Artists row */}
              <div style={{
                ...styles.artistsContainer,
                maxWidth: '70%', // Ensure it doesn't crowd the stats
              }}>
                {visibleArtists.map((artist, artistIdx) => (
                  <EnhancedArtistCircle key={artistIdx} artist={artist} />
                ))}
                
                {/* Plus count if there are more artists */}
                {remainingCount > 0 && (
                  <div style={{
                    ...styles.plusCount
                  }}>
                    + {remainingCount}
                  </div>
                )}
              </div>
              
              {/* Right side: Stats - IMPROVED POSITIONING */}
              <div style={{
                ...styles.statsContainer,
                marginTop: '-8px', // Key fix: Pull stats up for better alignment
                paddingTop: 0, // Remove any padding
                gap: '4px', // Tighter spacing between stats
              }}>
                {day.genreStats.map((stat, statIdx) => (
                  <div key={statIdx} style={{
                    ...styles.statItem,
                    lineHeight: '1.2', // Tighter line height
                  }}>
                    {stat.percentage} of {stat.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Add keyframes for loading spinner */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
};

export default EnhancedDiscoverySection;