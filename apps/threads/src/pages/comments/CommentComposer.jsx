import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Music, Pause, X, Search, Send, Disc } from 'lucide-react';
import InfoIconModal from "../InfoIconModal";
import { validateAndSanitizeInput, sanitizeSearchQuery, checkRateLimit } from '../../utils/security';
import { buildApiUrl } from '../../utils/api';
import {
  CURRENT_USER_AVATAR,
  CURRENT_USER_DISPLAY_NAME,
  CURRENT_USER_USERNAME,
} from '../../utils/currentUser';

const DEFAULT_ARTWORK = '/assets/default-artist.png';
const MIN_SEARCH_QUERY_LENGTH = 2;
const MOBILE_BREAKPOINT = 767;
const MOBILE_SEARCH_PANEL_OFFSET = 52;

function useViewportMatch(maxWidth = MOBILE_BREAKPOINT) {
  const [isMatch, setIsMatch] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= maxWidth;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const handleChange = (event) => setIsMatch(event.matches);
    setIsMatch(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [maxWidth]);

  return isMatch;
}

function formatArtworkUrl(url, size = 100) {
  if (!url || typeof url !== 'string') {
    return DEFAULT_ARTWORK;
  }

  return url
    .replace('{w}', String(size))
    .replace('{h}', String(size))
    .replace('{f}', 'jpg');
}

function buildSnippetFromSong(song) {
  if (!song) return null;

  const songName = song.attributes?.name || "Unknown Song";
  const artistName = song.attributes?.artistName || "Unknown Artist";
  const artworkUrl = formatArtworkUrl(song.attributes?.artwork?.url, 100);
  const previewUrl = song.attributes?.previews?.[0]?.url || null;

  return {
    id: song.id,
    commentId: null,
    name: songName,
    songName,
    artistName,
    artwork: artworkUrl,
    artworkUrl,
    previewUrl,
    userRating: null,
    avgRating: 0,
    totalRatings: 0,
    didRate: false,
    snippetData: {
      ...song,
      attributes: {
        ...song.attributes,
        name: songName,
        artistName,
        artwork: { url: artworkUrl || "" },
        previews: previewUrl ? [{ url: previewUrl }] : [],
      },
    },
  };
}

