import React, {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Headphones, Disc, Music, TrendingUp, Shuffle, Mic, Info } from 'lucide-react';
import Starfield from '../components/Starfield';
import ThreadDetail from './threads/ThreadDetail';
import GroupChatDetail from './threads/GroupChatDetail';
import UserProfile from './user/UserProfile'; 
import HomeTikTokModal from './modals/HomeTikTokModal';
import ThreadCommentComposer from './threads/ThreadCommentComposer';
import PostCard from './posts/PostCard';
import InfoIconModal from '../components/InfoIconModal';
import RightPanel from '../components/Rightpanel';
import { buildApiUrl } from '../utils/api';

const POST_TYPE_INDICATORS = {
  thread: { color: "#1d9bf0", label: "Thread" },
  news: { color: "#FF9500", label: "News" },
  groupchat: { color: "#FF69B4", label: "GroupChat" },
  parameter: { color: "#00C4B4", label: "Parameter" },
  tweet: { color: "#FFB6C1", label: "Tweet" }
};

const FEED_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'thread', label: 'Threads' },
  { key: 'news', label: 'News' },
  { key: 'groupchat', label: 'GroupChats' },
  { key: 'parameter', label: 'Parameters' },
];

const FILTER_INFO_STEPS = {
  thread: [
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
  ],
  news: [
    {
      icon: <TrendingUp size={18} color="#a9b6fc" />,
      title: "Music News",
      content: "Aside from music recommendation threads, news posts may also pop up in your feed, keeping you updated on artist news and upcoming albums"
    }
  ],
  groupchat: [
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
  ],
  parameter: [
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
  ],
};

const FOR_YOU_INFO_STEPS = [
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
];

const MemoStarfield = React.memo(Starfield);
const MemoPostCard = React.memo(PostCard);
const MemoInfoIconModal = React.memo(InfoIconModal);
const MemoRightPanel = React.memo(RightPanel);
const MemoThreadCommentComposer = React.memo(ThreadCommentComposer);

const PINNED_HOME_THREAD_IDS = ['1hc9b9g', '1h41sz5', '1gzncch'];
const PINNED_HOME_PARAMETER_ID = 'parameter_thread_002';

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

function buildCachedFeedPosts(cachedPostList, examplePost) {
  const sortedPosts = [...(cachedPostList || [])]
    .sort((a, b) => (b.createdUtc || 0) - (a.createdUtc || 0))
    .map(enrichPost);

  if (!sortedPosts.length) {
    return [examplePost];
  }

  const remainingPosts = [...sortedPosts];
  const takePostById = (postId) => {
    const postIndex = remainingPosts.findIndex(post => post.id === postId);
    if (postIndex === -1) return null;
    return remainingPosts.splice(postIndex, 1)[0];
  };

  const pinnedPosts = PINNED_HOME_THREAD_IDS
    .map(takePostById)
    .filter(Boolean);

  const groupChatIndex = remainingPosts.findIndex(
    post => String(post?.postType || '').toLowerCase() === 'groupchat'
  );

  if (groupChatIndex !== -1) {
    pinnedPosts.push(remainingPosts.splice(groupChatIndex, 1)[0]);
  }

  const pinnedParameterPost = takePostById(PINNED_HOME_PARAMETER_ID);
  if (pinnedParameterPost) {
    pinnedPosts.push(pinnedParameterPost);
  }

  return [...pinnedPosts, ...remainingPosts, examplePost];
}

