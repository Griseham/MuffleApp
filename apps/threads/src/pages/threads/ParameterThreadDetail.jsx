// src/pages/threads/ParameterThreadDetail.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts'; 
import { 
  Heart, MessageCircle, Share2, Bookmark, 
  BarChart3
} from 'lucide-react';
import InfoIconModal from '../../components/InfoIconModal';

// Import components
import GraphModal from "../modals/GraphModal";
import TikTokModal from "../modals/TikTokModal";
import ThreadCommentCard from './ThreadCommentCard';
import ThreadCommentComposer from './ThreadCommentComposer';
import { ScatterRatingsGraph as ThreadDetailScatterRatingsGraph } from './GraphComponents';
import { generateHash, getCommentMetrics, getCommunitySnippetStats } from './threadHelpers';
import { buildApiUrl } from '../../utils/api';
import GlobalModalContext from '../../components/context/GlobalModalContext';

// Import utilities and styles
import { authorToAvatar, getAvatarSrc } from "../utils/utils";
import { FiArrowLeft } from "react-icons/fi";
import ThreadDetailStyles from "./ThreadDetailStyles";
import './../../styles/threadDetailStyles.css';

const THREAD_THEME_COLOR = '#00C4B4';
const PARAMETER_PALETTE = [
  '#EF4444',
  '#F59E0B',
  '#22C55E',
  '#3B82F6',
  '#EC4899',
  '#8B5CF6',
  '#14B8A6',
  '#A16207',
];
const MIN_PARAMETER_SONG_COUNT = 11;
const MAX_PARAMETER_SONG_COUNT = 23;
const INITIAL_PARAMETER_VERTICAL_USERS = [
  { username: "EchoPilot", userRating: 88, avgRating: 74, parameterIndex: 0 },
  { username: "NovaRhythm", userRating: 71, avgRating: 66, parameterIndex: 1 },
];
const INITIAL_PARAMETER_SCATTER_USERS = [
  "AuroraLoop",
  "NeonTape",
  "EchoPulse",
  "SonicAtlas",
  "VinylOrbit",
  "CobaltWave",
  "MintCassette",
  "SolarGroove",
];

function rangeFromSeed(seedInput, min, max) {
  const seed = Math.abs(generateHash(seedInput));
  const span = Math.max(1, max - min + 1);
  return min + (seed % span);
}

function normalizeMetricCount(value, fallback, minimumValid = 1) {
  if (Number.isFinite(value) && value >= minimumValid) {
    return Math.round(value);
  }
  return Math.round(fallback);
}

function getRealisticParameterCommentMetrics(comment = {}, hasSnippet = false) {
  const baseMetrics = getCommentMetrics(comment, hasSnippet);
  const seedBase = `${comment?.id || "comment"}:${comment?.author || "unknown"}:${(comment?.body || "").slice(0, 48)}`;

  const fallbackLikeCount = hasSnippet
    ? rangeFromSeed(`${seedBase}:parameter:likes:snippet`, 360, 980)
    : rangeFromSeed(`${seedBase}:parameter:likes:plain`, 90, 280);
  const fallbackCommentCount = hasSnippet
    ? rangeFromSeed(`${seedBase}:parameter:comments:snippet`, 24, 160)
    : rangeFromSeed(`${seedBase}:parameter:comments:plain`, 8, 52);

  const likeCount = normalizeMetricCount(
    baseMetrics.likeCount,
    fallbackLikeCount,
    hasSnippet ? 180 : 60
  );
  const commentCount = normalizeMetricCount(
    baseMetrics.commentCount,
    fallbackCommentCount,
    hasSnippet ? 14 : 5
  );

  const interactionFallback = Math.round(
    (likeCount * 0.7) + (commentCount * 2.7) + (hasSnippet ? 190 : 55)
  );
  const interactionCount = normalizeMetricCount(
    baseMetrics.interactionCount,
    interactionFallback,
    hasSnippet ? 220 : 75
  );

  return {
    ...baseMetrics,
    likeCount,
    commentCount,
    interactionCount,
  };
}

