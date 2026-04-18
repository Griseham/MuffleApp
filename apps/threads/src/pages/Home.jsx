import React, {
  Suspense,
  lazy,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import { Headphones, Disc, Music, TrendingUp, Mic, Info } from 'lucide-react';
import Starfield from '../components/Starfield';
import UserProfile from './user/UserProfile'; 
import CommentComposer from './comments/CommentComposer';
import PostCard from './posts/PostCard';
import InfoIconModal from '../components/InfoIconModal';
import RightPanel from '../components/Rightpanel';
import { buildApiUrl } from '../utils/api';
import {
  CURRENT_USER_AVATAR,
  CURRENT_USER_DISPLAY_NAME,
  CURRENT_USER_USERNAME,
} from '../utils/currentUser';
import '../styles/homeStyles.css';

const ThreadDetail = lazy(() => import('./threads/ThreadDetail'));
const GroupChatDetail = lazy(() => import('./threads/GroupChatDetail'));
const ParameterThreadDetail = lazy(() => import('./threads/ParameterThreadDetail'));
const HomeTikTokModal = lazy(() => import('./modals/HomeTikTokModal'));

const POST_TYPE_INDICATORS = {
  thread: { color: "#1d9bf0", label: "Thread" },
  news: { color: "#e8d5a8", label: "News" },
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
      content: "Users can use Apple Music API or upload media from their device "
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
      content: "A live version of a normal thread with a time limit"
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
    title: "Cached Content",
    content: "All posts are pre-cached from subreddits like r/musicrecommendations, r/musicsuggestions and r/music",
  },
];

const MemoStarfield = React.memo(Starfield);
const MemoPostCard = React.memo(PostCard);
const MemoInfoIconModal = React.memo(InfoIconModal);
const MemoRightPanel = React.memo(RightPanel);
const MemoHomeCommentComposer = React.memo(CommentComposer);

const PINNED_HOME_THREAD_IDS = ['1hc9b9g', '1h41sz5', '1gzncch'];
const PINNED_HOME_PARAMETER_ID = 'parameter_thread_002';
const CACHED_POSTS_FEED_SUMMARY_ENDPOINT = '/cached-posts/feed-summary';
const EMPTY_STATE_DELAY_MS = 1000;
const VIEW_TRANSITION_MS = 220;
const SHELL_STACK_BREAKPOINT = 1180;
const INITIAL_VISIBLE_POSTS = 8;
const VISIBLE_POSTS_STEP = 8;
const REDDIT_SOURCE_SUBREDDITS = [
  { label: 'r/musicrecommendations', url: 'https://www.reddit.com/r/MusicRecommendations/' },
  { label: 'r/musicsuggestions', url: 'https://www.reddit.com/r/musicsuggestions/' },
  { label: 'r/music', url: 'https://www.reddit.com/r/Music/' },
];

const initialViewState = {
  route: 'feed',
  stack: [],
  thread: null,
  user: null,
  isTransitioning: false,
};

function createViewSnapshot(state) {
  return {
    route: state.route,
    thread: state.thread,
    user: state.user,
  };
}

function homeViewReducer(state, action) {
  switch (action.type) {
    case 'OPEN_THREAD': {
      if (!action.thread || state.isTransitioning) {
        return state;
      }

      return {
        ...state,
        route: 'thread',
        stack: [...state.stack, createViewSnapshot(state)],
        thread: action.thread,
        user: null,
        isTransitioning: true,
      };
    }
    case 'OPEN_USER': {
      if (!action.user || state.isTransitioning) {
        return state;
      }

      return {
        ...state,
        route: 'user',
        stack: [...state.stack, createViewSnapshot(state)],
        user: action.user,
        isTransitioning: true,
      };
    }
    case 'BACK': {
      if (state.isTransitioning || state.stack.length === 0) {
        return state;
      }

      const previous = state.stack[state.stack.length - 1];
      return {
        ...state,
        route: previous.route,
        thread: previous.thread || null,
        user: previous.user || null,
        stack: state.stack.slice(0, -1),
        isTransitioning: true,
      };
    }
    case 'END_TRANSITION':
      return {
        ...state,
        isTransitioning: false,
      };
    default:
      return state;
  }
}

function normalizePostType(postType = '') {
  return String(postType).trim().toLowerCase();
}

