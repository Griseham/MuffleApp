// RoomsScreen.js - Updated with centered dial tuner design

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './RoomsScreen.css';
import './SelectionScreen.css';

import RadioTuner from './RadioTuner';
import StationCard from './StationCard';
import SimpleTunerDial from './SimpleTunerDial';
import { useEnhancedRoomFeed } from '../hooks/useEnhancedRoomFeed';
import InfoIconModal from './InfoIconModal';
import { apiClient } from '../utils/api';
import { RADIO_TUNER_INFO_STEPS } from './radioTunerInfo';

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

// Feed overlay (used for short fake tuning/loading states)
const FeedOverlay = ({ label = 'Loading...', showSpinner = true, showBar = true }) => {
  return (
    <div className="feed-overlay">
      <div className="feed-overlay-inner">
        {showBar && (
          <div className="feed-loading-bar">
            <div className="feed-loading-bar-fill" />
          </div>
        )}
        {showSpinner && <div className="lds-dual-ring" />}
        <div className="feed-overlay-label">{label}</div>
      </div>
    </div>
  );
};

// Skeleton station card (shown on first entry while initial data loads)
const StationSkeleton = () => {
  return (
    <div className="station-skeleton">
      <div className="station-skeleton-top">
        <div className="station-skeleton-pill" />
        <div className="station-skeleton-pill short" />
      </div>

      <div className="station-skeleton-row">
        <div className="station-skeleton-circle" />
        <div className="station-skeleton-circle" />
        <div className="station-skeleton-circle" />
        <div className="station-skeleton-circle" />
        <div className="station-skeleton-circle" />
        <div className="station-skeleton-circle" />
      </div>

      <div className="station-skeleton-bottom">
        <div className="station-skeleton-bar" />
        <div className="station-skeleton-bar short" />
      </div>
    </div>
  );
};

const StationsSkeletonList = ({ count = 8 }) => {
  return (
    <div className="stations-list">
      {Array.from({ length: count }).map((_, i) => (
        <StationSkeleton key={i} />
      ))}
    </div>
  );
};

const getInitialLoadLabel = ({ progress, loadingState, hasSelectedArtists }) => {
  if (loadingState.similarArtists && hasSelectedArtists) {
    return 'Finding similar artists';
  }

  if (loadingState.roomGeneration) {
    return 'Generating stations';
  }

  if (progress >= 100) {
    return 'Finalizing stations';
  }

  return 'Preparing your room feed';
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

// Generate trending rooms with Spotify artists (20 artists per room => 2 pages)
const generateTrendingRooms = async (count = 8) => {
  try {
    const res = await apiClient.get('/spotify/artists', {
      params: {
        genre: 'pop',
        limit: count * 40
      }
    });

    const allArtists = (res.data || []).filter(
      (artist) =>
        artist?.image &&
        artist.image !== 'fallback.jpg' &&
        !artist.image.includes('/api/placeholder/')
    );

    const sampleArtists = (n) => {
      if (!allArtists.length) return [];
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push(allArtists[Math.floor(Math.random() * allArtists.length)]);
      }
      return out;
    };

    const rooms = [];

    for (let i = 0; i < count; i++) {
      const volume = generateRandomVolume(600, 3300);
      const similarity = generateRandomSimilarity(-1000, 300);

      const roomArtists = sampleArtists(20).map((artist) => ({
        ...artist,
        volume: Math.floor(Math.random() * 6) + 1,
        isSelected: false,
        isSeed: false,
        count: 1
      }));

      rooms.push({
        id: `trending-${i}`,
        name: generateRandomStationName(),
        volume,
        similarity,
        freqNumber: `${volume}.${Math.abs(similarity)}${similarity < 0 ? '-' : ''}`,
        artists: roomArtists,
        listeners: Math.floor(Math.random() * 10000) + 1000,
        minutes: [15, 30, 45, 60][Math.floor(Math.random() * 4)],
        userCount: Math.floor(Math.random() * 100) + 10,
        dominantGenre: null,
        showGenreBadge: false
      });
    }

    return rooms;
  } catch (error) {
    console.error('Failed to generate trending rooms:', error);
    return Array.from({ length: count }, (_, i) => ({
      id: `trending-${i}`,
      name: generateRandomStationName(),
      volume: generateRandomVolume(600, 3300),
      similarity: generateRandomSimilarity(-1000, 300),
      artists: Array.from({ length: 20 }, (_, j) => ({
        id: `trending-artist-${i}-${j}`,
        name: `Trending Artist ${j + 1}`,
        image: '/api/placeholder/200/200',
        volume: Math.floor(Math.random() * 6) + 1
      })),
      listeners: Math.floor(Math.random() * 10000) + 1000,
      minutes: 30,
      userCount: Math.floor(Math.random() * 100) + 10,
      dominantGenre: null,
      showGenreBadge: false
    }));
  }
};

