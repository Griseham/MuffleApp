import React, { useState, useRef, useEffect } from 'react';
import { Play, Music, Pause, X, Search, Send, Disc } from 'lucide-react';
import { Info } from "lucide-react";
import InfoIconModal from "../InfoIconModal";
import { validateAndSanitizeInput, sanitizeSearchQuery, checkRateLimit } from '../../utils/security';


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
  const [audioElement, setAudioElement] = useState(null);
  
  // Refs
  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);
  
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
      if (audioElement && isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      }
    }
  };

  // Function to select a song from search results
  const handleSelectSong = (song) => {
    setSelectedSong(song);
    setShowSongSearch(false);
    
    // Stop audio if playing when song is selected
    if (audioElement && isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  // Function to handle song preview
  const handlePreviewToggle = (song) => {
    const previewUrl = song?.attributes?.previews?.[0]?.url;
    if (!previewUrl) return;
    
    // If already playing this song, pause it
    if (isPlaying && audioElement && song.id === selectedSong?.id) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }
    
    // Create or update audio element
    let audio = audioElement;
    if (!audio) {
      audio = new Audio(previewUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      setAudioElement(audio);
    } else {
      audio.src = previewUrl;
    }
    
    // Play the audio
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.error("Error playing audio:", err);
    });
  };

  // Clear selected song
  const clearSelectedSong = () => {
    // Stop audio if playing
    if (audioElement && isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    }
    setSelectedSong(null);
  };

  // Function to handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Rate limiting check
    if (!checkRateLimit('music_search', 20, 60000)) {
      console.warn('Search rate limit exceeded');
      return;
    }
    
    // Sanitize search query
    const sanitizedQuery = sanitizeSearchQuery(searchQuery);
    if (!sanitizedQuery) {
      console.warn('Invalid search query');
      return;
    }
    
    setIsSearching(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/apple-music-search?query=${encodeURIComponent(sanitizedQuery)}`);
      const data = await resp.json();
      
      if (data.success && data.data) {
        // Store as an array for multiple results
        setSearchResults([data.data]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching for music:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Debounced search as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const debounceTimer = setTimeout(() => {
      handleSearch();
    }, 300); // Reduced to 300ms for faster response
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

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
      console.warn('Comment submission rate limit exceeded');
      return;
    }
    
    // Validate and sanitize comment
    const validation = validateAndSanitizeInput(comment, {
      maxLength: 2000,
      minLength: 0,
      type: 'comment'
    });
    
    if (!validation.isValid) {
      console.warn('Invalid comment:', validation.error);
      return;
    }
    
    setIsSubmitting(true);
    
    // Create a new comment object
    const newComment = {
      id: `temp_${Date.now()}`,
      author: 'You',
      body: validation.sanitized,
      createdUtc: Date.now() / 1000,
      likes: 0,
      replies: 0,
      postType: 'thread'
    };
    
    // If there's a selected song, attach it to the comment
    if (selectedSong) {
      newComment.snippet = {
        id: selectedSong.id,
        name: selectedSong.attributes?.name || "Unknown Song",
        artistName: selectedSong.attributes?.artistName || "Unknown Artist",
        artwork: selectedSong.attributes?.artwork?.url
          ?.replace("{w}", "100")
          ?.replace("{h}", "100") || "/threads/assets/default-artist.png",
        previewUrl: selectedSong.attributes?.previews?.[0]?.url || null
      };
    }
    
    // Call the parent's onSubmit function
    if (onSubmit) {
      onSubmit(newComment);
    }
    
    // Reset the input and search state
    setComment('');
    setSelectedSong(null);
    setSearchQuery('');
    setSearchResults([]);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsSubmitting(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        {/* User Avatar */}
        <div style={styles.avatarContainer}>
          <img 
            src="/threads/assets/user.png" 
            alt="Your avatar" 
            style={styles.avatar}
          />
        </div>
        
        {/* Input Area */}
        <div style={styles.inputContainer}>
          {/* Text Input */}
          <textarea
            ref={textareaRef}
            placeholder="What's on your mind about music?"
            value={comment}
            onChange={handleInput}
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
                    src={selectedSong.attributes.artwork?.url
                      ?.replace("{w}", "100")
                      ?.replace("{h}", "100") || "/threads/assets/default-artist.png"}
                    alt={selectedSong.attributes.name}
                    style={styles.snippetImage}
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
                  <button
                    onClick={clearSelectedSong}
                    style={styles.removeButton}
                    title="Remove"
                  >
                    <X size={16} color="#fff" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Bar with Icons and Submit Button */}
          <div style={styles.actionsRow}>
          <div style={styles.iconsContainer}>
  {/* Snippet Card Button with Info Modal */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <button 
      style={styles.snippetButton}
      onClick={handleOpenTikTokModal}
      title="Add Snippet Card"
    >
      <Disc size={18} color="#fff" />
    </button>
    <InfoIconModal
      title="TikTok Modal"
      iconSize={14}
      showButtonText={false}
      steps={[
        {
          icon: <Disc size={18} color="#a9b6fc" />,
          title: "TikTok Style Interface",
          content: "TikTok style interface where users can scroll through music recommendations from all the active threads throughout the entire app"
        },
        {
          icon: <Search size={18} color="#a9b6fc" />,
          title: "Join Threads",
          content: "Title of the thread where this song recommendations came from, click it to join the thread"
        }
      ]}
    />
  </div>
  
  {/* Music Search Button with Info Modal */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <button 
      style={{
        ...styles.musicButton,
        backgroundColor: showSongSearch ? 'rgba(91, 111, 232, 0.3)' : '#2c324a'
      }}
      onClick={handleMusicSearchToggle}
      title={showSongSearch ? "Close music search" : "Search music"}
    >
      <Music size={18} color={showSongSearch ? "#fff" : "#5b6fe8"} />
    </button>
    <InfoIconModal
      title="Add a Song"
      iconSize={14}
      showButtonText={false}
      steps={[
        {
          icon: <Music size={18} color="#a9b6fc" />,
          title: "Apple Music API",
          content: "Add a song to your post by using the Apple Music API"
        }
      ]}
    />
  </div>
</div>
            
            {/* Post Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!comment.trim() && !selectedSong)}
              style={{
                ...(comment.trim() || selectedSong) && !isSubmitting
                  ? styles.postButton
                  : styles.postButtonDisabled
              }}
            >
              <span style={{ marginRight: '6px' }}>Share</span>
              <Send size={14} color="#fff" />
            </button>
          </div>
          
          {/* Song Search Box */}
          {showSongSearch && (
            <div style={styles.songSearchContainer}>
              {/* Search input */}
              <div style={styles.searchInputRow}>
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
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(58, 91, 160, 0.25)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(58, 91, 160, 0.15)'}
                    >
                      <div style={styles.resultImageContainer}>
                        <img
                          src={song.attributes.artwork?.url
                            ?.replace("{w}", "100")
                            ?.replace("{h}", "100") || "/threads/assets/default-artist.png"}
                          alt={song.attributes.name}
                          style={styles.resultImage}
                        />
                      </div>
                      <div style={styles.resultInfo}>
                        <div style={styles.songTitle}>{song.attributes.name}</div>
                        <div style={styles.artistName}>{song.attributes.artistName}</div>
                      </div>
                      <div style={styles.resultActions}>
                        {/* Preview button */}
                        <button
                          style={styles.previewButton}
                          title={isPlaying && selectedSong?.id === song.id ? "Pause preview" : "Preview song"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewToggle(song);
                          }}
                        >
                          {isPlaying && selectedSong?.id === song.id ? 
                            <Pause size={18} color="#fff" /> : 
                            <Play size={18} color="#fff" />}
                        </button>
                        
                        {/* Add button */}
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
                  <p style={styles.noResultsText}>No results found for "{searchQuery}"</p>
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
    </div>
  );
};

const styles = {
  container: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '12px',
    backgroundColor: 'rgba(16, 18, 30, 0.7)',
    backgroundImage: 'linear-gradient(to bottom, rgba(58, 91, 160, 0.1), rgba(16, 18, 30, 0.7))',
    borderRadius: '12px',
  },
  innerContainer: {
    display: 'flex',
  },
  avatarContainer: {
    marginRight: '12px',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(58, 91, 160, 0.5)',
  },
  inputContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  textInput: {
    width: '100%',
    backgroundColor: 'rgba(16, 18, 30, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '12px',
    color: '#e7e9ea',
    fontSize: '15px',
    lineHeight: '22px',
    resize: 'none',
    outline: 'none',
    minHeight: '42px',
    overflow: 'hidden',
    marginBottom: '8px',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  
  // Action row
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
  },
  iconsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  snippetButton: {
    width: '36px',
    height: '36px',
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
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButton: {
    color: 'white',
    border: 'none',
    borderRadius: '9999px',
    padding: '8px 16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 8px rgba(58, 91, 160, 0.3)',
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.2s',
    backgroundImage: 'linear-gradient(to right, #3a5ba0, #5b6fe8)',
  },
  postButtonDisabled: {
    backgroundColor: 'rgba(58, 91, 160, 0.5)',
    color: 'rgba(255, 255, 255, 0.6)',
    border: 'none',
    borderRadius: '9999px',
    padding: '8px 16px',
    fontWeight: 'bold',
    cursor: 'not-allowed',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
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
    padding: '16px',
    backgroundColor: 'rgba(16, 18, 30, 0.8)',
    backgroundImage: 'linear-gradient(to bottom, rgba(26, 32, 55, 0.9), rgba(16, 18, 30, 0.9))',
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(58, 91, 160, 0.3)',
    maxHeight: '300px',
    overflowY: 'auto',
    position: 'relative',
  },
  searchInputRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    alignItems: 'center',
    position: 'relative',
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
    fontSize: '14px',
    outline: 'none',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
  },
  
  // Empty search state
  emptySearchContainer: {
    padding: '20px',
    textAlign: 'center',
  },
  emptySearchText: {
    fontSize: '14px',
    color: '#a0aec0',
  },
  
  // Search results
  searchResultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
  resultImageContainer: {
    width: '44px',
    height: '44px',
    borderRadius: '6px',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  resultImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  resultInfo: {
    flex: 1,
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
};

export default MusicCommentComposer;