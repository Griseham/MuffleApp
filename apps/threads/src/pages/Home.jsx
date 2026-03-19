import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Headphones, Disc, Music, TrendingUp, Shuffle, Mic, Search, Info, ChevronDown, ChevronUp } from 'lucide-react';
import Starfield from '../components/Starfield';
import ThreadDetail from './threads/ThreadDetail';
import GroupChatDetail from './threads/GroupChatDetail';
import UserProfile from './user/UserProfile'; 
import HomeTikTokModal from './modals/HomeTikTokModal';
import ThreadCommentComposer from './threads/ThreadCommentComposer';
import PostCard from './posts/PostCard';
import { getAvatarSrc } from '../components/utils';
import InfoIconModal from '../components/InfoIconModal';
import RightPanel from '../components/Rightpanel';

const POST_TYPE_INDICATORS = {
  thread: { color: "#1d9bf0", label: "Thread" },
  news: { color: "#FF9500", label: "News" },
  groupchat: { color: "#FF69B4", label: "GroupChat" },
  parameter: { color: "#00C4B4", label: "Parameter" },
  tweet: { color: "#FFB6C1", label: "Tweet" }
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function hashStringToInt(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function buildStableRoomStats(post) {
  const seed = hashStringToInt(String(post?.id || post?.title || ""));
  const roomVolume = 500 + (seed % 4500);
  const volumeChange = 5 + (seed % 30);

  const palette = ["#00d4aa", "#ff6b9d", "#a855f7", "#f59e0b", "#3b82f6"];
  const genres = ["Metal", "Hip-Hop", "R&B", "Electronic", "Pop", "Rock", "Indie", "Jazz"];

  const g1 = genres[seed % genres.length];
  const g2 = genres[(seed * 7) % genres.length];
  const g3 = genres[(seed * 13) % genres.length];
  const picked = Array.from(new Set([g1, g2, g3])).slice(0, 3);

  const genreStats = picked.map((name, i) => ({
    name,
    change: `+${(((seed % 17) + 3 + i) / 10).toFixed(1)}%`,
    color: palette[i % palette.length],
  }));

  return { roomVolume, volumeChange, genreStats };
}

function enrichPost(post) {
  if (!post) return post;
  if (post.roomVolume && post.genreStats) return post;
  const stats = buildStableRoomStats(post);
  return { ...post, ...stats };
}

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

  // Feed mode: cached-only vs reddit-only
  const [activeFeed, setActiveFeed] = useState("forYou"); // 'forYou' | 'trending'
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
  const [isStarfieldOpen, setIsStarfieldOpen] = useState(false);
  
  // Starfield state
  const [feedCoordinate, setFeedCoordinate] = useState({ x: 0, y: 1 });
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [feedData, setFeedData] = useState({ genres: [], artists: [] });
  
  // Cached posts tracking
  const [cachedPosts, setCachedPosts] = useState([]);
  
  // Reddit API posts tracking
  const [redditPosts, setRedditPosts] = useState([]);
  const [isLoadingReddit, setIsLoadingReddit] = useState(false);
  const [redditPostsLoaded, setRedditPostsLoaded] = useState(false);
  const feedTopRef = useRef(null);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);
  const [lastAddedCount, setLastAddedCount] = useState(0);

  const scrollFeedToTop = useCallback(() => {
    const el = feedTopRef.current;
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

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
    console.log("Home: handleViewThread postData", post);
    post.entryTransition = true;
    setNavigationHistory(prev => [...prev, 'home']);
    setSelectedThread(post);
  }, []);

  const generateFeedData = (x, y, wheelGenres = []) => {
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

    const formatLiveUsers = (count) => {
      const safeCount = Number(count);
      if (!Number.isFinite(safeCount) || safeCount <= 0) return "0";
      if (safeCount >= 1_000_000) return `${(safeCount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
      if (safeCount >= 1_000) return `${(safeCount / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
      return `${Math.round(safeCount)}`;
    };

    const normalizeWheelGenres = () => {
      if (!Array.isArray(wheelGenres) || wheelGenres.length === 0) return [];

      const totalFraction = wheelGenres.reduce((sum, genre) => {
        const fraction = Number(genre?.fraction);
        return sum + (Number.isFinite(fraction) ? fraction : 0);
      }, 0);

      const divisor = totalFraction > 0 ? totalFraction : wheelGenres.length;
      const normalized = wheelGenres
        .map((genre, index) => {
          const genreName = genre?.genre || genre?.name;
          if (!genreName) return null;

          const rawFraction = Number(genre?.fraction);
          const safeFraction = totalFraction > 0
            ? (Number.isFinite(rawFraction) ? rawFraction : 0) / divisor
            : 1 / divisor;
          const fallbackUsers = 10000 + Math.abs((seed + index * 7919) % 40000);
          const rawUserCount = Number(genre?.userCount);

          return {
            name: genreName,
            color: genre?.color || genreColors[genreName] || "#a9b6fc",
            percentage: Math.max(1, Math.round(safeFraction * 100)),
            liveUsers: formatLiveUsers(
              Number.isFinite(rawUserCount) && rawUserCount > 0 ? rawUserCount : fallbackUsers
            )
          };
        })
        .filter(Boolean);

      return normalized;
    };

    const wheelSelectedGenres = normalizeWheelGenres();
    let selectedGenres = wheelSelectedGenres;

    if (!selectedGenres.length) {
      const allGenres = Object.keys(genreColors);
      const primary = Math.abs((x * 7 + y * 13) % allGenres.length);
      const secondary = Math.abs((x * 13 + y * 17) % allGenres.length);
      const tertiary = Math.abs((x * 19 + y * 23) % allGenres.length);
      const quaternary = Math.abs((x * 23 + y * 29) % allGenres.length);
      const uniqueIndices = Array.from(new Set([primary, secondary, tertiary, quaternary]));

      // Generate live user counts for each genre
      const liveUserCounts = ["14.2K", "8.7K", "21.3K", "6.1K", "12.5K", "9.8K"];

      selectedGenres = uniqueIndices.map((index, i) => {
        const genreName = allGenres[index];
        let percentage;
        if (i === 0) percentage = 35 + (seed % 15);
        else if (i === 1) percentage = 20 + (seed % 10);
        else if (i === 2) percentage = 10 + (seed % 10);
        else percentage = 5 + (seed % 5);
        return {
          name: genreName,
          color: genreColors[genreName],
          percentage,
          liveUsers: liveUserCounts[i % liveUserCounts.length]
        };
      });
    }

    // Generate artists with recommendations and discovered status
    const artistNames = [
      "Tyler, The Creator", "Tame Impala", "Frank Ocean", "Mac Miller",
      "Radiohead", "Daft Punk", "Kendrick Lamar", "The Strokes",
      "Arctic Monkeys", "Childish Gambino", "The Weeknd", "SZA"
    ];

    const artists = selectedGenres.slice(0, 3).flatMap((genre, genreIndex) => {
      const artistCount = 2 + Math.floor((seed + genre.name.length) % 2);
      return Array.from({ length: artistCount }, (_, i) => {
        const artistIndex = (genreIndex * 3 + i + seed) % artistNames.length;
        return {
          id: `artist-${genre.name.toLowerCase()}-${i}-${seed % 1000}`,
          name: artistNames[artistIndex],
          genre: genre.name,
          recommendations: Math.floor(1500 + (seed * (i + 1)) % 2000),
          discovered: (seed + i) % 3 !== 0, // ~66% discovered
          imageUrl: `/assets/image${Math.abs(artistIndex * 7 + seed) % 1000 + 1}.png`
        };
      });
    });

    return { genres: selectedGenres, artists };
  };

  const handleStarfieldLoadFeed = useCallback(({ x, y, genres = [] }) => {
    setFeedCoordinate({ x, y });
    const newFeedData = generateFeedData(x, y, genres);
    setFeedData(newFeedData);
    setFeedLoaded(true);
    setIsStarfieldOpen(false);
  }, []);

  const [jumpGenre, setJumpGenre] = useState(null);

  const handleLoadGenreFeed = useCallback((genreName) => {
    setFeedData({
      genres : [{ name: genreName, color: '#1DB954', percentage: 100, liveUsers: "18.5K" }],
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

  // Function to add background-fetched Reddit posts to main feed
  const handleLoadRedditPosts = useCallback(async (options = {}) => {
    if (isLoadingReddit) return;

    const forceTrending = options.forceTrending === true;

    setIsLoadingReddit(true);
    setIsRefreshingFeed(true);
    setLastAddedCount(0);

    try {
      let incoming = [];
      const tagRedditPost = (p) => ({ ...p, source: 'reddit', hasCachedData: false });

      // Read current redditPosts via ref to avoid stale closure / dep cascade
      const currentRedditPosts = redditPostsRef.current || [];

      if (currentRedditPosts.length > 0 && !redditPostsLoaded) {
        console.log(`Using ${currentRedditPosts.length} background-fetched Reddit posts`);
        incoming = currentRedditPosts.map(tagRedditPost);
        setRedditPostsLoaded(true);
      } else {
        console.log("Fetching fresh diverse posts from backend.");
        const response = await fetch(`${API_BASE}/api/diverse-posts?ts=${Date.now()}`);

        if (response.ok) {
          const result = await response.json();
          if (result?.success && Array.isArray(result.data)) {
            incoming = result.data.map(tagRedditPost);
            setRedditPostsLoaded(true);
          }
        }
      }

      const incomingEnriched = (incoming || []).map(enrichPost);

      setRedditPosts(prev => {
        const prevArr = Array.isArray(prev) ? prev : [];
        const existingIds = new Set(prevArr.map(p => p?.id));
        const uniqueIncoming = incomingEnriched.filter(p => p?.id && !existingIds.has(p.id));

        setLastAddedCount(uniqueIncoming.length);

        const next = [...uniqueIncoming, ...prevArr];

        // Trending feed replaces posts entirely with reddit-only content
        if (forceTrending || activeFeedRef.current === "trending") {
          setPosts(next);
        }

        return next;
      });

      if (forceTrending || activeFeedRef.current === "trending") {
        requestAnimationFrame(() => {
          scrollFeedToTop();
          setTimeout(() => setIsRefreshingFeed(false), 450);
        });
      } else {
        setTimeout(() => setIsRefreshingFeed(false), 450);
      }
    } catch (err) {
      console.error("Error loading Reddit posts:", err);
      setIsRefreshingFeed(false);
    } finally {
      setIsLoadingReddit(false);
    }
  }, [isLoadingReddit, redditPostsLoaded, scrollFeedToTop]); // removed redditPosts + activeFeed — both read via stable refs

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
    
    console.log(`Starfield has ${allPosts.length} posts (${cachedPostsOnly.length} cached + ${allPosts.length - cachedPostsOnly.length} reddit)`);
    return allPosts;
  }, [posts, redditPosts]);

  // Stable refs so event listeners and callbacks always see current values
  // without needing to be in dependency arrays (which causes re-registration / re-render cascades)
  const activeFeedRef = useRef(activeFeed);
  useEffect(() => { activeFeedRef.current = activeFeed; }, [activeFeed]);

  const redditPostsRef = useRef(redditPosts);
  useEffect(() => { redditPostsRef.current = redditPosts; }, [redditPosts]);

  const cachedPostsRef = useRef(cachedPosts);
  useEffect(() => { cachedPostsRef.current = cachedPosts; }, [cachedPosts]);

  useEffect(() => {
    const handleCachedPostsRefresh = async () => {
      console.log("Refreshing cached posts");
      
      try {
        const response = await fetch(`${API_BASE}/api/cached-posts`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const taggedCached = (result.data || []).map(p => ({ ...p, source: 'cached', hasCachedData: true }));
            setCachedPosts(taggedCached);

            // Use the ref so this listener never needs to re-register when activeFeed changes
            if (activeFeedRef.current === "forYou") {
              const examplePost = createExamplePost();
              const sortedPosts = [...taggedCached]
                .sort((a, b) => (b.createdUtc || 0) - (a.createdUtc || 0))
                .map(enrichPost);
              setPosts(sortedPosts.length ? [examplePost, ...sortedPosts] : [examplePost]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to refresh cached posts:", err);
      }
    };

    window.addEventListener('refreshCachedPosts', handleCachedPostsRefresh);
    
    return () => {
      window.removeEventListener('refreshCachedPosts', handleCachedPostsRefresh);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — stable via refs, intentionally runs once

  // Load only cached posts on page load — runs once on mount only
  useEffect(() => {
    async function loadCachedPosts() {
      setIsLoading(true);
      try {
        const examplePost = createExamplePost();
        
        const response = await fetch(`${API_BASE}/api/cached-posts`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.length > 0) {
            const cachedData = (result.data || []).map(p => ({ ...p, source: 'cached', hasCachedData: true }));
            setCachedPosts(cachedData);
            
            // Deterministic sort by newest first — consistent across users and refreshes
            const sortedPosts = [...cachedData]
              .sort((a, b) => (b.createdUtc || 0) - (a.createdUtc || 0))
              .map(enrichPost);
            
            setPosts([examplePost, ...sortedPosts]);
            console.log(`Loaded ${cachedData.length} cached posts`);
          } else {
            setPosts([examplePost]);
            console.log("No cached posts found, showing only example post");
          }
        } else {
          setPosts([examplePost]);
          console.error("Failed to fetch cached posts");
        }
        
      } catch (err) {
        console.error("Error loading cached posts:", err);
        setPosts([createExamplePost()]);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCachedPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally runs once on mount

  // Background fetch Reddit posts for starfield — runs once after initial cached load completes
  const hasBgFetchedRef = useRef(false);
  useEffect(() => {
    if (isLoading || posts.length === 0 || hasBgFetchedRef.current) return;

    hasBgFetchedRef.current = true; // guard — prevents re-triggering after redditPosts state updates

    const backgroundFetchRedditPosts = async () => {
      try {
        console.log("Background fetching diverse Reddit posts for starfield...");
        
        const [diverseResponse, refreshResponse] = await Promise.all([
          fetch(`${API_BASE}/api/diverse-posts`),
          fetch(`${API_BASE}/api/refresh`)
        ]);
        
        const allFetchedPosts = [];
        
        if (diverseResponse.ok) {
          const diverseResult = await diverseResponse.json();
          if (diverseResult.success && diverseResult.data.length > 0) {
            allFetchedPosts.push(...diverseResult.data);
          }
        }
        
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          if (refreshResult.success && refreshResult.data.length > 0) {
            const existingIds = new Set(allFetchedPosts.map(p => p.id));
            const newRefreshPosts = refreshResult.data.filter(p => !existingIds.has(p.id));
            allFetchedPosts.push(...newRefreshPosts);
          }
        }
        
        if (allFetchedPosts.length > 0) {
          console.log(`Background loaded ${allFetchedPosts.length} diverse Reddit posts for starfield`);
          setRedditPosts(
            allFetchedPosts
              .map(p => ({ ...p, source: 'reddit', hasCachedData: false }))
              .map(enrichPost)
          );
        }
      } catch (err) {
        console.log("Background fetch failed:", err);
      }
    };

    backgroundFetchRedditPosts();
  }, [isLoading, posts.length]); // only re-check when loading finishes or posts first arrive

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
              console.log("Group chat users updated:", users);
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
        <div className="music-home" style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', position: 'relative' }}>
          {/* Main Content + Right Panel wrapper - centered together */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: 20,
              width: '100%',
              maxWidth: '1800px',
              padding: '0 16px',
            }}
          >
            {/* Main Content Area */}
            <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: 1000 }}>
            {!showExploreView && (
              <div
                style={{
                  maxWidth: '1000px',
                  width: '100%',
                  margin: '0 auto',
                  padding: '1rem 1rem 0',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(10, 14, 24, 0.72)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsStarfieldOpen(v => !v)}
                    aria-expanded={isStarfieldOpen}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 14px',
                      border: 'none',
                      cursor: 'pointer',
                      background: 'linear-gradient(180deg, rgba(18,24,38,0.85), rgba(12,17,27,0.55))',
                      color: '#e7e9ea',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: isStarfieldOpen ? 'rgba(169,182,252,0.95)' : 'rgba(169,182,252,0.55)',
                          boxShadow: isStarfieldOpen
                            ? '0 0 18px rgba(169,182,252,0.45)'
                            : '0 0 10px rgba(169,182,252,0.18)',
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                        <span style={{ fontWeight: 800, letterSpacing: '0.2px' }}>
                          Starfield
                        </span>
                        <span style={{ fontSize: 12, color: 'rgba(231,233,234,0.65)' }}>
                          {isStarfieldOpen ? 'Collapse to save CPU' : 'Expand to explore threads as stars'}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontWeight: 700,
                        color: 'rgba(231,233,234,0.85)',
                      }}
                    >
                      <span style={{ fontSize: 12 }}>
                        {isStarfieldOpen ? 'Hide' : 'Show'}
                      </span>
                      <span
                        style={{
                          display: 'inline-block',
                          transform: isStarfieldOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                          opacity: 0.9,
                        }}
                      >
                        ▼
                      </span>
                    </div>
                  </button>

                  <div
                    style={{
                      height: isStarfieldOpen ? 600 : 76,
                      transition: 'height 260ms cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      backgroundColor: '#0c111b',
                    }}
                  >
                    {!isStarfieldOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 14px',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 44,
                            borderRadius: 14,
                            border: '1px solid rgba(255,255,255,0.08)',
                            background:
                              'radial-gradient(circle at 20% 40%, rgba(169,182,252,0.18), transparent 45%),' +
                              'radial-gradient(circle at 70% 30%, rgba(255,105,180,0.12), transparent 48%),' +
                              'radial-gradient(circle at 55% 75%, rgba(16,185,129,0.10), transparent 55%),' +
                              'linear-gradient(180deg, rgba(10,14,24,0.55), rgba(12,17,27,0.35))',
                            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.35)',
                          }}
                        />
                        <div style={{ fontSize: 12, color: 'rgba(231,233,234,0.55)', whiteSpace: 'nowrap' }}>
                          Preview • paused
                        </div>
                      </div>
                    )}

                    {isStarfieldOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          overflow: 'hidden',
                          animation: 'starfieldPop 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
                        }}
                      >
                        <Starfield
                          isActive={isStarfieldOpen}
                          onLoadFeed={handleStarfieldLoadFeed}
                          jumpGenre={jumpGenre}
                          onJumpComplete={() => setJumpGenre(null)}
                          onViewThread={handleViewThread}
                          posts={getAllPostsForStarfield()}
                        />
                        <div className="cosmic-gradient"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="feed-content-overlay" style={{
              maxWidth: '1000px',
              width: '100%',
              margin: '0 auto',
              padding: '1.25rem 1rem 0',
              boxSizing: 'border-box',
              overflowX: 'hidden',
              transform: 'none',
              transformOrigin: 'top center',
              marginTop: '0',
              backgroundColor: '#0c111b',
              borderRadius: '1rem',
              position: 'relative',
              zIndex: 5
            }}>
              <div ref={feedTopRef} />

              {isRefreshingFeed && (
                <div
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                    margin: "0 0 12px 0",
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "rgba(19, 20, 41, 0.85)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    backdropFilter: "blur(10px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "rgba(231,233,234,0.92)",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255, 255, 255, 0.25)",
                        borderTop: "2px solid rgba(255, 255, 255, 0.9)",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Refreshing feed…
                  </div>

                  <div style={{ fontSize: 12, color: "rgba(231,233,234,0.65)" }}>
                    {lastAddedCount > 0 ? `+${lastAddedCount} new` : "Checking…"}
                  </div>
                </div>
              )}

              <div className="feed-title-container" style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '12px',
                margin: '1.5rem 0 1.2rem',
                padding: '0.5rem 0',
                width: '100%',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFeed("forYou");
                        const examplePost = createExamplePost();
                        // Deterministic sort — consistent order for all users
                        const sorted = [...cachedPostsRef.current]
                          .sort((a, b) => (b.createdUtc || 0) - (a.createdUtc || 0))
                          .map(enrichPost);
                        setPosts(sorted.length ? [examplePost, ...sorted] : [examplePost]);
                        setCurrentFilter("all");
                      }}
                      style={{
                        background: 'linear-gradient(45deg, #9c27b0, #3f51b5)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 10px rgba(156, 39, 176, 0.3)',
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        lineHeight: '1.2',
                        cursor: 'pointer',
                        opacity: activeFeed === "forYou" ? 1 : 0.45,
                        filter: activeFeed === "forYou" ? 'none' : 'grayscale(1)',
                        transition: 'opacity 160ms ease, filter 160ms ease',
                      }}
                      title="Cached posts"
                    >
                      For You
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveFeed("trending");
                        setCurrentFilter("all");
                        // Show ONLY reddit posts
                        setPosts((redditPosts || []).map(enrichPost));

                        // Trending click = load more reddit posts (same as old green button)
                        handleLoadRedditPosts({ forceTrending: true });
                      }}
                      style={{
                        background: 'linear-gradient(45deg, #9c27b0, #3f51b5)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 10px rgba(156, 39, 176, 0.3)',
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        lineHeight: '1.2',
                        cursor: 'pointer',
                        opacity: activeFeed === "trending" ? 1 : 0.45,
                        filter: activeFeed === "trending" ? 'none' : 'grayscale(1)',
                        transition: 'opacity 160ms ease, filter 160ms ease',
                      }}
                      title="Live Reddit posts"
                    >
                      Trending
                    </button>

                    <button
                      type="button"
                      disabled
                      style={{
                        background: 'linear-gradient(45deg, #9c27b0, #3f51b5)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 10px rgba(156, 39, 176, 0.3)',
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        lineHeight: '1.2',
                        cursor: 'not-allowed',
                        opacity: 0.22,
                        filter: 'grayscale(1)',
                        transition: 'opacity 160ms ease, filter 160ms ease',
                      }}
                      title="Recents (coming soon)"
                    >
                      Recents
                    </button>
                  </div>

                  <InfoIconModal
                    title={activeFeed === "forYou" ? "For You" : "Trending"}
                    modalId={activeFeed === "forYou" ? "for-you-info" : "trending-info"}
                    iconSize={20}
                    buttonText="Info"
                    steps={
                      activeFeed === "forYou"
                        ? [
                            {
                              icon: <Info size={18} color="#a9b6fc" />,
                              title: "For You",
                              content: "Your curated feed shows cached threads from Reddit music communities",
                            },
                            {
                              icon: <Info size={18} color="#a9b6fc" />,
                              title: "Cached Content",
                              content: "All posts are pre-cached from subreddits like r/musicrecommendations, r/musicsuggestions and r/music",
                            },
                          ]
                        : [
                            {
                              icon: <TrendingUp size={18} color="#a9b6fc" />,
                              title: "Trending",
                              content: "Live posts loaded from Reddit right now (not cached).",
                            },
                            {
                              icon: <Info size={18} color="#a9b6fc" />,
                              title: "Live Fetch",
                              content: "ThreadDetail will fetch comments/snippets live for these posts.",
                            },
                          ]
                    }
                  />
                </div>
              </div>

              {activeFeed === "trending" && isLoadingReddit && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    color: "rgba(231,233,234,0.65)",
                    marginTop: "-0.6rem",
                    marginBottom: "1rem",
                  }}
                >
                  Loading…
                </div>
              )}

              <div className="content-wrapper" style={{
                backgroundColor: 'rgba(12, 17, 27, 0.7)',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                boxSizing: 'border-box',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflowX: 'hidden',
                overflowY: 'visible',
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
                
                <ThreadCommentComposer
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
                    <p className="spinner-text" style={{
                      marginTop: '1rem',
                      fontSize: '1.125rem',
                      fontWeight: '500'
                    }}>Exploring the music universe...</p>
                  </div>
                )}
                
                {!isLoading && filteredPosts.length === 0 && (
                  activeFeed === "trending" && (isLoadingReddit || isRefreshingFeed) ? (
                    <div className="loading-container" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '3.5rem 0',
                      color: '#a9b6fc'
                    }}>
                      <div className="spinner" style={{
                        width: '3rem',
                        height: '3rem',
                        border: '4px solid rgba(169, 182, 252, 0.2)',
                        borderTop: '4px solid #a9b6fc',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <p style={{ marginTop: '1rem', fontSize: '1.05rem', fontWeight: 600, color: '#d0d7de' }}>
                        Loading trending posts…
                      </p>
                    </div>
                  ) : (
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
                        No posts found
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
                  )
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
                          isCached={activeFeed === "forYou"}
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
          
          {/* Right Panel (sticky, scrolls with page but stays in view) */}
          <div style={{ 
            position: 'sticky', 
            top: 20, 
            alignSelf: 'flex-start',
            flexShrink: 0,
            zIndex: 20,
          }}>
            <RightPanel
              feedLoaded={feedLoaded}
              coordinates={feedCoordinate}
              genres={feedData.genres}
              artists={feedData.artists}
              onLoadGenreFeed={handleLoadGenreFeed}
              cachedPosts={cachedPosts}
              onNavigateToThread={handleViewThread}
            />
          </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes starfieldPop {
          from { opacity: 0; transform: translateY(-6px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default MusicHome;