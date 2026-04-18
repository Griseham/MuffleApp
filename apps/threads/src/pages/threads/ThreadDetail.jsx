import React, { useState, useEffect, useCallback, useRef, useMemo, useContext } from "react";
import { 
  Heart, MessageCircle, Share2, Bookmark, Music, Users, BarChart3
} from 'lucide-react';
import InfoIconModal from '../../components/InfoIconModal';
import GlobalModalContext from '../../components/context/GlobalModalContext';
import GraphModal from "../modals/GraphModal";
import TikTokModal from "../modals/TikTokModal";
import ThreadCommentCard from './ThreadCommentCard';
import ThreadCommentComposer from './ThreadCommentComposer';
import { GraphSection } from './GraphComponents';
import useThreadData from "./useThreadData";
import { authorToAvatar, getAvatarSrc } from "../utils/utils";
import { ClickableUserAvatar } from "../posts/UserHoverCard";
import { FiArrowLeft } from "react-icons/fi";
import ThreadDetailStyles from "./ThreadDetailStyles";
import './../../styles/threadDetailStyles.css';
import { useAudioRating } from './useAudioRating';
import { 
  createExampleData,
  formatSnippetData, 
  processScatterData,
  getCommentMetrics
} from './threadHelpers';
import {
  CURRENT_USER_AVATAR,
  CURRENT_USER_DISPLAY_NAME,
  CURRENT_USER_USERNAME,
  isCurrentUserAuthor,
} from "../../utils/currentUser";

const HOME_THREAD_BLUE = '#1d9bf0';
const HOME_THREAD_BLUE_DEEP = '#1a8cd8';
const HOME_THREAD_BLUE_SOFT = '#7dd3fc';
const HOME_NEWS_CHAMPAGNE = '#e8d5a8';
const COMPACT_PHONE_BREAKPOINT = 390;
const PHONE_THREAD_BREAKPOINT = 480;
const TABLET_PORTRAIT_BREAKPOINT = 1024;

const normalizePostType = (postType) => String(postType || '').toLowerCase();

// Theme color function
const getThemeColor = (postType) => {
  const normalizedType = normalizePostType(postType);
  if (normalizedType === 'groupchat') return '#FF69B4';
  if (normalizedType === 'parameter') return '#00C4B4';
  if (normalizedType === 'news') return HOME_NEWS_CHAMPAGNE;
  return HOME_THREAD_BLUE;
};

// Glassmorphic gradient for music badge
const getMusicBadgeGradient = (postType) => {
  const normalizedType = normalizePostType(postType);
  if (normalizedType === 'groupchat') return 'linear-gradient(135deg, #FF69B4, #ec4899)';
  if (normalizedType === 'parameter') return 'linear-gradient(135deg, #00C4B4, #06b6d4)';
  if (normalizedType === 'news') return `linear-gradient(135deg, ${HOME_NEWS_CHAMPAGNE}, ${HOME_NEWS_CHAMPAGNE})`;
  return `linear-gradient(135deg, ${HOME_THREAD_BLUE}, ${HOME_THREAD_BLUE_DEEP})`;
};

// Helper to format Apple Music artwork URLs
function formatArtworkUrl(url, size = 300) {
  if (!url) return null;
  return url
    .replace('{w}', String(size))
    .replace('{h}', String(size))
    .replace('{f}', 'jpg');
}

function buildProfileUser(userLike, fallbackName, fallbackAvatar) {
  const isCurrentUser = isCurrentUserAuthor(userLike) || isCurrentUserAuthor(fallbackName);
  const displayName =
    isCurrentUser
      ? CURRENT_USER_DISPLAY_NAME
      : (
        userLike?.displayName ||
        userLike?.name ||
        userLike?.author ||
        fallbackName ||
        "User"
      );

  const username =
    isCurrentUser
      ? CURRENT_USER_USERNAME
      : (
        userLike?.username ||
        String(displayName)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "")
          .slice(0, 24) ||
        "user"
      );

  return {
    ...userLike,
    displayName,
    name: userLike?.name || displayName,
    username,
    avatar: isCurrentUser
      ? CURRENT_USER_AVATAR
      : (userLike?.avatar || fallbackAvatar || authorToAvatar(displayName)),
  };
}

function useViewportMatch(maxWidth) {
  const [isMatch, setIsMatch] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= maxWidth;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const handleViewportChange = (event) => {
      setIsMatch(event.matches);
    };

    setIsMatch(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleViewportChange);
      return () => mediaQuery.removeEventListener("change", handleViewportChange);
    }

    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, [maxWidth]);

  return isMatch;
}

function formatPostDate(createdUtc) {
  if (!Number.isFinite(createdUtc) || createdUtc <= 0) {
    return "";
  }

  const resolvedMs = createdUtc > 1e12 ? createdUtc : createdUtc * 1000;
  return new Date(resolvedMs).toLocaleDateString();
}

