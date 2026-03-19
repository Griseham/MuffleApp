// src/pages/GroupChatDetail.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Music, Search, Plus, Users, Send, MessageCircle, Heart, Share2, Bookmark, Volume2, Play, X } from "lucide-react";
import styles from "./GroupChatDetailStyles";
import { validateAndSanitizeInput, checkRateLimit, sanitizeComment, sanitizeSearchQuery } from "../../utils/security";
import { buildApiUrl, toApiOriginUrl } from "../../utils/api";

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

function formatArtworkUrl(url, size = 100) {
  if (!url || typeof url !== "string") return "";
  return normalizeMediaUrl(
    url
      .replace("{w}", String(size))
      .replace("{h}", String(size))
      .replace("{f}", "jpg")
  );
}

const PLACEHOLDER_NAMES = [
  "Echo",
  "Nova",
  "Atlas",
  "Sage",
  "Lyric",
  "Drift",
  "Rift",
  "Pulse",
  "Raven",
  "Indigo",
  "Juno",
  "Zen",
  "Vega",
  "Sol",
  "Moss",
  "Piper",
  "Slate",
  "Cove",
  "Rune",
  "Quill",
  "Ash",
  "Vale",
  "Mira",
  "Halo",
  "Haze",
  "Fable",
  "Lumen",
  "Orion",
  "Onyx",
  "Blaze",
];

// Helper function to format timestamps
function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
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

// Generate random volume for the room
function generateRoomVolume() {
  return Math.floor(Math.random() * 5000) + 500;
}

// Generate genre stats
function generateGenreStats() {
  const genres = ['Electronic', 'Pop', 'Rock', 'Hip-Hop', 'Trap', 'R&B', 'Indie', 'Metal'];
  const shuffled = genres.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  
  return selected.map((genre, i) => ({
    name: genre,
    change: `+${(Math.random() * 2 + 0.1).toFixed(1)}%`,
    color: ['#00d4aa', '#ff6b9d', '#a855f7', '#f59e0b', '#3b82f6'][i % 5]
  }));
}

