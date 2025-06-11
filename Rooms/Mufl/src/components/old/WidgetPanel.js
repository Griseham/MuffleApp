import React, { useState, useEffect, useRef } from 'react';
import './WidgetPanel.css';

// If you have a separate constant for WIDGET_USER, import it; otherwise define here:
const WIDGET_USER = {
  id: 'widget-user',
  username: 'Your Picks',
  profileImage: 'https://via.placeholder.com/50?text=W',
};

function WidgetPanel({
  onClose,
  selectedArtists,
  personalQueue,
  setPersonalQueue,
  onQueueSong
}) {
  // Modes: 'list' or 'detail'
  const [mode, setMode] = useState('list');
  const [currentArtist, setCurrentArtist] = useState(null);

  const [artistTracks, setArtistTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [trackPending, setTrackPending] = useState(null);

  // Audio management
  const audioRef = useRef(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);

  /************************************************
   * Effects & Handlers
   ************************************************/

  // On mount/unmount, reset some states if needed—but don't clear personal queue.
  // We remove setPersonalQueue([]) from here so it doesn't clear the queue on close.
  useEffect(() => {
    // Optionally, we can do partial cleanup, but not resetting the queue:
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setCurrentlyPlayingId(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the selected artists change (user picks different ones), we can optionally reset the *artist-specific* state:
  useEffect(() => {
    setMode('list');
    setCurrentArtist(null);
    setArtistTracks([]);
    setSearchQuery('');
    setSearchResults([]);
    setCountdown(0);
    setTrackPending(null);
  }, [selectedArtists]);

  // Fetch top songs for the selected artist
  useEffect(() => {
    if (!currentArtist) return;

    const fetchTopSongs = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/apple-music/tracks?artistName=${encodeURIComponent(currentArtist.name)}`
        );
        if (!response.ok) throw new Error('Failed to fetch top songs');
        const tracks = await response.json();

        const processed = tracks.map((t, i) => ({
          id: t.id || `track-${i}`,
          title: t.attributes?.name || 'Unknown',
          artist: t.attributes?.artistName || currentArtist.name,
          artwork: t.attributes?.artwork
            ? t.attributes.artwork.url.replace('{w}x{h}', '200x200')
            : '',
          previewUrl: t.attributes?.previews?.[0]?.url || ''
        }));
        setArtistTracks(processed);
      } catch (error) {
        console.error('Error fetching artist tracks:', error);
      }
    };
    fetchTopSongs();
  }, [currentArtist]);

  // Countdown logic for trackPending (if you have that logic)
  useEffect(() => {
    if (countdown === 0 && trackPending) {
      onQueueSong?.(trackPending);
      setTrackPending(null);
    }
  }, [countdown, trackPending, onQueueSong]);

  // Poll countdown if > 0
  useEffect(() => {
    if (countdown > 0) {
      const timerId = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [countdown]);

  // Possibly queue the last item in personalQueue when countdown hits 0
  useEffect(() => {
    if (countdown === 0) {
      if (personalQueue.length > 0) {
        const lastTrack = personalQueue[personalQueue.length - 1];
        onQueueSong?.(lastTrack);
      }
    }
  }, [countdown, personalQueue, onQueueSong]);

  // Searching
  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const response = await fetch(`http://localhost:5001/apple-music/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery }),
      });
      if (!response.ok) throw new Error('Search failed');
      const results = await response.json();

      const processedResults = results.map((item, idx) => ({
        id: item.id || `res-${idx}`,
        title: item.track,
        artist: item.artist,
        artwork: item.artworkUrl || '',
        previewUrl: item.previewUrl || ''
      }));

      setSearchResults(processedResults);
    } catch (error) {
      console.error('Error searching for songs:', error);
    }
  };

  // **Prepend** new items to top of personalQueue
  function handleAddToQueue(track) {
    const snippetWithUser = {
      ...track,
      user: WIDGET_USER,
      fromWidget: true,
      previewUrl: track.previewUrl || ''
    };

    // Newest item at the top => [snippetWithUser, ...prev]
    setPersonalQueue((prev) => [snippetWithUser, ...prev]);

    // Optionally queue it immediately
    onQueueSong?.(snippetWithUser);
  }

  // Artist detail
  const handleArtistClick = (artist) => {
    setCurrentArtist(artist);
    setMode('detail');
  };

  const handleBackToList = () => {
    setMode('list');
    setCurrentArtist(null);
    setArtistTracks([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Play/Pause
  const handlePlayPause = (trackId, previewUrl) => {
    if (currentlyPlayingId === trackId) {
      // Already playing => pause
      audioRef.current.pause();
      setCurrentlyPlayingId(null);
    } else {
      // If another track is playing, pause it
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // Create new Audio
      const audio = new Audio(previewUrl);
      audio.play();
      audioRef.current = audio;
      setCurrentlyPlayingId(trackId);

      audio.addEventListener('ended', () => {
        setCurrentlyPlayingId(null);
      });
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /************************************************
   * Render
   ************************************************/
  return (
    <div className="widget-panel">
      <div className="widget-header">
        <h3>Music Picks</h3>
        <button className="widget-close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="widget-content">
        {/* Left side */}
        <div className="widget-left">
          {mode === 'detail' && currentArtist ? (
            <div className="artist-detail-view">
              <button onClick={handleBackToList} style={{ marginBottom: '8px' }}>
                ← Back
              </button>
              <div className="artist-circle" style={{ marginBottom: '12px' }}>
                <img
                  src={currentArtist.image}
                  alt={currentArtist.name}
                  style={{ width: 50, height: 50, borderRadius: '50%' }}
                />
                <p>{currentArtist.name}</p>
              </div>

              {/* Search bar */}
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search for songs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={handleSearch}>Search</button>
              </div>

              {searchQuery ? (
                <>
                  <h5>Search Results</h5>
                  {searchResults.map((track) => (
                    <div key={track.id} className="search-result-item">
                      <img
                        src={track.artwork || 'https://via.placeholder.com/50?text=A'}
                        alt={track.title}
                      />
                      <p>{track.title}</p>
                      <button onClick={() => handlePlayPause(track.id, track.previewUrl)}>
                        {currentlyPlayingId === track.id ? 'Pause' : 'Play'}
                      </button>
                      <button onClick={() => handleAddToQueue(track)}>+</button>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <h5>Top Tracks</h5>
                  {artistTracks.map((track) => (
                    <div key={track.id} className="search-result-item">
                      <img
                        src={track.artwork || 'https://via.placeholder.com/50?text=A'}
                        alt={track.title}
                      />
                      <p>{track.title}</p>
                      <button onClick={() => handleAddToQueue(track)}>+</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <>
              <h4>Selected Artists</h4>
              <div className="selected-artists">
                {selectedArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className="artist-circle"
                    onClick={() => handleArtistClick(artist)}
                  >
                    <img src={artist.image || 'https://via.placeholder.com/50?text=A'} alt={artist.name} />
                    <p>{artist.name}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right side => personal queue */}
        <div className="widget-right">
          {/* Example countdown if > 0 */}
          {countdown > 0 && (
            <div style={{ textAlign: 'right', marginBottom: 8 }}>
              Next song in: {countdown} s
            </div>
          )}

          <h4>Personal Queue</h4>
          <div className="queue-list">
            {personalQueue.map((track) => (
              <div key={track.id} className="queue-item">
                <img src={track.artwork || 'https://via.placeholder.com/50?text=A'} alt={track.title} />
                <p>{track.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WidgetPanel;
