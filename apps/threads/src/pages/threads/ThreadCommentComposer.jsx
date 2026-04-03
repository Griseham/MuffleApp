import React, { useState, useRef, useEffect, useCallback } from 'react';
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

  return (
    <div style={styles.container}>
      <div style={styles.sectionLabel}>
        <div style={styles.labelDot} />
        <span>Add a Response</span>
      </div>
      
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
            placeholder="Reply with a song, thought, or take..."
            value={comment}
            onChange={handleInput}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                _handleSubmit();
              }
            }}
            style={styles.textInput}
            rows={1}
            maxLength={2000}
          />
          
          {/* Attached Snippet Preview (if selected) */}
          {selectedSong && (
            <div style={styles.attachedSnippetContainer}>
              <div style={styles.attachedSnippetInner}>
                <div style={styles.snippetImageContainer}>
                  <img
                    src={formatArtworkUrl(selectedSong.attributes.artwork?.url, 100)}
                    alt={selectedSong.attributes.name}
                    style={styles.snippetImage}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_ARTWORK;
                    }}
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
                    {isPlaying ? <Pause size={14} color="#fff" /> : <Play size={14} color="#fff" />}
                  </button>
                  <button
                    onClick={clearSelectedSong}
                    style={styles.removeButton}
                    title="Remove"
                  >
                    <X size={14} color="#94a3b8" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Row with Prominent Buttons */}
          <div style={styles.actionsRow}>
            <div style={styles.actionButtonsContainer}>
              <div style={styles.actionButtonWithInfo}>
                {/* TikTok/Snippets Browser Button */}
                <button 
                  style={styles.snippetButton}
                  onClick={handleOpenTikTokModal}
                  title="Browse Snippets"
                >
                  <div style={styles.buttonIconWrapper}>
                    <Disc size={16} color="#fff" />
                  </div>
                  <span style={styles.buttonLabel}>Snippets</span>
                </button>
                <div style={styles.actionInfoIcon}>
                  <InfoIconModal
                    modalId="thread-comment-composer-snippets-info"
                    title="Snippets"
                    iconSize={14}
                    showButtonText={false}
                    steps={[
                      {
                        icon: <Disc size={18} color="#a9b6fc" />,
                        title: "Snippets",
                        content: "Quickly scroll through recommended songs in threads throughout the app",
                      },
                    ]}
                  />
                </div>
              </div>
              
              <div style={styles.actionButtonWithInfo}>
                {/* Apple Music / Add Music Button */}
                <button 
                  style={{
                    ...styles.musicButton,
                    ...(showSongSearch && styles.musicButtonActive)
                  }}
                  onClick={handleMusicSearchToggle}
                  title={showSongSearch ? "Close music search" : "Add music"}
                >
                  <div style={{
                    ...styles.buttonIconWrapper,
                    ...(showSongSearch && styles.buttonIconWrapperActive)
                  }}>
                    <Music size={16} color="#fff" />
                  </div>
                  <span style={styles.buttonLabel}>Music</span>
                </button>
                <div style={styles.actionInfoIcon}>
                  <InfoIconModal
                    modalId="thread-comment-composer-music-info"
                    title="Add music"
                    iconSize={14}
                    showButtonText={false}
                    steps={[
                      {
                        icon: <Music size={18} color="#a9b6fc" />,
                        title: "Add music",
                        content: "Add songs using Apple music APi or your own downloaded content from your device",
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
                  ? styles.submitButton
                  : styles.submitButtonDisabled
              }
              title="Post reply"
            >
              <span style={styles.submitButtonText}>Reply</span>
              <Send size={14} color="#fff" />
            </button>
          </div>
          
          {/* Song Search Box */}
          {showSongSearch && (
            <div style={styles.songSearchContainer}>
              {/* Search input */}
              <div style={styles.searchInputRow}>
                <Search size={16} color="#64748b" style={styles.searchIcon} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(searchQuery);
                    }
                  }}
                  placeholder="Search for artists, songs, or albums..."
                  style={styles.searchInput}
                  maxLength={200}
                />
              </div>
              
              {/* Empty state message */}
              {!searchQuery.trim() && !isSearching && (
                <div style={styles.emptySearchContainer}>
                  <p style={styles.emptySearchText}>Start typing to search for music</p>
                </div>
              )}
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div style={styles.searchResultsList}>
                  {searchResults.map((song) => (
                    <div 
                      key={song.id} 
                      style={styles.searchResultContainer}
                      onClick={() => handleSelectSong(song)}
                    >
                      <div style={styles.resultImageContainer}>
                        <img
                          src={formatArtworkUrl(song.attributes.artwork?.url, 100)}
                          alt={song.attributes.name}
                          style={styles.resultImage}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_ARTWORK;
                          }}
                        />
                      </div>
                      <div style={styles.resultInfo}>
                        <div style={styles.songTitle}>{song.attributes.name}</div>
                        <div style={styles.artistName}>{song.attributes.artistName}</div>
                      </div>
                      <div style={styles.resultActions}>
                        <button
                          style={styles.previewButton}
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
                          style={styles.addButton}
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
                <div style={styles.noResultsContainer}>
                  <p style={styles.noResultsText}>No results found for &quot;{searchQuery}&quot;</p>
                  <p style={styles.noResultsSubtext}>Try a different search term</p>
                </div>
              )}
              
              {/* Loading state */}
              {isSearching && (
                <div style={styles.loadingContainer}>
                  <div style={styles.loadingSpinner}></div>
                  <p style={styles.loadingText}>Searching...</p>
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
  searchInputRow: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    marginBottom: '14px',
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