export default function GroupChatDetail({ post, onBack, onUserListUpdate }) {
  // Core state
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [newComment, setNewComment] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [isSongSearchVisible, setIsSongSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedSnippet, setSearchedSnippet] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [attachedSnippet, setAttachedSnippet] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [randomTypingUser, setRandomTypingUser] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(() => 23 + Math.floor(Math.random() * 21));
  const [isVisible, setIsVisible] = useState(false);
  
  // Room stats
  const [roomVolume] = useState(() => post?.roomVolume ?? generateRoomVolume());
  const [genreStats] = useState(() => post?.genreStats ?? generateGenreStats());
  const [volumeChange] = useState(() => post?.volumeChange ?? (Math.floor(Math.random() * 30) + 5));

  // Audio playback state
  const audioRef = useRef(null);
  const [isSnippetAudioPlaying, setIsSnippetAudioPlaying] = useState(false);
  const [currentPlayingSnippetId, setCurrentPlayingSnippetId] = useState(null);

  // Refs
  const chatRef = useRef(null);
  const messageIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setOnlineCount(23 + Math.floor(Math.random() * 21));

    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const roll = Math.random();
        const delta = roll < 0.55 ? 0 : roll < 0.9 ? 1 : 2;
        const next = prev + delta;
        return Math.min(next, 120);
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [post?.id]);

  // Auto-scroll function
  const scrollToBottom = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Load messages from API - simplified
  useEffect(() => {
    if (!post?.id) return;

    async function loadMessages() {
      try {
        setLoading(true);

        const formatArtwork = (url) => {
          if (!url || typeof url !== "string") return "/assets/default-artist.png";
          return formatArtworkUrl(url, 100);
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
        } catch (e) {
          console.warn("Failed to load cached post for groupchat:", e?.message || e);
        }

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
          } catch (e) {
            console.log("No snippets found:", e.message);
          }
        }

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
              id: `msg_${comment.id}_${Date.now()}`,
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
              id: `msg_${reply.id}_${Date.now()}`,
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
        
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
        setAllMessages([]);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();

    return () => {
      clearInterval(messageIntervalRef.current);
      clearTimeout(typingTimeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [post?.id]);

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

  // Update unique users when messages change
  useEffect(() => {
    const userSet = new Set();
    messages.forEach(msg => {
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
  }, [messages]);

  const placeholderSeed = useMemo(
    () => hashStringToNumber(String(post?.id ?? "room")),
    [post?.id]
  );

  const buildOnlineUsers = useCallback((targetCount, knownUsers, seed) => {
    const users = [];
    const seen = new Set();

    knownUsers.forEach((user) => {
      if (!seen.has(user.name)) {
        users.push(user);
        seen.add(user.name);
      }
    });

    const base = seed % PLACEHOLDER_NAMES.length;
    let i = 0;
    while (users.length < targetCount) {
      const nameBase = PLACEHOLDER_NAMES[(base + i) % PLACEHOLDER_NAMES.length];
      const suffix = Math.floor((base + i) / PLACEHOLDER_NAMES.length) + 1;
      const name = `${nameBase}_${suffix}`;

      if (!seen.has(name)) {
        users.push({
          name,
          avatar: authorToAvatar(name),
          isActive: ((seed + i * 7) % 10) < 9,
        });
        seen.add(name);
      }

      i += 1;
      if (i > targetCount * 3) {
        break;
      }
    }

    return users.slice(0, targetCount);
  }, []);

  useEffect(() => {
    setOnlineUsers(buildOnlineUsers(onlineCount, uniqueUsers, placeholderSeed));
  }, [onlineCount, uniqueUsers, placeholderSeed, buildOnlineUsers]);

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
    if (!newComment.trim() && !attachedSnippet) return;
    
    const userId = "user_local";
    if (!checkRateLimit(`comment_${userId}`, 5, 60000)) {
      alert("You're sending messages too quickly. Please wait a moment.");
      return;
    }
    
    const validation = validateAndSanitizeInput(newComment, {
      type: 'comment',
      maxLength: 500,
      minLength: 1
    });
    
    if (!validation.isValid && newComment.trim()) {
      alert(`Invalid message: ${validation.error}`);
      return;
    }
    
    const newMessage = {
      id: `user_${Date.now()}`,
      author: "You",
      body: validation.sanitized || '',
      snippet: attachedSnippet,
      timestamp: Date.now() / 1000,
      isReply: false
    };
    
    setMessages(prev => [...prev, newMessage]);
    setNewComment("");
    setAttachedSnippet(null);
    setSearchedSnippet(null);
    setIsSongSearchVisible(false);
    
    setTimeout(() => scrollToBottom(), 100);
  }, [newComment, attachedSnippet, scrollToBottom]);

  // Handle audio playback
  const handlePlayInChat = useCallback((snippet) => {
    if (!snippet?.previewUrl) return;
    
    if (currentPlayingSnippetId === snippet.id && isSnippetAudioPlaying) {
      audioRef.current?.pause();
      setIsSnippetAudioPlaying(false);
      return;
    }
    
    setCurrentPlayingSnippetId(snippet.id);
    setIsSnippetAudioPlaying(true);
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    audioRef.current.pause();
    audioRef.current.src = normalizeMediaUrl(snippet.previewUrl);
    audioRef.current.play().catch(err => {
      console.error("Error playing audio:", err);
      setIsSnippetAudioPlaying(false);
    });
    
    audioRef.current.onended = () => {
      setIsSnippetAudioPlaying(false);
      setCurrentPlayingSnippetId(null);
    };
  }, [currentPlayingSnippetId, isSnippetAudioPlaying]);

  // Handle song search with security validation
  const handleSongSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    const userId = "user_local";
    if (!checkRateLimit(`search_${userId}`, 10, 60000)) {
      alert("You're searching too frequently. Please wait a moment.");
      return;
    }
    
    const validation = validateAndSanitizeInput(searchQuery, {
      type: 'search',
      maxLength: 100,
      minLength: 1
    });
    
    if (!validation.isValid) {
      alert(`Invalid search query: ${validation.error}`);
      return;
    }
    
    const sanitizedQuery = sanitizeSearchQuery(validation.sanitized);
    if (!sanitizedQuery) {
      alert("Please enter a valid search term.");
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`${buildApiUrl("/apple-music-search")}?query=${encodeURIComponent(sanitizedQuery)}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const items = Array.isArray(data.data) ? data.data : [data.data];
        setSearchedSnippet(items[0] || null);
        setSearchResults(items.slice(0, 5));
      }
    } catch (error) {
      console.error("Error searching for song:", error);
      alert("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Handle attaching snippet
  const handleAttachSnippet = useCallback((snippet) => {
    const attrs = snippet.attributes || snippet;
    setAttachedSnippet({
      id: snippet.id || `snippet_${Date.now()}`,
      name: attrs.name,
      artistName: attrs.artistName,
      artwork: formatArtworkUrl(attrs.artwork?.url) || "/assets/default-artist.png",
      previewUrl: normalizeMediaUrl(attrs.previews?.[0]?.url || null)
    });
    setIsSongSearchVisible(false);
  }, []);

  // Toggle panels
  const toggleMusicPanel = useCallback(() => {
    setIsSongSearchVisible(prev => !prev);
    setActiveSection(null);
  }, []);

  const toggleUsersPanel = useCallback(() => {
    setActiveSection(prev => prev === 'users' ? null : 'users');
    setIsSongSearchVisible(false);
  }, []);

  // Render messages
  const renderMessages = useCallback(() => {
    return messages.map((msg) => {
      const isUserMessage = msg.author === "You";
      
      return (
        <div
          key={msg.id}
          style={isUserMessage ? styles.sentMessageContainer : styles.messageContainer}
        >
          {!isUserMessage && (
            <div style={styles.avatarColumn}>
              <img 
                src={authorToAvatar(msg.author)} 
                style={styles.avatar} 
                alt={msg.author} 
              />
              <div style={styles.onlineIndicator}></div>
            </div>
          )}
          
          <div style={isUserMessage ? styles.sentChatBubbleWrapper : styles.chatBubbleWrapper}>
            {!isUserMessage && (
              <div style={styles.messageAuthor}>
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
            
            <div style={isUserMessage ? styles.sentChatBubble : styles.chatBubble}>
              <p style={styles.messageBody}>{cleanMessageBody(sanitizeComment(msg.body || ''))}</p>
              
              {msg.snippet && (
                <div style={styles.snippetContainer}>
                  <img
                    src={msg.snippet.artwork}
                    alt={msg.snippet.name}
                    style={styles.snippetArtwork}
                  />
                  <div style={styles.snippetInfo}>
                    <div style={styles.snippetTitle}>
                      {msg.snippet.name}
                    </div>
                    <div style={styles.snippetArtist}>
                      {msg.snippet.artistName}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlayInChat(msg.snippet)}
                    style={styles.playButton}
                  >
                    {currentPlayingSnippetId === msg.snippet.id && isSnippetAudioPlaying ? "⏸" : "▶"}
                  </button>
                </div>
              )}
              
              <div style={styles.messageTime}>
                {formatTimestamp(msg.timestamp)}
              </div>
            </div>
          </div>
        </div>
      );
    });
  }, [messages, currentPlayingSnippetId, isSnippetAudioPlaying, handlePlayInChat]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <div style={styles.loadingText}>Loading group chat...</div>
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

      {/* Header with Volume Badge */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={onBack} style={styles.backButton}>←</button>
          <div>
            <h1 style={styles.headerTitle}>
              Group <span style={{ color: '#ff69b4' }}>Chat</span>
            </h1>
            <p style={styles.headerSubtitle}>{onlineCount} participants</p>
          </div>
        </div>
        
        {/* Volume Badge */}
        <div style={styles.volumeBadge}>
          <Volume2 size={18} color="#ff69b4" />
          <span style={styles.volumeNumber}>{roomVolume.toLocaleString()}</span>
        </div>
      </div>

      {/* Post Card + Stats Row */}
      <div style={styles.postStatsRow}>
        {/* Post Card */}
        <div style={styles.postCard}>
          <div style={styles.postHeader}>
            <img
              src={authorToAvatar(post.author)}
              alt={post.author}
              style={styles.postAvatar}
            />
            <div>
              <div style={styles.postAuthor}>{post.author}</div>
              <div style={styles.postDate}>
                {new Date(post.createdUtc * 1000).toLocaleString()}
              </div>
            </div>
          </div>
          <p style={styles.postTitle}>{post.title}</p>
          {post.selftext && (
            <p style={styles.postText}>{post.selftext}</p>
          )}
          {post.imageUrl && (
            <img src={post.imageUrl} alt="Post" style={styles.postImage} />
          )}
        </div>

        {/* Volume & Genre Stats Card */}
        <div style={styles.statsCard} className="float-card">
          {/* Volume Section */}
          <div style={styles.volumeSection}>
            <div style={styles.volumeHeader}>
              <Volume2 size={16} color="#ff69b4" />
              <span style={styles.volumeLabel}>Vol</span>
              <span style={styles.volumeChange}>+{volumeChange}</span>
            </div>
          </div>

          {/* Genre Stats */}
          <div style={styles.genreSection}>
            {genreStats.map((genre, i) => (
              <div key={i} style={styles.genreRow}>
                <span style={{
                  ...styles.genreTag,
                  backgroundColor: genre.color,
                }}>
                  {genre.name}
                </span>
                <span style={styles.genreChange}>{genre.change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div style={styles.chatContainer}>
        {/* Chat Header with Tool Buttons */}
        <div style={styles.chatHeader}>
          <span style={styles.chatHeaderText}>Live Chat</span>
          <div style={styles.toolButtons}>
            <button 
              onClick={toggleMusicPanel}
              style={{
                ...styles.toolButton,
                background: isSongSearchVisible ? 'rgba(255,105,180,0.2)' : 'transparent',
              }}
              className="btn-glow"
            >
              <Music size={14} />
              <span>Add Song</span>
            </button>
            <button 
              onClick={toggleUsersPanel}
              style={{
                ...styles.toolButton,
                background: activeSection === 'users' ? 'rgba(255,105,180,0.2)' : 'transparent',
              }}
              className="btn-glow"
            >
              <Users size={14} />
              <span>{onlineCount} Online</span>
            </button>
          </div>
        </div>

        {/* Users Panel */}
        {activeSection === 'users' && (
          <div style={styles.usersPanel}>
            <div style={styles.usersPanelScroll}>
              {onlineUsers.map((user, i) => (
                <div key={i} style={styles.userCard}>
                  <div style={styles.userAvatarWrapper}>
                    <img src={user.avatar} alt={user.name} style={styles.userAvatar} />
                    <div style={{
                      ...styles.userOnlineIndicator,
                      background: user.isActive ? '#00ff88' : '#555',
                    }} />
                  </div>
                  <span style={styles.userNameSmall}>{user.name.split('_')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Music Search Panel */}
        {isSongSearchVisible && (
          <div style={styles.musicPanel}>
            <div style={styles.searchInputWrapper}>
              <input
                value={searchQuery}
                onChange={(e) => {
                  const input = e.target.value;
                  if (input.length <= 100) {
                    setSearchQuery(input);
                  }
                }}
                placeholder="Search Apple Music..."
                style={styles.searchInput}
                onKeyDown={(e) => e.key === 'Enter' && handleSongSearch()}
              />
              <button 
                onClick={handleSongSearch}
                disabled={isSearching}
                style={styles.searchButton}
              >
                {isSearching ? '...' : <Search size={16} />}
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div style={styles.searchResults}>
                {searchResults.map((song, i) => {
                  const attrs = song.attributes || song;
                  return (
                    <div key={i} style={styles.searchResultItem}>
                      <div style={styles.searchResultArtwork}>
                        <Play size={16} color="#fff" />
                      </div>
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
          </div>
        )}

        {/* Messages Area */}
        <div ref={chatRef} style={styles.messagesArea}>
          <div style={styles.joinMessage}>— You joined the chat —</div>
          
          {renderMessages()}
          
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
              <span>{randomTypingUser} is typing</span>
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
            <img src={attachedSnippet.artwork} alt={attachedSnippet.name} style={styles.attachedArtwork} />
            <div style={styles.attachedInfo}>
              <div style={styles.attachedName}>{attachedSnippet.name}</div>
              <div style={styles.attachedArtist}>{attachedSnippet.artistName}</div>
            </div>
            <button onClick={() => setAttachedSnippet(null)} style={styles.removeAttachment}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div style={styles.inputArea}>
          <input
            value={newComment}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setNewComment(e.target.value);
              }
            }}
            placeholder="Type a message..."
            style={styles.messageInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() && !attachedSnippet}
            style={styles.sendButton}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button onClick={scrollToBottom} style={styles.scrollButton}>
          ↓
        </button>
      )}
    </div>
  );
}
