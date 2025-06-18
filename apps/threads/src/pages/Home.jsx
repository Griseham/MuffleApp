import React, { useEffect, useState, useCallback } from 'react';
import { Headphones, Disc, Music, TrendingUp, Shuffle, Mic, Search, Info } from 'lucide-react';
import Starfield from '../components/Starfield';
import ThreadDetail from './threads/ThreadDetail';
import GroupChatDetail from './threads/GroupChatDetail';
import UserProfile from './user/UserProfile'; 
import HomeTikTokModal from './modals/HomeTikTokModal';
import MusicCommentComposer from './comments/CommentComposer';
import PostCard from './posts/PostCard';
import FeedInfoDisplay from '../components/FeedInfoDisplay';
import InfoIconModal from '../components/InfoIconModal';

const POST_TYPE_INDICATORS = {
  thread: { color: "#1d9bf0", label: "Thread" },
  news: { color: "#FF9500", label: "News" },
  groupchat: { color: "#FF69B4", label: "GroupChat" },
  parameter: { color: "#00C4B4", label: "Parameter" },
  tweet: { color: "#FFB6C1", label: "Tweet" }
};

// Create example post function
const createExamplePost = () => ({
  id: 'example_post_001',
  author: 'MusicLover23',
  title: 'Example post text',
  selftext: '',
  createdUtc: Date.now() / 1000,
  postType: 'thread',
  ups: 42,
  bookmarks: 15,
  num_comments: 8,
  imageUrl: null,
  username: 'MusicLover23',
  avatar: null // Let the getAvatarSrc function generate a random avatar
});

const MusicHome = () => {
  // Core state
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  
  // Navigation state
  const [selectedThread, setSelectedThread] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [navigationHistory, setNavigationHistory] = useState([]);
  
  // UI state
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [showExploreView, setShowExploreView] = useState(false);
  
  // Starfield state
  const [feedCoordinate, setFeedCoordinate] = useState({ x: 0, y: 0 });
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [feedData, setFeedData] = useState({ genres: [], artists: [] });
  
  // Cached posts tracking
  const [cachedPosts, setCachedPosts] = useState([]);
  
  // Reddit API posts tracking
  const [redditPosts, setRedditPosts] = useState([]);
  const [starfieldPosts, setStarfieldPosts] = useState([]);   // only for the background starfield

  const [isLoadingReddit, setIsLoadingReddit] = useState(false);
  const [redditPostsLoaded, setRedditPostsLoaded] = useState(false);

  useEffect(() => {
    import('../styles/homeStyles.css');
  }, []);

  useEffect(() => {
    if (currentFilter === 'all') {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.postType === currentFilter));
    }
  }, [currentFilter, posts]);

  const toggleTikTokModal = useCallback(() => setShowTikTokModal(prev => !prev), []);
  const toggleExploreView = useCallback(() => setShowExploreView(prev => !prev), []);
  
  const handleViewUserProfile = useCallback((user) => {
    setNavigationHistory(prev => [...prev, 'home']);
    setSelectedUser(user);
  }, []);
  
  const handleViewThread = useCallback((post) => {
    post.entryTransition = true;
    setNavigationHistory(prev => [...prev, 'home']);
    setSelectedThread(post);
  }, []);

  const generateFeedData = (x, y) => {
    const seed = x * 13 + y * 7;
    const genreColors = {
      "Rock": "#E63946",
      "Pop": "#FF9500",
      "Hip-Hop": "#FF4747",
      "Electronic": "#1DB954",
      "R&B": "#8338EC",
      "Jazz": "#06D6A0",
      "Metal": "#FF47DA",
      "Classical": "#3A86FF",
      "K-Pop": "#FF758F",
      "Lo-Fi": "#FF6B35",
      "Indie Rock": "#E17A9F",
      "Afrobeat": "#88CC14",
      "Synth-Pop": "#FC76FF"
    };

    const allGenres = Object.keys(genreColors);
    const primary = Math.abs((x * 7 + y * 13) % allGenres.length);
    const secondary = Math.abs((x * 13 + y * 17) % allGenres.length);
    const tertiary = Math.abs((x * 19 + y * 23) % allGenres.length);
    const quaternary = Math.abs((x * 23 + y * 29) % allGenres.length);
    const uniqueIndices = Array.from(new Set([primary, secondary, tertiary, quaternary]));

    const selectedGenres = uniqueIndices.map((index, i) => {
      const genreName = allGenres[index];
      let percentage;
      if (i === 0) percentage = 35 + (seed % 15);
      else if (i === 1) percentage = 20 + (seed % 10);
      else if (i === 2) percentage = 10 + (seed % 10);
      else percentage = 5 + (seed % 5);
      return {
        name: genreName,
        color: genreColors[genreName],
        percentage
      };
    });

    const artists = selectedGenres.flatMap(genre => {
      const artistCount = 2 + Math.floor((seed + genre.name.length) % 2);
      return Array.from({ length: artistCount }, (_, i) => {
        const artistId = `artist-${genre.name.toLowerCase()}-${i}-${seed % 100}`;
        return {
          id: artistId,
          name: `${genre.name} Artist ${i + 1}`,
          genre: genre.name,
          imageUrl: `/assets/image${Math.abs(artistId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100) + 1}.png`
        };
      });
    });

    return { genres: selectedGenres, artists };
  };

  const handleStarfieldLoadFeed = useCallback(({ x, y }) => {
    setFeedCoordinate({ x, y });
    const newFeedData = generateFeedData(x, y);
    setFeedData(newFeedData);
    setFeedLoaded(true);
  }, []);

  const [jumpGenre, setJumpGenre] = useState(null);

  const handleLoadGenreFeed = useCallback((genreName) => {
    setFeedData({
      genres : [{ name: genreName, color: '#1DB954', percentage: 100 }],
      artists: []
    });
    setJumpGenre(genreName);
  }, []);

  const handleCommentSubmit = useCallback((newComment) => {
    const newPost = {
      id: `user_post_${Date.now()}`,
      author: 'You',
      title: newComment.body,
      selftext: '',
      createdUtc: Date.now() / 1000,
      postType: 'thread',
      ups: 0,
      num_comments: 0,
      imageUrl: null
    };
    
    if (newComment.snippet) {
      newPost.snippet = newComment.snippet;
    }
    
    setPosts(prevPosts => [newPost, ...prevPosts]);
    
    setFilteredPosts(prevFiltered => {
      if (currentFilter === 'all' || currentFilter === 'thread') {
        return [newPost, ...prevFiltered];
      }
      return prevFiltered;
    });
  }, [currentFilter]);

  // Home.jsx
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

  // Function to add fresh Reddit posts to main feed
