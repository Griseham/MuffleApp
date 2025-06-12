// EnhancedArtistCircle.jsx
import React, { useState, useEffect, useRef } from 'react';

// Global image cache to store loaded images across all instances
const IMAGE_CACHE = {};

const EnhancedArtistCircle = ({ artist }) => {
  const [imageStatus, setImageStatus] = useState({
    loaded: false,
    error: false
  });
  const isMounted = useRef(true);

  // Return null or fallback if artist is not provided
  if (!artist || !artist.id || !artist.name) {
    return null;
  }

  // Effect to handle image loading and caching
  useEffect(() => {
    // Check if we already have this artist's image in cache
    if (IMAGE_CACHE[artist.id]) {
      setImageStatus(IMAGE_CACHE[artist.id]);
      return;
    }

    // Otherwise, load the image
    const img = new Image();
    img.src = artist.imageUrl;

    img.onload = () => {
      // Only update state if component is still mounted
      if (isMounted.current) {
        const newStatus = { loaded: true, error: false };
        IMAGE_CACHE[artist.id] = newStatus; // Cache the result
        setImageStatus(newStatus);
      }
    };

    img.onerror = () => {
      // Handle error case
      if (isMounted.current) {
        const newStatus = { loaded: true, error: true };
        IMAGE_CACHE[artist.id] = newStatus; // Cache the error
        setImageStatus(newStatus);
        console.warn(`Failed to load image for artist: ${artist.name}`);
      }
    };

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted.current = false;
    };
  }, [artist.id, artist.imageUrl]);

  // First letter as fallback
  const firstLetter = artist.name.charAt(0).toUpperCase();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '60px', // Fixed width for better alignment
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        marginBottom: '0.25rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        position: 'relative',
        backgroundColor: '#7B1FA2', // Purple background while loading
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
      }}>
        {/* Show first letter as fallback if image not loaded or errored */}
        {(!imageStatus.loaded || imageStatus.error) && firstLetter}
        
        {/* Actual image, hidden until loaded */}
        {!imageStatus.error && (
          <img 
            src={artist.imageUrl}
            alt={artist.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: imageStatus.loaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />
        )}
      </div>

      {/* Artist name with overflow handling */}
      <div style={{
        fontSize: '0.75rem',
        color: '#a9b6fc',
        textAlign: 'center',
        width: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {artist.name}
      </div>
    </div>
  );
};

export default EnhancedArtistCircle;