function generateFeedData(x, y, wheelGenres = []) {
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
        discovered: (seed + i) % 3 !== 0,
        imageUrl: `/assets/image${Math.abs(artistIndex * 7 + seed) % 1000 + 1}.png`
      };
    });
  });

  return { genres: selectedGenres, artists };
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
  const examplePost = useMemo(() => createExamplePost(), []);

  // Core state
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  
  // Navigation state
  const [selectedThread, setSelectedThread] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [navigationHistory, setNavigationHistory] = useState([]);
  
  // UI state
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [isStarfieldOpen, setIsStarfieldOpen] = useState(false);
  
  // Starfield state
  const [feedCoordinate, setFeedCoordinate] = useState({ x: 0, y: 1 });
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [feedData, setFeedData] = useState({ genres: [], artists: [] });
  
  // Cached posts tracking
  const [cachedPosts, setCachedPosts] = useState([]);

  useEffect(() => {
    import('../styles/homeStyles.css');
  }, []);

  const filteredPosts = useMemo(() => {
    if (currentFilter === 'all') {
      return posts;
    }

    return posts.filter(post => post.postType === currentFilter);
  }, [currentFilter, posts]);

  const deferredFilteredPosts = useDeferredValue(filteredPosts);

  const cachedFeedPosts = useMemo(
    () => buildCachedFeedPosts(cachedPosts, examplePost),
    [cachedPosts, examplePost]
  );

  const starfieldPosts = useMemo(
    () => posts.filter(p => p.id !== 'example_post_001'),
    [posts]
  );

  const toggleTikTokModal = useCallback(() => setShowTikTokModal(prev => !prev), []);
  
  const handleViewUserProfile = useCallback((user) => {
    setNavigationHistory(prev => [...prev, 'home']);
    setSelectedUser(user);
  }, []);
  
  const handleViewThread = useCallback((post) => {
    setNavigationHistory(prev => [...prev, 'home']);
    setSelectedThread({ ...post, entryTransition: true });
  }, []);

  const handleStarfieldLoadFeed = useCallback(({ x, y, genres = [] }) => {
    setFeedCoordinate({ x, y });
    const newFeedData = generateFeedData(x, y, genres);
    setFeedData(newFeedData);
    setFeedLoaded(true);
    setIsStarfieldOpen(false);
  }, []);

  const [jumpGenre, setJumpGenre] = useState(null);
  const handleJumpComplete = useCallback(() => setJumpGenre(null), []);

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

    startTransition(() => {
      setPosts(prevPosts => [newPost, ...prevPosts]);
    });
  }, []);

  useEffect(() => {
    const handleCachedPostsRefresh = async () => {
      console.log("Refreshing cached posts");
      
      try {
        const response = await fetch(buildApiUrl("/cached-posts"));
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const taggedCached = (result.data || []).map(p => ({ ...p, source: 'cached', hasCachedData: true }));
            setCachedPosts(taggedCached);
            startTransition(() => {
              setPosts(buildCachedFeedPosts(taggedCached, examplePost));
            });
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
  }, [examplePost]); // eslint-disable-line react-hooks/exhaustive-deps — stable via refs, intentionally runs once

  // Load only cached posts on page load — runs once on mount only
  useEffect(() => {
    async function loadCachedPosts() {
      setIsLoading(true);
      try {
        const response = await fetch(buildApiUrl("/cached-posts"));
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.length > 0) {
            const cachedData = (result.data || []).map(p => ({ ...p, source: 'cached', hasCachedData: true }));
            setCachedPosts(cachedData);

            startTransition(() => {
              setPosts(buildCachedFeedPosts(cachedData, examplePost));
            });
            console.log(`Loaded ${cachedData.length} cached posts`);
          } else {
            startTransition(() => {
              setPosts([examplePost]);
            });
            console.log("No cached posts found, showing only example post");
          }
        } else {
          startTransition(() => {
            setPosts([examplePost]);
          });
          console.error("Failed to fetch cached posts");
        }
        
      } catch (err) {
        console.error("Error loading cached posts:", err);
        startTransition(() => {
          setPosts([examplePost]);
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCachedPosts();
  }, [examplePost]); // eslint-disable-line react-hooks/exhaustive-deps — intentionally runs once on mount

  const handleFilterChange = useCallback((filter) => {
    startTransition(() => {
      setCurrentFilter(filter);
    });
  }, []);

  const handleShowForYouFeed = useCallback(() => {
    startTransition(() => {
      setCurrentFilter("all");
      setPosts(cachedFeedPosts);
    });
  }, [cachedFeedPosts]);

  const renderedPosts = useMemo(() => {
    if (isLoading) {
      return null;
    }

    return deferredFilteredPosts.map((post) => (
      <div
        key={post.id}
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <div style={{ width: '90%', maxWidth: '990px' }}>
          <MemoPostCard
            post={post}
            onClick={handleViewThread}
            onUserClick={handleViewUserProfile}
            isCached
            POST_TYPE_INDICATORS={POST_TYPE_INDICATORS}
          />
        </div>
      </div>
    ));
  }, [deferredFilteredPosts, handleViewThread, handleViewUserProfile, isLoading]);

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
            onUserListUpdate={() => {}}
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
                        <MemoStarfield
                          isActive={isStarfieldOpen}
                          onLoadFeed={handleStarfieldLoadFeed}
                          jumpGenre={jumpGenre}
                          onJumpComplete={handleJumpComplete}
                          onViewThread={handleViewThread}
                          posts={starfieldPosts}
                        />
                        <div className="cosmic-gradient"></div>
                      </div>
                    )}
                  </div>
                  </div>
                </div>

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
                      onClick={handleShowForYouFeed}
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
                        opacity: 1,
                        filter: 'none',
                        transition: 'opacity 160ms ease, filter 160ms ease',
                      }}
                      title="Cached posts"
                    >
                      For You
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
                      title="Trending (disabled)"
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

                  <MemoInfoIconModal
                    title="For You"
                    modalId="for-you-info"
                    iconSize={20}
                    buttonText="Info"
                    steps={FOR_YOU_INFO_STEPS}
                  />
                </div>
              </div>

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
                  {FEED_FILTERS.map(({ key: filter, label: displayName }) => {
                    const infoSteps = FILTER_INFO_STEPS[filter] || [];

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
                        {filter !== 'all' && infoSteps.length > 0 && (
                          <MemoInfoIconModal
                            title={displayName}
                            modalId={`filter-info-${filter}`}
                            iconSize={14}
                            showButtonText={false}
                            steps={infoSteps}
                          />
                        )}
                      </div>
                      );
                    })}
                  </div>
                
                <MemoThreadCommentComposer
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
                      onClick={() => handleFilterChange('all')}
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
                  {renderedPosts}
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
            <MemoRightPanel
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