function hashStringToInt(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function ensureMinimumGenreStats(genreStats = [], fallbackGenreStats = [], minCount = 2) {
  const normalized = [];
  const pushUnique = (stat) => {
    if (!stat) return;
    const name = String(stat?.name || '').trim();
    if (!name || normalized.some((item) => item.name === name)) return;
    normalized.push(stat);
  };

  genreStats.forEach(pushUnique);
  fallbackGenreStats.forEach(pushUnique);

  return normalized.slice(0, Math.max(2, minCount));
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
  const pickedSet = new Set([g1, g2, g3]);
  let cursor = seed;
  while (pickedSet.size < 2) {
    pickedSet.add(genres[cursor % genres.length]);
    cursor += 1;
  }
  const picked = Array.from(pickedSet).slice(0, 3);

  const genreStats = picked.map((name, i) => ({
    name,
    change: `+${(((seed % 17) + 3 + i) / 10).toFixed(1)}%`,
    color: palette[i % palette.length],
  }));

  return { roomVolume, volumeChange, genreStats };
}

function enrichPost(post) {
  if (!post) return post;
  const normalizedPost = {
    ...post,
    postType: normalizePostType(post?.postType),
  };
  const stats = buildStableRoomStats(post);

  if (normalizedPost.roomVolume && normalizedPost.genreStats) {
    if (normalizedPost.postType === 'groupchat') {
      return {
        ...normalizedPost,
        volumeChange: Number.isFinite(Number(normalizedPost?.volumeChange))
          ? normalizedPost.volumeChange
          : stats.volumeChange,
        genreStats: ensureMinimumGenreStats(
          Array.isArray(normalizedPost.genreStats) ? normalizedPost.genreStats : [],
          stats.genreStats,
          2
        ),
      };
    }

    return normalizedPost;
  }

  return { ...normalizedPost, ...stats };
}

function tagCachedPosts(postList) {
  return (Array.isArray(postList) ? postList : [])
    .filter(Boolean)
    .map((post) => ({
      ...post,
      source: 'cached',
      hasCachedData: true,
      postType: normalizePostType(post?.postType),
    }));
}

function buildCachedFeedPosts(cachedPostList) {
  const sortedPosts = [...(cachedPostList || [])]
    .sort((a, b) => (b.createdUtc || 0) - (a.createdUtc || 0))
    .map(enrichPost);

  if (!sortedPosts.length) {
    return [createExamplePost()];
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

  return [createExamplePost(), ...pinnedPosts, ...remainingPosts];
}

const EXPANDED_POST_CONTENT_ARTISTS = [
  { name: 'Ariana Grande', genre: 'Pop' },
  { name: 'Bad Bunny', genre: 'Latin Trap/Reggaeton' },
  { name: 'Drake', genre: 'Hip-Hop' },
  { name: 'Post Malone', genre: 'Pop Rap' },
  { name: 'Dua Lipa', genre: 'Dance-Pop' },
  { name: 'SZA', genre: 'R&B' },
  { name: 'Frank Ocean', genre: 'Alternative R&B' },
  { name: 'Beyoncé', genre: 'Pop/R&B' },
  { name: 'Taylor Swift', genre: 'Pop' },
  { name: 'Kendrick Lamar', genre: 'Hip-Hop' },
  { name: 'Billie Eilish', genre: 'Alternative Pop' },
  { name: 'The Weeknd', genre: 'R&B/Pop' },
  { name: 'Lana Del Rey', genre: 'Alternative Pop' },
  { name: 'Travis Scott', genre: 'Hip-Hop' },
  { name: 'Tyler, The Creator', genre: 'Hip-Hop' },
];

const TOP_ARTIST_POOL_BY_GENRE = {
  'Pop': EXPANDED_POST_CONTENT_ARTISTS.filter((artist) => artist.genre.toLowerCase().includes('pop')),
  'Hip-Hop': EXPANDED_POST_CONTENT_ARTISTS.filter((artist) => artist.genre.toLowerCase().includes('hip-hop') || artist.genre.toLowerCase().includes('rap')),
  'R&B': EXPANDED_POST_CONTENT_ARTISTS.filter((artist) => artist.genre.toLowerCase().includes('r&b')),
  'Electronic': EXPANDED_POST_CONTENT_ARTISTS.filter((artist) => artist.genre.toLowerCase().includes('dance')),
  'Synth-Pop': EXPANDED_POST_CONTENT_ARTISTS.filter((artist) => artist.genre.toLowerCase().includes('pop')),
};

const TOP_ARTIST_FALLBACK_POOL = [...EXPANDED_POST_CONTENT_ARTISTS];

function normalizeArtistKey(name = '') {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
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

  const artists = [];
  const usedArtistNames = new Set();

  const pushUniqueArtist = (candidate, genreIndex, slotIndex) => {
    const safeName = String(candidate?.name || '').trim();
    const safeGenre = String(candidate?.genre || '').trim() || 'Music';
    const artistKey = normalizeArtistKey(safeName);
    if (!safeName || !artistKey || usedArtistNames.has(artistKey)) {
      return false;
    }

    usedArtistNames.add(artistKey);
    const recommendationSeed = Math.abs(
      seed + genreIndex * 173 + slotIndex * 47 + artistKey.length * 29
    );
    artists.push({
      id: `artist-${artistKey.replace(/[^a-z0-9]+/g, '-')}-${recommendationSeed % 10000}`,
      name: safeName,
      genre: safeGenre,
      recommendations: 1400 + (recommendationSeed % 2600),
      discovered: recommendationSeed % 4 !== 0,
      imageUrl: '',
    });
    return true;
  };

  selectedGenres.slice(0, 4).forEach((genre, genreIndex) => {
    const pool = TOP_ARTIST_POOL_BY_GENRE[genre.name] || [];
    if (!pool.length) {
      return;
    }

    const startIndex = Math.abs(seed + genreIndex * 11) % pool.length;
    const targetCount = Math.min(2, pool.length);
    let added = 0;

    for (let offset = 0; offset < pool.length && added < targetCount; offset += 1) {
      const candidate = pool[(startIndex + offset) % pool.length];
      if (pushUniqueArtist(candidate, genreIndex, offset)) {
        added += 1;
      }
    }
  });

  if (artists.length < 8) {
    const fallbackStart = Math.abs(seed * 3) % TOP_ARTIST_FALLBACK_POOL.length;
    for (let offset = 0; offset < TOP_ARTIST_FALLBACK_POOL.length && artists.length < 8; offset += 1) {
      const candidate = TOP_ARTIST_FALLBACK_POOL[
        (fallbackStart + offset) % TOP_ARTIST_FALLBACK_POOL.length
      ];
      pushUniqueArtist(candidate, selectedGenres.length, offset);
    }
  }

  return { genres: selectedGenres, artists };
}

function HomeViewFallback({ label = 'Loading view...' }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, rgba(29,155,240,0.18), rgba(5,8,18,0.96) 52%)',
        color: 'rgba(226,232,240,0.92)',
        fontSize: '0.98rem',
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </div>
  );
}

