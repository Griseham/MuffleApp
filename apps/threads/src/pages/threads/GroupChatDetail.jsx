// src/pages/GroupChatDetail.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Music, Search, Users, Send, Volume2, X } from "lucide-react";
import styles from "./GroupChatDetailStyles";
import { sanitizeComment } from "../../utils/security";
import { buildApiUrl, toApiOriginUrl } from "../../utils/api";

const DEFAULT_ARTWORK = "/assets/default-artist.png";
const GROUPCHAT_MUSIC_SEARCH_ENABLED = false;
const COMPACT_PHONE_BREAKPOINT = 390;
const PHONE_BREAKPOINT = 480;
const TABLET_PORTRAIT_BREAKPOINT = 1024;

// Helper function to generate avatar URLs
function authorToAvatar(author) {
  if (!author || typeof author !== "string") {
    return "/assets/default-avatar.png";
  }

  const mod = hashStringToNumber(author) % 1000;
  return `/assets/image${mod + 1}.png`;
}

function hashStringToNumber(value) {
  if (!value) return 0;
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function normalizeMediaUrl(url) {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("/cached_media/")) return toApiOriginUrl(url);
  return url;
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

function formatArtworkUrl(url, size = 100) {
  if (!url || typeof url !== "string") return "";
  return normalizeMediaUrl(
    url
      .replace("{w}", String(size))
      .replace("{h}", String(size))
      .replace("{f}", "jpg")
  );
}

function getArtworkSrc(url, size = 100) {
  return formatArtworkUrl(url, size) || DEFAULT_ARTWORK;
}

function needsSnippetMediaRecovery(url) {
  return !url || url.startsWith("/cached_media/");
}

// Helper function to format timestamps
function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
}

function formatPostDate(createdUtc) {
  if (!Number.isFinite(createdUtc) || createdUtc <= 0) return "";
  const resolvedMs = createdUtc > 1e12 ? createdUtc : createdUtc * 1000;
  return new Date(resolvedMs).toLocaleString();
}

// Clean message body: strip markdown links, images, and decode HTML entities
function cleanMessageBody(text) {
  if (!text) return '';
  return text
    // Remove markdown images: ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Convert markdown links [text](url) → just text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Decode common HTML entities
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    // Remove bold markdown **text** → text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove italic markdown _text_ → text
    .replace(/\b_([^_]+)_\b/g, '$1')
    // Strip any remaining markdown blockquotes
    .replace(/^> /gm, '')
    .trim();
}

function normalizeGenrePointChange(change, fallback = "+0.0%") {
  if (typeof change === "string" && change.trim()) {
    return change.trim();
  }
  if (Number.isFinite(change)) {
    return `+${change.toFixed(1)}%`;
  }
  return fallback;
}

function buildStableGroupChatFallback(post = {}) {
  const seed = hashStringToNumber(String(post?.id || post?.title || ""));
  const roomVolume = 500 + (seed % 4500);
  const volumePoints = 5 + (seed % 30);
  const palette = ["#00d4aa", "#ff6b9d", "#a855f7", "#f59e0b", "#3b82f6"];
  const genres = ["Metal", "Hip-Hop", "R&B", "Electronic", "Pop", "Rock", "Indie", "Jazz"];

  const pickedSet = new Set([
    genres[seed % genres.length],
    genres[(seed * 7) % genres.length],
    genres[(seed * 13) % genres.length],
  ]);
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

  return { roomVolume, volumePoints, genreStats };
}