// Main RoomsScreen Component with centered dial tuner design
const RoomsScreen = ({ selectedArtists = [], onJoinRoom = () => {}, onBack = () => {} }) => {
  // Single source of truth for all tuner state
  const [tuner, setTuner] = useState({
    volume: 1326,
    similarity: 80,
    activeSection: 'volume'
  });

  // State for expanded advanced tuner
  const [isTunerExpanded, setIsTunerExpanded] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('tuned');
  const [trendingRooms, setTrendingRooms] = useState([]);
  const [tabLoading, setTabLoading] = useState({
    trending: false
  });
  const trendingReqIdRef = useRef(0);

  // Use the enhanced hook to get rooms and manage data
  const {
    rooms,
    isLoading,
    loadingState,
    error,
    currentSimilarity,
    handleSimilarityChange,
    handleVolumeChange,
    regenerateRooms
  } = useEnhancedRoomFeed(selectedArtists);

  useEffect(() => {
    console.log('[RoomsScreen] rooms length', rooms.length, rooms.map(r => r.name));
  }, [rooms]);

  useEffect(() => {
    console.log('[RoomsScreen] loadingState', loadingState);
  }, [loadingState]);

  // State for selected room
  const [selectedRoom, setSelectedRoom] = useState(null);

  // --- Simple tuner ---

  const [isTuningOverlay, setIsTuningOverlay] = useState(false);
  const tuningOverlayTimerRef = useRef(null);
  const tuningOverlayStartedAtRef = useRef(0);
  const lastRoomsSigRef = useRef('');

  const [stationsFadeIn, setStationsFadeIn] = useState(false);
  const stationsFadeTimerRef = useRef(null);

  const triggerStationsFade = useCallback(() => {
    if (stationsFadeTimerRef.current) clearTimeout(stationsFadeTimerRef.current);
    setStationsFadeIn(true);
    stationsFadeTimerRef.current = setTimeout(() => setStationsFadeIn(false), 450);
  }, []);

  const showTuningOverlay = useCallback(() => {
    tuningOverlayStartedAtRef.current = Date.now();
    setIsTuningOverlay(true);

    // Safety: auto-hide even if the rooms list doesn't change for some reason
    if (tuningOverlayTimerRef.current) clearTimeout(tuningOverlayTimerRef.current);
    tuningOverlayTimerRef.current = setTimeout(() => setIsTuningOverlay(false), 1200);
  }, []);

  const hideTuningOverlaySoon = useCallback(() => {
    const minMs = 420;
    const elapsed = Date.now() - tuningOverlayStartedAtRef.current;
    const wait = Math.max(0, minMs - elapsed);

    if (tuningOverlayTimerRef.current) clearTimeout(tuningOverlayTimerRef.current);
    tuningOverlayTimerRef.current = setTimeout(() => setIsTuningOverlay(false), wait);
  }, []);

  useEffect(() => {
    return () => {
      if (tuningOverlayTimerRef.current) clearTimeout(tuningOverlayTimerRef.current);
      if (stationsFadeTimerRef.current) clearTimeout(stationsFadeTimerRef.current);
    };
  }, []);

  const commitTuningSelection = useCallback(
    (payload = {}) => {
      if (activeTab !== 'tuned') return;

      const committedVolume = payload.volume ?? tuner.volume;
      const committedSimilarity = payload.similarity ?? tuner.similarity;
      const committedSection = payload.activeSection ?? tuner.activeSection ?? 'similarity';

      showTuningOverlay();

      if (committedSection === 'volume') {
        const landedSimilarity = payload.landedFreq ?? committedSimilarity;
        handleVolumeChange(committedVolume, landedSimilarity);
      } else {
        const landedVolume = payload.landedFreq ?? committedVolume;
        handleSimilarityChange(committedSimilarity, landedVolume);
      }
    },
    [
      activeTab,
      tuner.volume,
      tuner.similarity,
      tuner.activeSection,
      showTuningOverlay,
      handleVolumeChange,
      handleSimilarityChange
    ]
  );

  // When rooms swap, fade in + end the tuning overlay (after a short minimum time)
  useEffect(() => {
    const sig = Array.isArray(rooms) ? rooms.map((r) => r.id).join('|') : '';
    if (!sig || sig === lastRoomsSigRef.current) return;

    lastRoomsSigRef.current = sig;

    if (!loadingState.initialLoad) {
      triggerStationsFade();
    }

    if (isTuningOverlay) {
      hideTuningOverlaySoon();
    }
  }, [rooms, loadingState.initialLoad, triggerStationsFade, isTuningOverlay, hideTuningOverlaySoon]);

  // Auto-commit initial tuner values once feed data is ready but no rooms exist yet
  const hasAutoCommittedRef = useRef(false);
  useEffect(() => {
    if (hasAutoCommittedRef.current) return;
    if (loadingState.initialLoad) return; // still loading
    if (rooms.length > 0) return; // rooms already exist
    // Feed finished loading but produced no rooms — trigger generation with current tuner values
    if (!loadingState.similarArtists && !loadingState.roomGeneration) {
      hasAutoCommittedRef.current = true;
      console.log('[RoomsScreen] auto-committing initial tuner values');
      handleSimilarityChange(tuner.similarity, tuner.volume);
    }
  }, [loadingState, rooms.length, tuner.similarity, tuner.volume, handleSimilarityChange]);

  // Auto-select target room when rooms change
  useEffect(() => {
    if (rooms.length > 0 && activeTab === 'tuned') {
      const targetRoom = rooms.find((room) => room.isTargetRoom);
      if (targetRoom) {
        setSelectedRoom(targetRoom);
      } else {
        setSelectedRoom(rooms[0]);
      }
    } else {
      setSelectedRoom(null);
    }
  }, [rooms, activeTab]);

  // Handle tuner value changes from RadioTuner:
  // - UI updates immediately
  // - rooms commit after a short pause (same as simple dial)
  const handleTunerChange = useCallback(
    (payload) => {
      setTuner((current) => ({
        ...current,
        ...payload
      }));

      if (activeTab !== 'tuned') return;

      if (payload.previewOnly) {
        return;
      }

      if (payload.commitNow) {
        commitTuningSelection(payload);
      }
    },
    [activeTab, commitTuningSelection]
  );

  // Handle simple dial volume change (preview only)
  const handleDialVolumeChange = useCallback(
    (newVolume) => {
      setTuner((current) => ({
        ...current,
        volume: newVolume,
        activeSection: 'volume'
      }));
    },
    []
  );

  // Handle simple dial similarity change (preview only)
  const handleDialSimilarityChange = useCallback(
    (newSimilarity) => {
      setTuner((current) => ({
        ...current,
        similarity: newSimilarity,
        activeSection: 'similarity'
      }));
    },
    []
  );

  // Handle tab changes
  const handleTabChange = useCallback(
    async (tab) => {
      if (tab === activeTab) return;
      if (tab === 'recents') return;

      setActiveTab(tab);

      if (tab === 'trending' && trendingRooms.length === 0) {
        const reqId = ++trendingReqIdRef.current;
        setTabLoading((prev) => ({ ...prev, trending: true }));
        try {
          const trending = await generateTrendingRooms(8);
          if (reqId === trendingReqIdRef.current) {
            setTrendingRooms(trending);
          }
        } catch (error) {
          console.error('Failed to load trending rooms:', error);
        } finally {
          if (reqId === trendingReqIdRef.current) {
            setTabLoading((prev) => ({ ...prev, trending: false }));
          }
        }
      }
    },
    [activeTab, trendingRooms.length]
  );

  // Handle room joining
  const handleJoinRoom = useCallback(
    (station) => {
      console.log('Joining room with full data:', station);

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

      onJoinRoom(roomData);
    },
    [onJoinRoom]
  );

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

  // Keep tuner interactive even during loading
  const isBusy = false;

  const showInitialSkeleton = activeTab === 'tuned' && loadingState.initialLoad && rooms.length === 0;
  const showTuningOverlayInFeed = activeTab === 'tuned' && isTuningOverlay;
  const showFeedLoadingOverlay = activeTab !== 'tuned' && getCurrentLoading() && !showInitialSkeleton && !showTuningOverlayInFeed;
  const initialLoadProgress = Math.max(0, Math.min(100, Math.round(loadingState.progress || 0)));
  const initialLoadLabel = getInitialLoadLabel({
    progress: initialLoadProgress,
    loadingState,
    hasSelectedArtists: selectedArtists.length > 0
  });

  return (
    <div className="radio-rooms-container">
      {/* Header with Back button and Info icon */}
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>
      <div className="radio-info-button">
        <InfoIconModal
          title="Rooms"
          modalId="rooms-screen-modal"
          iconSize={32}
          showButtonText={false}
          steps={[
            {
              title: 'MUFL Radio',
              content:
                "MUFL Radio lets you tune Volume + Similarity to quickly discover rooms that match your taste - from super close picks to left-field finds. As you scan, the station list refreshes like an FM dial, and you can jump into any room to trade 30-second Apple Music snippets and swipe/rate with other listeners."
            }
          ]}
        />
      </div>

      {/* Selected Artists */}
      {selectedArtists.length > 0 && (
        <div className={`selected-artists-container ${(activeTab !== 'tuned' || isBusy) ? 'disabled' : ''}`}>
          <h2>Selected Artists</h2>
          <div className="selected-artists-list">
            {selectedArtists.map((artist) => (
              <div key={artist.id} className="selected-artist-card">
                <img src={artist.image} alt={artist.name} className="selected-artist-image" />
                <span className="selected-artist-name">{artist.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Centered Dial Tuner */}
      <SimpleTunerDial
        volume={tuner.volume}
        similarity={tuner.similarity}
        onVolumeChange={handleDialVolumeChange}
        onSimilarityChange={handleDialSimilarityChange}
        onCommit={({ volume, similarity }) =>
          commitTuningSelection({
            volume,
            similarity,
            activeSection: 'similarity'
          })
        }
        onExpandClick={() => setIsTunerExpanded((prev) => !prev)}
        isExpanded={isTunerExpanded}
        disabled={activeTab !== 'tuned' || isBusy}
        dialLocked={isTunerExpanded}
        size={100}
      />

      {/* Expanded Advanced Tuner */}
      {isTunerExpanded && (
        <div className={`tuner-container expanded ${(activeTab !== 'tuned' || isBusy) ? 'disabled' : ''}`}>
          <div className="tuner-container__info">
            <InfoIconModal
              title="Radio"
              modalId="rooms-expanded-radio-tuner-modal"
              showButtonText={false}
              steps={RADIO_TUNER_INFO_STEPS}
            />
          </div>
          <div className="tuner-wrapper">
            <RadioTuner
              initialVolume={tuner.volume}
              initialSimilarity={tuner.similarity}
              onChange={handleTunerChange}
              rulerWidth={1600}
              disabled={activeTab !== 'tuned' || isBusy}
            />
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs-navigation">
          <TabButton active={activeTab === 'tuned'} onClick={() => handleTabChange('tuned')}>
            Tuned Stations
          </TabButton>
          <TabButton active={activeTab === 'trending'} onClick={() => handleTabChange('trending')} disabled>
            Trending
          </TabButton>
          <TabButton active={activeTab === 'recents'} onClick={() => handleTabChange('recents')} disabled={true}>
            Recents
          </TabButton>
        </div>
      </div>

      {/* Info messages for tuned tab */}
      {activeTab === 'tuned' && selectedRoom && (
        <div className="mode-info-message">
          <p>
            Tuned to volume {tuner.volume} • Landed on similarity {Math.round(currentSimilarity)}
            {selectedRoom.isTargetRoom && <span> • Selected station: {selectedRoom.name}</span>}
          </p>
        </div>
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

      {/* Stations Feed */}
      <div className="feed-section">
        {showFeedLoadingOverlay && (
          <FeedOverlay label={activeTab === 'trending' ? 'Loading trending...' : 'Loading...'} />
        )}

        {showTuningOverlayInFeed && <FeedOverlay label="Tuning..." showSpinner={false} />}

        {showInitialSkeleton ? (
          <div className="initial-loading-stack">
            <div className="initial-load-panel">
              <div className="initial-load-header">
                <span className="initial-load-kicker">Loading stations</span>
                <span className="initial-load-percentage">{initialLoadProgress}%</span>
              </div>
              <div className="initial-load-bar" aria-hidden="true">
                <div
                  className="initial-load-fill"
                  style={{ width: `${initialLoadProgress}%` }}
                />
              </div>
              <p className="initial-load-status">{initialLoadLabel}</p>
            </div>
            <StationsSkeletonList count={8} />
          </div>
        ) : (
          <div className={`stations-list ${stationsFadeIn ? 'fade-in' : ''}`}>
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
                    ? 'No stations found. Try adjusting the tuner or check your selection.'
                    : `No ${activeTab} stations available.`}
                </p>
                {activeTab === 'tuned' && (
                  <button className="retry-button" onClick={regenerateRooms}>
                    Regenerate Stations
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsScreen;