function HomeModalFallback() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2, 6, 23, 0.72)',
        backdropFilter: 'blur(8px)',
        color: 'rgba(226,232,240,0.92)',
        zIndex: 1000,
      }}
    >
      Loading snippets...
    </div>
  );
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

const SIDEBAR_EXTERNAL_TARGETS = {
  rooms: { label: 'Rooms', url: 'https://mufl.app/rooms/' },
  timeline: { label: 'Timeline', url: 'https://mufl.app/timeline/' },
  pitch: { label: 'Pitch Deck', url: 'https://mufl.app/?tab=pitch' },
  archives: { label: 'Archives', url: 'https://mufl.app/?tab=archives' },
};

const MUFL_APP_ROUTE_SEGMENTS = new Set(['rooms', 'threads', 'timeline']);

function resolveSidebarTargetUrl(targetUrl) {
  if (!targetUrl || typeof window === 'undefined') return targetUrl;
  if (/^https?:\/\//i.test(targetUrl)) return targetUrl;

  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const appSegmentIndex = pathSegments.findIndex((segment) => MUFL_APP_ROUTE_SEGMENTS.has(segment));
  const lastSegment = pathSegments[pathSegments.length - 1] || '';
  const pathLooksLikeFile = lastSegment.includes('.');

  let baseSegments;
  if (appSegmentIndex >= 0) {
    baseSegments = pathSegments.slice(0, appSegmentIndex);
  } else if (pathLooksLikeFile) {
    baseSegments = pathSegments.slice(0, -1);
  } else {
    baseSegments = pathSegments;
  }

  const basePath = baseSegments.length > 0 ? `/${baseSegments.join('/')}` : '';
  const normalizedTargetPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;

  return `${window.location.origin}${basePath}${normalizedTargetPath}`;
}

function ThreadsHomeSidebar() {
  const [pendingTarget, setPendingTarget] = useState(null);
  const activeTab = 'threads';

  const handleNavClick = useCallback((targetKey) => {
    if (targetKey === activeTab) return;
    const target = SIDEBAR_EXTERNAL_TARGETS[targetKey];
    if (!target) return;
    setPendingTarget({ key: targetKey, ...target });
  }, []);

  const closeModal = useCallback(() => setPendingTarget(null), []);

  const confirmOpen = useCallback(() => {
    if (typeof window !== 'undefined' && pendingTarget?.url) {
      window.open(resolveSidebarTargetUrl(pendingTarget.url), '_blank', 'noopener,noreferrer');
    }
    setPendingTarget(null);
  }, [pendingTarget]);

  useEffect(() => {
    if (!pendingTarget || typeof window === 'undefined') return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPendingTarget(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingTarget]);

  const subNavItems = [
    { key: 'rooms', label: 'Rooms', dataContent: 'rooms' },
    { key: 'threads', label: 'Threads', dataContent: 'threads' },
    { key: 'timeline', label: 'Timeline', dataContent: 'timeline' },
  ];

  return (
    <>
      <aside className="threads-home-sidebar" aria-label="Threads navigation">
        <div className="threads-home-sidebar__logo">
          <div className="threads-home-sidebar__logo-wrapper">
            <div
              className="threads-home-sidebar__logo-circle"
              style={{ backgroundImage: "url('/assets/MuflLogo.png')" }}
            />
          </div>
        </div>

        <div className="threads-home-sidebar__nav-section">
          <div className="threads-home-sidebar__nav-header">Mufl</div>
          {subNavItems.map(({ key, label, dataContent }) => {
            const isActive = key === activeTab;
            return (
              <button
                key={key}
                type="button"
                className={`threads-home-sidebar__nav-sub-item${isActive ? ' active' : ''}`}
                data-content={dataContent}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavClick(key)}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="threads-home-sidebar__nav-item"
          data-content="pitch"
          onClick={() => handleNavClick('pitch')}
        >
          Pitch Deck
        </button>

        <button
          type="button"
          className="threads-home-sidebar__nav-item"
          data-content="old-videos"
          onClick={() => handleNavClick('archives')}
        >
          Archives
        </button>
      </aside>

      {pendingTarget && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          role="presentation"
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 32000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(3, 7, 18, 0.7)',
            backdropFilter: 'blur(5px)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidebar-confirm-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(92vw, 420px)',
              borderRadius: '16px',
              border: '1px solid rgba(169, 182, 252, 0.35)',
              background: 'linear-gradient(160deg, rgba(16,22,38,0.96), rgba(11,16,27,0.98))',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
              color: '#dbe6ff',
              padding: '1.2rem 1.1rem 1rem',
            }}
          >
            <h3
              id="sidebar-confirm-title"
              style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#eef2ff' }}
            >
              Open {pendingTarget.label} in new tab?
            </h3>
            <p
              style={{
                margin: '0.65rem 0 0',
                fontSize: '0.92rem',
                lineHeight: 1.55,
                color: 'rgba(219, 230, 255, 0.84)',
              }}
            >
              Do you want to open <strong>{pendingTarget.label}</strong> in a new tab?
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.65rem',
                marginTop: '1rem',
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                style={{
                  borderRadius: '10px',
                  border: '1px solid rgba(148, 163, 184, 0.38)',
                  background: 'rgba(30, 41, 59, 0.85)',
                  color: '#d4def7',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '0.5rem 0.8rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmOpen}
                style={{
                  borderRadius: '10px',
                  border: '1px solid rgba(169, 182, 252, 0.42)',
                  background: 'linear-gradient(120deg, rgba(96, 165, 250, 0.35), rgba(129, 140, 248, 0.5))',
                  color: '#f8faff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  padding: '0.5rem 0.85rem',
                  cursor: 'pointer',
                }}
              >
                Open
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function ThreadsAppShell({ children, rightPanel = null }) {
  return (
    <div className="music-home threads-home-layout">
      <div className="threads-home-shell">
        <ThreadsHomeSidebar />
        <div className="threads-home-main">
          {children}
        </div>
        {rightPanel ? (
          <div className="threads-home-rightpanel">
            {rightPanel}
          </div>
        ) : (
          <div className="threads-home-rightpanel threads-home-rightpanel-spacer" aria-hidden="true">
            <div className="threads-home-rightpanel-spacer-inner" />
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadsMainFrame({ children, viewMode = 'feed', isTransitioning = false }) {
  return (
    <div
      className={`threads-main-frame home-view-frame home-view-frame--${viewMode}${isTransitioning ? ' is-transitioning' : ''}`}
      data-view-mode={viewMode}
      style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: '0.75rem clamp(0.55rem, 2.2vw, 1rem) 0',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
}

const MusicHome = () => {
  // Core state
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canShowEmptyState, setCanShowEmptyState] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');

  // Navigation state
  const [viewState, dispatchView] = useReducer(homeViewReducer, initialViewState);

  // UI state
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [isStarfieldOpen, setIsStarfieldOpen] = useState(false);
  const [pendingSubreddit, setPendingSubreddit] = useState(null);

  // Starfield state
  const [feedCoordinate, setFeedCoordinate] = useState({ x: 50, y: 50 });
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [feedData, setFeedData] = useState({ genres: [], artists: [] });

  // Cached posts tracking
  const [cachedPosts, setCachedPosts] = useState([]);
  const [viewportMetrics, setViewportMetrics] = useState({
    width: typeof window === 'undefined' ? 1440 : window.innerWidth,
    height: typeof window === 'undefined' ? 900 : window.innerHeight,
  });
  const scrollPositionsRef = useRef({
    feed: 0,
    thread: 0,
    user: 0,
  });
  const loadMoreSentinelRef = useRef(null);
  const [visiblePostCount, setVisiblePostCount] = useState(INITIAL_VISIBLE_POSTS);

  const isStackedLayout = viewportMetrics.width <= SHELL_STACK_BREAKPOINT;
  const isMobileFeedView = viewportMetrics.width <= 640;
  const isDesktopStarfieldView = viewportMetrics.width > SHELL_STACK_BREAKPOINT;
  const selectedThread = viewState.thread;
  const selectedUser = viewState.user;
  const activeRoute = viewState.route;

  useEffect(() => {
    const updateViewportMetrics = () => {
      setViewportMetrics({
        width: window.innerWidth || 1440,
        height: window.innerHeight || 900,
      });
    };

    updateViewportMetrics();
    window.addEventListener('resize', updateViewportMetrics);
    return () => window.removeEventListener('resize', updateViewportMetrics);
  }, []);

  useEffect(() => {
    const shouldLockBody = showTikTokModal || Boolean(pendingSubreddit);
    if (!shouldLockBody || typeof document === 'undefined') {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [showTikTokModal, pendingSubreddit]);

  useEffect(() => {
    if (!isDesktopStarfieldView) {
      setIsStarfieldOpen(false);
    }
  }, [isDesktopStarfieldView]);

  const filteredPosts = useMemo(() => {
    if (currentFilter === 'all') {
      return posts;
    }

    return posts.filter((post) => normalizePostType(post?.postType) === currentFilter);
  }, [currentFilter, posts]);

  const deferredFilteredPosts = useDeferredValue(filteredPosts);
  const visiblePosts = useMemo(
    () => deferredFilteredPosts.slice(0, visiblePostCount),
    [deferredFilteredPosts, visiblePostCount]
  );
  const hasMoreVisiblePosts = visiblePostCount < deferredFilteredPosts.length;
  const isSettlingEmptyState = !isLoading && filteredPosts.length === 0 && !canShowEmptyState;
  const showFeedLoadingOverlay = isLoading || isSettlingEmptyState;

  const cachedFeedPosts = useMemo(
    () => buildCachedFeedPosts(cachedPosts),
    [cachedPosts]
  );

  useEffect(() => {
    if (isLoading || filteredPosts.length > 0) {
      setCanShowEmptyState(false);
      return;
    }

    const emptyStateTimeout = setTimeout(() => {
      setCanShowEmptyState(true);
    }, EMPTY_STATE_DELAY_MS);

    return () => clearTimeout(emptyStateTimeout);
  }, [filteredPosts.length, isLoading]);

  useEffect(() => {
    setVisiblePostCount(INITIAL_VISIBLE_POSTS);
  }, [currentFilter, posts]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || isLoading || !hasMoreVisiblePosts || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        setVisiblePostCount((prevCount) => (
          Math.min(prevCount + VISIBLE_POSTS_STEP, deferredFilteredPosts.length)
        ));
      },
      {
        root: null,
        rootMargin: '600px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [deferredFilteredPosts.length, hasMoreVisiblePosts, isLoading]);

  const starfieldPosts = useMemo(
    () => posts,
    [posts]
  );

  const toggleTikTokModal = useCallback(() => setShowTikTokModal(prev => !prev), []);

  const saveScrollForRoute = useCallback((route) => {
    if (!route || typeof window === 'undefined') {
      return;
    }
    scrollPositionsRef.current[route] = window.scrollY || 0;
  }, []);

  const restoreScrollForRoute = useCallback((route) => {
    if (!route || typeof window === 'undefined') {
      return;
    }

    const targetScrollTop = scrollPositionsRef.current[route] || 0;
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: targetScrollTop,
        left: 0,
        behavior: 'auto',
      });
    });
  }, []);

  useEffect(() => {
    if (!viewState.isTransitioning) {
      return undefined;
    }

    const transitionTimeout = window.setTimeout(() => {
      dispatchView({ type: 'END_TRANSITION' });
    }, VIEW_TRANSITION_MS);

    return () => window.clearTimeout(transitionTimeout);
  }, [viewState.isTransitioning]);

  const handleViewUserProfile = useCallback((user) => {
    if (!user || viewState.isTransitioning) {
      return;
    }

    saveScrollForRoute(viewState.route);
    dispatchView({ type: 'OPEN_USER', user });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [saveScrollForRoute, viewState.isTransitioning, viewState.route]);

  const resolveSelectedPost = useCallback((postOrId) => {
    if (!postOrId) {
      return null;
    }

    const postId = typeof postOrId === 'string' ? postOrId : postOrId.id;
    if (postId) {
      return posts.find((post) => post.id === postId)
        || cachedPosts.find((post) => post.id === postId)
        || (typeof postOrId === 'object' ? postOrId : null);
    }

    return typeof postOrId === 'object' ? postOrId : null;
  }, [cachedPosts, posts]);
  
  const handleViewThread = useCallback((postOrId) => {
    if (viewState.isTransitioning) {
      return;
    }

    const resolvedPost = resolveSelectedPost(postOrId);
    if (!resolvedPost) {
      return;
    }

    saveScrollForRoute(viewState.route);
    dispatchView({
      type: 'OPEN_THREAD',
      thread: {
      ...resolvedPost,
      postType: normalizePostType(resolvedPost?.postType),
      },
    });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [resolveSelectedPost, saveScrollForRoute, viewState.isTransitioning, viewState.route]);

  const handleBack = useCallback(() => {
    if (viewState.isTransitioning || viewState.stack.length === 0) {
      return;
    }

    const previousRoute = viewState.stack[viewState.stack.length - 1]?.route || 'feed';
    saveScrollForRoute(viewState.route);
    dispatchView({ type: 'BACK' });
    restoreScrollForRoute(previousRoute);
  }, [restoreScrollForRoute, saveScrollForRoute, viewState.isTransitioning, viewState.route, viewState.stack]);

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
    setJumpGenre(isDesktopStarfieldView ? genreName : null);
    setIsStarfieldOpen(isDesktopStarfieldView);
  }, [isDesktopStarfieldView]);

  const starfieldOpenHeight = useMemo(() => {
    const viewportHeight = viewportMetrics.height || 900;
    const preferredRatio = isStackedLayout ? 0.56 : 0.68;
    const minHeight = isStackedLayout ? 300 : 380;
    const maxHeight = isStackedLayout ? 560 : 700;
    return Math.max(minHeight, Math.min(maxHeight, Math.round(viewportHeight * preferredRatio)));
  }, [isStackedLayout, viewportMetrics.height]);

  const handleCommentSubmit = useCallback((newComment) => {
    const authorName = newComment?.author || CURRENT_USER_DISPLAY_NAME;
    const authorUsername = newComment?.username || CURRENT_USER_USERNAME;
    const authorAvatar = newComment?.avatar || CURRENT_USER_AVATAR;
    const commentId = newComment?.id || `temp_${Date.now()}`;
    const attachedSnippet = newComment?.snippet
      ? {
          ...newComment.snippet,
          commentId: newComment.snippet.commentId || commentId,
        }
      : null;
    const fallbackSnippetTitle = newComment.snippet
      ? `Shared ${newComment.snippet.name} by ${newComment.snippet.artistName}`
      : 'New thread';

    const newPost = {
      id: `user_post_${Date.now()}`,
      author: authorName,
      displayName: authorName,
      username: authorUsername,
      avatar: authorAvatar,
      title: newComment.body?.trim() || fallbackSnippetTitle,
      selftext: '',
      createdUtc: Date.now() / 1000,
      postType: 'thread',
      hasCachedData: false,
      isLocalOnly: true,
      ups: 0,
      num_comments: 1,
      imageUrl: null,
      comments: [
        {
          ...newComment,
          author: authorName,
          displayName: authorName,
          username: authorUsername,
          avatar: authorAvatar,
          id: commentId,
          replies: Array.isArray(newComment?.replies) ? newComment.replies : [],
          snippet: attachedSnippet,
        },
      ],
      snippets: attachedSnippet ? [attachedSnippet] : [],
    };
    
    if (attachedSnippet) {
      newPost.snippet = attachedSnippet;
    }

    startTransition(() => {
      setPosts(prevPosts => [newPost, ...prevPosts]);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleCachedPostsRefresh = async () => {
      try {
        const response = await fetch(buildApiUrl(`${CACHED_POSTS_FEED_SUMMARY_ENDPOINT}?refresh=1`));
        
        if (response.ok) {
          const result = await response.json();
          if (isMounted && result.success) {
            const taggedCached = tagCachedPosts(result.data);
            setCachedPosts(taggedCached);
            startTransition(() => {
              setPosts(buildCachedFeedPosts(taggedCached));
            });
          }
        }
      } catch { /* intentionally empty */ }
    };

    window.addEventListener('refreshCachedPosts', handleCachedPostsRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener('refreshCachedPosts', handleCachedPostsRefresh);
    };
  }, []);

  // Load only cached posts on page load — runs once on mount only
  useEffect(() => {
    let isMounted = true;

    async function loadCachedPosts() {
      setIsLoading(true);
      try {
        const response = await fetch(buildApiUrl(CACHED_POSTS_FEED_SUMMARY_ENDPOINT));
        
        if (response.ok) {
          const result = await response.json();
          const cachedData = tagCachedPosts(result.data);

          if (!isMounted) {
            return;
          }

          if (result.success && cachedData.length > 0) {
            setCachedPosts(cachedData);
            setPosts(buildCachedFeedPosts(cachedData));
          } else {
            setPosts([createExamplePost()]);
          }
        } else {
          if (!isMounted) {
            return;
          }

          setPosts([createExamplePost()]);
        }
        
      } catch {
        if (!isMounted) {
          return;
        }

        setPosts([createExamplePost()]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    loadCachedPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFilterChange = useCallback((filter) => {
    startTransition(() => {
      setCurrentFilter(filter);
    });
  }, []);

  const handleShowForYouFeed = useCallback(() => {
    startTransition(() => {
      setCurrentFilter("all");
      setPosts(cachedFeedPosts);
      setFeedLoaded(false);
      setFeedData({ genres: [], artists: [] });
      setJumpGenre(null);
      setIsStarfieldOpen(false);
    });
  }, [cachedFeedPosts]);

  const handleOpenSubreddit = useCallback((event, subreddit) => {
    event.preventDefault();

    if (!subreddit?.url) {
      return;
    }

    setPendingSubreddit(subreddit);
  }, []);

  const handleCloseSubredditModal = useCallback(() => {
    setPendingSubreddit(null);
  }, []);

  const handleConfirmSubredditOpen = useCallback(() => {
    if (typeof window !== 'undefined' && pendingSubreddit?.url) {
      window.open(pendingSubreddit.url, '_blank', 'noopener,noreferrer');
    }
    setPendingSubreddit(null);
  }, [pendingSubreddit]);

  useEffect(() => {
    if (!pendingSubreddit || typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPendingSubreddit(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingSubreddit]);

  const renderedPosts = useMemo(() => {
    if (isLoading) {
      return null;
    }

    return visiblePosts.map((post) => (
      <div
        key={post.id}
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <div style={{ width: '100%', maxWidth: '990px', padding: '0 clamp(0.25rem, 1.6vw, 0.85rem)' }}>
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
  }, [handleViewThread, handleViewUserProfile, isLoading, visiblePosts]);

  return (
    <>
      {activeRoute === 'user' && selectedUser ? (
        <ThreadsAppShell>
          <ThreadsMainFrame viewMode={activeRoute} isTransitioning={viewState.isTransitioning}>
            <UserProfile 
              user={selectedUser} 
              onBack={handleBack}
            />
          </ThreadsMainFrame>
        </ThreadsAppShell>
      ) : activeRoute === 'thread' && selectedThread ? (
        <ThreadsAppShell>
          <ThreadsMainFrame viewMode={activeRoute} isTransitioning={viewState.isTransitioning}>
            <Suspense fallback={<HomeViewFallback label="Loading thread..." />}>
              {selectedThread.postType === "groupchat" ? (
                <GroupChatDetail
                  post={selectedThread}
                  onBack={handleBack}
                  onUserListUpdate={() => { /* intentionally empty */ }}
                />
              ) : selectedThread.postType === "parameter" ? (
                <ParameterThreadDetail
                  postId={selectedThread.id}
                  onBack={handleBack}
                  onSelectUser={handleViewUserProfile}
                />
              ) : (
                <ThreadDetail 
                  postId={selectedThread.id}
                  postData={selectedThread}
                  onSelectUser={handleViewUserProfile}
                  onBack={handleBack} 
                />
              )}
            </Suspense>
          </ThreadsMainFrame>
        </ThreadsAppShell>
      ) : (
        <ThreadsAppShell
          rightPanel={(
            <MemoRightPanel
              feedLoaded={feedLoaded}
              coordinates={feedCoordinate}
              genres={feedData.genres}
              artists={feedData.artists}
              onLoadGenreFeed={handleLoadGenreFeed}
              cachedPosts={cachedPosts}
              onNavigateToThread={handleViewThread}
              onUserClick={handleViewUserProfile}
            />
          )}
        >
          <ThreadsMainFrame viewMode={activeRoute} isTransitioning={viewState.isTransitioning}>
                {isDesktopStarfieldView && (
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
                      height: isStarfieldOpen ? starfieldOpenHeight : 76,
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
                )}

            <div className="feed-content-overlay" style={{
              maxWidth: '1000px',
              width: '100%',
              margin: '0 auto',
              padding: 'clamp(0.9rem, 2.2vw, 1.25rem) clamp(0.65rem, 2.2vw, 1rem) 0',
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
                margin: '1.5rem 0 0.75rem',
                padding: '0.5rem 0 0',
                width: '100%',
                position: 'relative'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', gridColumn: '2' }}>
                    <button
                      type="button"
                      onClick={handleShowForYouFeed}
                      style={{
                        background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: 'clamp(1.55rem, 7.2vw, 2.5rem)',
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

                    {!isMobileFeedView && (
                      <button
                        type="button"
                        disabled
                        style={{
                          color: 'rgba(255, 255, 255, 0.14)',
                          WebkitTextFillColor: 'rgba(255, 255, 255, 0.14)',
                          fontSize: 'clamp(1.55rem, 7.2vw, 2.5rem)',
                          fontWeight: 700,
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          margin: 0,
                          lineHeight: '1.2',
                          cursor: 'not-allowed',
                          transition: 'opacity 160ms ease',
                        }}
                        title="Trending (disabled)"
                      >
                        Trending
                      </button>
                    )}

                    {!isMobileFeedView && (
                      <button
                        type="button"
                        disabled
                        style={{
                          color: 'rgba(255, 255, 255, 0.14)',
                          WebkitTextFillColor: 'rgba(255, 255, 255, 0.14)',
                          fontSize: 'clamp(1.55rem, 7.2vw, 2.5rem)',
                          fontWeight: 700,
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          margin: 0,
                          lineHeight: '1.2',
                          cursor: 'not-allowed',
                          transition: 'opacity 160ms ease',
                        }}
                        title="Recents (coming soon)"
                      >
                        Recents
                      </button>
                    )}
                  </div>

                  <div style={{ gridColumn: '3', justifySelf: 'end' }}>
                    <MemoInfoIconModal
                      title="For You"
                      modalId="for-you-info"
                      iconSize={20}
                      buttonText="Info"
                      steps={FOR_YOU_INFO_STEPS}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  margin: '0.6rem auto 1rem',
                  padding: '0.55rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  background: 'rgba(169, 182, 252, 0.05)',
                  border: '1px solid rgba(169, 182, 252, 0.12)',
                  borderRadius: '10px',
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 20 20"
                  fill="none"
                  style={{ flexShrink: 0, opacity: 0.45 }}
                >
                  <circle cx="10" cy="10" r="9" stroke="#a9b6fc" strokeWidth="1.5" />
                  <circle cx="10" cy="8" r="2.5" stroke="#a9b6fc" strokeWidth="1.5" />
                  <path d="M4.5 16c.8-2.5 3-4 5.5-4s4.7 1.5 5.5 4" stroke="#a9b6fc" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.35)' }}>
                  All posts cached from
                </span>
                {REDDIT_SOURCE_SUBREDDITS.map((subreddit, index) => {
                  const isLast = index === REDDIT_SOURCE_SUBREDDITS.length - 1;
                  const isSecondToLast = index === REDDIT_SOURCE_SUBREDDITS.length - 2;
                  return (
                    <React.Fragment key={subreddit.label}>
                      <a
                        href={subreddit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => handleOpenSubreddit(event, subreddit)}
                        style={{
                          color: '#a9b6fc',
                          fontWeight: 600,
                          fontSize: '0.76rem',
                          textDecoration: 'none',
                          borderBottom: '1px solid rgba(169, 182, 252, 0.28)',
                          paddingBottom: '1px',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = 'rgba(169, 182, 252, 0.7)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'rgba(169, 182, 252, 0.28)'}
                      >
                        {subreddit.label}
                      </a>
                      {isSecondToLast && (
                        <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.76rem' }}>and</span>
                      )}
                      {!isLast && !isSecondToLast && (
                        <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.76rem' }}>,</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="content-wrapper" style={{
                backgroundColor: 'rgba(12, 17, 27, 0.7)',
                borderRadius: '1.5rem',
                padding: 'clamp(0.95rem, 2.4vw, 1.5rem)',
                boxSizing: 'border-box',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflowX: 'hidden',
                overflowY: 'visible',
                width: '100%',
                maxWidth: '100%',
                margin: '0 auto',
                position: 'relative'
              }}>
                <div className={`feed-content-body ${showFeedLoadingOverlay ? 'feed-content-body--loading' : ''}`}>
                  <div className="feed-content-main">

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
                
                <MemoHomeCommentComposer
                  onSubmit={handleCommentSubmit}
                  onOpenTikTokModal={toggleTikTokModal}
                />
                
                {!isLoading && canShowEmptyState && filteredPosts.length === 0 && (
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

                {!isLoading && hasMoreVisiblePosts && (
                  <div
                    ref={loadMoreSentinelRef}
                    aria-hidden="true"
                    style={{
                      height: 1,
                      width: '100%',
                    }}
                  />
                )}
                  </div>

                  {showFeedLoadingOverlay && (
                    <div className="feed-loading-overlay">
                      <div className="loading-container">
                        <div className="spinner"></div>
                        <p className="spinner-text">
                          {isLoading ? 'Loading your feed...' : 'Checking for posts...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {showTikTokModal && (
                  <Suspense fallback={<HomeModalFallback />}>
                    <HomeTikTokModal 
                      onClose={() => setShowTikTokModal(false)} 
                      cachedPosts={cachedPosts}
                      onNavigateToThread={handleViewThread}
                    />
                  </Suspense>
                )}

                {pendingSubreddit && typeof document !== 'undefined' && ReactDOM.createPortal(
                  <div
                    role="presentation"
                    onClick={handleCloseSubredditModal}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 32000,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1rem',
                      background: 'rgba(3, 7, 18, 0.7)',
                      backdropFilter: 'blur(5px)',
                    }}
                  >
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="subreddit-confirm-title"
                      onClick={(event) => event.stopPropagation()}
                      style={{
                        width: 'min(92vw, 420px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(169, 182, 252, 0.35)',
                        background: 'linear-gradient(160deg, rgba(16,22,38,0.96), rgba(11,16,27,0.98))',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
                        color: '#dbe6ff',
                        padding: '1.2rem 1.1rem 1rem',
                      }}
                    >
                      <h3
                        id="subreddit-confirm-title"
                        style={{
                          margin: 0,
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: '#eef2ff',
                        }}
                      >
                        Open subreddit in new tab?
                      </h3>
                      <p
                        style={{
                          margin: '0.65rem 0 0',
                          fontSize: '0.92rem',
                          lineHeight: 1.55,
                          color: 'rgba(219, 230, 255, 0.84)',
                        }}
                      >
                        Do you want to open <strong>{pendingSubreddit.label}</strong> in a new tab?
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '0.65rem',
                          marginTop: '1rem',
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleCloseSubredditModal}
                          style={{
                            borderRadius: '10px',
                            border: '1px solid rgba(148, 163, 184, 0.38)',
                            background: 'rgba(30, 41, 59, 0.85)',
                            color: '#d4def7',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            padding: '0.5rem 0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmSubredditOpen}
                          style={{
                            borderRadius: '10px',
                            border: '1px solid rgba(169, 182, 252, 0.42)',
                            background: 'linear-gradient(120deg, rgba(96, 165, 250, 0.35), rgba(129, 140, 248, 0.5))',
                            color: '#f8faff',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            padding: '0.5rem 0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </ThreadsMainFrame>
        </ThreadsAppShell>
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

        @keyframes starfieldPop {
          from { opacity: 0; transform: translateY(-6px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default MusicHome;