function normalizeParameterKey(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function buildParameterLookup(parameters = []) {
  const lookup = new Map();
  parameters.forEach((parameter) => {
    const key = normalizeParameterKey(parameter);
    if (key && !lookup.has(key)) {
      lookup.set(key, parameter);
    }
  });
  return lookup;
}

function resolveKnownParameter(candidates = [], parameterLookup = new Map(), fallback = null) {
  for (const candidate of candidates) {
    const key = normalizeParameterKey(candidate);
    if (key && parameterLookup.has(key)) {
      return parameterLookup.get(key);
    }
  }
  return fallback;
}

function buildRandomizedParameterCounts(seedPrefix, parameters = []) {
  const counts = {};
  const usedCounts = new Set();

  parameters.forEach((parameter, index) => {
    let count = rangeFromSeed(
      `${seedPrefix || "parameter-thread"}:${parameter}:${index}:song-count`,
      MIN_PARAMETER_SONG_COUNT,
      MAX_PARAMETER_SONG_COUNT
    );
    let attempts = 0;

    while (usedCounts.has(count) && attempts < (MAX_PARAMETER_SONG_COUNT - MIN_PARAMETER_SONG_COUNT + 1)) {
      count = count >= MAX_PARAMETER_SONG_COUNT ? MIN_PARAMETER_SONG_COUNT : count + 1;
      attempts += 1;
    }

    usedCounts.add(count);
    counts[parameter] = count;
  });

  return counts;
}

function buildNonOverlappingRandomPoints(
  seedKey,
  count,
  {
    minX = 8,
    maxX = 92,
    minY = 10,
    maxY = 90,
    minDistance = 11,
  } = {}
) {
  const points = [];
  const distanceSq = minDistance * minDistance;

  for (let index = 0; index < count; index += 1) {
    let accepted = false;

    for (let attempt = 0; attempt < 48; attempt += 1) {
      const x = rangeFromSeed(`${seedKey}:x:${index}:${attempt}`, minX, maxX);
      const y = rangeFromSeed(`${seedKey}:y:${index}:${attempt}`, minY, maxY);
      const hasCollision = points.some((point) => {
        const dx = point.x - x;
        const dy = point.y - y;
        return (dx * dx) + (dy * dy) < distanceSq;
      });

      if (!hasCollision) {
        points.push({ x, y });
        accepted = true;
        break;
      }
    }

    if (!accepted) {
      points.push({
        x: rangeFromSeed(`${seedKey}:fallback:x:${index}`, minX, maxX),
        y: rangeFromSeed(`${seedKey}:fallback:y:${index}`, minY, maxY),
      });
    }
  }

  return points;
}

function buildInitialParameterGraphRatings(threadSeed, parameters = []) {
  return INITIAL_PARAMETER_VERTICAL_USERS.map((seedUser, index) => ({
    snippetId: `__parameter_seed_vertical_${threadSeed}_${index + 1}`,
    userRating: seedUser.userRating,
    avgRating: seedUser.avgRating,
    userAvatar: authorToAvatar(seedUser.username),
    parameter: parameters[seedUser.parameterIndex] || parameters[index] || parameters[0] || null,
  }));
}

function buildInitialParameterScatterUsers(threadSeed, parameters = [], getParameterColor) {
  const points = buildNonOverlappingRandomPoints(
    `${threadSeed}:scatter:initial`,
    INITIAL_PARAMETER_SCATTER_USERS.length,
    { minX: 10, maxX: 90, minY: 12, maxY: 88, minDistance: 12 }
  );

  return INITIAL_PARAMETER_SCATTER_USERS.map((username, index) => {
    const parameter = parameters[index % Math.max(1, parameters.length)] || null;
    return {
      username,
      userAvatar: authorToAvatar(username),
      ratingCount: rangeFromSeed(`${threadSeed}:initial:ratings:${username}`, 12, 78),
      average: rangeFromSeed(`${threadSeed}:initial:average:${username}`, 28, 92),
      parameter,
      color: getParameterColor(parameter, index),
      _plotX: points[index].x,
      _plotY: points[index].y,
    };
  });
}

function normalizeParameterThreadData(rawPost = {}, rawComments = [], rawSnippets = []) {
  const parameterLookup = buildParameterLookup(rawPost?.parameters || []);
  const snippetByCommentId = new Map();

  rawSnippets.forEach((snippet) => {
    const snippetId = snippet?.commentId || snippet?.id;
    if (snippetId) {
      snippetByCommentId.set(snippetId, snippet);
    }
  });

  const normalizedComments = rawComments.map((comment) => {
    const linkedSnippet = snippetByCommentId.get(comment?.id);
    const resolvedParameter = resolveKnownParameter(
      [
        comment?.parameter,
        comment?.snippet?.parameter,
        comment?.snippet?.artistName,
        linkedSnippet?.parameter,
        linkedSnippet?.artistName,
        linkedSnippet?.snippetData?.attributes?.artistName,
      ],
      parameterLookup,
      comment?.parameter || null
    );

    if (!resolvedParameter || resolvedParameter === comment?.parameter) {
      return comment;
    }

    return {
      ...comment,
      parameter: resolvedParameter,
    };
  });

  const commentParameterById = new Map(
    normalizedComments
      .filter((comment) => comment?.id && comment?.parameter)
      .map((comment) => [comment.id, comment.parameter])
  );

  const normalizedSnippets = rawSnippets.map((snippet) => {
    const snippetId = snippet?.commentId || snippet?.id;
    const commentParameter = snippetId ? commentParameterById.get(snippetId) : null;
    const resolvedParameter = resolveKnownParameter(
      [
        snippet?.parameter,
        snippet?.artistName,
        snippet?.snippetData?.attributes?.artistName,
        commentParameter,
      ],
      parameterLookup,
      snippet?.parameter || commentParameter || null
    );

    return normalizeParameterSnippet({
      ...snippet,
      parameter: resolvedParameter,
    });
  });

  return {
    comments: normalizedComments,
    snippets: normalizedSnippets,
  };
}

function formatArtworkUrl(url, size = 300) {
  if (!url || typeof url !== "string") {
    return "/assets/default-artist.png";
  }

  return url
    .replace('{w}', String(size))
    .replace('{h}', String(size))
    .replace('{f}', 'jpg');
}

function normalizeParameterSnippet(snippet = {}) {
  const attrs = snippet?.snippetData?.attributes || {};
  const snippetId = snippet.commentId || snippet.id;
  const communityStats = getCommunitySnippetStats(snippetId, snippet.avgRating);
  const hasTotalRatings = Number.isFinite(snippet.totalRatings) && snippet.totalRatings > 0;
  const hasAvgRating = Number.isFinite(snippet.avgRating);

  return {
    ...snippet,
    id: snippetId,
    commentId: snippetId,
    name: snippet.songName || snippet.name || attrs.name || "Unknown Song",
    artistName: snippet.artistName || attrs.artistName || "Unknown Artist",
    artwork: formatArtworkUrl(
      snippet.artworkUrl ||
      snippet.artwork ||
      attrs.artwork?.url ||
      snippet.artistImage ||
      "/assets/default-artist.png"
    ),
    previewUrl: snippet.previewUrl || attrs.previews?.[0]?.url || null,
    userRating: Number.isFinite(snippet.userRating) ? snippet.userRating : null,
    avgRating: hasAvgRating ? Math.round(snippet.avgRating) : communityStats.avgRating,
    totalRatings: hasTotalRatings ? Math.round(snippet.totalRatings) : communityStats.totalRatings,
    didRate: Boolean(snippet.didRate),
  };
}

function buildProfileUser(userLike, fallbackName, fallbackAvatar) {
  const displayName =
    userLike?.displayName ||
    userLike?.name ||
    userLike?.author ||
    fallbackName ||
    "User";

  const username =
    userLike?.username ||
    String(displayName)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) ||
    "user";

  return {
    ...userLike,
    displayName,
    name: userLike?.name || displayName,
    username,
    avatar: userLike?.avatar || fallbackAvatar || authorToAvatar(displayName),
  };
}