export default function GroupChatDetail({ post, onBack, onUserListUpdate }) {
  // Core state
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [_messageIndex, setMessageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [newComment, setNewComment] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [isSongSearchVisible, setIsSongSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [_searchedSnippet, setSearchedSnippet] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [attachedSnippet, setAttachedSnippet] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [randomTypingUser, setRandomTypingUser] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [panelNotice, setPanelNotice] = useState(null);
  const [isPostExpanded, setIsPostExpanded] = useState(false);
  const isCompactPhoneView = useViewportMatch(COMPACT_PHONE_BREAKPOINT);
  const isMobileView = useViewportMatch(PHONE_BREAKPOINT);
  const isTabletPortraitView =
    useViewportMatch(TABLET_PORTRAIT_BREAKPOINT) && !isMobileView;
  const isTouchViewport = isMobileView || isTabletPortraitView;

  const replaySummary = useMemo(() => {
    const snippetMessages = allMessages.filter((message) => Boolean(message?.snippet)).length;
    const replyMessages = allMessages.filter((message) => Boolean(message?.isReply)).length;

    return {
      totalMessages: allMessages.length,
      snippetMessages,
      replyMessages,
      participantCount: uniqueUsers.length,
    };
  }, [allMessages, uniqueUsers.length]);

  const groupChatFallbackStats = useMemo(
    () => buildStableGroupChatFallback(post),
    [post]
  );

  const rightPanelStats = useMemo(() => {
    const parsedVolumePoints = Number(post?.volumeChange);
    const volumePoints = Number.isFinite(parsedVolumePoints)
      ? Math.max(0, Math.round(parsedVolumePoints))
      : groupChatFallbackStats.volumePoints;

    const fallbackGenres = groupChatFallbackStats.genreStats;
    const postGenreStats = Array.isArray(post?.genreStats) ? post.genreStats : [];

    const normalizedGenres = [];
    const pushGenre = (genreStat, index) => {
      if (!genreStat || normalizedGenres.length >= 3) return;
      const genreName = String(genreStat?.name || "").trim();
      if (!genreName || normalizedGenres.some((item) => item.name === genreName)) return;
      normalizedGenres.push({
        name: genreName,
        change: normalizeGenrePointChange(
          genreStat?.change,
          fallbackGenres[index]?.change || "+0.0%"
        ),
        color: genreStat?.color || fallbackGenres[index]?.color || "#64748b",
      });
    };

    postGenreStats.forEach(pushGenre);
    fallbackGenres.forEach(pushGenre);

    return {
      volumePoints,
      genres: normalizedGenres.slice(0, 3),
    };
  }, [groupChatFallbackStats.genreStats, groupChatFallbackStats.volumePoints, post?.genreStats, post?.volumeChange]);

  const headerRoomVolume = useMemo(() => {
    const parsedRoomVolume = Number(post?.roomVolume);
    if (Number.isFinite(parsedRoomVolume)) {
      return Math.max(0, Math.round(parsedRoomVolume));
    }
    return groupChatFallbackStats.roomVolume;
  }, [groupChatFallbackStats.roomVolume, post?.roomVolume]);
  const postCreatedLabel = useMemo(() => formatPostDate(post?.createdUtc), [post?.createdUtc]);
  const pagePadding = isCompactPhoneView ? "10px" : (isMobileView ? "12px" : (isTabletPortraitView ? "18px" : "20px"));
  const surfaceRadius = isCompactPhoneView ? "14px" : (isMobileView ? "16px" : (isTabletPortraitView ? "20px" : "24px"));
  const chatContainerHeight = useMemo(() => {
    if (isMobileView) {
      if (isPostExpanded) return isCompactPhoneView ? "calc(100dvh - 340px)" : "calc(100dvh - 360px)";
      return isCompactPhoneView ? "calc(100dvh - 220px)" : "calc(100dvh - 240px)";
    }
    if (isTabletPortraitView) return "calc(100dvh - 360px)";
    return "calc(100vh - 420px)";
  }, [isCompactPhoneView, isMobileView, isPostExpanded, isTabletPortraitView]);

  // Audio playback state
  const audioRef = useRef(null);
  const [isSnippetAudioPlaying, setIsSnippetAudioPlaying] = useState(false);
  const [currentPlayingSnippetId, setCurrentPlayingSnippetId] = useState(null);

  // Refs
  const chatRef = useRef(null);
  const messageIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const recoverSnippetMedia = useCallback(async (snippet) => {
    if (!snippet) return snippet;

    const attrs = snippet.snippetData?.attributes;
    const songName = snippet.songName || snippet.name || attrs?.name || "";
    const artistName = snippet.artistName || attrs?.artistName || "";
    const artworkUrl =
      snippet.artworkUrl ||
      snippet.artwork ||
      snippet.artistImage ||
      attrs?.artwork?.url ||
      "";
    const previewUrl =
      snippet.previewUrl ||
      attrs?.previews?.[0]?.url ||
      "";

    if (
      !songName ||
      !artistName ||
      (!needsSnippetMediaRecovery(artworkUrl) && !needsSnippetMediaRecovery(previewUrl))
    ) {
      return snippet;
    }

    try {
      const response = await fetch(
        `${buildApiUrl("/apple-music-search")}?query=${encodeURIComponent(`${songName} ${artistName}`)}&limit=1`
      );
      const data = await response.json();
      const recovered = Array.isArray(data?.data) ? data.data[0] : null;
      const recoveredAttrs = recovered?.attributes;

      if (!recoveredAttrs) {
        return snippet;
      }

      return {
        ...snippet,
        artworkUrl: recoveredAttrs.artwork?.url || snippet.artworkUrl || snippet.artwork,
        previewUrl: recoveredAttrs.previews?.[0]?.url || snippet.previewUrl || null,
        snippetData: {
          ...snippet.snippetData,
          attributes: {
            ...attrs,
            ...recoveredAttrs,
            artwork: recoveredAttrs.artwork || attrs?.artwork,
            previews: recoveredAttrs.previews || attrs?.previews || [],
          },
        },
      };
    } catch  {
      
      return snippet;
    }
  }, []);

  // Handle entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll function
  const scrollToBottom = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Simplified message streaming
  const startMessageSequence = useCallback((allMsgs) => {
    if (!allMsgs || allMsgs.length === 0) return;
    
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
    }

    const initialCount = Math.min(2, allMsgs.length);
    setMessages(allMsgs.slice(0, initialCount));
    setMessageIndex(initialCount);
    
    setTimeout(() => scrollToBottom(), 100);

    if (allMsgs.length > initialCount) {
      let currentIndex = initialCount;
      
      messageIntervalRef.current = setInterval(() => {
        if (currentIndex < allMsgs.length) {
          const nextMessage = allMsgs[currentIndex];
          
          setRandomTypingUser(nextMessage.author);
          setIsTyping(true);
          
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, nextMessage]);
            setMessageIndex(currentIndex + 1);
            currentIndex++;
            scrollToBottom();
          }, 1000 + Math.random() * 1000);
          
        } else {
          clearInterval(messageIntervalRef.current);
          messageIntervalRef.current = null;
        }
      }, 3000);
    }
  }, [scrollToBottom]);

  // Load messages from API - simplified
  useEffect(() => {
    if (!post?.id) return;

    async function loadMessages() {
      try {
        setLoading(true);

        const formatArtwork = (url) => {
          if (!url || typeof url !== "string") return DEFAULT_ARTWORK;
          return getArtworkSrc(url, 100);
        };

        const toSnippetShape = (snippet) => {
          if (!snippet) return null;

          const attrs = snippet.snippetData?.attributes;
          const snippetId = snippet.commentId || snippet.id;
          const name = snippet.songName || snippet.name || attrs?.name;
          const artistName = snippet.artistName || attrs?.artistName;
          const artworkRaw =
            snippet.artworkUrl ||
            snippet.artwork ||
            snippet.artistImage ||
            attrs?.artwork?.url;
          const previewUrl = normalizeMediaUrl(
            snippet.previewUrl ||
            attrs?.previews?.[0]?.url ||
            null
          );

          if (!snippetId || !name || !artistName) return null;

          return {
            id: snippetId,
            name,
            artistName,
            artwork: formatArtwork(artworkRaw),
            previewUrl
          };
        };

        let cachedPostData = null;

        try {
          const cachedResp = await fetch(buildApiUrl(`/cached-posts/${post.id}`));
          if (cachedResp.ok) {
            const cachedJson = await cachedResp.json();
            if (cachedJson?.success && cachedJson?.data) {
              cachedPostData = cachedJson.data;
            }
          }
        } catch  { /* intentionally empty */ }

        let commentsData = { data: [] };
        let snippetsData = [];

        if (cachedPostData) {
          commentsData = { data: cachedPostData.comments || [] };
          snippetsData = cachedPostData.snippets || [];
        } else {
          const subreddit =
            cachedPostData?.subreddit ||
            post?.subreddit ||
            "";
          const postType =
            cachedPostData?.postType ||
            post?.postType ||
            "groupchat";
          const searchParams = new URLSearchParams();
          if (subreddit) searchParams.set("subreddit", subreddit);
          if (postType) searchParams.set("postType", postType);
          const querySuffix = searchParams.toString() ? `?${searchParams.toString()}` : "";

          // Fetch live comments
          const commentsResponse = await fetch(buildApiUrl(`/posts/${post.id}/comments${querySuffix}`));
          commentsData = await commentsResponse.json();

          // Fetch live snippets
          try {
            const snippetsResponse = await fetch(buildApiUrl(`/posts/${post.id}/snippets${querySuffix}`));
            const snippetsJson = await snippetsResponse.json();
            if (snippetsJson.success) {
              snippetsData = snippetsJson.data || [];
            }
          } catch  { /* intentionally empty */ }
        }

        snippetsData = await Promise.all(
          (Array.isArray(snippetsData) ? snippetsData : []).map((snippet) => recoverSnippetMedia(snippet))
        );

        // Create snippets map
        const snippetsMap = {};
        snippetsData.forEach((s) => {
          const normalized = toSnippetShape(s);
          if (!normalized) return;
          snippetsMap[normalized.id] = normalized;
        });

        // Process messages with better reply distribution
        const topLevelComments = [];
        const repliesByParent = {};
        
        // Handle different API response formats
        const comments = commentsData.data?.topLevel || commentsData.data || post.comments || [];
        let replies = commentsData.data?.replies || [];

        // Cached post shape stores replies nested inside each top-level comment.
        if ((!Array.isArray(replies) || replies.length === 0) && Array.isArray(comments)) {
          replies = comments.flatMap((comment) =>
            (Array.isArray(comment.replies) ? comment.replies : []).map((reply) => ({
              ...reply,
              parentId: comment.id,
              parentAuthor: comment.author
            }))
          );
        }
        
        // First, collect all top-level comments
        comments.forEach(comment => {
          if (comment.author && comment.author !== "[deleted]" && comment.body) {
            const commentData = {
              id: `msg_${comment.id || "unknown"}_${comment.createdUtc || 0}`,
              originalId: comment.id,
              author: comment.author,
              body: comment.body,
              snippet: snippetsMap[comment.id] || null,
              timestamp: comment.createdUtc || (Date.now() / 1000),
              isReply: false
            };
            topLevelComments.push(commentData);
          }
        });

        // Group replies by parent
        replies.forEach(reply => {
          if (reply.author && reply.author !== "[deleted]" && reply.body) {
            const parentId = reply.parentId || 'unknown';
            if (!repliesByParent[parentId]) {
              repliesByParent[parentId] = [];
            }
            
            repliesByParent[parentId].push({
              id: `msg_${reply.id || "unknown"}_${reply.createdUtc || 0}`,
              originalId: reply.id,
              author: reply.author,
              body: reply.body,
              snippet: snippetsMap[reply.id] || null,
              timestamp: reply.createdUtc || (Date.now() / 1000),
              isReply: true,
              parentId: parentId,
              parentAuthor: reply.parentAuthor || "Unknown"
            });
          }
        });

        // Create a natural conversation flow
        const allReplies = [];
        Object.keys(repliesByParent).forEach(parentId => {
          const parentReplies = repliesByParent[parentId];
          if (parentReplies.length > 0) {
            allReplies.push(parentReplies[0]);
          }
        });

        const allMsgs = [...topLevelComments, ...allReplies];
        allMsgs.sort((a, b) => a.timestamp - b.timestamp);
        
        // Create conversation flow
        const conversationFlow = [];
        let commentCount = 0;
        
        for (let i = 0; i < allMsgs.length; i++) {
          const message = allMsgs[i];
          
          if (!message.isReply) {
            conversationFlow.push(message);
            commentCount++;
            
            if (commentCount % (Math.random() > 0.5 ? 2 : 3) === 0) {
              const availableReply = allMsgs.find((m, idx) => 
                idx > i && m.isReply && !conversationFlow.includes(m)
              );
              if (availableReply) {
                conversationFlow.push(availableReply);
              }
            }
          }
        }
        
        allMsgs.forEach(msg => {
          if (!conversationFlow.includes(msg)) {
            conversationFlow.push(msg);
          }
        });
        
        // Final shuffle
        const shuffledMessages = [];
        for (let i = 0; i < conversationFlow.length; i += 4) {
          const chunk = conversationFlow.slice(i, i + 4);
          if (chunk.length > 2) {
            const first = chunk[0];
            const rest = chunk.slice(1);
            for (let j = rest.length - 1; j > 0; j--) {
              const k = Math.floor(Math.random() * (j + 1));
              [rest[j], rest[k]] = [rest[k], rest[j]];
            }
            shuffledMessages.push(first, ...rest);
          } else {
            shuffledMessages.push(...chunk);
          }
        }
        
        if (shuffledMessages.length === 0) {
          setMessages([]);
          setAllMessages([]);
          setLoading(false);
          return;
        }

        const snippetFirstMessages = [
          ...shuffledMessages.filter((msg) => Boolean(msg.snippet)),
          ...shuffledMessages.filter((msg) => !msg.snippet),
        ];

        setAllMessages(snippetFirstMessages);
        setMessageIndex(0);
        setMessages([]);
        
        startMessageSequence(snippetFirstMessages);
        
      } catch  {
        
        setMessages([]);
        setAllMessages([]);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();

    const audioElement = audioRef.current;
    return () => {
      clearInterval(messageIntervalRef.current);
      clearTimeout(typingTimeoutRef.current);
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [post?.comments, post?.id, post?.postType, post?.subreddit, recoverSnippetMedia, startMessageSequence]);

  // Update participant list from the full replay payload
  useEffect(() => {
    const userSet = new Set();
    allMessages.forEach(msg => {
      if (msg.author && msg.author !== "System" && msg.author !== "You") {
        userSet.add(msg.author);
      }
    });
    
    const userArray = Array.from(userSet).map(name => ({
      name,
      avatar: authorToAvatar(name),
      isActive: (hashStringToNumber(name) % 10) < 8
    }));
    
    setUniqueUsers(userArray);
  }, [allMessages]);

  useEffect(() => {
    setOnlineUsers(uniqueUsers);
  }, [uniqueUsers]);

  useEffect(() => {
    if (onUserListUpdate) {
      onUserListUpdate(onlineUsers);
    }
  }, [onlineUsers, onUserListUpdate]);

  // Handle scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!chatRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 20;
      setShowScrollButton(!atBottom);
    };
    
    const chatElement = chatRef.current;
    if (chatElement) {
      chatElement.addEventListener('scroll', handleScroll);
      return () => chatElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Handle user message submission with security validation
  const handleSubmitComment = useCallback(() => {
    setPanelNotice({
      type: "info",
      text: "Chat replay is read-only. Messaging is disabled in this prototype view."
    });
  }, []);

  // Handle audio playback
  const handlePlayInChat = useCallback((snippet) => {
    if (!snippet?.previewUrl) return;

    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    if (currentPlayingSnippetId === snippet.id && isSnippetAudioPlaying) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsSnippetAudioPlaying(false);
      setCurrentPlayingSnippetId(null);
      return;
    }
    
    setCurrentPlayingSnippetId(snippet.id);
    setIsSnippetAudioPlaying(true);

    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement.src = normalizeMediaUrl(snippet.previewUrl);
    audioElement.load();
    audioElement.play().catch(_err => {
      
      setIsSnippetAudioPlaying(false);
      setCurrentPlayingSnippetId(null);
    });
    
    audioElement.onerror = () => {
      setIsSnippetAudioPlaying(false);
      setCurrentPlayingSnippetId(null);
    };

    audioElement.onended = () => {
      setIsSnippetAudioPlaying(false);
      setCurrentPlayingSnippetId(null);
    };
  }, [currentPlayingSnippetId, isSnippetAudioPlaying]);

  // Handle song search with security validation
  const handleSongSearch = useCallback(() => {
    setIsSearching(false);
    setSearchedSnippet(null);
    setSearchResults([]);
    setPanelNotice({
      type: "info",
      text: "Music search is disabled in the group chat replay prototype."
    });
  }, []);

  // Handle attaching snippet
  const handleAttachSnippet = useCallback((snippet) => {
    const attrs = snippet.attributes || snippet;
    setAttachedSnippet({
      id: snippet.id || `snippet_${Date.now()}`,
      name: attrs.name,
      artistName: attrs.artistName,
      artwork: getArtworkSrc(attrs.artwork?.url),
      previewUrl: normalizeMediaUrl(attrs.previews?.[0]?.url || null)
    });
    setIsSongSearchVisible(false);
    setPanelNotice(null);
  }, []);

  // Toggle panels
  const toggleMusicPanel = useCallback(() => {
    setIsSongSearchVisible(prev => {
      const next = !prev;
      if (next) {
        setPanelNotice({
          type: "info",
          text: "Music search is disabled in the group chat replay prototype."
        });
      } else {
        setPanelNotice(null);
      }
      return next;
    });
    setActiveSection(null);
    setSearchResults([]);
    setSearchedSnippet(null);
  }, []);

  const toggleUsersPanel = useCallback(() => {
    setActiveSection(prev => prev === 'users' ? null : 'users');
    setIsSongSearchVisible(false);
    setPanelNotice(null);
  }, []);

  // Render messages
  const renderMessages = useCallback(() => {
    return messages.map((msg) => {
      const isUserMessage = msg.author === "You";
      
      return (
        <div
          key={msg.id}
          style={
            isUserMessage
              ? styles.sentMessageContainer
              : {
                  ...styles.messageContainer,
                  ...(isCompactPhoneView ? { gap: "8px", marginBottom: "12px" } : null),
                }
          }
        >
          {!isUserMessage && (
            <div style={styles.avatarColumn}>
              <img 
                src={authorToAvatar(msg.author)} 
                style={{
                  ...styles.avatar,
                  ...(isCompactPhoneView ? { width: "30px", height: "30px" } : null),
                }}
                alt={msg.author} 
              />
              <div
                style={{
                  ...styles.onlineIndicator,
                  ...(isCompactPhoneView ? { width: "8px", height: "8px" } : null),
                }}
              />
            </div>
          )}
          
          <div
            style={
              isUserMessage
                ? {
                    ...styles.sentChatBubbleWrapper,
                    ...(isMobileView ? { maxWidth: "84%" } : null),
                  }
                : {
                    ...styles.chatBubbleWrapper,
                    ...(isMobileView ? { maxWidth: "84%" } : null),
                  }
            }
          >
            {!isUserMessage && (
              <div style={{
                ...styles.messageAuthor,
                ...(isCompactPhoneView ? { fontSize: "12px" } : null),
              }}>
                {msg.author}
              </div>
            )}
            
            {msg.isReply && msg.parentAuthor && (
              <div style={styles.replyContainer}>
                <span style={styles.replyingTo}>
                  ↳ Reply to {msg.parentAuthor}
                </span>
              </div>
            )}
            
            <div
              style={
                isUserMessage
                  ? {
                      ...styles.sentChatBubble,
                      ...(isCompactPhoneView ? { padding: "10px 12px", borderRadius: "14px" } : null),
                    }
                  : {
                      ...styles.chatBubble,
                      ...(isCompactPhoneView ? { padding: "10px 12px", borderRadius: "14px" } : null),
                    }
              }
            >
              <p style={{
                ...styles.messageBody,
                ...(isCompactPhoneView ? { fontSize: "13px", lineHeight: 1.45 } : null),
              }}>
                {cleanMessageBody(sanitizeComment(msg.body || ''))}
              </p>
              
              {msg.snippet && (
                <div style={{
                  ...styles.snippetContainer,
                  ...(isCompactPhoneView ? { gap: "8px", padding: "8px 10px", marginTop: "8px" } : null),
                }}>
                  <img
                    src={msg.snippet.artwork || DEFAULT_ARTWORK}
                    alt={msg.snippet.name}
                    style={{
                      ...styles.snippetArtwork,
                      ...(isCompactPhoneView ? { width: "34px", height: "34px", borderRadius: "7px" } : null),
                    }}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_ARTWORK;
                    }}
                  />
                  <div style={styles.snippetInfo}>
                    <div style={{
                      ...styles.snippetTitle,
                      ...(isCompactPhoneView ? { fontSize: "12px" } : null),
                    }}>
                      {msg.snippet.name}
                    </div>
                    <div style={{
                      ...styles.snippetArtist,
                      ...(isCompactPhoneView ? { fontSize: "10px" } : null),
                    }}>
                      {msg.snippet.artistName}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlayInChat(msg.snippet)}
                    disabled={!msg.snippet.previewUrl}
                    title={msg.snippet.previewUrl ? "Play preview" : "Preview unavailable"}
                    style={{
                      ...styles.playButton,
                      ...(isCompactPhoneView ? { width: "28px", height: "28px", fontSize: "11px" } : null),
                      ...(msg.snippet.previewUrl ? null : styles.playButtonDisabled)
                    }}
                  >
                    {currentPlayingSnippetId === msg.snippet.id && isSnippetAudioPlaying ? "⏸" : "▶"}
                  </button>
                </div>
              )}
              
              <div style={{
                ...styles.messageTime,
                ...(isCompactPhoneView ? { fontSize: "10px", marginTop: "4px" } : null),
              }}>
                {formatTimestamp(msg.timestamp)}
              </div>
            </div>
          </div>
        </div>
      );
    });
  }, [
    currentPlayingSnippetId,
    handlePlayInChat,
    isCompactPhoneView,
    isMobileView,
    isSnippetAudioPlaying,
    messages,
  ]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <div style={styles.loadingText}>Loading chat replay...</div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.pageContainer,
      opacity: isVisible ? 1 : 0,
      transform: `scale(${isVisible ? '1' : '0.98'})`,
      maxWidth: isTabletPortraitView ? "960px" : styles.pageContainer.maxWidth,
      padding: pagePadding,
      ...(isMobileView
        ? {
            width: "100%",
            maxWidth: "100%",
            margin: 0,
            minHeight: "100dvh",
            boxSizing: "border-box",
          }
        : null),
    }}>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          .float-card { animation: float 4s ease-in-out infinite; }
          .glow-pink { box-shadow: 0 0 30px rgba(255, 105, 180, 0.2); }
          .btn-glow:hover { box-shadow: 0 0 20px rgba(255, 105, 180, 0.4); transform: translateY(-2px); }
          .typing-dot { animation: pulse 1.4s infinite; }
          .typing-dot:nth-child(2) { animation-delay: 0.2s; }
          .typing-dot:nth-child(3) { animation-delay: 0.4s; }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <audio ref={audioRef} style={{ display: "none" }} />

      {/* ── MOBILE HEADER (Design 2: Chat First) ── */}
      {isMobileView ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isCompactPhoneView ? "8px" : "10px",
          marginBottom: isCompactPhoneView ? "8px" : "10px",
          padding: isCompactPhoneView ? "8px 10px" : "10px 14px",
          background: 'rgba(255,105,180,0.06)',
          borderRadius: isCompactPhoneView ? "12px" : "14px",
          border: '1px solid rgba(255,105,180,0.15)',
        }}>
          <button
            onClick={onBack}
            style={{
              ...styles.backButton,
              width: isCompactPhoneView ? "30px" : "34px",
              height: isCompactPhoneView ? "30px" : "34px",
              fontSize: isCompactPhoneView ? "14px" : "16px",
              flexShrink: 0
            }}
          >
            ←
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              ...styles.headerTitle,
              fontSize: isCompactPhoneView ? "14px" : "16px",
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Group <span style={{ color: '#ff69b4' }}>Chat Replay</span>
            </h1>
            <p style={{
              ...styles.headerSubtitle,
              fontSize: isCompactPhoneView ? "10px" : "11px",
              margin: '1px 0 0',
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {replaySummary.participantCount} Users · Replay
            </p>
          </div>
          <div style={{
            ...styles.volumeBadge,
            padding: isCompactPhoneView ? "4px 8px" : "5px 10px",
            gap: isCompactPhoneView ? "4px" : "5px",
            flexShrink: 0,
            minWidth: 0,
          }}>
            <Volume2 size={isCompactPhoneView ? 12 : 14} color="#ff69b4" />
            <span style={{
              ...styles.volumeNumber,
              fontSize: isCompactPhoneView ? "11px" : "13px",
              whiteSpace: "nowrap",
            }}>
              {headerRoomVolume.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        /* ── DESKTOP HEADER ── */
        <div style={{
          ...styles.header,
          ...(isTabletPortraitView
            ? {
                marginBottom: "18px",
                padding: "14px 16px",
                borderRadius: "14px",
              }
            : null),
        }}>
          <div style={styles.headerLeft}>
            <button
              onClick={onBack}
              style={{
                ...styles.backButton,
                ...(isTabletPortraitView
                  ? { width: "36px", height: "36px", fontSize: "16px", borderRadius: "9px" }
                  : null),
              }}
            >
              ←
            </button>
            <div>
              <h1 style={{
                ...styles.headerTitle,
                ...(isTabletPortraitView ? { fontSize: "20px" } : null),
              }}>
                Group <span style={{ color: '#ff69b4' }}>Chat Replay</span>
              </h1>
              <p style={{
                ...styles.headerSubtitle,
                ...(isTabletPortraitView ? { fontSize: "11px" } : null),
              }}>
                {replaySummary.participantCount} Users
              </p>
            </div>
          </div>
          <div style={{
            ...styles.volumeBadge,
            ...(isTabletPortraitView ? { padding: "7px 12px", gap: "6px" } : null),
          }}>
            <Volume2 size={isTabletPortraitView ? 16 : 18} color="#ff69b4" />
            <span style={{
              ...styles.volumeNumber,
              ...(isTabletPortraitView ? { fontSize: "15px" } : null),
            }}>
              {headerRoomVolume.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* ── MOBILE: Slim Context Banner (Design 2) ── */}
      {isMobileView ? (
        <>
          {/* Collapsed banner — always visible */}
          <div
            style={{
              ...styles.contextBanner,
              ...(isCompactPhoneView
                ? {
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "12px",
                    marginBottom: "10px",
                  }
                : null),
            }}
            onClick={() => setIsPostExpanded((p) => !p)}
          >
            <img
              src={authorToAvatar(post.author)}
              alt={post.author}
              style={{
                ...styles.contextBannerThumb,
                ...(isCompactPhoneView
                  ? { width: "38px", height: "38px", borderRadius: "9px" }
                  : null),
              }}
              onError={(e) => { e.currentTarget.src = '/assets/default-avatar.png'; }}
            />
            <div style={styles.contextBannerBody}>
              <div style={{
                ...styles.contextBannerAuthor,
                ...(isCompactPhoneView ? { fontSize: "12px" } : null),
              }}>
                {post.author}
              </div>
              <div style={{
                ...styles.contextBannerText,
                ...(isCompactPhoneView ? { fontSize: "11px", marginTop: "1px" } : null),
              }}>
                {post.title}
              </div>
              <div style={styles.contextBannerMeta}>
                {rightPanelStats.genres.map((item) => (
                  <span
                    key={item.name}
                    style={{
                      ...styles.contextBannerGenrePill,
                      backgroundColor: item.color,
                      ...(isCompactPhoneView ? { fontSize: "9px", padding: "2px 6px" } : null),
                    }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
            <button
              style={{
                ...styles.contextBannerExpandBtn,
                ...(isCompactPhoneView ? { fontSize: "16px" } : null),
              }}
              aria-label={isPostExpanded ? 'Collapse post' : 'Expand post'}
            >
              {isPostExpanded ? '✕' : '⋯'}
            </button>
          </div>

          {/* Expanded panel */}
          {isPostExpanded && (
            <div style={{
              ...styles.contextBannerExpanded,
              ...(isCompactPhoneView ? { padding: "12px", borderRadius: "12px" } : null),
            }}>
              {post.selftext && (
                <p style={{
                  ...styles.postText,
                  fontSize: isCompactPhoneView ? "12px" : "13px",
                  marginBottom: "10px",
                }}>
                  {post.selftext}
                </p>
              )}
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Post"
                  style={{
                    ...styles.contextBannerExpandedImage,
                    ...(isCompactPhoneView ? { maxHeight: "170px" } : null),
                  }}
                />
              )}
              <div style={{
                ...styles.contextBannerStatsRow,
                ...(isCompactPhoneView ? { gap: "8px" } : null),
              }}>
                <div style={styles.contextBannerStatBlock}>
                  <div style={styles.contextBannerStatLabel}>
                    <Volume2 size={12} color="#ff69b4" /> Vol
                  </div>
                  <div style={styles.contextBannerStatValue}>+{rightPanelStats.volumePoints}</div>
                </div>
                <div style={styles.contextBannerStatBlock}>
                  <div style={styles.contextBannerStatLabel}>Genres</div>
                  <div style={styles.contextBannerGenreList}>
                    {rightPanelStats.genres.map((item) => (
                      <div key={item.name} style={styles.contextBannerGenreRow}>
                        <span style={{ ...styles.contextBannerGenrePill, backgroundColor: item.color }}>
                          {item.name}
                        </span>
                        <span style={styles.contextBannerGenreChange}>{item.change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ── DESKTOP: Post Card + Stats Row ── */
        <div style={{
          ...styles.postStatsRow,
          ...(isTabletPortraitView ? { gap: "12px", marginBottom: "16px" } : null),
        }}>
          <div style={{
            ...styles.postCard,
            ...(isTabletPortraitView
              ? { borderRadius: "16px", padding: "16px" }
              : null),
          }}>
            <div style={{
              ...styles.postHeader,
              ...(isTabletPortraitView ? { gap: "10px", marginBottom: "10px" } : null),
            }}>
              <img
                src={authorToAvatar(post.author)}
                alt={post.author}
                style={{
                  ...styles.postAvatar,
                  ...(isTabletPortraitView ? { width: "42px", height: "42px" } : null),
                }}
              />
              <div>
                <div style={{
                  ...styles.postAuthor,
                  ...(isTabletPortraitView ? { fontSize: "14px" } : null),
                }}>
                  {post.author}
                </div>
                <div style={{
                  ...styles.postDate,
                  ...(isTabletPortraitView ? { fontSize: "12px" } : null),
                }}>
                  {postCreatedLabel}
                </div>
              </div>
            </div>
            <p style={{
              ...styles.postTitle,
              ...(isTabletPortraitView ? { fontSize: "14px", marginBottom: "10px" } : null),
            }}>
              {post.title}
            </p>
            {post.selftext && (
              <p style={{
                ...styles.postText,
                ...(isTabletPortraitView ? { fontSize: "13px", marginBottom: "10px" } : null),
              }}>
                {post.selftext}
              </p>
            )}
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post"
                style={{
                  ...styles.postImage,
                  ...(isTabletPortraitView ? { height: "clamp(180px, 34vw, 300px)" } : null),
                }}
              />
            )}
          </div>

          <div
            style={{
              ...styles.statsCard,
              ...(isTabletPortraitView
                ? {
                    width: "146px",
                    borderRadius: "16px",
                    padding: "14px 12px",
                    gap: "12px",
                  }
                : null),
            }}
            className="float-card"
          >
            <div style={styles.volumeSection}>
              <div style={styles.volumeHeader}>
                <Volume2 size={isTabletPortraitView ? 14 : 16} color="#ff69b4" />
                <span style={{
                  ...styles.volumeLabel,
                  ...(isTabletPortraitView ? { fontSize: "13px" } : null),
                }}>
                  Vol
                </span>
                <span style={{
                  ...styles.volumeChange,
                  ...(isTabletPortraitView ? { fontSize: "14px" } : null),
                }}>
                  +{rightPanelStats.volumePoints}
                </span>
              </div>
            </div>
            <div style={{
              ...styles.genreSection,
              ...(isTabletPortraitView ? { gap: "8px" } : null),
            }}>
              {rightPanelStats.genres.map((item) => (
                <div key={item.name} style={styles.genreRow}>
                  <span
                    style={{
                      ...styles.genreTag,
                      backgroundColor: item.color,
                      ...(isTabletPortraitView ? { fontSize: "12px", padding: "4px 8px" } : null),
                    }}
                  >
                    {item.name}
                  </span>
                  <span style={{
                    ...styles.genreChange,
                    ...(isTabletPortraitView ? { fontSize: "12px" } : null),
                  }}>
                    {item.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div style={{
        ...styles.chatContainer,
        borderRadius: surfaceRadius,
        ...(isMobileView ? {
          minHeight: isCompactPhoneView ? "300px" : "340px",
          height: chatContainerHeight,
        } : (isTabletPortraitView ? {
          minHeight: "500px",
          height: "calc(100dvh - 360px)",
        } : null)),
      }}>
        {/* Chat Header with Tool Buttons */}
        <div style={{
          ...styles.chatHeader,
          ...(isMobileView
            ? { padding: isCompactPhoneView ? "8px 10px" : "10px 12px" }
            : (isTabletPortraitView ? { padding: "12px 16px" } : null)),
        }}>
          <span style={{
            ...styles.chatHeaderText,
            ...(isMobileView ? { fontSize: isCompactPhoneView ? "11px" : "12px" } : null),
          }}>
            Chat Replay
          </span>
          <div style={{
            ...styles.toolButtons,
            ...(isTouchViewport ? { width: "100%", justifyContent: "flex-end", minWidth: 0 } : null),
          }}>
            <button 
              onClick={toggleMusicPanel}
              style={{
                ...styles.toolButton,
                background: isSongSearchVisible ? 'rgba(255,105,180,0.2)' : 'transparent',
                ...(isMobileView
                  ? {
                      flex: 1,
                      justifyContent: "center",
                      minWidth: 0,
                      gap: isCompactPhoneView ? "4px" : "5px",
                      padding: isCompactPhoneView ? "6px 8px" : "7px 10px",
                      fontSize: isCompactPhoneView ? "11px" : "12px",
                    }
                  : (isTabletPortraitView ? { padding: "7px 12px", fontSize: "12px" } : null)),
              }}
              className="btn-glow"
            >
              <Music size={isMobileView ? (isCompactPhoneView ? 11 : 12) : 14} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {isCompactPhoneView ? "Song" : "Add Song"}
              </span>
            </button>
            <button 
              onClick={toggleUsersPanel}
              style={{
                ...styles.toolButton,
                background: activeSection === 'users' ? 'rgba(255,105,180,0.2)' : 'transparent',
                ...(isMobileView
                  ? {
                      flex: 1,
                      justifyContent: "center",
                      minWidth: 0,
                      gap: isCompactPhoneView ? "4px" : "5px",
                      padding: isCompactPhoneView ? "6px 8px" : "7px 10px",
                      fontSize: isCompactPhoneView ? "11px" : "12px",
                    }
                  : (isTabletPortraitView ? { padding: "7px 12px", fontSize: "12px" } : null)),
              }}
              className="btn-glow"
            >
              <Users size={isMobileView ? (isCompactPhoneView ? 11 : 12) : 14} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {isCompactPhoneView ? "Users" : `${replaySummary.participantCount} Users`}
              </span>
            </button>
          </div>
        </div>

        {/* Users Panel */}
        {activeSection === 'users' && (
          <div style={{
            ...styles.usersPanel,
            ...(isMobileView
              ? { padding: isCompactPhoneView ? "10px" : "12px" }
              : (isTabletPortraitView ? { padding: "14px 16px" } : null)),
          }}>
            <div style={{
              ...styles.usersPanelScroll,
              ...(isMobileView ? { gap: isCompactPhoneView ? "10px" : "12px", paddingBottom: "6px" } : null),
            }}>
              {onlineUsers.map((user, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.userCard,
                    ...(isCompactPhoneView ? { minWidth: "58px" } : null),
                  }}
                >
                  <div style={styles.userAvatarWrapper}>
                    <img
                      src={user.avatar}
                      alt={user.name}
                      style={{
                        ...styles.userAvatar,
                        ...(isCompactPhoneView ? { width: "42px", height: "42px" } : null),
                      }}
                    />
                    <div style={{
                      ...styles.userOnlineIndicator,
                      ...(isCompactPhoneView ? { width: "10px", height: "10px" } : null),
                      background: user.isActive ? '#00ff88' : '#555',
                    }} />
                  </div>
                  <span style={{
                    ...styles.userNameSmall,
                    ...(isCompactPhoneView ? { fontSize: "10px", maxWidth: "52px" } : null),
                  }}>
                    {user.name.split('_')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Music Search Panel */}
        {isSongSearchVisible && (
          <div style={{
            ...styles.musicPanel,
            ...(isMobileView
              ? { padding: isCompactPhoneView ? "10px" : "12px" }
              : (isTabletPortraitView ? { padding: "14px 16px" } : null)),
          }}>
            <div style={{
              ...styles.searchInputWrapper,
              ...(isMobileView ? { gap: "6px" } : null),
            }}>
              <input
                value={searchQuery}
                onChange={(e) => {
                  if (!GROUPCHAT_MUSIC_SEARCH_ENABLED) {
                    handleSongSearch();
                    return;
                  }
                  const input = e.target.value;
                  if (input.length <= 100) {
                    setSearchQuery(input);
                    if (panelNotice) {
                      setPanelNotice(null);
                    }
                  }
                }}
                placeholder={GROUPCHAT_MUSIC_SEARCH_ENABLED ? "Search Apple Music..." : "Music search disabled in replay prototype"}
                style={{
                  ...styles.searchInput,
                  ...(isMobileView
                    ? {
                        padding: isCompactPhoneView ? "10px 12px" : "11px 14px",
                        fontSize: isCompactPhoneView ? "12px" : "13px",
                      }
                    : null),
                  ...(GROUPCHAT_MUSIC_SEARCH_ENABLED ? null : styles.searchInputDisabled)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSongSearch()}
                disabled={!GROUPCHAT_MUSIC_SEARCH_ENABLED}
              />
              <button 
                onClick={handleSongSearch}
                disabled={isSearching || !GROUPCHAT_MUSIC_SEARCH_ENABLED}
                style={{
                  ...styles.searchButton,
                  ...(isMobileView
                    ? {
                        padding: isCompactPhoneView ? "10px 12px" : "11px 14px",
                        borderRadius: "10px",
                      }
                    : null),
                  ...(GROUPCHAT_MUSIC_SEARCH_ENABLED ? null : styles.searchButtonDisabled)
                }}
              >
                {isSearching ? '...' : <Search size={isCompactPhoneView ? 14 : 16} />}
              </button>
            </div>

            {panelNotice && (
              <div
                style={{
                  ...styles.notice,
                  ...(panelNotice.type === "warning" ? styles.noticeWarning : styles.noticeInfo)
                }}
              >
                {panelNotice.text}
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div style={styles.searchResults}>
                {searchResults.map((song, i) => {
                  const attrs = song.attributes || song;
                  return (
                    <div key={i} style={styles.searchResultItem}>
                      <img
                        src={getArtworkSrc(attrs.artwork?.url)}
                        alt={attrs.name}
                        style={styles.searchResultArtwork}
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_ARTWORK;
                        }}
                      />
                      <div style={styles.searchResultInfo}>
                        <div style={styles.searchResultName}>{attrs.name}</div>
                        <div style={styles.searchResultArtist}>{attrs.artistName}</div>
                      </div>
                      <button 
                        onClick={() => handleAttachSnippet(song)}
                        style={styles.addButton}
                      >
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {searchQuery.trim() && searchResults.length === 0 && !isSearching && !panelNotice && (
              <div style={{ ...styles.notice, ...styles.noticeInfo }}>
                No songs found yet. Try another search term.
              </div>
            )}
          </div>
        )}

        {/* Messages Area */}
        <div
          ref={chatRef}
          style={{
            ...styles.messagesArea,
            ...(isMobileView
              ? {
                  padding: isCompactPhoneView ? "10px" : "12px",
                  minHeight: "220px",
                }
              : (isTabletPortraitView ? { padding: "14px 16px", minHeight: "280px" } : null)),
          }}
        >
          <div style={styles.joinMessage}>— Replay started —</div>
          
          {renderMessages()}

          {!loading && messages.length === 0 && (
            <div style={styles.emptyState}>
              No chat messages yet. Start the conversation.
            </div>
          )}
          
          {/* Typing indicator */}
          {isTyping && (
            <div style={styles.typingIndicator}>
              <div style={styles.typingAvatar}>
                <img 
                  src={authorToAvatar(randomTypingUser)} 
                  alt={randomTypingUser}
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                />
              </div>
              <span>Next replay message: {randomTypingUser}</span>
              <div style={styles.typingDots}>
                <span className="typing-dot" style={styles.typingDot} />
                <span className="typing-dot" style={styles.typingDot} />
                <span className="typing-dot" style={styles.typingDot} />
              </div>
            </div>
          )}
        </div>

        {/* Attached Snippet Preview */}
        {attachedSnippet && (
          <div style={styles.attachedPreview}>
            <img
              src={attachedSnippet.artwork || DEFAULT_ARTWORK}
              alt={attachedSnippet.name}
              style={styles.attachedArtwork}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_ARTWORK;
              }}
            />
            <div style={styles.attachedInfo}>
              <div style={styles.attachedName}>{attachedSnippet.name}</div>
              <div style={styles.attachedArtist}>{attachedSnippet.artistName}</div>
            </div>
            <button onClick={() => setAttachedSnippet(null)} style={styles.removeAttachment}>
              <X size={14} />
            </button>
          </div>
        )}

        {panelNotice && !isSongSearchVisible && (
          <div
            style={{
              ...styles.notice,
              ...(panelNotice.type === "warning" ? styles.noticeWarning : styles.noticeInfo),
              margin: isMobileView ? "8px 10px 0" : (isTabletPortraitView ? "10px 16px 0" : "12px 20px 0"),
            }}
          >
            {panelNotice.text}
          </div>
        )}

        {/* Input Area */}
        <div style={{
          ...styles.inputArea,
          ...(isMobileView
            ? { gap: "8px", padding: isCompactPhoneView ? "10px" : "12px" }
            : (isTabletPortraitView ? { padding: "12px 16px", gap: "10px" } : null)),
        }}>
          <input
            value={newComment}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setNewComment(e.target.value);
                if (panelNotice) {
                  setPanelNotice(null);
                }
              }
            }}
            placeholder="Replay view only"
            style={{
              ...styles.messageInput,
              ...(isMobileView
                ? {
                    padding: isCompactPhoneView ? "10px 12px" : "11px 14px",
                    fontSize: isCompactPhoneView ? "12px" : "13px",
                  }
                : null),
            }}
            disabled
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />
          <button
            onClick={handleSubmitComment}
            disabled
            style={{
              ...styles.sendButton,
              ...(isMobileView
                ? {
                    padding: isCompactPhoneView ? "10px 12px" : "11px 14px",
                    minWidth: isCompactPhoneView ? "42px" : "48px",
                  }
                : null),
            }}
          >
            <Send size={isCompactPhoneView ? 14 : 16} />
          </button>
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          style={{
            ...styles.scrollButton,
            ...(isTouchViewport
              ? {
                  width: isCompactPhoneView ? "36px" : "40px",
                  height: isCompactPhoneView ? "36px" : "40px",
                  right: isCompactPhoneView ? "12px" : "14px",
                  bottom: isCompactPhoneView ? "72px" : "82px",
                  fontSize: isCompactPhoneView ? "15px" : "16px",
                }
              : null),
          }}
        >
          ↓
        </button>
      )}
    </div>
  );
}
