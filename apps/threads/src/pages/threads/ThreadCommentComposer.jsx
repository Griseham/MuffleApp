import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Music, Pause, X, Search, Disc, Send } from 'lucide-react';
import InfoIconModal from '../../components/InfoIconModal';
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
const COMPACT_PHONE_BREAKPOINT = 420;

function useViewportMatch(maxWidth = MOBILE_BREAKPOINT) {
  const [isMatch, setIsMatch] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= maxWidth;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const handler = (event) => setIsMatch(event.matches);
    setIsMatch(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
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

const MusicCommentComposer = ({ onSubmit, onOpenTikTokModal, themeVariant = 'thread' }) => {
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
  
  // Refs
  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);
  const audioRef = useRef(null);
  const searchAbortControllerRef = useRef(null);
  const latestSearchRequestRef = useRef(0);
  const isMobile = useViewportMatch(MOBILE_BREAKPOINT);
  const isCompactPhone = useViewportMatch(COMPACT_PHONE_BREAKPOINT);
  const isParameterTheme = themeVariant === 'parameter';

  const commentPlaceholder = 'Make a reply';
  const isSearchIdle = !searchQuery.trim() && !isSearching && searchResults.length === 0;

  const searchPlaceholder = isMobile
    ? (isCompactPhone ? 'Search songs or artists...' : 'Search artists, songs, albums...')
    : 'Search for artists, songs, or albums...';

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
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {
      cancelPendingSearch();
      stopAudioPlayback(true);
    }
  };

  // Function to select a song from search results
  const handleSelectSong = (song) => {
    setSelectedSong(song);
    setShowSongSearch(false);
    setPreviewingSongId(null);
    
    cancelPendingSearch();
    stopAudioPlayback(true);
  };

  // Function to handle song preview
  const handlePreviewToggle = (song) => {
    const previewUrl = song?.attributes?.previews?.[0]?.url;
    if (!previewUrl) return;
    
    const audio = getAudioElement();

    if (isPlaying && song.id === previewingSongId) {
      stopAudioPlayback(true);
      return;
    }
    
    audio.pause();
    audio.currentTime = 0;
    audio.src = previewUrl;
    
    audio.play().then(() => {
      setIsPlaying(true);
      setPreviewingSongId(song.id);
    }).catch(_err => { /* intentionally empty */ });
  };

  // Clear selected song
  const clearSelectedSong = () => {
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
    }, 300);
    
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

    let inputValue = e.target.value;
    
    if (inputValue.length > 2000) {
      inputValue = inputValue.substring(0, 2000);
    }
    
    setComment(inputValue);
    
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  // Handle search input changes
  const handleSearchInput = (e) => {
    let inputValue = e.target.value;
    
    if (inputValue.length > 200) {
      inputValue = inputValue.substring(0, 200);
    }
    
    setSearchQuery(inputValue);
  };

  const _handleSubmit = () => {
    if (!comment.trim() && !selectedSong) return;
    
    if (!checkRateLimit('comment_submit', 5, 60000)) {
      
      return;
    }
    
    const validation = validateAndSanitizeInput(comment, {
      maxLength: 2000,
      minLength: 0,
      type: 'comment'
    });
    
    if (!validation.isValid) {
      
      return;
    }
    
    setIsSubmitting(true);
    
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
    
    if (selectedSong) {
      newComment.snippet = buildSnippetFromSong(selectedSong);
    }
    
    if (onSubmit) {
      onSubmit(newComment);
    }

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

  const responsiveStyles = useMemo(() => {
    if (!isMobile) {
      return styles;
    }

    const mobileAvatarSize = isCompactPhone ? 34 : 38;
    const mobileInnerGap = isCompactPhone ? 10 : 12;
    const mobileContentOffset = mobileAvatarSize + mobileInnerGap;

    return {
      ...styles,
      container: {
        ...styles.container,
        padding: isCompactPhone ? '12px' : '14px',
        borderRadius: '16px',
      },
      sectionLabel: {
        ...styles.sectionLabel,
        paddingBottom: '10px',
        marginBottom: '12px',
        fontSize: '11px',
      },
      innerContainer: {
        ...styles.innerContainer,
        gap: `${mobileInnerGap}px`,
      },
      avatar: {
        ...styles.avatar,
        width: `${mobileAvatarSize}px`,
        height: `${mobileAvatarSize}px`,
      },
      textInput: {
        ...styles.textInput,
        padding: isCompactPhone ? '12px' : '12px 14px',
        fontSize: '14px',
        minHeight: '52px',
      },
      attachedSnippetInner: {
        ...styles.attachedSnippetInner,
        gap: isCompactPhone ? '8px' : '10px',
        padding: isCompactPhone ? '8px 10px' : '9px 10px',
      },
      snippetImageContainer: {
        ...styles.snippetImageContainer,
        width: isCompactPhone ? '38px' : '40px',
        height: isCompactPhone ? '38px' : '40px',
      },
      snippetTitle: {
        ...styles.snippetTitle,
        fontSize: '13px',
      },
      snippetArtist: {
        ...styles.snippetArtist,
        fontSize: '11px',
      },
      snippetActions: {
        ...styles.snippetActions,
        gap: '6px',
      },
      previewButtonSmall: {
        ...styles.previewButtonSmall,
        width: '30px',
        height: '30px',
      },
      removeButton: {
        ...styles.removeButton,
        width: '30px',
        height: '30px',
      },
      actionsRow: {
        ...styles.actionsRow,
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        marginTop: '10px',
        gap: isCompactPhone ? '6px' : '8px',
        width: '100%',
        marginLeft: 0,
      },
      actionButtonsContainer: {
        ...styles.actionButtonsContainer,
        width: 'auto',
        maxWidth: 'none',
        flex: '1 1 auto',
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
        gap: isCompactPhone ? '6px' : '8px',
        flexWrap: 'nowrap',
      },
      actionButtonWithInfo: {
        ...styles.actionButtonWithInfo,
        alignItems: 'stretch',
        position: 'relative',
        flex: '1 1 0',
        minWidth: 0,
      },
      actionInfoIcon: {
        ...styles.actionInfoIcon,
        display: 'none',
      },
      snippetButton: {
        ...styles.snippetButton,
        width: '100%',
        justifyContent: 'center',
        borderRadius: '999px',
        padding: isCompactPhone ? '7px 8px' : '8px 10px',
      },
      musicButton: {
        ...styles.musicButton,
        width: '100%',
        justifyContent: 'center',
        borderRadius: '999px',
        padding: isCompactPhone ? '7px 8px' : '8px 10px',
      },
      buttonIconWrapper: {
        ...styles.buttonIconWrapper,
        width: isCompactPhone ? '19px' : '20px',
        height: isCompactPhone ? '19px' : '20px',
        borderRadius: '999px',
      },
      buttonLabel: {
        ...styles.buttonLabel,
        fontSize: isCompactPhone ? '10px' : '11px',
      },
      submitButton: {
        ...styles.submitButton,
        width: 'auto',
        maxWidth: 'none',
        justifyContent: 'center',
        alignSelf: 'stretch',
        marginLeft: 0,
        padding: isCompactPhone ? '8px 12px' : '8px 14px',
      },
      submitButtonDisabled: {
        ...styles.submitButtonDisabled,
        width: 'auto',
        maxWidth: 'none',
        justifyContent: 'center',
        alignSelf: 'stretch',
        marginLeft: 0,
        padding: isCompactPhone ? '8px 12px' : '8px 14px',
      },
      songSearchContainer: {
        ...styles.songSearchContainer,
        marginTop: '10px',
        padding: isCompactPhone ? '10px' : '11px',
        maxHeight: '300px',
        borderRadius: '12px',
        backgroundColor: 'rgba(7, 12, 30, 0.86)',
        border: '1px solid rgba(91, 111, 232, 0.26)',
        width: `calc(100% + ${mobileContentOffset}px)`,
        marginLeft: `-${mobileContentOffset}px`,
        boxSizing: 'border-box',
      },
      searchInputRow: {
        ...styles.searchInputRow,
        margin: '0 0 10px',
        width: '100%',
      },
      searchInput: {
        ...styles.searchInput,
        padding: '10px 34px 10px 36px',
        backgroundColor: 'rgba(17, 27, 49, 0.7)',
        borderColor: 'rgba(169, 182, 252, 0.2)',
        borderRadius: '10px',
        fontSize: '13px',
        width: '100%',
        boxSizing: 'border-box',
      },
      searchClearButton: {
        ...styles.searchClearButton,
        width: '16px',
        height: '16px',
      },
      searchIcon: {
        ...styles.searchIcon,
        left: '12px',
      },
      searchResultsList: {
        ...styles.searchResultsList,
        gap: '6px',
        maxHeight: '176px',
        overflowY: 'auto',
      },
      searchResultContainer: {
        ...styles.searchResultContainer,
        gap: '8px',
        padding: isCompactPhone ? '7px 8px' : '8px 9px',
        borderRadius: '10px',
      },
      resultImageContainer: {
        ...styles.resultImageContainer,
        width: isCompactPhone ? '36px' : '38px',
        height: isCompactPhone ? '36px' : '38px',
        borderRadius: '8px',
      },
      songTitle: {
        ...styles.songTitle,
        fontSize: isCompactPhone ? '12px' : '13px',
      },
      artistName: {
        ...styles.artistName,
        fontSize: isCompactPhone ? '10px' : '11px',
      },
      resultActions: {
        ...styles.resultActions,
        gap: '6px',
      },
      previewButton: {
        ...styles.previewButton,
        width: isCompactPhone ? '28px' : '30px',
        height: isCompactPhone ? '28px' : '30px',
      },
      addButton: {
        ...styles.addButton,
        borderRadius: '999px',
        padding: isCompactPhone ? '5px 8px' : '5px 10px',
        fontSize: isCompactPhone ? '10px' : '11px',
      },
      emptySearchContainer: {
        ...styles.emptySearchContainer,
        padding: '14px',
      },
      searchIdleContainer: {
        ...styles.searchIdleContainer,
        minHeight: isCompactPhone ? '96px' : '104px',
        padding: isCompactPhone ? '14px 8px' : '16px 10px',
      },
      searchIdleIconWrap: {
        ...styles.searchIdleIconWrap,
        width: isCompactPhone ? '32px' : '34px',
        height: isCompactPhone ? '32px' : '34px',
      },
      searchIdleText: {
        ...styles.searchIdleText,
        fontSize: isCompactPhone ? '11px' : '12px',
      },
      noResultsContainer: {
        ...styles.noResultsContainer,
        padding: '12px',
      },
      songSearchContainerIdle: {
        ...styles.songSearchContainerIdle,
        minHeight: isCompactPhone ? '138px' : '150px',
      },
    };
  }, [isMobile, isCompactPhone]);

  const musicButtonThemeStyles = useMemo(() => {
    if (!isParameterTheme) {
      return {
        base: null,
        active: null,
        iconActive: null,
      };
    }

    return {
      base: {
        borderColor: 'rgba(0, 196, 180, 0.35)',
        backgroundColor: 'rgba(0, 196, 180, 0.08)',
      },
      active: {
        backgroundColor: 'rgba(0, 196, 180, 0.16)',
        borderColor: 'rgba(0, 196, 180, 0.6)',
      },
      iconActive: {
        background: 'linear-gradient(135deg, #00C4B4, #0ea5a6)',
      },
    };
  }, [isParameterTheme]);

  return (
    <div style={responsiveStyles.container}>
      <div style={responsiveStyles.sectionLabel}>
        <div style={responsiveStyles.labelDot} />
        <span>Add a Response</span>
      </div>
      
      <div style={responsiveStyles.innerContainer}>
        {/* User Avatar */}
        <div style={responsiveStyles.avatarContainer}>
          <img 
            src={CURRENT_USER_AVATAR}
            alt="Me avatar"
            style={responsiveStyles.avatar}
          />
        </div>
        
        {/* Input Area */}
        <div style={responsiveStyles.inputContainer}>
          {/* Text Input */}
          <textarea
            ref={textareaRef}
            className="composer-textarea"
            placeholder={commentPlaceholder}
            value={comment}
            onChange={handleInput}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                _handleSubmit();
              }
            }}
            style={responsiveStyles.textInput}
            rows={1}
            maxLength={2000}
          />
          
          {/* Attached Snippet Preview (if selected) */}
          {selectedSong && (
            <div style={responsiveStyles.attachedSnippetContainer}>
              <div style={responsiveStyles.attachedSnippetInner}>
                <div style={responsiveStyles.snippetImageContainer}>
                  <img
                    src={formatArtworkUrl(selectedSong.attributes.artwork?.url, 100)}
                    alt={selectedSong.attributes.name}
                    style={responsiveStyles.snippetImage}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_ARTWORK;
                    }}
                  />
                </div>
                <div style={responsiveStyles.snippetContent}>
                  <div style={responsiveStyles.snippetTitle}>{selectedSong.attributes.name}</div>
                  <div style={responsiveStyles.snippetArtist}>{selectedSong.attributes.artistName}</div>
                </div>
                <div style={responsiveStyles.snippetActions}>
                  <button
                    onClick={() => handlePreviewToggle(selectedSong)}
                    style={responsiveStyles.previewButtonSmall}
                    title={isPlaying ? "Pause" : "Preview"}
                  >
                    {isPlaying ? <Pause size={14} color="#fff" /> : <Play size={14} color="#fff" />}
                  </button>
                  <button
                    onClick={clearSelectedSong}
                    style={responsiveStyles.removeButton}
                    title="Remove"
                  >
                    <X size={14} color="#94a3b8" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Row with Prominent Buttons */}
          <div style={responsiveStyles.actionsRow}>
            <div style={responsiveStyles.actionButtonsContainer}>
              <div style={responsiveStyles.actionButtonWithInfo}>
                {/* TikTok/Snippets Browser Button */}
                <button 
                  style={responsiveStyles.snippetButton}
                  onClick={handleOpenTikTokModal}
                  title="Browse Snippets"
                >
                  <div style={responsiveStyles.buttonIconWrapper}>
                    <Disc size={16} color="#fff" />
                  </div>
                  <span style={responsiveStyles.buttonLabel}>Snippets</span>
                </button>
                <div style={responsiveStyles.actionInfoIcon}>
                  <InfoIconModal
                    modalId="thread-comment-composer-snippets-info"
                    title="Snippets"
                    iconSize={isCompactPhone ? 12 : 14}
                    showButtonText={false}
                    steps={[
                      {
                        icon: <Disc size={18} color="#a9b6fc" />,
                        title: "Snippets",
                        content: "Quickly scroll through recommended songs in threads this thread.",
                      },
                    ]}
                  />
                </div>
              </div>
              
              <div style={responsiveStyles.actionButtonWithInfo}>
                {/* Apple Music / Add Music Button */}
                <button 
                  style={{
                    ...responsiveStyles.musicButton,
                    ...(musicButtonThemeStyles.base || {}),
                    ...(showSongSearch && responsiveStyles.musicButtonActive),
                    ...(showSongSearch && musicButtonThemeStyles.active ? musicButtonThemeStyles.active : {}),
                  }}
                  onClick={handleMusicSearchToggle}
                  title={showSongSearch ? "Close music search" : "Add music"}
                >
                  <div style={{
                    ...responsiveStyles.buttonIconWrapper,
                    ...(showSongSearch && responsiveStyles.buttonIconWrapperActive),
                    ...(showSongSearch && musicButtonThemeStyles.iconActive ? musicButtonThemeStyles.iconActive : {}),
                  }}>
                    <Music size={16} color="#fff" />
                  </div>
                  <span style={responsiveStyles.buttonLabel}>Music</span>
                </button>
                <div style={responsiveStyles.actionInfoIcon}>
                  <InfoIconModal
                    modalId="thread-comment-composer-music-info"
                    title="Add music"
                    iconSize={isCompactPhone ? 12 : 14}
                    showButtonText={false}
                    steps={[
                      {
                        icon: <Music size={18} color="#a9b6fc" />,
                        title: "Add music",
                        content: "Add songs using Apple music API or downloaded content from your device.",
                      },
                    ]}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={_handleSubmit}
              disabled={isSubmitting || (!comment.trim() && !selectedSong)}
              style={
                (comment.trim() || selectedSong) && !isSubmitting
                  ? responsiveStyles.submitButton
                  : responsiveStyles.submitButtonDisabled
              }
              title="Post reply"
            >
              <span style={responsiveStyles.submitButtonText}>Reply</span>
              <Send size={14} color="#fff" />
            </button>
          </div>
          
          {/* Song Search Box */}
          {showSongSearch && (
            <div
              style={{
                ...responsiveStyles.songSearchContainer,
                ...(isSearchIdle ? responsiveStyles.songSearchContainerIdle : null),
              }}
            >
              {/* Search input */}
              <div style={responsiveStyles.searchInputRow}>
                <Search size={16} color="#64748b" style={responsiveStyles.searchIcon} />
                <input
                  ref={searchInputRef}
                  className="composer-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(searchQuery);
                    }
                  }}
                  placeholder={searchPlaceholder}
                  style={responsiveStyles.searchInput}
                  maxLength={200}
                />
                {searchQuery.trim() && (
                  <button
                    type="button"
                    style={responsiveStyles.searchClearButton}
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
              </div>

              {/* Idle state */}
              {isSearchIdle && (
                <div style={responsiveStyles.searchIdleContainer}>
                  <div style={responsiveStyles.searchIdleIconWrap}>
                    <Music size={18} color="#a9b6fc" />
                  </div>
                  <p style={responsiveStyles.searchIdleText}>
                    Search Apple Music to attach{'\n'}a song to your reply
                  </p>
                </div>
              )}
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div style={responsiveStyles.searchResultsList}>
                  {searchResults.map((song) => (
                    <div 
                      key={song.id} 
                      style={responsiveStyles.searchResultContainer}
                      onClick={() => handleSelectSong(song)}
                    >
                      <div style={responsiveStyles.resultImageContainer}>
                        <img
                          src={formatArtworkUrl(song.attributes.artwork?.url, 100)}
                          alt={song.attributes.name}
                          style={responsiveStyles.resultImage}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_ARTWORK;
                          }}
                        />
                      </div>
                      <div style={responsiveStyles.resultInfo}>
                        <div style={responsiveStyles.songTitle}>{song.attributes.name}</div>
                        <div style={responsiveStyles.artistName}>{song.attributes.artistName}</div>
                      </div>
                      <div style={responsiveStyles.resultActions}>
                        <button
                          style={responsiveStyles.previewButton}
                          title={isPlaying && previewingSongId === song.id ? "Pause preview" : "Preview song"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewToggle(song);
                          }}
                        >
                          {isPlaying && previewingSongId === song.id ? 
                            <Pause size={16} color="#fff" /> : 
                            <Play size={16} color="#fff" />}
                        </button>
                        
                        <button
                          style={responsiveStyles.addButton}
                          title="Add song to post"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSong(song);
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No results message */}
              {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
                <div style={responsiveStyles.noResultsContainer}>
                  <p style={responsiveStyles.noResultsText}>No results found for &quot;{searchQuery}&quot;</p>
                  <p style={responsiveStyles.noResultsSubtext}>Try a different search term</p>
                </div>
              )}
              
              {/* Loading state */}
              {isSearching && (
                <div style={responsiveStyles.loadingContainer}>
                  <div style={responsiveStyles.loadingSpinner}></div>
                  <p style={responsiveStyles.loadingText}>Searching...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .composer-textarea::placeholder {
          color: rgba(148, 163, 184, 0.9);
          letter-spacing: 0.02em;
        }

        .composer-search-input::placeholder {
          color: rgba(148, 163, 184, 0.82);
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    backdropFilter: 'blur(12px)',
  },
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    paddingBottom: '14px',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  labelDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
  },
  innerContainer: {
    display: 'flex',
    width: '100%',
    gap: '14px',
  },
  avatarContainer: {
    flexShrink: 0,
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(99, 102, 241, 0.3)',
  },
  inputContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  textInput: {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    display: 'block',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '14px',
    padding: '14px 16px',
    color: '#e2e8f0',
    fontSize: '15px',
    lineHeight: '1.5',
    resize: 'none',
    outline: 'none',
    minHeight: '56px',
    overflow: 'hidden',
    fontFamily: "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    transition: 'border-color 0.2s ease',
  },
  
  // Action row
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '14px',
    gap: '12px',
  },
  actionButtonsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  actionButtonWithInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
  },
  actionInfoIcon: {
    marginTop: '2px',
    flexShrink: 0,
  },
  
  // Snippet/TikTok Button — glassmorphic
  snippetButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(4px)',
  },
  
  // Music Button
  musicButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(236, 72, 153, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(4px)',
  },
  musicButtonActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: 'rgba(236, 72, 153, 0.5)',
  },
  
  buttonIconWrapper: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  buttonIconWrapperActive: {
    background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
  },
  buttonLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e2e8f0',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
    borderRadius: '9999px',
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    boxShadow: '0 10px 24px rgba(99, 102, 241, 0.24)',
  },
  submitButtonDisabled: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
    borderRadius: '9999px',
    padding: '10px 16px',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    color: 'rgba(226, 232, 240, 0.4)',
    cursor: 'not-allowed',
    fontSize: '13px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  submitButtonText: {
    lineHeight: 1,
  },
  
  // Attached snippet preview — glassmorphic
  attachedSnippetContainer: {
    marginTop: '12px',
    marginBottom: '4px',
    borderRadius: '14px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    overflow: 'hidden',
    backdropFilter: 'blur(8px)',
  },
  attachedSnippetInner: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    gap: '12px',
  },
  snippetImageContainer: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    overflow: 'hidden',
    flexShrink: 0,
    border: '1px solid rgba(255, 255, 255, 0.08)',
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
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  snippetArtist: {
    fontSize: '12px',
    color: '#64748b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  snippetActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexShrink: 0,
  },
  previewButtonSmall: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  removeButton: {
    width: '32px',
    height: '32px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  
  // Song search styles — glassmorphic
  songSearchContainer: {
    marginTop: '14px',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    maxHeight: '280px',
    overflowY: 'auto',
    backdropFilter: 'blur(12px)',
  },
  songSearchContainerIdle: {
    minHeight: '150px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  searchInputRow: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    margin: '0 auto 14px',
    width: 'min(100%, 420px)',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '12px 14px 12px 42px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: '#e2e8f0',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  },
  searchClearButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 1,
  },
  
  // Empty search state
  emptySearchContainer: {
    padding: '20px',
    textAlign: 'center',
  },
  emptySearchText: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  searchIdleContainer: {
    minHeight: '110px',
    padding: '18px 10px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  searchIdleIconWrap: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIdleText: {
    fontSize: '12px',
    color: 'rgba(148, 163, 184, 0.9)',
    lineHeight: 1.45,
    margin: 0,
    whiteSpace: 'pre-line',
  },
  
  // Search results — glassmorphic
  searchResultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  searchResultContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    transition: 'background-color 0.2s',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    cursor: 'pointer',
  },
  resultImageContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    overflow: 'hidden',
    flexShrink: 0,
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  resultImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  songTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  artistName: {
    fontSize: '12px',
    color: '#64748b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  resultActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  previewButton: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: '#e2e8f0',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  // No results state
  noResultsContainer: {
    padding: '20px',
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '4px',
  },
  noResultsSubtext: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
  },
  
  // Loading spinner — glassmorphic
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    gap: '10px',
  },
  loadingSpinner: {
    width: '24px',
    height: '24px',
    border: '2px solid rgba(99, 102, 241, 0.2)',
    borderTop: '2px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '13px',
    margin: 0,
  },
};

export default MusicCommentComposer;