const MusicCommentComposer = ({ onSubmit, onOpenTikTokModal }) => {
  // State declarations
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSongSearch, setShowSongSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewingSongId, setPreviewingSongId] = useState(null);
  const isMobile = useViewportMatch(MOBILE_BREAKPOINT);
  const isSearchIdle = !searchQuery.trim() && !isSearching && searchResults.length === 0;
  
  // Refs
  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);
  const audioRef = useRef(null);
  const searchAbortControllerRef = useRef(null);
  const latestSearchRequestRef = useRef(0);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    setPreviewingSongId(null);
  }, []);

  const getAudioElement = useCallback(() => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.addEventListener('ended', handleAudioEnded);
      audioRef.current = audio;
    }

    return audio;
  }, [handleAudioEnded]);

  const stopAudioPlayback = useCallback((resetPreviewState = false) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (resetPreviewState) {
      setIsPlaying(false);
      setPreviewingSongId(null);
    }
  }, []);

  const abortPendingSearch = useCallback(() => {
    latestSearchRequestRef.current += 1;

    const controller = searchAbortControllerRef.current;
    if (controller) {
      controller.abort();
      searchAbortControllerRef.current = null;
    }
  }, []);

  const cancelPendingSearch = useCallback(() => {
    abortPendingSearch();
    setIsSearching(false);
  }, [abortPendingSearch]);
  
  // Function to handle TikTok modal toggle
  const handleOpenTikTokModal = () => {
    if (onOpenTikTokModal) {
      onOpenTikTokModal();
    }
  };

  // Function to handle music search toggle
  const handleMusicSearchToggle = () => {
    setShowSongSearch(!showSongSearch);
    if (!showSongSearch) {
      cancelPendingSearch();
      setSearchQuery('');
      setSearchResults([]);
      // Focus the search input when opening
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {
      // Stop audio if playing when closing
      cancelPendingSearch();
      stopAudioPlayback(true);
    }
  };

  // Function to select a song from search results
  const handleSelectSong = (song) => {
    setSelectedSong(song);
    setShowSongSearch(false);
    setPreviewingSongId(null);
    
    // Stop audio if playing when song is selected
    cancelPendingSearch();
    stopAudioPlayback(true);
  };

  // Function to handle song preview
  const handlePreviewToggle = (song) => {
    const previewUrl = song?.attributes?.previews?.[0]?.url;
    if (!previewUrl) return;
    
    const audio = getAudioElement();

    // If already playing this song, pause it
    if (isPlaying && song.id === previewingSongId) {
      stopAudioPlayback(true);
      return;
    }
    
    audio.pause();
    audio.currentTime = 0;
    audio.src = previewUrl;
    
    // Play the audio
    audio.play().then(() => {
      setIsPlaying(true);
      setPreviewingSongId(song.id);
    }).catch(() => {
      setIsPlaying(false);
      setPreviewingSongId(null);
    });
  };

  // Clear selected song
  const clearSelectedSong = () => {
    // Stop audio if playing
    stopAudioPlayback(true);
    setSelectedSong(null);
  };

  // Function to handle search
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      cancelPendingSearch();
      setSearchResults([]);
      return;
    }

    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery || sanitizedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      cancelPendingSearch();
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    abortPendingSearch();
    const requestId = latestSearchRequestRef.current + 1;
    latestSearchRequestRef.current = requestId;

    // Rate limiting check
    if (!checkRateLimit('music_search', 20, 60000)) {
      setIsSearching(false);
      return;
    }
    
    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    setIsSearching(true);
    try {
      const resp = await fetch(`${buildApiUrl("/apple-music-search")}?query=${encodeURIComponent(sanitizedQuery)}`, {
        signal: controller.signal,
      });
      const data = await resp.json();

      if (controller.signal.aborted || latestSearchRequestRef.current !== requestId) {
        return;
      }

      if (data.success && data.data) {
        const items = Array.isArray(data.data) ? data.data : [data.data];
        setSearchResults(items);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
      if (latestSearchRequestRef.current === requestId) {
        setSearchResults([]);
      }
    } finally {
      if (searchAbortControllerRef.current === controller) {
        searchAbortControllerRef.current = null;
      }
      if (!controller.signal.aborted && latestSearchRequestRef.current === requestId) {
        setIsSearching(false);
      }
    }
  }, [abortPendingSearch, cancelPendingSearch]);
  
  // Debounced search as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      cancelPendingSearch();
      setSearchResults([]);
      return;
    }

    const sanitizedQuery = sanitizeSearchQuery(searchQuery);
    if (!sanitizedQuery || sanitizedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      cancelPendingSearch();
      setSearchResults([]);
      return;
    }
    
    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300); // Reduced to 300ms for faster response
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch, cancelPendingSearch]);

  useEffect(() => {
    return () => {
      abortPendingSearch();

      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeEventListener('ended', handleAudioEnded);
        audio.src = '';
        audio.load();
        audioRef.current = null;
      }
    };
  }, [abortPendingSearch, handleAudioEnded]);

  // Auto-resize the textarea as user types
  const handleInput = (e) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Basic input validation and sanitization on-the-fly
    let inputValue = e.target.value;
    
    // Limit length immediately
    if (inputValue.length > 2000) {
      inputValue = inputValue.substring(0, 2000);
    }
    
    setComment(inputValue);
    
    // Reset height to recalculate
    textarea.style.height = 'auto';
    // Set new height based on scrollHeight
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  // Handle search input changes
  const handleSearchInput = (e) => {
    let inputValue = e.target.value;
    
    // Limit search query length
    if (inputValue.length > 200) {
      inputValue = inputValue.substring(0, 200);
    }
    
    setSearchQuery(inputValue);
  };

  const handleSubmit = () => {
    // Allow submitting if there's text or a selected song
    if (!comment.trim() && !selectedSong) return;
    
    // Rate limiting check for comment submission
    if (!checkRateLimit('comment_submit', 5, 60000)) {
      return;
    }
    
    // Validate and sanitize comment
    const validation = validateAndSanitizeInput(comment, {
      maxLength: 2000,
      minLength: 0,
      type: 'comment'
    });
    
    if (!validation.isValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Create a new comment object
    const newComment = {
      id: `temp_${Date.now()}`,
      author: CURRENT_USER_DISPLAY_NAME,
      displayName: CURRENT_USER_DISPLAY_NAME,
      username: CURRENT_USER_USERNAME,
      avatar: CURRENT_USER_AVATAR,
      body: validation.sanitized,
      createdUtc: Date.now() / 1000,
      likes: 0,
      replies: [],
      postType: 'thread'
    };
    
    // If there's a selected song, attach it to the comment
    if (selectedSong) {
      newComment.snippet = buildSnippetFromSong(selectedSong);
    }
    
    // Call the parent's onSubmit function
    if (onSubmit) {
      onSubmit(newComment);
    }
    
    // Reset the input and search state
    cancelPendingSearch();
    stopAudioPlayback(true);
    setComment('');
    setSelectedSong(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSongSearch(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsSubmitting(false);
  };

  // ─── shared search panel content (used by both mobile and desktop) ───────────
  const renderSearchPanel = () => (
    <div
      style={{
        ...styles.songSearchContainer,
        ...(isMobile ? styles.songSearchContainerMobile : null),
        ...(isSearchIdle ? styles.songSearchContainerIdle : null),
      }}
    >
      {/* Search input row */}
      <div
        style={{
          ...styles.searchInputRow,
          ...(isMobile ? styles.searchInputRowMobile : null),
        }}
      >
        {/* Clear / X button — only when there is a query */}
        {searchQuery.trim() && (
          <button
            style={styles.searchClearButton}
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              cancelPendingSearch();
              if (searchInputRef.current) searchInputRef.current.focus();
            }}
            title="Clear search"
          >
            <X size={10} color="rgba(255,255,255,0.7)" />
          </button>
        )}
        <Search size={16} color="#8899a6" style={styles.searchIcon} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchInput}
          placeholder="Search for artists, songs, or albums..."
          style={styles.searchInput}
          maxLength={200}
        />
      </div>

      {/* Idle / empty prompt */}
      {isSearchIdle && (
        <div style={styles.searchIdleContainer}>
          <div style={styles.searchIdleIconWrap}>
            <Music size={18} color="#a9b6fc" />
          </div>
          <p style={styles.searchIdleText}>Search Apple Music to attach{'\n'}a song to your reply</p>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div
          style={{
            ...styles.searchResultsList,
            ...(isMobile ? styles.searchResultsListMobile : null),
          }}
        >
          {searchResults.map((song) => (
            <div
              key={song.id}
              style={{
                ...styles.searchResultContainer,
                ...(isMobile ? styles.searchResultContainerMobile : null),
              }}
              onClick={() => handleSelectSong(song)}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(58, 91, 160, 0.25)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(58, 91, 160, 0.15)'}
            >
              <div
                style={{
                  ...styles.resultImageContainer,
                  ...(isMobile ? styles.resultImageContainerMobile : null),
                }}
              >
                <img
                  src={song.attributes.artwork?.url
                    ? formatArtworkUrl(song.attributes.artwork?.url, 100)
                    : DEFAULT_ARTWORK}
                  alt={song.attributes.name}
                  style={styles.resultImage}
                  onError={(e) => { e.currentTarget.src = DEFAULT_ARTWORK; }}
                />
              </div>
              <div style={styles.resultInfo}>
                <div
                  style={{
                    ...styles.songTitle,
                    ...(isMobile ? styles.songTitleMobile : null),
                  }}
                >
                  {song.attributes.name}
                </div>
                <div style={styles.artistName}>{song.attributes.artistName}</div>
              </div>
              <div
                style={{
                  ...styles.resultActions,
                  ...(isMobile ? styles.resultActionsMobile : null),
                }}
              >
                <button
                  style={{
                    ...styles.previewButton,
                    ...(isMobile ? styles.previewButtonMobile : null),
                  }}
                  title={isPlaying && previewingSongId === song.id ? "Pause preview" : "Preview song"}
                  onClick={(e) => { e.stopPropagation(); handlePreviewToggle(song); }}
                >
                  {isPlaying && previewingSongId === song.id
                    ? <Pause size={isMobile ? 14 : 18} color="#fff" />
                    : <Play  size={isMobile ? 14 : 18} color="#fff" />}
                </button>
                <button
                  style={{
                    ...styles.addButton,
                    ...(isMobile ? styles.addButtonMobile : null),
                  }}
                  title="Add song to post"
                  onClick={(e) => { e.stopPropagation(); handleSelectSong(song); }}
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
        <div style={styles.noResultsContainer}>
          <p style={styles.noResultsText}>No results found for &quot;{searchQuery}&quot;</p>
          <p style={styles.noResultsSubtext}>Try a different search term</p>
        </div>
      )}

      {/* Loading */}
      {isSearching && (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Searching...</p>
        </div>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        {/* User Avatar */}
        <div style={styles.avatarContainer}>
          <img
            src={CURRENT_USER_AVATAR}
            alt="Me avatar"
            style={styles.avatar}
          />
        </div>

        {/* Input Area */}
        <div style={styles.inputContainer}>
          {/* Text Input */}
          <textarea
            ref={textareaRef}
            placeholder="Make a reply"
            value={comment}
            onChange={handleInput}
            style={styles.textInput}
            rows={1}
            maxLength={2000}
          />

          {/* ── MOBILE LAYOUT ─────────────────────────────────────────── */}
          {isMobile ? (
            <>
              {/* Attached song chip (mobile) */}
              {selectedSong && (
                <div style={styles.mobileSongChip}>
                  <div style={styles.mobileSongChipArt}>
                    <img
                      src={formatArtworkUrl(selectedSong.attributes.artwork?.url, 100)}
                      alt={selectedSong.attributes.name}
                      style={styles.snippetImage}
                      onError={(e) => { e.currentTarget.src = DEFAULT_ARTWORK; }}
                    />
                  </div>
                  <div style={styles.snippetContent}>
                    <div style={styles.snippetTitle}>{selectedSong.attributes.name}</div>
                    <div style={styles.snippetArtist}>{selectedSong.attributes.artistName}</div>
                  </div>
                  <div style={styles.snippetActions}>
                    <button
                      onClick={() => handlePreviewToggle(selectedSong)}
                      style={styles.mobileSongChipPlayBtn}
                      title={isPlaying ? "Pause" : "Preview"}
                    >
                      {isPlaying ? <Pause size={12} color="#fff" /> : <Play size={12} color="#fff" />}
                    </button>
                    <button onClick={clearSelectedSong} style={styles.mobileSongChipRemoveBtn} title="Remove">
                      <X size={10} color="rgba(255,255,255,0.7)" />
                    </button>
                  </div>
                </div>
              )}

              {/* Pill action bar (mobile) */}
              <div style={styles.mobilePillBar}>
                {/* Snippet pill */}
                <button
                  style={styles.mobilePill}
                  onClick={handleOpenTikTokModal}
                  title="Add Snippet Card"
                >
                  <Disc size={13} color="rgba(91,111,232,0.9)" />
                  <span style={styles.mobilePillLabel}>Snippet</span>
                </button>

                {/* Music pill */}
                <button
                  style={{
                    ...styles.mobilePill,
                    ...(showSongSearch ? styles.mobilePillActive : null),
                  }}
                  onClick={handleMusicSearchToggle}
                  title={showSongSearch ? "Close music search" : "Search music"}
                >
                  <Music size={13} color={showSongSearch ? "#a9b6fc" : "rgba(91,111,232,0.9)"} />
                  <span
                    style={{
                      ...styles.mobilePillLabel,
                      ...(showSongSearch ? styles.mobilePillLabelActive : null),
                    }}
                  >
                    Music
                  </span>
                </button>

                {/* Share button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!comment.trim() && !selectedSong)}
                  style={{
                    ...styles.mobileShareBtn,
                    ...((comment.trim() || selectedSong) && !isSubmitting
                      ? styles.mobileShareBtnActive
                      : styles.mobileShareBtnDisabled),
                  }}
                >
                  <span style={{ marginRight: '5px' }}>Share</span>
                  <Send size={12} color="#fff" />
                </button>
              </div>

              {/* Music search panel (mobile) */}
              {showSongSearch && renderSearchPanel()}
            </>
          ) : (
            /* ── DESKTOP LAYOUT (unchanged) ─────────────────────────── */
            <>
              {/* Attached Snippet Preview */}
              {selectedSong && (
                <div style={styles.attachedSnippetContainer}>
                  <div style={styles.attachedSnippetInner}>
                    <div style={styles.snippetImageContainer}>
                      <img
                        src={formatArtworkUrl(selectedSong.attributes.artwork?.url, 100)}
                        alt={selectedSong.attributes.name}
                        style={styles.snippetImage}
                        onError={(e) => { e.currentTarget.src = DEFAULT_ARTWORK; }}
                      />
                    </div>
                    <div style={styles.snippetContent}>
                      <div style={styles.snippetTitle}>{selectedSong.attributes.name}</div>
                      <div style={styles.snippetArtist}>{selectedSong.attributes.artistName}</div>
                    </div>
                    <div style={styles.snippetActions}>
                      <button
                        onClick={() => handlePreviewToggle(selectedSong)}
                        style={styles.previewButtonSmall}
                        title={isPlaying ? "Pause" : "Preview"}
                      >
                        {isPlaying ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" />}
                      </button>
                      <button onClick={clearSelectedSong} style={styles.removeButton} title="Remove">
                        <X size={16} color="#fff" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop action bar */}
              <div style={styles.actionsRow}>
                <div style={styles.iconsContainer}>
                  {/* Snippet button */}
                  <div style={styles.controlPair}>
                    <button style={styles.snippetButton} onClick={handleOpenTikTokModal} title="Add Snippet Card">
                      <Disc size={18} color="#fff" />
                    </button>
                    <InfoIconModal
                      modalId="home-comment-composer-snippets-info"
                      title="Snippets"
                      iconSize={14}
                      showButtonText={false}
                      steps={[{
                        icon: <Disc size={18} color="#a9b6fc" />,
                        title: "Snippets",
                        content: "Quickly scroll through recommended songs in threads throughout the app",
                      }]}
                    />
                  </div>

                  {/* Music button */}
                  <div style={styles.controlPair}>
                    <button
                      style={{
                        ...styles.musicButton,
                        ...(showSongSearch ? styles.musicButtonActive : null),
                      }}
                      onClick={handleMusicSearchToggle}
                      title={showSongSearch ? "Close music search" : "Search music"}
                    >
                      <Music size={18} color={showSongSearch ? "#fff" : "#5b6fe8"} />
                    </button>
                    <InfoIconModal
                      modalId="home-comment-composer-music-info"
                      title="Add music"
                      iconSize={14}
                      showButtonText={false}
                      steps={[{
                        icon: <Music size={18} color="#a9b6fc" />,
                        title: "Add music",
                        content: "Add songs using Apple music API or downloaded content from your device.",
                      }]}
                    />
                  </div>
                </div>

                {/* Desktop post button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!comment.trim() && !selectedSong)}
                  style={
                    (comment.trim() || selectedSong) && !isSubmitting
                      ? styles.postButton
                      : styles.postButtonDisabled
                  }
                >
                  <span style={{ marginRight: '6px' }}>Share</span>
                  <Send size={14} color="#fff" />
                </button>
              </div>

              {/* Desktop search panel */}
              {showSongSearch && renderSearchPanel()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: 'clamp(10px, 2.4vw, 12px)',
    backgroundColor: 'rgba(16, 18, 30, 0.7)',
    backgroundImage: 'linear-gradient(to bottom, rgba(58, 91, 160, 0.1), rgba(16, 18, 30, 0.7))',
    borderRadius: 'clamp(10px, 2.2vw, 12px)',
  },
  innerContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'clamp(8px, 2.4vw, 12px)',
  },
  avatarContainer: {
    marginRight: 0,
    flexShrink: 0,
  },
  avatar: {
    width: 'clamp(36px, 10vw, 42px)',
    height: 'clamp(36px, 10vw, 42px)',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(58, 91, 160, 0.5)',
  },
  inputContainer: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  textInput: {
    width: '100%',
    backgroundColor: 'rgba(16, 18, 30, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 'clamp(10px, 2.2vw, 12px)',
    padding: 'clamp(10px, 2.6vw, 12px)',
    color: '#e7e9ea',
    fontSize: 'clamp(14px, 3.7vw, 15px)',
    lineHeight: '1.45',
    resize: 'none',
    outline: 'none',
    minHeight: '44px',
    overflow: 'hidden',
    marginBottom: '6px',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
    boxSizing: 'border-box',
  },
  
  // Action row
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    gap: '8px',
    flexWrap: 'wrap',
  },
  actionsRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: '10px',
    marginTop: '4px',
  },
  iconsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    flex: '1 1 170px',
    minWidth: 0,
  },
  iconsContainerMobile: {
    width: 'auto',
    flex: '0 1 auto',
    justifyContent: 'flex-start',
    gap: '8px',
  },
  controlPair: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  snippetButton: {
    width: 'clamp(34px, 8.8vw, 36px)',
    height: 'clamp(34px, 8.8vw, 36px)',
    backgroundImage: 'linear-gradient(to right, #3a5ba0, #5b6fe8)',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(58, 91, 160, 0.3)',
    transition: 'transform 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicButton: {
    width: 'clamp(34px, 8.8vw, 36px)',
    height: 'clamp(34px, 8.8vw, 36px)',
    backgroundColor: '#2c324a',
    borderRadius: '8px',
    border: '1px solid rgba(91, 111, 232, 0.35)',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicButtonActive: {
    background: 'linear-gradient(135deg, rgba(91, 111, 232, 0.62), rgba(70, 126, 255, 0.52))',
    borderColor: 'rgba(169, 182, 252, 0.9)',
    boxShadow: '0 0 0 1px rgba(169, 182, 252, 0.3), 0 6px 14px rgba(24, 41, 122, 0.45)',
  },
  postButton: {
    color: 'white',
    border: 'none',
    borderRadius: '9999px',
    padding: '8px 14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13px',
    boxShadow: '0 2px 8px rgba(58, 91, 160, 0.3)',
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.2s',
    backgroundImage: 'linear-gradient(to right, #3a5ba0, #5b6fe8)',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  postButtonDisabled: {
    backgroundColor: 'rgba(58, 91, 160, 0.5)',
    color: 'rgba(255, 255, 255, 0.6)',
    border: 'none',
    borderRadius: '9999px',
    padding: '8px 14px',
    fontWeight: 'bold',
    cursor: 'not-allowed',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  postButtonMobile: {
    marginLeft: 'auto',
    alignSelf: 'auto',
    minWidth: '92px',
    justifyContent: 'center',
  },
  
  // Attached snippet preview
  attachedSnippetContainer: {
    marginBottom: '10px',
    padding: '2px',
    borderRadius: '10px',
    border: '1px solid rgba(58, 91, 160, 0.5)',
    backgroundColor: 'rgba(16, 18, 30, 0.7)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
  },
  attachedSnippetInner: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    gap: '10px',
    borderRadius: '8px',
    backgroundImage: 'linear-gradient(to right, rgba(58, 91, 160, 0.2), rgba(16, 18, 30, 0.5))',
  },
  snippetImageContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  snippetImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  snippetContent: {
    flex: 1,
    minWidth: 0,
  },
  snippetTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  snippetArtist: {
    fontSize: '12px',
    color: '#a0aec0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  snippetActions: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  previewButtonSmall: {
    width: '28px',
    height: '28px',
    backgroundColor: '#3a5ba0',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.2s',
  },
  removeButton: {
    width: '26px',
    height: '26px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  
  // Song search styles
  songSearchContainer: {
    marginTop: '12px',
    padding: 'clamp(12px, 3.2vw, 16px)',
    backgroundColor: 'rgba(16, 18, 30, 0.8)',
    backgroundImage: 'linear-gradient(to bottom, rgba(26, 32, 55, 0.9), rgba(16, 18, 30, 0.9))',
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(58, 91, 160, 0.3)',
    maxHeight: 'min(52vh, 320px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  songSearchContainerIdle: {
    minHeight: '150px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  searchInputRow: {
    display: 'flex',
    gap: '10px',
    margin: '0 auto 16px',
    alignItems: 'center',
    position: 'relative',
    width: 'min(100%, 420px)',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 36px',
    backgroundColor: 'rgba(16, 18, 30, 0.7)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: 'clamp(13px, 3.4vw, 14px)',
    outline: 'none',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
    boxSizing: 'border-box',
  },
  
  // Empty search state
  emptySearchContainer: {
    padding: '20px',
    textAlign: 'center',
  },
  emptySearchText: {
    fontSize: '14px',
    color: '#a0aec0',
    margin: 0,
  },
  
  // Search results
  searchResultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  searchResultsListMobile: {
    gap: '6px',
    paddingRight: '2px',
  },
  searchResultContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    backgroundColor: 'rgba(58, 91, 160, 0.15)',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    border: '1px solid rgba(58, 91, 160, 0.3)',
    cursor: 'pointer',
  },
  searchResultContainerMobile: {
    gap: '8px',
    padding: '8px 9px',
  },
  resultImageContainer: {
    width: '44px',
    height: '44px',
    borderRadius: '6px',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  resultImageContainerMobile: {
    width: '40px',
    height: '40px',
  },
  resultImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
    padding: '4px 0',
  },
  songTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  songTitleMobile: {
    fontSize: '13px',
    lineHeight: 1.2,
  },
  artistName: {
    fontSize: '12px',
    color: '#a0aec0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  resultActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  resultActionsMobile: {
    gap: '6px',
  },
  previewButton: {
    width: '32px',
    height: '32px',
    backgroundColor: '#3a5ba0',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
  },
  previewButtonMobile: {
    width: '30px',
    height: '30px',
  },
  addButton: {
    backgroundImage: 'linear-gradient(to right, #3a5ba0, #5b6fe8)',
    color: 'white',
    border: 'none',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 5px rgba(58, 91, 160, 0.3)',
  },
  addButtonMobile: {
    padding: '5px 10px',
    fontSize: '11px',
  },
  
  // No results state
  noResultsContainer: {
    padding: '16px',
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: '4px',
  },
  noResultsSubtext: {
    fontSize: '12px',
    color: '#a0aec0',
  },
  
  // Loading spinner
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 0',
    gap: '8px',
  },
  loadingSpinner: {
    width: '24px',
    height: '24px',
    border: '2px solid rgba(58, 91, 160, 0.2)',
    borderTop: '2px solid #3a5ba0',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#a0aec0',
    fontSize: '13px',
  },

  // ─── Mobile pill toolbar ────────────────────────────────────────────────────
  mobilePillBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '6px',
    marginTop: '10px',
  },
  mobilePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 11px',
    borderRadius: '999px',
    border: '0.5px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  mobilePillActive: {
    background: 'rgba(91,111,232,0.25)',
    borderColor: 'rgba(169,182,252,0.65)',
  },
  mobilePillLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1,
  },
  mobilePillLabelActive: {
    color: '#a9b6fc',
  },
  mobileShareBtn: {
    display: 'flex',
    alignItems: 'center',
    border: 'none',
    borderRadius: '999px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
    flexShrink: 0,
  },
  mobileShareBtnActive: {
    backgroundImage: 'linear-gradient(135deg, #3a5ba0, #5b6fe8)',
    color: '#fff',
    cursor: 'pointer',
  },
  mobileShareBtnDisabled: {
    backgroundColor: 'rgba(58, 91, 160, 0.35)',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'not-allowed',
  },

  // ─── Mobile song chip (attached song) ──────────────────────────────────────
  mobileSongChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
    padding: '7px 10px',
    borderRadius: '10px',
    border: '0.5px solid rgba(91,111,232,0.35)',
    background: 'rgba(91,111,232,0.12)',
  },
  mobileSongChipArt: {
    width: '32px',
    height: '32px',
    borderRadius: '5px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  mobileSongChipPlayBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'rgba(91,111,232,0.3)',
    border: '0.5px solid rgba(91,111,232,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  mobileSongChipRemoveBtn: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },

  // ─── Mobile search panel ────────────────────────────────────────────────────
  songSearchContainerMobile: {
    width: `calc(100% + ${MOBILE_SEARCH_PANEL_OFFSET}px)`,
    margin: `10px 0 0 -${MOBILE_SEARCH_PANEL_OFFSET}px`,
    padding: '10px',
    borderRadius: '12px',
    maxHeight: '300px',
    background: 'rgba(14, 14, 28, 0.95)',
    border: '0.5px solid rgba(91,111,232,0.3)',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },
  searchInputRowMobile: {
    margin: '0 0 10px',
    width: '100%',
    padding: 0,
  },
  searchClearButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 1,
  },

  // ─── Idle/empty search state ─────────────────────────────────────────────────
  searchIdleContainer: {
    padding: '20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  searchIdleIconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(91,111,232,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIdleText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 1.5,
    margin: 0,
    whiteSpace: 'pre-line',
  },
};

export default MusicCommentComposer;