// Mock data for parameter thread
const parameterThreadMockData = {
  post: {
    id: 'parameter_thread_001',
    title: 'Comparing music from my 4 favorite bands, dying to know which songs end up being recommended',
    author: 'MusicComparison23',
    selftext: "I've been obsessed with these 4 bands lately and want to see what songs you all think represent them best. Drop your favorite tracks from Imagine Dragons, Green Day, OneRepublic, and Maroon 5. Really curious to see which direction this goes!",
    createdUtc: Date.now() / 1000 - 7200, // 2 hours ago
    postType: 'parameter',
    ups: 156,
    num_comments: 20,
    parameters: ['Imagine Dragons', 'Green Day', 'OneRepublic', 'Maroon 5'],
    imageUrl: '/assets/Parameter1.png'
  },
  
  comments: [
    {
      id: 'param_comment_001',
      author: 'RockFan2024',
      body: 'Imagine Dragons hits different when you listen to Demons live. The raw emotion Adam Levine puts into it is incredible!',
      createdUtc: Date.now() / 1000 - 6800,
      likeCount: 23,
      commentCount: 4,
      parameter: 'Imagine Dragons',
      snippet: {
        name: 'Demons',
        artistName: 'Imagine Dragons',
        artwork: '/assets/image123.png',
        previewUrl: null,
        userRating: null,
        avgRating: null,
        totalRatings: null,
        didRate: false
      }
    },
    
    {
      id: 'param_comment_002',
      author: 'PunkRockLover',
      body: 'Green Day will always be legendary for this track. Basket Case perfectly captures that 90s anxiety and energy that defined a generation.',
      createdUtc: Date.now() / 1000 - 6200,
      likeCount: 31,
      commentCount: 7,
      parameter: 'Green Day',
      snippet: {
        name: 'Basket Case',
        artistName: 'Green Day',
        artwork: '/assets/image234.png',
        previewUrl: null,
        userRating: null,
        avgRating: null,
        totalRatings: null,
        didRate: false
      }
    },
    
    {
      id: 'param_comment_003',
      author: 'PopRockDaily',
      body: 'OneRepublic\'s songwriting is next level. Counting Stars is pure perfection - the way it builds up is just *chef\'s kiss*',
      createdUtc: Date.now() / 1000 - 5800,
      likeCount: 19,
      commentCount: 2,
      parameter: 'OneRepublic',
      snippet: {
        name: 'Counting Stars',
        artistName: 'OneRepublic',
        artwork: '/assets/image345.png',
        previewUrl: null,
        userRating: null,
        avgRating: null,
        totalRatings: null,
        didRate: false
      }
    },
    
    {
      id: 'param_comment_004',
      author: 'MelodyMaster',
      body: 'Maroon 5 before they went full pop was incredible. This Love showcases Adam\'s vocal range and the band\'s rock roots perfectly.',
      createdUtc: Date.now() / 1000 - 5400,
      likeCount: 27,
      commentCount: 5,
      parameter: 'Maroon 5',
      snippet: {
        name: 'This Love',
        artistName: 'Maroon 5',
        artwork: '/assets/image456.png',
        previewUrl: null,
        userRating: null,
        avgRating: null,
        totalRatings: null,
        didRate: false
      }
    },
    
    {
      id: 'param_comment_005',
      author: 'DragonFan99',
      body: 'Thunder is such an underrated Imagine Dragons track! The experimental sound and those drums... this song got me through some tough times.',
      createdUtc: Date.now() / 1000 - 4900,
      likeCount: 15,
      commentCount: 3,
      parameter: 'Imagine Dragons',
      snippet: {
        name: 'Thunder',
        artistName: 'Imagine Dragons',
        artwork: '/assets/image567.png',
        previewUrl: null,
        userRating: null,
        avgRating: null,
        totalRatings: null,
        didRate: false
      }
    },
    
    {
      id: 'param_comment_006',
      author: 'GuitarHero2000',
      body: 'When I Come Around by Green Day is criminally underrated. The guitar work and Billie Joe\'s lyrics about growing up hit so hard.',
      createdUtc: Date.now() / 1000 - 4500,
      likeCount: 22,
      commentCount: 6,
      parameter: 'Green Day',
      snippet: {
        name: 'When I Come Around',
        artistName: 'Green Day',
        artwork: '/assets/image678.png',
        previewUrl: null,
        userRating: null,
        avgRating: null,
        totalRatings: null,
        didRate: false
      }
    },
    
    {
      id: 'param_comment_007',
      author: 'IndieVibes',
      body: 'Apologize by OneRepublic is a masterpiece of songwriting. Ryan Tedder really knows how to craft a hook that sticks with you forever.',
      createdUtc: Date.now() / 1000 - 4100,
      likeCount: 34,
      commentCount: 8,
      parameter: 'OneRepublic',
      snippet: {
        name: 'Apologize',
        artistName: 'OneRepublic',
        artwork: '/assets/image789.png',
        previewUrl: null,
        userRating: null,
        avgRating: null,
        totalRatings: null,
        didRate: false
      }
    },
    
    {
      id: 'param_comment_008',
      author: 'VocalRange',
      body: 'Sunday Morning by Maroon 5 is so chill and perfect for lazy weekends. Adam\'s falsetto in this is absolutely gorgeous.',
      createdUtc: Date.now() / 1000 - 3700,
      likeCount: 18,
      commentCount: 2,
      parameter: 'Maroon 5',
      snippet: {
        name: 'Sunday Morning',
        artistName: 'Maroon 5',
        artwork: '/assets/image890.png',
        previewUrl: null,
        userRating: null,
        avgRating: null,
        totalRatings: null,
        didRate: false
      }
    },
    
    {
      id: 'param_comment_009',
      author: 'NightVisionMusic',
      body: 'Radioactive changed everything for Imagine Dragons. This song put them on the map and for good reason - it\'s an absolute anthem!',
      createdUtc: Date.now() / 1000 - 3300,
      likeCount: 41,
      commentCount: 12,
      parameter: 'Imagine Dragons',
      snippet: {
        name: 'Radioactive',
        artistName: 'Imagine Dragons',
        artwork: '/assets/image901.png',
        previewUrl: null,
        userRating: null,
        avgRating: null,
        totalRatings: null,
        didRate: false
      }
    },
    
    {
      id: 'param_comment_010',
      author: 'AlternativeRocks',
      body: 'Good Riddance (Time of Your Life) by Green Day is pure poetry. This acoustic masterpiece shows their softer side while still being powerful.',
      createdUtc: Date.now() / 1000 - 2900,
      likeCount: 29,
      commentCount: 5,
      parameter: 'Green Day',
      snippet: {
        name: 'Good Riddance (Time of Your Life)',
        artistName: 'Green Day',
        artwork: '/assets/image012.png',
        previewUrl: null,
        userRating: null,
        avgRating: null,
        totalRatings: null,
        didRate: false
      }
    },
    
    // Comments without snippets
    {
      id: 'param_comment_011',
      author: 'MusicCritic2024',
      body: 'Great selection of bands! Each one brings something unique to the table. Imagine Dragons with their anthemic sound, Green Day with punk rock energy, OneRepublic with incredible songwriting, and Maroon 5 with those smooth vocals.',
      createdUtc: Date.now() / 1000 - 2500,
      likeCount: 12,
      commentCount: 1,
      parameter: null
    },
    
    {
      id: 'param_comment_012',
      author: 'BandAnalyst',
      body: 'It\'s interesting how all these bands evolved over time. Green Day went from punk to rock opera, Maroon 5 shifted to pop, while Imagine Dragons and OneRepublic found their signature sounds early and stuck with them.',
      createdUtc: Date.now() / 1000 - 2100,
      likeCount: 25,
      commentCount: 4,
      parameter: null
    }
  ],
  
  snippetRecs: [
    {
      commentId: 'param_comment_001',
      id: 'param_comment_001',
      parameter: 'Imagine Dragons',
      userRating: null,
      avgRating: null,
      totalRatings: 0,
      didRate: false
    },
    {
      commentId: 'param_comment_002',
      id: 'param_comment_002',
      parameter: 'Green Day',
      userRating: null,
      avgRating: null,
      totalRatings: 0,
      didRate: false
    },
    {
      commentId: 'param_comment_003',
      id: 'param_comment_003',
      parameter: 'OneRepublic',
      userRating: null,
      avgRating: null,
      totalRatings: 0,
      didRate: false
    },
    {
      commentId: 'param_comment_004',
      id: 'param_comment_004',
      parameter: 'Maroon 5',
      userRating: null,
      avgRating: null,
      totalRatings: 0,
      didRate: false
    }
  ]
};