// Put this inside Home.jsx



  // Function to get all available posts (cached + reddit) for starfield
  const getAllPostsForStarfield = useCallback(() => {
    // Start with cached posts (excluding example post)
    const cachedPostsOnly = posts.filter(p => p.id !== 'example_post_001');
    
    // Always include Reddit posts for starfield diversity
    const allPosts = [...cachedPostsOnly];
    if (redditPosts.length > 0) {
      const existingIds = new Set(allPosts.map(p => p.id));
      const additionalRedditPosts = redditPosts.filter(p => !existingIds.has(p.id));
      allPosts.push(...additionalRedditPosts);
    }
    
    return allPosts;
  }, [posts, redditPosts]);

  useEffect(() => {
    const handleCachedPostsRefresh = async () => {
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cached-posts`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setCachedPosts(result.data);
            
            // Update posts by refreshing with new cached data
            setPosts(prevPosts => {
              const examplePost = prevPosts.find(p => p.id === 'example_post_001');
              const shuffledPosts = [...result.data].sort(() => Math.random() - 0.5);
              return examplePost ? [examplePost, ...shuffledPosts] : shuffledPosts;
            });
          }
        }
      } catch (err) {
      }
    };

    window.addEventListener('refreshCachedPosts', handleCachedPostsRefresh);
    
    return () => {
      window.removeEventListener('refreshCachedPosts', handleCachedPostsRefresh);
    };
  }, []);

  // Load only cached posts on page load
  useEffect(() => {
    async function loadCachedPosts() {
      setIsLoading(true);
      try {
        // Create example post
        const examplePost = createExamplePost();
        
        // Load cached posts
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cached-posts`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.length > 0) {
            const cachedData = result.data;
            setCachedPosts(cachedData);
            
            // Shuffle posts for variety
            const shuffleArray = (arr) => {
              const shuffled = [...arr];
              for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
              }
              return shuffled;
            };
            
            const shuffledPosts = shuffleArray(cachedData);
            setPosts([examplePost, ...shuffledPosts]);
            
          } else {
            // Only show example post if no cached posts
            setPosts([examplePost]);
          }
        } else {
          // Fallback to example post on error
          setPosts([examplePost]);
        }
        
      } catch (err) {
        const examplePost = createExamplePost();
        setPosts([examplePost]);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCachedPosts();
  }, []);

 

  const handleFilterChange = useCallback((filter) => {
    setCurrentFilter(filter);
  }, []);

  return (
    <>
      {selectedUser ? (
        <UserProfile 
          user={selectedUser} 
          onBack={() => {
            const lastPage = navigationHistory.pop();
            setNavigationHistory([...navigationHistory]);
            
            if (lastPage === 'thread') {
              setSelectedUser(null);
            } else {
              setSelectedUser(null);
              setSelectedThread(null);
            }
          }}
        />
      ) : selectedThread ? (
        selectedThread.postType === "groupchat" ? (
          <GroupChatDetail
            post={selectedThread}
            onBack={() => setSelectedThread(null)}
            onUserListUpdate={(users) => {
            }}
          />
        ) : (
          <ThreadDetail 
          
            postId={selectedThread.id}
            postData={selectedThread}
            onSelectUser={(user) => {
              setNavigationHistory(prev => [...prev, 'thread']);
              setSelectedUser(user);
            }}
            onBack={() => setSelectedThread(null)} 
          />
        )
      ) : (
        <div className="music-home">
          {!showExploreView && (
            <div className="enhanced-starfield-container" style={{
              height: '600px',
              width: '100%',
              overflow: 'hidden',
              backgroundColor: '#0c111b',
              marginBottom: '0px'
            }}>
              
              <Starfield
                onLoadFeed={handleStarfieldLoadFeed}
                jumpGenre={jumpGenre}
                onJumpComplete={() => setJumpGenre(null)}
                onViewThread={handleViewThread}
                posts={getAllPostsForStarfield()}
              />
              <div className="cosmic-gradient"></div>
            </div>
          )}

          <div className="feed-content-overlay" style={{
            maxWidth: '1200px',
            width: '92%',
            margin: '-60px auto 0 auto',
            padding: '0 1rem',
            transform: 'none',
            transformOrigin: 'top center',
            marginTop: '0',
            backgroundColor: '#0c111b',
            borderRadius: '1rem',
            position: 'relative',
            zIndex: 5
          }}>

            <div className="feed-title-container" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              margin: '1.5rem 0 1.2rem',
              padding: '0.5rem 0'
            }}>
              <h1 className="feed-title" style={{
                fontSize: '2.5rem',
                background: 'linear-gradient(45deg, #9c27b0, #3f51b5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 10px rgba(156, 39, 176, 0.3)',
                textAlign: 'center',
                fontWeight: '700',
                display: 'inline',
                margin: 0,
                lineHeight: '1.2'
              }}>
                {!feedLoaded ? 'For You' : `Feed at Coordinates`}
              </h1>
              <InfoIconModal
                title="For You"
                modalId="for-you-info"
                iconSize={20}
                buttonText="Info"
                steps={[
                  {
                    icon: <Info size={18} color="#a9b6fc" />,
                    title: "For You",
                    content: "Your curated feed shows cached threads from Reddit music communities"
                  },
                  {
                    icon: <Info size={18} color="#a9b6fc" />,
                    title: "Cached Content",
                    content: "All posts are pre-cached from subreddits like r/musicrecommendations, r/musicsuggestions and r/music"
                  }
                ]}
              />
            </div>

            {feedLoaded && (
              <div className="feed-coordinate" style={{
                textAlign: 'center',
                fontSize: '1.2rem',
                color: '#a9b6fc',
                marginBottom: '1rem',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                fontWeight: '600'
              }}>
                {feedCoordinate.x}, {feedCoordinate.y}
              </div>
            )}

            {feedLoaded && (
              <div className="feed-info-container" style={{
                width: '100%',
                margin: '0 0 1.5rem 0',
                animation: 'fadeSlideDown 0.5s ease-out',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }}>
                <FeedInfoDisplay 
                  genres={feedData.genres}
                  artists={feedData.artists}
                  coordinates={feedCoordinate}
                  onLoadGenreFeed={handleLoadGenreFeed}
                />
              </div>
            )}

           

            <div className="content-wrapper" style={{
              backgroundColor: 'rgba(12, 17, 27, 0.7)',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto'
            }}>

              <div className="pill-container" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}>
                {['all', 'thread', 'news', 'groupchat', 'parameter'].map(filter => {
                const displayName = filter === 'all' ? 'All' : 
                                    filter === 'thread' ? 'Threads' :
                                    filter === 'news' ? 'News' :
                                    filter === 'groupchat' ? 'GroupChats' :
                                    'Parameters';

                  const getInfoSteps = (filterType) => {
                    switch(filterType) {
                      case 'thread':
                        return [
                          {
                            icon: <Music size={18} color="#a9b6fc" />,
                            title: "Threads",
                            content: "A post started by a user to share music recommendations with the community"
                          },
                          {
                            icon: <Headphones size={18} color="#a9b6fc" />,
                            title: "Sharing Music",
                            content: "Users can use Apple Music API or upload their content"
                          }
                        ];
                      case 'news':
                        return [
                          {
                            icon: <TrendingUp size={18} color="#a9b6fc" />,
                            title: "Music News",
                            content: "Aside from music recommendation threads, news posts may also pop up in your feed, keeping you updated on artist news and upcoming albums"
                          }
                        ];
                      case 'groupchat':
                        return [
                          {
                            icon: <Mic size={18} color="#a9b6fc" />,
                            title: "What is Group Chat?",
                            content: "A live alternative of a thread, where users can chat and share song recommendations in real time"
                          },
                          {
                            icon: <Shuffle size={18} color="#a9b6fc" />,
                            title: "Time Limit",
                            content: "Group chats will have a time limit"
                          }
                        ];
                      case 'parameter':
                        return [
                          {
                            icon: <Disc size={18} color="#a9b6fc" />,
                            title: "Parameter Thread",
                            content: "A type of thread where users can compare up to 4 different parameters which can include artists, bands, time periods, genres or anything the user types up"
                          },
                          {
                            icon: <TrendingUp size={18} color="#a9b6fc" />,
                            title: "Music Data & Graphs",
                            content: "As users share music either from the Apple Music API or personal media, each post will go under a parameter and the graphs will correlate to each"
                          }
                        ];
                      default:
                        return [];
                    }
                  };
                              
                  return (
                    <div key={filter} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        className={`genre-pill ${currentFilter === filter ? 'active' : ''}`}
                        onClick={() => handleFilterChange(filter)}
                        style={{
                          backgroundColor: currentFilter === filter ? 
                            (POST_TYPE_INDICATORS[filter]?.color || '#475569') : 'rgba(30, 41, 59, 0.8)',
                          color: currentFilter === filter && filter !== 'all' ? 
                            (filter === 'news' || filter === 'parameter' ? 'black' : 'white') : 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '2rem',
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: currentFilter === filter ? 
                            '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none'
                        }}
                      >
                        {displayName}
                      </button>
                      {filter !== 'all' && getInfoSteps(filter).length > 0 && (
                        <InfoIconModal
                          title={displayName}
                          modalId={`filter-info-${filter}`}
                          iconSize={14}
                          showButtonText={false}
                          steps={getInfoSteps(filter)}
                        />
                      )}
                    </div>
                    );
                  })}
                </div>
              
              <MusicCommentComposer 
                onSubmit={handleCommentSubmit}
                onOpenTikTokModal={toggleTikTokModal}
              />
              
              {isLoading && (
                <div className="loading-container" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 0',
                  color: '#a9b6fc'
                }}>
                  <div className="spinner" style={{
                    width: '3rem',
                    height: '3rem',
                    border: '4px solid rgba(169, 182, 252, 0.2)',
                    borderTop: '4px solid #a9b6fc',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                 
                </div>
              )}
              
              {!isLoading && filteredPosts.length === 0 && (
                <div className="empty-state" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4rem 0',
                  color: '#a9b6fc'
                }}>
                  <Headphones size={80} color="#3a5ba0" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
                  <p className="empty-message" style={{
                    fontSize: '1.25rem',
                    fontWeight: '500',
                    marginBottom: '1.5rem',
                    color: '#d0d7de'
                  }}>
                    No posts found in this dimension
                  </p>
                  <button 
                    onClick={() => setCurrentFilter('all')}
                    className="genre-pill"
                    style={{ 
                      backgroundColor: '#3a5ba0',
                      color: 'white',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '2rem',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    Show all posts
                  </button>
                </div>
              )}
              
              <div className="feed-posts" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.25rem',
                marginTop: '1rem',
                paddingBottom: '1rem',
                width: '100%'
              }}>
                {!isLoading && filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      width: '100%',
                    }}
                  >
                    <div style={{ width: '90%', maxWidth: '990px' }}>
                      <PostCard
                        post={post}
                        onClick={handleViewThread}
                        onUserClick={handleViewUserProfile}
                        isCached={true}
                        POST_TYPE_INDICATORS={POST_TYPE_INDICATORS}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {showTikTokModal && (
  <HomeTikTokModal 
    onClose={() => setShowTikTokModal(false)} 
    cachedPosts={cachedPosts}
    onNavigateToThread={handleViewThread}
  />
)}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default MusicHome;