export default function ThreadDetail({ postId, postData, onBack, onSelectUser }) {
  const { closeModal: closeGlobalModal } = useContext(GlobalModalContext);
  const [isVisible, setIsVisible] = useState(false);
  const isCompactPhoneViewport = useViewportMatch(COMPACT_PHONE_BREAKPOINT);
  const isMobileViewport = useViewportMatch(PHONE_THREAD_BREAKPOINT);
  const isTabletPortraitViewport =
    useViewportMatch(TABLET_PORTRAIT_BREAKPOINT) && !isMobileViewport;
  const { 
    post, 
    comments, 
    setComments, 
    snippetRecs, 
    setSnippetRecs, 
    usedCache,
    commentsLoaded,
    snippetsLoading
  } = useThreadData(postId, postData);
 
  // If we navigated here from the Home TikTok modal, inject that snippet/comment
  const injectedOnceRef = useRef(false);
  const pendingAutoPlayIdRef = useRef(null);
  // Track the injected snippet ID for graph updates
  const injectedSnippetIdRef = useRef(null);
  const seededInitialRatingsRef = useRef(false);
  const graphsSectionRef = useRef(null);

  // Always enter thread detail with info sidebar closed.
  useEffect(() => {
    closeGlobalModal();
  }, [postId, closeGlobalModal]);

  // Reset injection flag when postId changes
  useEffect(() => {
    injectedOnceRef.current = false;
    pendingAutoPlayIdRef.current = null;
    injectedSnippetIdRef.current = null;
    seededInitialRatingsRef.current = false;
  }, [postId]);

  // FIXED: Wait for commentsLoaded before injecting from TikTok modal
  useEffect(() => {
    // Don't inject until comments are loaded from cache
    if (!commentsLoaded) {
      return;
    }
    
    const injected = postData?.__prefillFromTikTok;
    
    if (!injected || injectedOnceRef.current) return;

    const { snippet, comment, autoPlay } = injected;
    injectedOnceRef.current = true;

    // Inject the comment
    if (comment?.id) {
      setComments(prev => {
        // Check if already exists
        if (prev.some(c => c.id === comment.id)) {
          return prev;
        }
        // Add at the beginning (after example comment will be added in stableCommentOrder)
        const newComments = [{ ...comment, __injectedFromTikTok: true }, ...prev];
        return newComments;
      });
    }

    // Inject the snippet
    const snipId = snippet?.commentId || snippet?.id;
    if (snipId) {
      injectedSnippetIdRef.current = snipId;
      
      // Format artwork URL if needed
      const rawArtwork =
        snippet.snippetData?.attributes?.artwork?.url ||
        snippet.artworkUrl ||
        snippet.artwork;
      const artworkUrl = formatArtworkUrl(rawArtwork, 300) || rawArtwork;
      
      const formattedSnippet = {
        ...snippet,
        __injectedFromTikTok: true,
        // Ensure artwork field is set
        artwork: artworkUrl,
        artworkUrl: artworkUrl,
      };
      
      setSnippetRecs(prev => {
        if (prev.some(s => (s.commentId || s.id) === snipId)) {
          return prev;
        }
        return [formattedSnippet, ...prev];
      });
      
      if (autoPlay) {
        pendingAutoPlayIdRef.current = snipId;
      }
    }
  }, [postId, postData, setComments, setSnippetRecs, commentsLoaded]);

  // Check if this is a special-case thread
  const normalizedPostType = normalizePostType(post?.postType || postData?.postType || 'thread');
  const isNewsThread = normalizedPostType === 'news';
  const isParameterThread = normalizedPostType === 'parameter';
  const isNormalThread = normalizedPostType === 'thread';
  const shouldShowExampleComment = !isNewsThread && !isParameterThread;
  
  // Get theme color based on post type
  const themeColor = getThemeColor(normalizedPostType);
  const { exampleComment, exampleSnippet } = useMemo(() => createExampleData(), []);
  
  const [graphRatings, setGraphRatings] = useState([]);
  const [scatterData, setScatterData] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [isTikTokOpen, setIsTikTokOpen] = useState(false);
  const [expandedSnippetIds, setExpandedSnippetIds] = useState([]);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [activeGraphType, setActiveGraphType] = useState('vertical');
  const displayedPostStats = useMemo(() => ({
    num_comments: 0,
    ups: 0,
    bookmarks: 0,
  }), []);
  const postUser = useMemo(
    () => buildProfileUser(post, post?.author, post?.avatar || (post ? getAvatarSrc(post) : null)),
    [post]
  );
  
  // FIXED: Use comments directly in stableCommentOrder, include comments in dependency array
  const [stableCommentOrder, setStableCommentOrder] = useState([]);
  const shouldShowNoSnippetsState =
    !isNewsThread &&
    !isParameterThread &&
    !usedCache &&
    commentsLoaded &&
    !snippetsLoading &&
    comments.length > 0 &&
    snippetRecs.length === 0;
  const postCreatedLabel = useMemo(() => formatPostDate(post?.createdUtc), [post?.createdUtc]);

  const getSnippetId = useCallback((snippet) => {
    return snippet?.commentId || snippet?.id;
  }, []);

  const hasSnippetRating = useCallback((snippet) => {
    return (
      Number.isFinite(snippet?.userRating) ||
      Boolean(snippet?.didRate)
    );
  }, []);

  const displayedPostStatsWithFallback = useMemo(() => {
    const snippetIds = new Set(
      snippetRecs
        .map((snippet) => snippet?.commentId || snippet?.id)
        .filter(Boolean)
    );

    const enrichedComments = comments.map((comment) => {
      const hasSnippet =
        Boolean(comment?.snippet) ||
        snippetIds.has(comment?.id);
      return getCommentMetrics(comment, hasSnippet);
    });

    const totalLikes = enrichedComments.reduce(
      (sum, comment) => sum + (Number.isFinite(comment.likeCount) ? comment.likeCount : 0),
      0
    );
    const totalReplies = enrichedComments.reduce(
      (sum, comment) => sum + (Number.isFinite(comment.commentCount) ? comment.commentCount : 0),
      0
    );

    const derivedUps = Math.max(
      180,
      Math.round((totalLikes * 0.32) + (totalReplies * 2.1))
    );
    const derivedBookmarks = Math.max(
      28,
      Math.round(derivedUps * 0.18)
    );
    const derivedCommentCount = Math.max(comments.length, totalReplies);

    const resolvedNumComments =
      Number.isFinite(post?.num_comments) && post.num_comments > 0
        ? post.num_comments
        : derivedCommentCount;
    const resolvedUps =
      Number.isFinite(post?.ups) && post.ups > 0
        ? post.ups
        : derivedUps;
    const resolvedBookmarks =
      Number.isFinite(post?.bookmarks) && post.bookmarks > 0
        ? post.bookmarks
        : derivedBookmarks;

    return {
      ...displayedPostStats,
      num_comments: resolvedNumComments,
      ups: resolvedUps,
      bookmarks: resolvedBookmarks,
    };
  }, [comments, displayedPostStats, post, snippetRecs]);

  const { 
    audioRef, 
    activeSnippet, 
    playSnippet, 
    handleUserRate: baseHandleUserRate, 
    stopAudio 
  } = useAudioRating(snippetRecs, setSnippetRecs, getSnippetId);

  // Wrap handleUserRate to trigger graph update after rating
  const handleUserRate = useCallback((snippet, newRating) => {
    baseHandleUserRate(snippet, newRating);
  }, [baseHandleUserRate]);

  useEffect(() => {
    // Scroll to top when entering thread detail
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // FIXED: Create stable comment order - include comments in dependency array
  useEffect(() => {
    const sameOrderById = (a = [], b = []) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if ((a[i]?.id ?? "") !== (b[i]?.id ?? "")) return false;
      }
      return true;
    };

    let finalComments = [];

    if (comments.length > 0) {
      if (shouldShowExampleComment) {
        const injectedComments = comments.filter((c) => c.__injectedFromTikTok);
        const otherComments = comments.filter((c) => !c.__injectedFromTikTok);
        finalComments = [exampleComment, ...injectedComments, ...otherComments];
      } else {
        finalComments = [...comments];
      }
    } else if (commentsLoaded && shouldShowExampleComment) {
      finalComments = [exampleComment];
    } else {
      finalComments = [];
    }

    setStableCommentOrder((prev) => {
      if (sameOrderById(prev, finalComments)) return prev;
      return finalComments;
    });
  }, [comments, commentsLoaded, shouldShowExampleComment, exampleComment]);

  useEffect(() => {
    if (seededInitialRatingsRef.current) return;
    if (!shouldShowExampleComment || !commentsLoaded) return;

    seededInitialRatingsRef.current = true;

    setSnippetRecs((prevSnippets) => {
      const getId = (snippet) => snippet?.commentId || snippet?.id;
      const nextSnippets = [...prevSnippets];

      const upsertSnippetWithRating = (baseSnippet, ratingSeed) => {
        const snippetId = getId(baseSnippet);
        if (!snippetId) return;

        const existingIndex = nextSnippets.findIndex((snippet) => getId(snippet) === snippetId);
        const existingSnippet = existingIndex >= 0 ? nextSnippets[existingIndex] : null;
        const mergedSnippet = existingSnippet ? { ...baseSnippet, ...existingSnippet } : baseSnippet;
        const snippetWithRating = hasSnippetRating(mergedSnippet)
          ? mergedSnippet
          : {
              ...mergedSnippet,
              userRating: ratingSeed.userRating,
              avgRating: ratingSeed.avgRating,
              totalRatings: ratingSeed.totalRatings,
              didRate: true,
            };

        if (existingIndex >= 0) {
          nextSnippets[existingIndex] = snippetWithRating;
        } else {
          nextSnippets.push(snippetWithRating);
        }
      };

      const exampleSnippetId = exampleSnippet.commentId || exampleSnippet.id;
      upsertSnippetWithRating(
        {
          ...exampleSnippet,
          id: exampleSnippetId,
          commentId: exampleSnippetId,
          author: exampleComment.author,
        },
        {
          userRating: Number.isFinite(exampleSnippet.userRating) ? exampleSnippet.userRating : 78,
          avgRating: Number.isFinite(exampleSnippet.avgRating) ? exampleSnippet.avgRating : 65,
          totalRatings: Number.isFinite(exampleSnippet.totalRatings) ? exampleSnippet.totalRatings : 23,
        }
      );

      const firstRealCommentWithSnippet = comments.find((comment) => {
        if (!comment?.id) return false;
        if (comment.snippet) return true;
        return nextSnippets.some((snippet) => getId(snippet) === comment.id);
      });

      const priorityIds = [exampleSnippetId];

      if (firstRealCommentWithSnippet) {
        const firstRealId = firstRealCommentWithSnippet.id;
        const snippetFromState = nextSnippets.find((snippet) => getId(snippet) === firstRealId);
        const snippetSource = snippetFromState || firstRealCommentWithSnippet.snippet || {};

        upsertSnippetWithRating(
          {
            ...snippetSource,
            id: snippetSource.id || snippetSource.commentId || firstRealId,
            commentId: snippetSource.commentId || snippetSource.id || firstRealId,
            name:
              snippetSource.name ||
              snippetSource.songName ||
              snippetSource.snippetData?.attributes?.name ||
              "Unknown Song",
            songName:
              snippetSource.songName ||
              snippetSource.name ||
              snippetSource.snippetData?.attributes?.name ||
              "Unknown Song",
            artistName:
              snippetSource.artistName ||
              snippetSource.snippetData?.attributes?.artistName ||
              "Unknown Artist",
            artwork:
              snippetSource.artwork ||
              snippetSource.artworkUrl ||
              snippetSource.snippetData?.attributes?.artwork?.url ||
              snippetSource.artistImage ||
              "/assets/default-artist.png",
            artworkUrl:
              snippetSource.artworkUrl ||
              snippetSource.artwork ||
              snippetSource.snippetData?.attributes?.artwork?.url ||
              snippetSource.artistImage ||
              "/assets/default-artist.png",
            previewUrl:
              snippetSource.previewUrl ||
              snippetSource.snippetData?.attributes?.previews?.[0]?.url ||
              null,
            author: snippetSource.author || firstRealCommentWithSnippet.author,
          },
          {
            userRating: 84,
            avgRating: 71,
            totalRatings: 29,
          }
        );

        priorityIds.push(firstRealId);
      }

      const orderedSnippets = [];
      const seenIds = new Set();

      priorityIds.forEach((id) => {
        const match = nextSnippets.find((snippet) => getId(snippet) === id);
        if (match && !seenIds.has(id)) {
          orderedSnippets.push(match);
          seenIds.add(id);
        }
      });

      nextSnippets.forEach((snippet) => {
        const snippetId = getId(snippet);
        if (!snippetId || seenIds.has(snippetId)) return;
        orderedSnippets.push(snippet);
        seenIds.add(snippetId);
      });

      return orderedSnippets;
    });
  }, [
    comments,
    commentsLoaded,
    exampleComment.author,
    exampleSnippet,
    hasSnippetRating,
    setSnippetRecs,
    shouldShowExampleComment,
  ]);

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

  const handleSelectUser = useCallback((user) => {
    if (!onSelectUser) return;
    onSelectUser(user);
  }, [onSelectUser]);

  const updateScatterData = useCallback((snippets) => {
    const newScatterData = processScatterData(snippets, comments, getSnippetId);
    setScatterData(newScatterData);
  }, [comments, getSnippetId]);

  // FIXED: Process ratings data including injected snippets
  const processRatingsData = useCallback(() => {
    if (snippetRecs.length === 0) return;
    
    // Include ALL snippets that have ratings (including injected ones)
    const ratedSnippets = snippetRecs.filter(
      snippet => snippet.didRate || snippet.userRating != null
    );
    
    if (ratedSnippets.length === 0) return;
    
    const verticalData = ratedSnippets
      .map(snippet => {
        const snippetId = snippet.id || snippet.commentId;
        const relatedComment = comments.find(c => c.id === snippetId);
        const commentAuthor = relatedComment?.author || snippet.author || "Unknown";
        
        return {
          snippetId,
          userRating: snippet.userRating ?? 0,
          avgRating: snippet.avgRating ?? 0,
          userAvatar: authorToAvatar(commentAuthor)
        };
      })
      .slice(0, 6);

    setGraphRatings(verticalData);
    updateScatterData(ratedSnippets);
  }, [snippetRecs, comments, updateScatterData]);

  useEffect(() => {
    processRatingsData();
  }, [processRatingsData]);

  const playSnippetInComment = useCallback((snippetObj) => {
    if (!snippetObj) return;
    
    const snippetId = getSnippetId(snippetObj);
    if (!snippetId) return;
    
    if (!expandedSnippetIds.includes(snippetId)) {
      setExpandedSnippetIds((prev) => [...prev, snippetId]);
    }
    
    if (!snippetObj.previewUrl) return;
    
    playSnippet(snippetId, snippetObj.previewUrl);
  }, [expandedSnippetIds, playSnippet, getSnippetId]);

  // Auto-play pending snippet from TikTok navigation
  useEffect(() => {
    const pendingId = pendingAutoPlayIdRef.current;
    if (!pendingId) return;

    const snip = snippetRecs.find(s => (s.id || s.commentId) === pendingId);
    if (!snip?.previewUrl) return;

    pendingAutoPlayIdRef.current = null;

    try {
      stopAudio?.();
    } catch {
      // ignore
    }

    const t = setTimeout(() => {
      playSnippetInComment(snip);
    }, 250);

    return () => clearTimeout(t);
  }, [snippetRecs, playSnippetInComment, stopAudio]);

  const handleRatingPause = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  const handleSubmitComment = useCallback((newComment) => {
    if (!newComment) return;
    
    const normalizedComment = {
      ...newComment,
      replies: Array.isArray(newComment?.replies) ? newComment.replies : [],
    };

    if (normalizedComment.snippet) {
      const snippetCommentId = normalizedComment.id || `temp_${Date.now()}`;
      normalizedComment.id = snippetCommentId;
      normalizedComment.snippet = {
        ...normalizedComment.snippet,
        commentId: normalizedComment.snippet.commentId || snippetCommentId,
      };

      setSnippetRecs((prevSnippets) => {
        const nextSnippet = formatSnippetData(
          {
            ...normalizedComment.snippet,
            id: normalizedComment.snippet.id || snippetCommentId,
            commentId: normalizedComment.snippet.commentId || snippetCommentId,
            author: normalizedComment.author,
          },
          normalizedComment,
          [...comments, normalizedComment]
        );

        return [...prevSnippets, nextSnippet];
      });
    }

    setComments(prevComments => [...prevComments, normalizedComment]);
    
    setTimeout(() => {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return;
      }
      const pageHeight = Math.max(
        document.body?.scrollHeight || 0,
        document.documentElement?.scrollHeight || 0
      );
      window.scrollTo({
        top: pageHeight,
        behavior: 'smooth'
      });
    }, 100);
  }, [comments, setComments, setSnippetRecs]);

  const openTikTokView = useCallback(() => {
    setIsTikTokOpen(true);
  }, []);
  
  const closeTikTokView = useCallback(() => {
    setIsTikTokOpen(false);
  }, []);

  const handleTabClick = useCallback((section) => {
    setActiveSection(prevSection => section === prevSection ? null : section);
  }, []);

  const scrollToGraphsSection = useCallback(() => {
    if (typeof window === "undefined") return;
    const sectionNode = graphsSectionRef.current;
    if (!sectionNode) return;

    const offset = isMobileViewport ? (isCompactPhoneViewport ? 82 : 86) : (isTabletPortraitViewport ? 96 : 104);
    const targetTop = Math.max(
      0,
      window.scrollY + sectionNode.getBoundingClientRect().top - offset
    );

    window.scrollTo({ top: targetTop, behavior: "smooth" });
  }, [isCompactPhoneViewport, isMobileViewport, isTabletPortraitViewport]);

  useEffect(() => {
    if (activeSection !== "graphs") return undefined;
    if (typeof window === "undefined") return undefined;

    let rafPrimary = 0;
    let rafSecondary = 0;

    rafPrimary = window.requestAnimationFrame(() => {
      rafSecondary = window.requestAnimationFrame(() => {
        scrollToGraphsSection();
      });
    });

    return () => {
      if (rafPrimary) window.cancelAnimationFrame(rafPrimary);
      if (rafSecondary) window.cancelAnimationFrame(rafSecondary);
    };
  }, [activeSection, scrollToGraphsSection]);

  const handleBack = useCallback(() => {
    if (onBack) onBack();
  }, [onBack]);

  const styles = ThreadDetailStyles;
  const graphsCount = graphRatings?.length || 0;
  const horizontalInset = isCompactPhoneViewport ? 16 : (isMobileViewport ? 20 : (isTabletPortraitViewport ? 28 : 32));
  const contentWidth = `min(100%, calc(100% - ${horizontalInset}px))`;
  const statIconSize = isCompactPhoneViewport ? 15 : (isMobileViewport ? 16 : (isTabletPortraitViewport ? 17 : 18));
  const headerPadding = isCompactPhoneViewport ? "12px 12px" : (isMobileViewport ? "14px 14px" : (isTabletPortraitViewport ? "16px 18px" : "18px 20px"));
  const contentHorizontalPadding = isCompactPhoneViewport ? "12px" : (isMobileViewport ? "14px" : (isTabletPortraitViewport ? "18px" : "20px"));
  const titleFontSize = isCompactPhoneViewport ? "19px" : (isMobileViewport ? "20px" : (isTabletPortraitViewport ? "24px" : "26px"));
  const bodyFontSize = isCompactPhoneViewport ? "13px" : (isMobileViewport ? "14px" : (isTabletPortraitViewport ? "15px" : "16px"));
  const postImageMaxHeight = isCompactPhoneViewport ? "300px" : (isMobileViewport ? "340px" : "500px");
  const showInlineGraphInfo = !isCompactPhoneViewport;
  const useGridStatsRow = isMobileViewport;

  // Build TikTok modal snippets from both snippetRecs and comment-attached snippets.
  // Exclude the seeded example snippet from this modal feed.
  const tikTokSnippets = useMemo(() => {
    const EXAMPLE_COMMENT_ID = "example_comment_001";
    const snippetsById = new Map();

    snippetRecs.forEach((snippet) => {
      const snippetId = snippet?.commentId || snippet?.id;
      if (!snippetId) return;
      snippetsById.set(snippetId, snippet);
    });

    const orderedComments = stableCommentOrder.length > 0 ? stableCommentOrder : comments;
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
      const artworkUrl = formatArtworkUrl(rawArtwork, 300) || rawArtwork || "/assets/default-artist.png";
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
      };
    };

    orderedComments.forEach((comment) => {
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
  }, [comments, snippetRecs, stableCommentOrder]);

  // Header label
  const headerLabel = post?.postType === 'news' ? 'News' 
    : post?.postType === 'parameter' ? 'Parameter' 
    : post?.postType === 'groupchat' ? 'GroupChat' 
    : 'Thread';

  return (
    <div 
      className="thread-detail-container"
      style={{
        ...styles.container,
        ...(isMobileViewport ? {
          width: "100%",
          maxWidth: "100%",
          margin: 0,
          paddingBottom: "16px",
        } : null),
        ...(isNormalThread ? {
          backgroundColor: "#071423",
          background: "linear-gradient(165deg, #071423 0%, #0a2238 44%, #08182a 100%)",
        } : null),
        ...(isNewsThread ? {
          backgroundColor: "#0a0b10",
          background: "linear-gradient(165deg, #0a0b10 0%, #10111a 40%, #0c0d14 100%)",
        } : null),
        opacity: isVisible ? 1 : 0,
        transform: `scale(${isVisible ? '1' : '0.98'})`,
      }}>
      
      <audio ref={audioRef} style={{ display: "none" }}>
        <source type="audio/mpeg" />
      </audio>
      
      {/* ═══════════════════════════════════════════════
          GLASSMORPHIC HEADER — frosted glass bar
          ═══════════════════════════════════════════════ */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: headerPadding,
        backgroundColor: isNormalThread
          ? "rgba(5, 16, 30, 0.72)"
          : isNewsThread
            ? "rgba(10, 11, 16, 0.7)"
            : "rgba(10, 14, 26, 0.6)",
        backdropFilter: "blur(24px) saturate(1.4)",
        borderBottom: isNormalThread
          ? "1px solid rgba(29, 155, 240, 0.28)"
          : isNewsThread
            ? "1px solid rgba(232, 213, 168, 0.25)"
            : "1px solid rgba(255, 255, 255, 0.06)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
      }}>
        <button 
          onClick={handleBack} 
          style={{
            width: isCompactPhoneViewport ? "32px" : (isMobileViewport ? "34px" : "38px"),
            height: isCompactPhoneViewport ? "32px" : (isMobileViewport ? "34px" : "38px"),
            borderRadius: "50%",
            background: isNormalThread
              ? "rgba(29, 155, 240, 0.16)"
              : isNewsThread
                ? "rgba(232, 213, 168, 0.12)"
                : "rgba(255, 255, 255, 0.06)",
            border: isNormalThread
              ? "1px solid rgba(29, 155, 240, 0.45)"
              : isNewsThread
                ? "1px solid rgba(232, 213, 168, 0.35)"
                : "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: isNormalThread ? "#bae6fd" : isNewsThread ? HOME_NEWS_CHAMPAGNE : "#e2e8f0",
            marginRight: isCompactPhoneViewport ? "10px" : (isMobileViewport ? "12px" : "16px"),
            backdropFilter: "blur(8px)",
            boxShadow: isNormalThread
              ? "0 6px 14px rgba(29, 155, 240, 0.18)"
              : isNewsThread
                ? "0 6px 14px rgba(232, 213, 168, 0.12)"
                : "none",
            padding: 0,
          }}
        >
          <FiArrowLeft size={isCompactPhoneViewport ? 17 : (isMobileViewport ? 18 : 20)} />
        </button>
        <span style={{
          fontSize: isCompactPhoneViewport ? "11px" : (isMobileViewport ? "12px" : "13px"),
          fontWeight: "600",
          letterSpacing: isCompactPhoneViewport ? "1.8px" : (isMobileViewport ? "2.2px" : "3px"),
          textTransform: "uppercase",
          color: isNormalThread ? "#93dbff" : isNewsThread ? HOME_NEWS_CHAMPAGNE : "#94a3b8",
        }}>
          {headerLabel}
        </span>
        
        {/* Music badge in header */}
        {!isNewsThread && (
          <div style={{
            marginLeft: "auto",
            width: isCompactPhoneViewport ? "28px" : (isMobileViewport ? "30px" : "32px"),
            height: isCompactPhoneViewport ? "28px" : (isMobileViewport ? "30px" : "32px"),
            borderRadius: "50%",
            background: getMusicBadgeGradient(normalizedPostType),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: `0 2px 12px ${themeColor}44`,
          }}>
            <Music size={isCompactPhoneViewport ? 14 : (isMobileViewport ? 15 : 16)} />
          </div>
        )}
      </div>
      
      {/* ═══════════════════════════════════════════════
          GLASSMORPHIC POST CARD
          ═══════════════════════════════════════════════ */}
      {post ? (
        <div style={{
          ...styles.postCard,
          position: "relative",
          overflow: "hidden",
          width: contentWidth,
          margin: isMobileViewport ? "12px auto 14px" : (isTabletPortraitViewport ? "16px auto 18px" : "20px auto"),
          borderRadius: isMobileViewport
            ? (isCompactPhoneViewport ? "14px" : "16px")
            : (isTabletPortraitViewport ? "18px" : "20px"),
          ...(isNormalThread ? {
            backgroundColor: "rgba(8, 27, 45, 0.65)",
            border: "1px solid rgba(29, 155, 240, 0.25)",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(29, 155, 240, 0.14)",
          } : null),
          ...(isNewsThread ? {
            backgroundColor: "rgba(232, 213, 168, 0.05)",
            border: "1px solid rgba(232, 213, 168, 0.18)",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(232, 213, 168, 0.1)",
          } : null),
        }}>
          {/* Ambient glow orbs */}
          <div style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "340px",
            height: "340px",
            background: `radial-gradient(circle, ${themeColor}${isNewsThread ? '0a' : '18'} 0%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 0,
          }}/>
          <div style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "260px",
            height: "260px",
            background: isNormalThread
              ? "radial-gradient(circle, rgba(125, 211, 252, 0.14) 0%, transparent 70%)"
              : isNewsThread
                ? "radial-gradient(circle, rgba(232, 213, 168, 0.1) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}/>

          {/* Author row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: isCompactPhoneViewport ? "9px" : (isMobileViewport ? "10px" : "12px"),
            padding: isMobileViewport ? `14px ${contentHorizontalPadding} 10px` : "18px 20px 14px",
            position: "relative",
            zIndex: 1,
          }}>
            <div
              onClick={(e) => e.stopPropagation()}
            >
              <ClickableUserAvatar
                user={postUser}
                avatarSrc={postUser.avatar}
                size={isCompactPhoneViewport ? 36 : (isMobileViewport ? 40 : 44)}
                onUserClick={handleSelectUser}
              />
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
            }}>
              <button
                type="button"
                onClick={() => handleSelectUser(postUser)}
                style={{
                  fontWeight: "700",
                  fontSize: isCompactPhoneViewport ? "13px" : (isMobileViewport ? "14px" : "15px"),
                  color: "#f1f5f9",
                  background: "none",
                  border: "none",
                  padding: 0,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {postUser.displayName}
              </button>
              <div style={{
                fontSize: isCompactPhoneViewport ? "10px" : (isMobileViewport ? "11px" : "12px"),
                color: isNormalThread ? "#7cc8ea" : isNewsThread ? `${HOME_NEWS_CHAMPAGNE}99` : "#64748b",
                marginTop: "2px",
              }}>
                {postCreatedLabel}
              </div>
            </div>
          </div>
          
          {/* Title — gradient text */}
          <div style={{ padding: isMobileViewport ? `0 ${contentHorizontalPadding} 12px` : "0 20px 16px", position: "relative", zIndex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: titleFontSize,
              fontWeight: "800",
              letterSpacing: isMobileViewport ? "-0.3px" : "-0.5px",
              lineHeight: isMobileViewport ? "1.28" : "1.2",
              background: isNormalThread
                ? `linear-gradient(135deg, #f8fdff 24%, ${HOME_THREAD_BLUE_SOFT} 92%)`
                : isNewsThread
                  ? `linear-gradient(135deg, #fffef8 20%, ${HOME_NEWS_CHAMPAGNE} 90%)`
                  : "linear-gradient(135deg, #f8fafc 30%, #94a3b8)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              wordBreak: "break-word",
            }}>
              {post.title}
            </h2>
          </div>

          {post.selftext && (
            <p style={{
              fontSize: bodyFontSize,
              lineHeight: isMobileViewport ? 1.55 : 1.6,
              color: isNormalThread ? "#d6efff" : isNewsThread ? `${HOME_NEWS_CHAMPAGNE}cc` : "#cbd5e1",
              margin: 0,
              padding: isMobileViewport ? `0 ${contentHorizontalPadding} 12px` : "0 20px 16px",
              position: "relative",
              zIndex: 1,
            }}>
              {post.selftext}
            </p>
          )}
          
          {/* Post image */}
          {post.imageUrl && (
            <div style={{ padding: isMobileViewport ? `0 ${contentHorizontalPadding} 14px` : "0 20px 20px", position: "relative", zIndex: 1 }}>
              <div style={{
                borderRadius: isMobileViewport ? "12px" : "14px",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                background: "#0a0e1a",
              }}>
                <img
                  src={post.imageUrl}
                  alt="Post visual"
                  style={{
                    width: "100%",
                    maxHeight: postImageMaxHeight,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
              
              {post.postType === 'parameter' && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  {(Array.isArray(post.parameters) ? post.parameters : []).map((parameterName, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      backgroundColor: ['#CC5427', '#3A9B93', '#3686A3', '#7BA387'][i % 4],
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}>
                      <span>{parameterName}</span>
                      <span style={{
                        background: 'rgba(255,255,255,0.25)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}>
                        {post.parameterCounts?.[parameterName] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* ═══════════════════════════════════════════════
              STATS ROW — pill badges
              ═══════════════════════════════════════════════ */}
          <div style={{
            display: useGridStatsRow ? "grid" : "flex",
            alignItems: "center",
            justifyContent: useGridStatsRow ? "stretch" : "space-around",
            gridTemplateColumns: useGridStatsRow ? "repeat(4, minmax(0, 1fr))" : undefined,
            gap: isCompactPhoneViewport ? "4px" : (isMobileViewport ? "6px" : 0),
            width: "100%",
            padding: isMobileViewport ? (isCompactPhoneViewport ? "9px 10px 13px" : "10px 12px 14px") : "14px 20px 18px",
            borderTop: isNormalThread
              ? "1px solid rgba(29, 155, 240, 0.18)"
              : isNewsThread
                ? "1px solid rgba(232, 213, 168, 0.15)"
                : "1px solid rgba(255, 255, 255, 0.05)",
            position: "relative",
            zIndex: 1,
          }}>
            {[
              { Icon: MessageCircle, val: displayedPostStatsWithFallback.num_comments },
              { Icon: Heart, val: displayedPostStatsWithFallback.ups },
              { Icon: Share2, val: null },
              { Icon: Bookmark, val: displayedPostStatsWithFallback.bookmarks },
            ].map(({ Icon, val }, i) => (
              <button key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: isCompactPhoneViewport ? "4px" : "6px",
                justifyContent: "center",
                flex: isMobileViewport ? "1 1 0" : "0 0 auto",
                minWidth: 0,
                width: isMobileViewport ? "100%" : "auto",
                background: isNormalThread
                  ? "rgba(29, 155, 240, 0.12)"
                  : isNewsThread
                    ? "rgba(232, 213, 168, 0.08)"
                    : "rgba(255, 255, 255, 0.04)",
                border: isNormalThread
                  ? "1px solid rgba(29, 155, 240, 0.28)"
                  : isNewsThread
                    ? "1px solid rgba(232, 213, 168, 0.18)"
                    : "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "999px",
                padding: isMobileViewport ? (isCompactPhoneViewport ? "7px 4px" : "8px 6px") : "8px 14px",
                color: isNormalThread ? "#a8e1ff" : isNewsThread ? `${HOME_NEWS_CHAMPAGNE}bb` : "#94a3b8",
                cursor: "pointer",
                fontSize: isCompactPhoneViewport ? "11px" : (isMobileViewport ? "12px" : "13px"),
                fontWeight: "600",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}>
                <Icon size={statIconSize} />
                {val !== null && <span style={{ minWidth: 0, textOverflow: "ellipsis", overflow: "hidden" }}>{val}</span>}
              </button>
            ))}
          </div>
          
          {/* ═══════════════════════════════════════════════
              TABS — glassmorphic capsule
              ═══════════════════════════════════════════════ */}
          {!isNewsThread && (
            <div style={{
              padding: isMobileViewport ? `0 ${contentHorizontalPadding} 14px` : "0 20px 20px",
              position: "relative",
              zIndex: 1,
            }}>
              <div style={{
                display: "flex",
                gap: isCompactPhoneViewport ? "5px" : (isMobileViewport ? "6px" : "8px"),
                padding: isCompactPhoneViewport ? "4px" : (isMobileViewport ? "5px" : "6px"),
                borderRadius: "999px",
                background: isNormalThread ? "rgba(29, 155, 240, 0.08)" : "rgba(255, 255, 255, 0.03)",
                border: isNormalThread ? "1px solid rgba(29, 155, 240, 0.22)" : "1px solid rgba(255, 255, 255, 0.06)",
              }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTabClick("graphs")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleTabClick("graphs");
                    }
                  }}
                  style={{
                    flex: 1,
                    border: "none",
                    cursor: "pointer",
                    background:
                      activeSection === "graphs"
                        ? `linear-gradient(135deg, ${themeColor}40, ${themeColor}20)`
                        : "transparent",
                    color: activeSection === "graphs" ? "#e0e7ff" : "#64748b",
                    borderRadius: "999px",
                    padding: isCompactPhoneViewport ? "8px 9px" : (isMobileViewport ? "10px 12px" : "12px 14px"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: isCompactPhoneViewport ? "6px" : (isMobileViewport ? "8px" : "10px"),
                    fontWeight: 700,
                    letterSpacing: "0.2px",
                    boxShadow:
                      activeSection === "graphs"
                        ? `0 0 0 1px ${themeColor}66, 0 8px 20px rgba(0,0,0,0.2)`
                        : "none",
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <BarChart3 size={isCompactPhoneViewport ? 15 : (isMobileViewport ? 16 : 18)} color={activeSection === "graphs" ? themeColor : "#64748b"} />
                  <span style={{ fontSize: isCompactPhoneViewport ? "13px" : (isMobileViewport ? "14px" : "15px") }}>Graphs</span>

                  <span
                    style={{
                      minWidth: isCompactPhoneViewport ? "22px" : (isMobileViewport ? "24px" : "28px"),
                      height: isCompactPhoneViewport ? "18px" : (isMobileViewport ? "20px" : "22px"),
                      padding: isCompactPhoneViewport ? "0 6px" : (isMobileViewport ? "0 8px" : "0 10px"),
                      borderRadius: "999px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isCompactPhoneViewport ? "9px" : (isMobileViewport ? "10px" : "11px"),
                      fontWeight: 800,
                      background: activeSection === "graphs" ? `${themeColor}33` : "rgba(255,255,255,0.06)",
                      color: activeSection === "graphs" ? "#fff" : "#cbd5e1",
                      border: activeSection === "graphs" ? `1px solid ${themeColor}55` : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {graphsCount}
                  </span>

                  {showInlineGraphInfo && (
                    <span style={{ display: "inline-flex", opacity: activeSection === "graphs" ? 1 : 0.75 }}>
                      <InfoIconModal
                        modalId={`thread-detail-graphs-tab-info-${postId || post?.id || 'unknown'}`}
                        title="Graphs"
                        iconSize={isMobileViewport ? 12 : 14}
                        showButtonText={false}
                        steps={[
                          {
                            icon: <BarChart3 size={18} color="#a9b6fc" />,
                            title: "Use Graphs for Insights",
                            content: "Use these graphs to glean more info on each thread",
                          },
                          {
                            icon: <Users size={18} color="#a9b6fc" />,
                            title: "Engage to Add Data",
                            content: "Engaging and rating snippets will add more users to each graph",
                          },
                        ]}
                      />
                    </span>
                  )}
                </div>

              </div>
            </div>
          )}
          
          {/* Graph content area */}
          {!isNewsThread && (
            <>
              <GraphModal 
                isOpen={isGraphModalOpen}
                onClose={closeGraphModal}
                graphType={activeGraphType}
                graphData={graphRatings}
                scatterData={scatterData}
              />
              
              {activeSection === "graphs" && (
                <div ref={graphsSectionRef}>
                  <GraphSection 
                    graphRatings={graphRatings}
                    scatterData={scatterData}
                    openVerticalGraphModal={openVerticalGraphModal}
                    openScatterGraphModal={openScatterGraphModal}
                    isMobile={isMobileViewport}
                  />
                </div>
              )}
              
            </>
          )}
          
        </div>
      ) : (
        <div style={{
          ...styles.loadingContainer,
          width: contentWidth,
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
      {!isNewsThread && (
        <div style={{
          width: contentWidth,
          margin: isMobileViewport ? (isCompactPhoneViewport ? "4px auto 14px" : "6px auto 16px") : "8px auto 24px",
          ...(isNormalThread ? {
            border: "1px solid rgba(29, 155, 240, 0.22)",
            background: "rgba(7, 26, 42, 0.45)",
            borderRadius: isMobileViewport ? "16px" : "20px",
            padding: isMobileViewport ? (isCompactPhoneViewport ? "4px" : "6px") : "8px",
          } : null),
        }}>
          <ThreadCommentComposer
            onSubmit={handleSubmitComment}
            onOpenTikTokModal={openTikTokView}
            themeVariant={isParameterThread ? "parameter" : "thread"}
          />
        </div>
      )}
      
      {post?.postType !== "groupchat" && (
        <div style={{
          ...styles.commentsSection,
          width: contentWidth,
          margin: "0 auto",
          ...(isNormalThread ? {
            border: "1px solid rgba(29, 155, 240, 0.2)",
            borderRadius: "16px",
            background: "linear-gradient(180deg, rgba(9, 27, 44, 0.5) 0%, rgba(7, 21, 35, 0.35) 100%)",
            padding: isMobileViewport ? (isCompactPhoneViewport ? "7px 10px 12px" : "8px 12px 14px") : "8px 16px 18px",
          } : null),
          ...(isNewsThread ? {
            border: "1px solid rgba(232, 213, 168, 0.14)",
            borderRadius: "16px",
            background: "linear-gradient(180deg, rgba(232, 213, 168, 0.06) 0%, transparent 100%)",
            padding: isMobileViewport ? (isCompactPhoneViewport ? "7px 10px 12px" : "8px 12px 14px") : "8px 16px 18px",
          } : null),
        }}>
          <h3 style={{
            ...styles.commentsHeader,
            ...(isNormalThread ? {
              color: "#9edfff",
              borderBottom: "1px solid rgba(29, 155, 240, 0.24)",
            } : null),
            ...(isNewsThread ? {
              color: HOME_NEWS_CHAMPAGNE,
              borderBottom: "1px solid rgba(232, 213, 168, 0.2)",
            } : null),
          }}>
            Responses ({stableCommentOrder.length || comments.length})
          </h3>

          {shouldShowNoSnippetsState && (
            <div style={{
              marginBottom: "16px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: isNormalThread ? "rgba(29, 155, 240, 0.1)" : "rgba(255, 255, 255, 0.03)",
              border: isNormalThread ? "1px solid rgba(29, 155, 240, 0.24)" : "1px solid rgba(255, 255, 255, 0.06)",
              color: isNormalThread ? "#ccecff" : "#cbd5e1",
              fontSize: "13px",
              lineHeight: "1.5",
              backdropFilter: "blur(8px)",
            }}>
              No snippets are available for this live thread right now.
            </div>
          )}
          
          <div style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}>
            {(stableCommentOrder.length > 0 ? stableCommentOrder : comments).map((c, index) => {
              let snippetObj = null;
              
              // For news threads, don't process any snippets
              if (!isNewsThread) {
                // First check if this comment has a snippet attached directly (from injection)
                if (c.snippet) {
                  // Format artwork URL if needed
                  const rawArtwork =
                    c.snippet.snippetData?.attributes?.artwork?.url ||
                    c.snippet.artworkUrl ||
                    c.snippet.artwork;
                  const artworkUrl = formatArtworkUrl(rawArtwork, 300) || rawArtwork;
                  
                  snippetObj = {
                    id: c.snippet.id || c.id,
                    commentId: c.snippet.commentId || c.id,
                    name: c.snippet.name || c.snippet.songName,
                    songName: c.snippet.songName || c.snippet.name,
                    artistName: c.snippet.artistName,
                    // CRITICAL: Use 'artwork' field for ThreadCommentCard
                    artwork: artworkUrl,
                    artworkUrl: artworkUrl,
                    previewUrl: c.snippet.previewUrl,
                    userRating: c.snippet.userRating,
                    avgRating: c.snippet.avgRating,
                    totalRatings: c.snippet.totalRatings,
                    didRate: c.snippet.didRate,
                    snippetData: c.snippet.snippetData,
                  };
                }
                
                // Then check snippetRecs for this comment (might have updated rating)
                if (!snippetObj) {
                  snippetObj = snippetRecs.find((s) => s.commentId === c.id);
                } else {
                  // Check if there's an updated version in snippetRecs (with new rating)
                  const updatedSnippet = snippetRecs.find((s) => s.commentId === c.id || s.id === c.id);
                  if (updatedSnippet) {
                    // Merge the updated rating data
                    snippetObj = {
                      ...snippetObj,
                      userRating: updatedSnippet.userRating ?? snippetObj.userRating,
                      avgRating: updatedSnippet.avgRating ?? snippetObj.avgRating,
                      totalRatings: updatedSnippet.totalRatings ?? snippetObj.totalRatings,
                      didRate: updatedSnippet.didRate ?? snippetObj.didRate,
                    };
                  }
                }
                
                if (c.id === 'example_comment_001') {
                  snippetObj = exampleSnippet;
                } else if (snippetObj && !c.snippet) {
                  snippetObj = formatSnippetData(snippetObj, c, comments);
                }
              }
              
              const isThisSnippetPlaying = !isNewsThread &&
                activeSnippet && 
                activeSnippet.snippetId === getSnippetId(snippetObj) && 
                activeSnippet.isPlaying;
              
              const commentKey = c.id || `comment-${c.author || 'unknown'}-${c.createdUtc || c.createdAt || index}`;
              
              return (
                <ThreadCommentCard
                  key={commentKey}
                  comment={getCommentMetrics(c, Boolean(snippetObj))}
                  snippet={isNewsThread ? null : snippetObj}
                  isPlaying={isThisSnippetPlaying}
                  activeSnippet={isNewsThread ? null : activeSnippet}
                  onPlayPause={isNewsThread ? null : () => playSnippetInComment(snippetObj)}
                  onRate={isNewsThread ? null : handleUserRate}
                  onRatingPause={isNewsThread ? null : handleRatingPause}
                  onUserClick={handleSelectUser}
                  isFirstSnippet={shouldShowExampleComment && index === 0 && c.id === 'example_comment_001' && Boolean(snippetObj)}
                  isNewsThread={isNewsThread}
                  snippetsLoading={!isNewsThread && !usedCache && snippetsLoading}
                  isMobileViewport={isMobileViewport}
                  isCompactPhoneViewport={isCompactPhoneViewport}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {!isNewsThread && isTikTokOpen && (
        <TikTokModal
          snippets={tikTokSnippets}
          comments={comments}
          onClose={closeTikTokView}
          audioRef={audioRef}
          isPlaying={activeSnippet.isPlaying}
          activeSnippet={activeSnippet}
          onUserRate={handleUserRate}
          playOrPauseSnippet={playSnippet}
          threadTitle={post?.title}
        />
      )}
    </div>
  );
}