export default function ParameterThreadDetail({ postId, onBack, onSelectUser }) {
  const { closeModal: closeGlobalModal } = useContext(GlobalModalContext);

  // Transition state
  const [isVisible, setIsVisible] = useState(false);
  
  // Data states
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [snippetRecs, setSnippetRecs] = useState([]);
  const [_isLoading, setIsLoading] = useState(true);
  
  // UI states
  const [graphRatings, setGraphRatings] = useState([]);
  const [parameterScatterData, setParameterScatterData] = useState([]);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [activeGraphType, setActiveGraphType] = useState('vertical');
  const [isGraphsOpen, setIsGraphsOpen] = useState(false);
  const [isTikTokOpen, setIsTikTokOpen] = useState(false);
  const [hasUserRatedInSession, setHasUserRatedInSession] = useState(false);

  // Always enter parameter thread detail with info sidebar closed.
  useEffect(() => {
    closeGlobalModal();
  }, [postId, closeGlobalModal]);

  const fallbackParameter =
    post?.parameters?.[0] ||
    comments.find((comment) => comment?.parameter)?.parameter ||
    null;
  const postParameterLookup = useMemo(
    () => buildParameterLookup(post?.parameters || []),
    [post?.parameters]
  );
  const resolveParameterTag = useCallback((...candidates) => (
    resolveKnownParameter(candidates, postParameterLookup, fallbackParameter)
  ), [fallbackParameter, postParameterLookup]);
  const displayComments = comments;
  const snippetIds = useMemo(
    () => new Set(snippetRecs.map((snippet) => snippet?.commentId || snippet?.id).filter(Boolean)),
    [snippetRecs]
  );
  const displayCommentsWithMetrics = useMemo(
    () =>
      displayComments.map((comment) => {
        const hasSnippet = Boolean(comment?.snippet) || snippetIds.has(comment?.id);
        return getRealisticParameterCommentMetrics(comment, hasSnippet);
      }),
    [displayComments, snippetIds]
  );
  const displayedPostStats = useMemo(() => ({
    num_comments: 0,
    ups: 0,
    bookmarks: 0,
  }), []);
  const displayedPostStatsWithFallback = useMemo(() => {
    const totalLikes = displayCommentsWithMetrics.reduce(
      (sum, comment) => sum + (Number.isFinite(comment.likeCount) ? comment.likeCount : 0),
      0
    );
    const totalReplies = displayCommentsWithMetrics.reduce(
      (sum, comment) => sum + (Number.isFinite(comment.commentCount) ? comment.commentCount : 0),
      0
    );
    const snippetCommentCount = displayCommentsWithMetrics.reduce((sum, comment) => {
      const hasSnippet = Boolean(comment?.snippet) || snippetIds.has(comment?.id);
      return sum + (hasSnippet ? 1 : 0);
    }, 0);

    const derivedUps = Math.max(
      420,
      Math.round((totalLikes * 0.36) + (totalReplies * 2.2))
    );
    const derivedBookmarks = Math.max(
      90,
      Math.round((derivedUps * 0.22) + (snippetCommentCount * 18))
    );
    const derivedCommentCount = Math.max(comments.length, totalReplies);

    const resolvedNumComments =
      Number.isFinite(post?.num_comments) && post.num_comments >= 120
        ? post.num_comments
        : derivedCommentCount;
    const resolvedUps =
      Number.isFinite(post?.ups) && post.ups >= 320
        ? post.ups
        : derivedUps;
    const resolvedBookmarks =
      Number.isFinite(post?.bookmarks) && post.bookmarks >= 70
        ? post.bookmarks
        : derivedBookmarks;

    return {
      ...displayedPostStats,
      num_comments: resolvedNumComments,
      ups: resolvedUps,
      bookmarks: resolvedBookmarks,
    };
  }, [comments.length, displayCommentsWithMetrics, displayedPostStats, post, snippetIds]);

  const parameterColorMap = useMemo(() => {
    const map = new Map();
    const orderedKeys = [];
    const seen = new Set();

    const addParameter = (parameterName) => {
      const key = normalizeParameterKey(parameterName);
      if (!key || seen.has(key)) return;
      seen.add(key);
      orderedKeys.push(key);
    };

    if (Array.isArray(post?.parameters)) {
      post.parameters.forEach(addParameter);
    }

    comments.forEach((comment) => addParameter(comment?.parameter));

    orderedKeys.forEach((key, index) => {
      map.set(key, PARAMETER_PALETTE[index % PARAMETER_PALETTE.length]);
    });

    return map;
  }, [comments, post?.parameters]);

  const getParameterColor = useCallback((parameterName, fallbackIndex = 0) => {
    const key = normalizeParameterKey(parameterName);
    if (key && parameterColorMap.has(key)) {
      return parameterColorMap.get(key);
    }
    return PARAMETER_PALETTE[fallbackIndex % PARAMETER_PALETTE.length];
  }, [parameterColorMap]);
  const initialGraphRatings = useMemo(
    () => buildInitialParameterGraphRatings(post?.id || postId, post?.parameters || []),
    [post?.id, post?.parameters, postId]
  );
  const initialScatterUsers = useMemo(
    () => buildInitialParameterScatterUsers(post?.id || postId, post?.parameters || [], getParameterColor),
    [getParameterColor, post?.id, post?.parameters, postId]
  );
  
  // Audio states
  const audioRef = useRef(null);
  const [activeSnippet, setActiveSnippet] = useState({
    snippetId: null,
    isPlaying: false,
    elapsedSeconds: 0,
    userRating: null,
    didRate: false,
  });
  const intervalRef = useRef(null);

  // Handle entrance transition
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Load parameter thread data
  useEffect(() => {
    async function loadParameterThread() {
      setIsLoading(true);

      try {
        const cacheResp = await fetch(buildApiUrl(`/cached-posts/${postId}`));
        
        if (cacheResp.ok) {
          const { data: cachedData } = await cacheResp.json();
          
          if (cachedData && cachedData.postType === 'parameter') {
            const normalizedData = normalizeParameterThreadData(
              cachedData,
              cachedData.comments || [],
              cachedData.snippets || []
            );
            setPost(cachedData);
            setComments(normalizedData.comments);
            setSnippetRecs(normalizedData.snippets);
            setIsLoading(false);
            return;
          }
        }

        if (postId === 'parameter_thread_001') {
          const normalizedData = normalizeParameterThreadData(
            parameterThreadMockData.post,
            parameterThreadMockData.comments,
            parameterThreadMockData.snippetRecs
          );
          setPost(parameterThreadMockData.post);
          setComments(normalizedData.comments);
          setSnippetRecs(normalizedData.snippets);
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
        
      } catch {
        setIsLoading(false);
      }
    }
    
    if (postId) {
      loadParameterThread();
    }
  }, [postId]);

  // Process parameter-specific graph data
  useEffect(() => {
    if (!post?.parameters) {
      setGraphRatings([]);
      setParameterScatterData([]);
      return;
    }

    const snippetsByCommentId = new Map(
      snippetRecs
        .filter((snippet) => snippet?.commentId || snippet?.id)
        .map((snippet) => [snippet.commentId || snippet.id, snippet])
    );
    
    // Process vertical ratings data
    const ratedSnippets = snippetRecs.filter(
      snippet => Number.isFinite(snippet.userRating) || Boolean(snippet.didRate)
    );
    
    if (ratedSnippets.length > 0) {
      const verticalData = ratedSnippets.map(snippet => {
        const snippetId = snippet.commentId || snippet.id;
        const relatedComment = displayComments.find(c => c.id === snippetId);
        const commentAuthor = relatedComment?.author || "Unknown";
        const resolvedParameter = resolveParameterTag(
          snippet.parameter,
          relatedComment?.parameter,
          snippet.artistName
        );
        
        return {
          snippetId,
          userRating: snippet.userRating ?? 0,
          avgRating: snippet.avgRating ?? 0,
          userAvatar: authorToAvatar(commentAuthor),
          parameter: resolvedParameter,
        };
      });
      
      if (hasUserRatedInSession) {
        setGraphRatings(verticalData);
      } else {
        setGraphRatings(initialGraphRatings);
      }
    } else {
      setGraphRatings(initialGraphRatings);
    }

    if (!hasUserRatedInSession) {
      setParameterScatterData(initialScatterUsers);
      return;
    }
    
    // Process parameter scatter data - group users by artist/parameter
    const userParameterMap = new Map();
    
    displayComments.forEach(comment => {
      const snippet = snippetsByCommentId.get(comment?.id);
      const resolvedParameter = resolveParameterTag(
        comment?.parameter,
        snippet?.parameter,
        snippet?.artistName
      );

      if (!resolvedParameter || !comment?.author) {
        return;
      }

      if (!userParameterMap.has(comment.author)) {
        userParameterMap.set(comment.author, {
          username: comment.author,
          parameter: resolvedParameter,
          ratings: [],
          totalRatings: 0,
          avgRating: 0,
        });
      }
      
      if (snippet && (Number.isFinite(snippet.userRating) || Boolean(snippet.didRate))) {
        const userData = userParameterMap.get(comment.author);
        const score = Number.isFinite(snippet.userRating) ? snippet.userRating : snippet.avgRating;
        userData.ratings.push(score);
        userData.totalRatings = userData.ratings.length;
        userData.avgRating = userData.ratings.reduce((sum, rating) => sum + rating, 0) / userData.ratings.length;
      }
    });
    
    // Convert to scatter data with colors and avatars
    const scatterData = Array.from(userParameterMap.values())
      .filter(user => user.totalRatings > 0)
      .map(user => ({
        username: user.username,
        userAvatar: authorToAvatar(user.username),
        ratingCount: user.totalRatings,
        average: Math.round(user.avgRating),
        parameter: user.parameter,
        color: getParameterColor(user.parameter)
      }));

    const liveScatterPoints = buildNonOverlappingRandomPoints(
      `${post?.id || postId}:scatter:live`,
      scatterData.length,
      { minX: 10, maxX: 90, minY: 12, maxY: 88, minDistance: 12 }
    );
    const liveScatterData = scatterData.map((user, index) => ({
      ...user,
      _plotX: liveScatterPoints[index].x,
      _plotY: liveScatterPoints[index].y,
    }));

    setParameterScatterData(liveScatterData.length > 0 ? liveScatterData : initialScatterUsers);
  }, [
    snippetRecs,
    displayComments,
    post,
    postId,
    getParameterColor,
    resolveParameterTag,
    hasUserRatedInSession,
    initialGraphRatings,
    initialScatterUsers,
  ]);

  // Build TikTok modal snippets from real thread comments and snippet rec state.
  // Exclude seeded example IDs and include all songs attached to comments.
  const tikTokSnippets = useMemo(() => {
    const EXAMPLE_COMMENT_ID = "example_comment_001";
    const snippetsById = new Map();

    snippetRecs.forEach((snippet) => {
      const snippetId = snippet?.commentId || snippet?.id;
      if (!snippetId) return;
      snippetsById.set(snippetId, snippet);
    });

    const mergedSnippets = [];
    const seenIds = new Set();

    const mergeSnippet = (comment, commentSnippet, snippetFromState) => {
      const snippetId =
        comment?.id ||
        snippetFromState?.commentId ||
        snippetFromState?.id ||
        commentSnippet?.commentId ||
        commentSnippet?.id;
      if (!snippetId || snippetId === EXAMPLE_COMMENT_ID) return null;

      const commentAttrs = commentSnippet?.snippetData?.attributes || {};
      const stateAttrs = snippetFromState?.snippetData?.attributes || {};
      const songName =
        commentSnippet?.name ||
        commentSnippet?.songName ||
        commentAttrs?.name ||
        snippetFromState?.name ||
        snippetFromState?.songName ||
        stateAttrs?.name ||
        "Unknown Song";
      const artistName =
        commentSnippet?.artistName ||
        commentAttrs?.artistName ||
        snippetFromState?.artistName ||
        stateAttrs?.artistName ||
        "Unknown Artist";
      const rawArtwork =
        snippetFromState?.artworkUrl ||
        snippetFromState?.artwork ||
        stateAttrs?.artwork?.url ||
        commentSnippet?.artworkUrl ||
        commentSnippet?.artwork ||
        commentAttrs?.artwork?.url ||
        "/assets/default-artist.png";
      const artworkUrl = formatArtworkUrl(rawArtwork, 300);
      const previewUrl =
        snippetFromState?.previewUrl ||
        stateAttrs?.previews?.[0]?.url ||
        commentSnippet?.previewUrl ||
        commentAttrs?.previews?.[0]?.url ||
        null;

      return {
        ...(commentSnippet || {}),
        ...(snippetFromState || {}),
        id: snippetId,
        commentId: snippetId,
        name: songName,
        songName,
        artistName,
        artwork: artworkUrl,
        artworkUrl,
        previewUrl,
        author:
          snippetFromState?.author ||
          commentSnippet?.author ||
          comment?.author ||
          "Unknown",
        parameter:
          snippetFromState?.parameter ||
          commentSnippet?.parameter ||
          comment?.parameter ||
          fallbackParameter ||
          null,
      };
    };

    comments.forEach((comment) => {
      const commentId = comment?.id;
      if (!commentId || commentId === EXAMPLE_COMMENT_ID) return;

      const commentSnippet = comment?.snippet || null;
      const snippetFromState = snippetsById.get(commentId) || null;
      if (!commentSnippet && !snippetFromState) return;

      const merged = mergeSnippet(comment, commentSnippet, snippetFromState);
      if (!merged) return;

      const mergedId = merged.commentId || merged.id;
      if (!mergedId || seenIds.has(mergedId)) return;
      seenIds.add(mergedId);
      mergedSnippets.push(merged);
    });

    snippetsById.forEach((snippet, snippetId) => {
      if (!snippetId || snippetId === EXAMPLE_COMMENT_ID || seenIds.has(snippetId)) return;
      const relatedComment = comments.find((comment) => comment?.id === snippetId) || null;
      const merged = mergeSnippet(relatedComment, relatedComment?.snippet || null, snippet);
      if (!merged) return;
      seenIds.add(snippetId);
      mergedSnippets.push(merged);
    });

    return mergedSnippets;
  }, [comments, fallbackParameter, snippetRecs]);

  const parameterCounts = useMemo(
    () => buildRandomizedParameterCounts(post?.id || postId, post?.parameters || []),
    [post?.id, post?.parameters, postId]
  );

  // Audio and rating handlers
  const getSnippetId = useCallback((snippet) => {
    return snippet?.commentId || snippet?.id;
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setActiveSnippet(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const playSnippetInComment = useCallback((snippetObj) => {
    if (!snippetObj) return;
    
    const snippetId = getSnippetId(snippetObj);
    if (!snippetId || !snippetObj.previewUrl) return;
    
    // Simple play/pause logic
    if (activeSnippet.snippetId === snippetId && activeSnippet.isPlaying) {
      stopAudio();
      return;
    }

    stopAudio();
    
    if (!audioRef.current) return;
    
    audioRef.current.src = snippetObj.previewUrl;
    audioRef.current.load();

    setActiveSnippet({
      snippetId,
      isPlaying: true,
      elapsedSeconds: 0,
      userRating: snippetObj.userRating ?? null,
      didRate: snippetObj.didRate ?? false,
    });

    audioRef.current.play().catch(() => stopAudio());

    intervalRef.current = setInterval(() => {
      setActiveSnippet((prev) => {
        if (prev.elapsedSeconds >= 30) {
          stopAudio();
          return { ...prev, isPlaying: false };
        } 
        return { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
      });
    }, 1000);
  }, [activeSnippet, stopAudio, getSnippetId]);

  const handleUserRate = useCallback((snippetObj, ratingVal) => {
    const realId = getSnippetId(snippetObj);
    if (!realId) return;
    setHasUserRatedInSession(true);
    
    setSnippetRecs(prev => {
      return prev.map(s => {
        const sId = getSnippetId(s);
        if (sId === realId) {
          const communityStats = getCommunitySnippetStats(realId, s.avgRating);
          const currentTotalRatings =
            Number.isFinite(s.totalRatings) && s.totalRatings > 0
              ? Math.round(s.totalRatings)
              : communityStats.totalRatings;
          const currentAvgRating = Number.isFinite(s.avgRating)
            ? Math.round(s.avgRating)
            : communityStats.avgRating;
          const nextTotalRatings = currentTotalRatings + 1;
          const nextAvgRating = Math.round(
            ((currentAvgRating * currentTotalRatings) + ratingVal) / nextTotalRatings
          );

          return {
            ...s,
            userRating: ratingVal,
            avgRating: nextAvgRating,
            totalRatings: nextTotalRatings,
            didRate: true
          };
        }
        return s;
      });
    });
    
    setActiveSnippet(prev => ({
      ...prev,
      userRating: ratingVal,
      avgRating: ratingVal,
      didRate: true
    }));
  }, [getSnippetId]);

  const handleRatingPause = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  const handleSubmitComment = useCallback((newComment) => {
    if (!newComment) return;
    const resolvedParameter = resolveParameterTag(
      newComment.parameter,
      newComment.snippet?.parameter,
      newComment.snippet?.artistName
    );

    if (newComment.snippet) {
      setSnippetRecs(prevSnippets => [
        ...prevSnippets,
        normalizeParameterSnippet({
          ...newComment.snippet,
          commentId: newComment.id,
          parameter: resolvedParameter,
        }),
      ]);
    }

    setComments(prevComments => [...prevComments, {
      ...newComment,
      parameter: resolvedParameter || newComment.parameter || null,
    }]);
  }, [resolveParameterTag]);

  // Cleanup
  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  useEffect(() => {
    setIsGraphsOpen(false);
    setHasUserRatedInSession(false);
  }, [postId]);

  // Modal handlers
  const openVerticalGraphModal = useCallback(() => {
    setActiveGraphType('vertical');
    setIsGraphModalOpen(true);
  }, []);

  const openScatterGraphModal = useCallback(() => {
    setActiveGraphType('scatter');
    setIsGraphModalOpen(true);
  }, []);

  const closeGraphModal = useCallback(() => {
    setIsGraphModalOpen(false);
  }, []);

  const openTikTokView = useCallback(() => {
    setIsTikTokOpen(true);
  }, []);
  
  const closeTikTokView = useCallback(() => {
    setIsTikTokOpen(false);
  }, []);

  const handleGraphsTabClick = useCallback(() => {
    setIsGraphsOpen((prevOpen) => !prevOpen);
  }, []);

  const handleSelectUser = useCallback((user) => {
    if (!onSelectUser || !user) return;
    onSelectUser(user);
  }, [onSelectUser]);

  const styles = ThreadDetailStyles;
  const graphsCount = graphRatings?.length || 0;
  const postUser = useMemo(
    () => buildProfileUser(post, post?.author, post ? getAvatarSrc(post) : null),
    [post]
  );

  return (
    <div 
      className="thread-detail-container"
      style={{
        ...styles.container,
        opacity: isVisible ? 1 : 0,
        transform: `scale(${isVisible ? '1' : '0.98'})`,
      }}>
      
      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: "none" }}>
        <source type="audio/mpeg" />
      </audio>
      
      {/* Header — Glassmorphic */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "18px 20px",
        backgroundColor: "rgba(10, 14, 26, 0.6)",
        backdropFilter: "blur(24px) saturate(1.4)",
        borderBottom: "1px solid rgba(0, 196, 180, 0.12)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
      }}>
        <button 
          onClick={onBack} 
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#e2e8f0",
            marginRight: "16px",
            backdropFilter: "blur(8px)",
            padding: 0,
          }}
        >
          <FiArrowLeft size={20} />
        </button>
        <span style={{
          fontSize: "13px",
          fontWeight: "600",
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: "#94a3b8",
        }}>
          Parameter
        </span>
        <div style={{
          marginLeft: "auto",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #00C4B4, #0d9488)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          boxShadow: "0 2px 12px rgba(0, 196, 180, 0.3)",
        }}>
          <BarChart3 size={16} />
        </div>
      </div>
      
      {/* Main Post — Glassmorphic */}
      {post ? (
        <div style={{
          padding: "0",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          borderRadius: "20px",
          margin: "20px auto",
          border: "1px solid rgba(0, 196, 180, 0.12)",
          position: "relative",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
          backdropFilter: "blur(20px)",
          width: "calc(100% - 32px)",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}>
          {/* Ambient glow orbs — green tinted */}
          <div style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "340px",
            height: "340px",
            background: "radial-gradient(circle, rgba(0, 196, 180, 0.12) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}/>
          <div style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "260px",
            height: "260px",
            background: "radial-gradient(circle, rgba(13, 148, 136, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}/>
          {/* User info */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "18px 20px 14px",
            position: "relative",
            zIndex: 1,
          }}>
            <button
              type="button"
              onClick={() => handleSelectUser(postUser)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                margin: 0,
                cursor: onSelectUser ? "pointer" : "default",
                borderRadius: "50%",
              }}
            >
              <img
                src={postUser?.avatar || getAvatarSrc(post)}
                alt={`${postUser?.displayName || post?.author || "User"} avatar`}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(0, 196, 180, 0.4)",
                  background: "#1e293b",
                }}
              />
            </button>
            <div style={{
              display: "flex",
              flexDirection: "column",
            }}>
              <button
                type="button"
                onClick={() => handleSelectUser(postUser)}
                style={{
                  fontWeight: "700",
                  fontSize: "15px",
                  color: "#f1f5f9",
                  background: "none",
                  border: "none",
                  padding: 0,
                  margin: 0,
                  textAlign: "left",
                  cursor: onSelectUser ? "pointer" : "default",
                }}
              >
                {postUser?.displayName || post.author}
              </button>
              <div style={{
                fontSize: "12px",
                color: "#64748b",
                marginTop: "2px",
              }}>
                {new Date(post.createdUtc * 1000).toLocaleDateString()}
              </div>
              </div>
            
            {/* Parameter thread icon */}
            <div style={{
              position: "absolute",
              right: "20px",
              top: "18px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(0, 196, 180, 0.25), rgba(13, 148, 136, 0.15))",
              border: "1px solid rgba(0, 196, 180, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: THREAD_THEME_COLOR,
            }}>
              <BarChart3 size={18} />
            </div>
          </div>
          
          {/* Post title and content — gradient text */}
          <div style={{ padding: "0 20px 16px", position: "relative", zIndex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: "800",
              letterSpacing: "-0.5px",
              lineHeight: "1.2",
              background: "linear-gradient(135deg, #f8fafc 30%, #94a3b8)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {post.title}
            </h2>
          </div>
          
          {post.selftext && (
            <p style={{
              fontSize: "16px",
              lineHeight: 1.6,
              color: "#cbd5e1",
              margin: 0,
              padding: "0 20px 16px",
              position: "relative",
              zIndex: 1,
            }}>
              {post.selftext}
            </p>
          )}
          
          {/* Parameter count display — glassmorphic */}
          {post.parameters && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              margin: "0 20px 20px",
              padding: "16px",
              backgroundColor: "rgba(0, 196, 180, 0.04)",
              borderRadius: "16px",
              border: "1px solid rgba(0, 196, 180, 0.1)",
              backdropFilter: "blur(8px)",
              position: "relative",
              zIndex: 1,
            }}>
              {post.parameters.map((param, index) => {
                const parameterColor = getParameterColor(param, index);

                return (
                  <div key={param} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    borderRadius: "999px",
                    border: `1.5px solid ${parameterColor}88`,
                    backdropFilter: "blur(4px)",
                  }}>
                    <div style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: parameterColor,
                    }} />
                    <span style={{
                      color: "#fff",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}>
                      {param}
                    </span>
                    <span style={{
                      color: "#94a3b8",
                      fontSize: "13px",
                    }}>
                      {parameterCounts[param] || 0} songs
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Post image */}
          {post.imageUrl && (
            <div style={{ padding: "0 20px 20px", position: "relative", zIndex: 1 }}>
              <div style={{
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                background: "#0a0e1a",
              }}>
                <img
                  src={post.imageUrl}
                  alt="Post visual"
                  style={{
                    width: "100%",
                    maxHeight: "500px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            </div>
          )}
          
         {/* Stats row — pill badges */}
         <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            width: "100%",
            padding: "14px 20px 18px",
            borderTop: "1px solid rgba(0, 196, 180, 0.08)",
            position: "relative",
            zIndex: 1,
          }}>
            {[
              { icon: <MessageCircle size={18} />, val: displayedPostStatsWithFallback.num_comments },
              { icon: <Heart size={18} />, val: displayedPostStatsWithFallback.ups },
              { icon: <Share2 size={18} />, val: null },
              { icon: <Bookmark size={18} />, val: displayedPostStatsWithFallback.bookmarks },
            ].map((stat, i) => (
              <button key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "999px",
                padding: "8px 14px",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.2s ease",
              }}>
                {stat.icon}
                {stat.val !== null && <span>{stat.val}</span>}
              </button>
            ))}
          </div>
          
          {/* Graphs Tab — glassmorphic capsule */}
          <div style={{
            padding: "0 20px 20px",
            position: "relative",
            zIndex: 1,
          }}>
            <div style={{
              width: "100%",
              display: "flex",
              gap: "8px",
              padding: "6px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}>
              <div
                role="button"
                tabIndex={0}
                onClick={handleGraphsTabClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleGraphsTabClick();
                  }
                }}
                style={{
                flex: 1,
                background: isGraphsOpen
                  ? `linear-gradient(135deg, ${THREAD_THEME_COLOR}40, ${THREAD_THEME_COLOR}20)`
                  : "transparent",
                color: isGraphsOpen ? "#e0e7ff" : "#64748b",
                borderRadius: "999px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                fontWeight: 700,
                letterSpacing: "0.2px",
                boxShadow: isGraphsOpen
                  ? `0 0 0 1px ${THREAD_THEME_COLOR}55, 0 8px 20px rgba(0,0,0,0.2)`
                  : "none",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                outline: "none",
              }}>
                <BarChart3 size={18} color={isGraphsOpen ? THREAD_THEME_COLOR : "#64748b"} />
                <span style={{ fontSize: "15px" }}>Graphs</span>

                <span style={{
                  minWidth: "28px",
                  height: "22px",
                  padding: "0 8px",
                  borderRadius: "999px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 800,
                  background: isGraphsOpen ? `${THREAD_THEME_COLOR}33` : "rgba(255,255,255,0.06)",
                  color: isGraphsOpen ? "#fff" : "#cbd5e1",
                  border: isGraphsOpen ? `1px solid ${THREAD_THEME_COLOR}55` : "1px solid rgba(255,255,255,0.06)",
                }}>
                  {graphsCount}
                </span>

                <span
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  style={{ display: "inline-flex", opacity: isGraphsOpen ? 1 : 0.75 }}
                >
                  <InfoIconModal
                    modalId="parameter-thread-graphs-tab-info"
                    title="Graphs"
                    iconSize={14}
                    showButtonText={false}
                    steps={[
                      {
                        icon: <BarChart3 size={18} color="#a9b6fc" />,
                        title: "Use Graphs for Insights",
                        content: "Use these graphs to glean more info on each thread",
                      },
                    ]}
                  />
                </span>
              </div>
            </div>
          </div>

          {isGraphsOpen && (
            /* Parameter Graphs — glassmorphic */
            <div style={{
              width: "calc(100% - 32px)",
              margin: "16px auto",
              backgroundImage: 'radial-gradient(circle at top right, rgba(0, 196, 180, 0.08), transparent 70%)',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px solid rgba(0, 196, 180, 0.08)',
              backdropFilter: 'blur(8px)',
            }}>
            {/* Vertical Rating Graph */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '24px', 
                margin: 0,
                fontWeight: '700',
                color: '#fff'
              }}>
                Your Ratings vs Average
              </h2>
            </div>
            
            <div style={{ 
              height: '270px', 
              marginBottom: '40px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid rgba(0, 196, 180, 0.12)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
              cursor: 'pointer',
            }}
            onClick={openVerticalGraphModal}
            title="Click to enlarge">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={graphRatings}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  barGap={12}
                  barCategoryGap="58%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    tickCount={6}
                    tick={{ fill: '#8899a6', fontSize: 12 }}
                    stroke="rgba(255, 255, 255, 0.05)"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="snippetId" 
                    tick={(props) => {
                      const { x, y, payload } = props;
                      const item = graphRatings.find(d => d.snippetId === payload.value);
                      if (!item) return null;
                      
                      return (
                        <g transform={`translate(${x - 40},${y})`}>
                          <image 
                            href={item.userAvatar} 
                            x={0} 
                            y={-12} 
                            height={24} 
                            width={24} 
                            clipPath="inset(0% round 50%)" 
                          />
                        </g>
                      );
                    }}
                    width={50}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0, 196, 180, 0.08)' }}
                    content={(props) => {
                      const { active, payload, label } = props;
                      if (active && payload && payload.length) {
                        const item = graphRatings.find(d => d.snippetId === label);
                        return (
                          <div style={{
                            backgroundColor: 'rgba(10, 14, 26, 0.95)',
                            padding: '12px',
                            border: '1px solid rgba(0, 196, 180, 0.2)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                            backdropFilter: 'blur(12px)',
                          }}>
                            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>
                              {item ? item.parameter : label}
                            </div>
                            {payload.map((entry, index) => (
                              <div key={`tooltip-${index}`} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                color: entry.name === 'userRating' ? '#5eead4' : '#00C4B4',
                                margin: '4px 0'
                              }}>
                                <div style={{ 
                                  width: '10px', 
                                  height: '10px', 
                                  backgroundColor: entry.name === 'userRating' ? '#5eead4' : '#00C4B4', 
                                  marginRight: '8px',
                                  borderRadius: '2px'
                                }} />
                                <span>{entry.name === 'userRating' ? 'Your Rating' : 'Average'}: {entry.value}%</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="avgRating" 
                    name="avgRating" 
                    barSize={16}
                    fill="#00C4B4"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="userRating" 
                    name="userRating" 
                    barSize={16}
                    fill="#5eead4"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Parameter Scatter Plot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '24px', 
                margin: 0,
                fontWeight: '700',
                color: '#fff'
              }}>
                User Ratings by Artist
              </h2>
            </div>
            
            <ThreadDetailScatterRatingsGraph 
              scatterData={parameterScatterData}
              onOpenModal={openScatterGraphModal}
            />
            </div>
          )}
        </div>
    ) : (
        <div style={{
          ...styles.loadingContainer,
          width: "calc(100% - 32px)",
          margin: "32px auto",
        }}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading post...</p>
          
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      <ThreadCommentComposer
        onSubmit={handleSubmitComment}
        onOpenTikTokModal={openTikTokView}
      />
      
      {/* Comments Section */}
      <div style={{
        ...styles.commentsSection,
        width: "calc(100% - 32px)",
        margin: "0 auto",
      }}>
        <h3 style={styles.commentsHeader}>
          Responses ({displayComments.length})
        </h3>
        
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}>
          {displayCommentsWithMetrics.map((c) => {
            let snippetObj = c.snippet
              ? {
                  ...c.snippet,
                  id: c.snippet.id || c.id,
                  commentId: c.snippet.commentId || c.id,
                }
              : null;

            const snippetRec = snippetRecs.find((s) => s.commentId === c.id || s.id === c.id);
            if (snippetObj && snippetRec) {
              snippetObj = {
                ...snippetObj,
                name: snippetObj.name || snippetObj.songName || snippetRec.name,
                artistName: snippetObj.artistName || snippetRec.artistName,
                artwork: snippetObj.artwork || snippetRec.artwork || "/assets/default-artist.png",
                previewUrl: snippetObj.previewUrl || snippetRec.previewUrl || null,
                userRating: Number.isFinite(snippetRec.userRating) ? snippetRec.userRating : snippetObj.userRating,
                avgRating: Number.isFinite(snippetRec.avgRating) ? snippetRec.avgRating : snippetObj.avgRating,
                totalRatings: Number.isFinite(snippetRec.totalRatings) ? snippetRec.totalRatings : snippetObj.totalRatings,
                didRate: snippetRec.didRate ?? snippetObj.didRate,
              };
            } else if (!snippetObj && snippetRec) {
              snippetObj = {
                id: c.id,
                commentId: c.id,
                name: snippetRec.name || c.snippet?.name || "Unknown Song",
                artistName: snippetRec.artistName || c.snippet?.artistName || "Unknown Artist",
                artwork: snippetRec.artwork || c.snippet?.artwork || "/assets/default-artist.png",
                previewUrl: snippetRec.previewUrl || c.snippet?.previewUrl || null,
                userRating: snippetRec.userRating,
                avgRating: snippetRec.avgRating,
                totalRatings: snippetRec.totalRatings,
                didRate: snippetRec.didRate,
              };
            }

            if (snippetObj) {
              const resolvedSnippetId = snippetObj.commentId || snippetObj.id || c.id;
              const communityStats = getCommunitySnippetStats(resolvedSnippetId, snippetObj.avgRating);
              const resolvedParameter = resolveParameterTag(
                c.parameter,
                snippetObj.parameter,
                snippetObj.artistName
              );
              snippetObj = {
                ...snippetObj,
                id: resolvedSnippetId,
                commentId: resolvedSnippetId,
                parameter: resolvedParameter,
                avgRating: Number.isFinite(snippetObj.avgRating)
                  ? Math.round(snippetObj.avgRating)
                  : communityStats.avgRating,
                totalRatings: Number.isFinite(snippetObj.totalRatings) && snippetObj.totalRatings > 0
                  ? Math.round(snippetObj.totalRatings)
                  : communityStats.totalRatings,
              };
            }

            const commentTag = resolveParameterTag(
              c.parameter,
              snippetObj?.parameter,
              snippetObj?.artistName
            );
            const usernameDotColor = snippetObj ? getParameterColor(commentTag) : null;

            const isThisSnippetPlaying = 
              activeSnippet && 
              activeSnippet.snippetId === getSnippetId(snippetObj) && 
              activeSnippet.isPlaying;
            
            const commentKey = c.id || `comment-${c.author}-${c.createdUtc || Date.now()}`;
            
            return (
              <ThreadCommentCard
                key={commentKey}
                comment={c}
                snippet={snippetObj}
                isPlaying={isThisSnippetPlaying}
                activeSnippet={activeSnippet}
                onPlayPause={() => playSnippetInComment(snippetObj)}
                onRate={handleUserRate}
                onRatingPause={handleRatingPause}
                onUserClick={handleSelectUser}
                isFirstSnippet={false}
                usernameDotColor={usernameDotColor}
                isParameterTheme
              />
            );
          })}
        </div>
      </div>
      
      {/* Graph Modal */}
      <GraphModal 
        isOpen={isGraphModalOpen}
        onClose={closeGraphModal}
        graphType={activeGraphType}
        graphData={graphRatings}
        scatterData={parameterScatterData}
      />
      
      {/* TikTok Modal */}
      {isTikTokOpen && (
        <TikTokModal
          snippets={tikTokSnippets}
          comments={comments}
          onClose={closeTikTokView}
          audioRef={audioRef}
          isSnippetPlaying={activeSnippet.isPlaying}
          setIsSnippetPlaying={(playing) => setActiveSnippet(prev => ({ ...prev, isPlaying: playing }))}
          currentSnippetId={activeSnippet.snippetId}
          setCurrentSnippetId={(id) => setActiveSnippet(prev => ({ ...prev, snippetId: id }))}
          onUserRate={handleUserRate}
          playOrPauseSnippet={playSnippetInComment}
          threadTitle={post?.title}
        />
      )}
    </div>
  );
}
