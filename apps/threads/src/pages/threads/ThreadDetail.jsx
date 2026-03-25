import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { 
  Heart, MessageCircle, Share2, Bookmark, Music, Users, BarChart3
} from 'lucide-react';
import InfoIconModal from '../InfoIconModal';
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
  generateRandomStats, 
  createExampleData, 
  formatSnippetData, 
  processScatterData 
} from './threadHelpers';

// Theme color function - news threads use same color as regular threads in detail view
const getThemeColor = (postType) => {
  if (postType === 'groupchat') return '#FF69B4';
  if (postType === 'parameter') return '#00C4B4';
  return '#1d9bf0'; // default thread color (including news)
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

export default function ThreadDetail({ postId, postData, onBack, onSelectUser }) {
  const [isVisible, setIsVisible] = useState(false);
  const { 
    post, 
    comments, 
    setComments, 
    snippetRecs, 
    setSnippetRecs, 
    uniqueUsers, 
    usedCache,
    commentsLoaded,
    snippetsLoading
  } = useThreadData(postId, postData);
 
  // If we navigated here from the Home TikTok modal, inject that snippet/comment
  const injectedOnceRef = useRef(false);
  const pendingAutoPlayIdRef = useRef(null);
  // Track the injected snippet ID for graph updates
  const injectedSnippetIdRef = useRef(null);

  // Reset injection flag when postId changes
  useEffect(() => {
    injectedOnceRef.current = false;
    pendingAutoPlayIdRef.current = null;
    injectedSnippetIdRef.current = null;
  }, [postId]);

  // FIXED: Wait for commentsLoaded before injecting from TikTok modal
  useEffect(() => {
    // Don't inject until comments are loaded from cache
    if (!commentsLoaded) {
      console.log("ThreadDetail: Waiting for comments to load before injection...");
      return;
    }
    
    const injected = postData?.__prefillFromTikTok;
    console.log("ThreadDetail: __prefillFromTikTok payload", injected);
    console.log("ThreadDetail: commentsLoaded =", commentsLoaded, "injectedOnce =", injectedOnceRef.current);
    
    if (!injected || injectedOnceRef.current) return;

    const { snippet, comment, autoPlay } = injected;
    injectedOnceRef.current = true;

    // Inject the comment
    if (comment?.id) {
      console.log("ThreadDetail: Injecting comment into comments array", comment);
      setComments(prev => {
        // Check if already exists
        if (prev.some(c => c.id === comment.id)) {
          console.log("ThreadDetail: Comment already exists, skipping");
          return prev;
        }
        console.log("ThreadDetail: Adding injected comment to array. Previous length:", prev.length);
        // Add at the beginning (after example comment will be added in stableCommentOrder)
        const newComments = [{ ...comment, __injectedFromTikTok: true }, ...prev];
        console.log("ThreadDetail: New comments length:", newComments.length);
        return newComments;
      });
    }

    // Inject the snippet
    const snipId = snippet?.commentId || snippet?.id;
    if (snipId) {
      console.log("ThreadDetail: Injecting snippet with ID:", snipId);
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
      
      console.log("ThreadDetail: Formatted snippet with artwork:", formattedSnippet);
      
      setSnippetRecs(prev => {
        if (prev.some(s => (s.commentId || s.id) === snipId)) {
          console.log("ThreadDetail: Snippet already exists, skipping");
          return prev;
        }
        console.log("ThreadDetail: Adding injected snippet. Previous length:", prev.length);
        return [formattedSnippet, ...prev];
      });
      
      if (autoPlay) {
        pendingAutoPlayIdRef.current = snipId;
      }
    }
  }, [postId, postData, setComments, setSnippetRecs, commentsLoaded]);

  // Debug logging for comments
  useEffect(() => {
    console.log("ThreadDetail: comments count changed to", comments.length);
    if (comments.length > 0) {
      console.log("ThreadDetail: First comment:", comments[0]?.id, comments[0]?.author);
      const injected = comments.find(c => c.__injectedFromTikTok);
      if (injected) {
        console.log("ThreadDetail: Found injected comment in comments array:", injected.id);
      }
    }
  }, [comments]);

  useEffect(() => {
    console.log("ThreadDetail: snippetRecs count", snippetRecs.length);
    const injectedSnippet = snippetRecs.find(s => s.__injectedFromTikTok);
    if (injectedSnippet) {
      console.log("ThreadDetail: Found injected snippet in snippetRecs:", injectedSnippet.id);
    }
  }, [snippetRecs.length]);

  // Check if this is a news thread
  const isNewsThread = post?.postType === 'news';
  
  // Get theme color based on post type
  const themeColor = post ? getThemeColor(post.postType) : '#1d9bf0';
  
  const [graphRatings, setGraphRatings] = useState([]);
  const [scatterData, setScatterData] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [isTikTokOpen, setIsTikTokOpen] = useState(false);
  const [expandedSnippetIds, setExpandedSnippetIds] = useState([]);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [activeGraphType, setActiveGraphType] = useState('vertical');
  const [postStats] = useState(() => generateRandomStats());
  const { exampleComment, exampleSnippet } = useMemo(() => createExampleData(), []);
  const postUser = useMemo(
    () => buildProfileUser(post, post?.author, post?.avatar || (post ? getAvatarSrc(post) : null)),
    [post]
  );
  
  // FIXED: Use comments directly in stableCommentOrder, include comments in dependency array
  const [stableCommentOrder, setStableCommentOrder] = useState([]);

  const getSnippetId = useCallback((snippet) => {
    return snippet?.id || snippet?.commentId;
  }, []);

  const { 
    audioRef, 
    activeSnippet, 
    playSnippet, 
    handleUserRate: baseHandleUserRate, 
    stopAudio 
  } = useAudioRating(snippetRecs, setSnippetRecs, getSnippetId);

  // Wrap handleUserRate to trigger graph update after rating
  const handleUserRate = useCallback((snippet, newRating) => {
    console.log("ThreadDetail: handleUserRate called for snippet:", snippet?.id, "rating:", newRating);
    
    // Call the base handler
    baseHandleUserRate(snippet, newRating);
    
    // Force update the snippet in snippetRecs to ensure graph picks up the change
    setSnippetRecs(prev => {
      return prev.map(s => {
        if ((s.id || s.commentId) === (snippet?.id || snippet?.commentId)) {
          const updated = {
            ...s,
            userRating: newRating,
            didRate: true,
            avgRating: Math.floor(
              ((s.avgRating || 50) * (s.totalRatings || 100) + newRating) /
                ((s.totalRatings || 100) + 1)
            ),
            totalRatings: (s.totalRatings || 100) + 1,
          };
          console.log("ThreadDetail: Updated snippet after rating:", updated);
          return updated;
        }
        return s;
      });
    });
  }, [baseHandleUserRate, setSnippetRecs]);

  useEffect(() => {
    // Scroll to top when entering thread detail
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    
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

    const isParameterThread = post?.postType === "parameter";
    let finalComments = [];

    if (comments.length > 0) {
      if (isNewsThread || isParameterThread) {
        finalComments = [...comments];
      } else {
        const hasInjectedComment = comments.some((c) => c.__injectedFromTikTok);
        if (hasInjectedComment) {
          const injectedComments = comments.filter((c) => c.__injectedFromTikTok);
          const otherComments = comments.filter((c) => !c.__injectedFromTikTok);
          finalComments = [exampleComment, ...injectedComments, ...otherComments];
        } else {
          finalComments = [exampleComment, ...comments];
        }
      }
    } else if (commentsLoaded && !isNewsThread && !isParameterThread) {
      finalComments = [exampleComment];
    } else {
      finalComments = [];
    }

    setStableCommentOrder((prev) => {
      if (sameOrderById(prev, finalComments)) return prev;
      console.log("ThreadDetail: Setting stableCommentOrder size", finalComments.length);
      return finalComments;
    });
  }, [comments, isNewsThread, post?.postType, commentsLoaded, exampleComment]);

  useEffect(() => {
    // Skip adding example snippet for news threads and parameter threads
    const isParameterThread = post?.postType === 'parameter';
    const hasInjected = snippetRecs.some(s => s?.__injectedFromTikTok);
    if (
      !isNewsThread &&
      !isParameterThread &&
      !hasInjected &&
      snippetRecs.length > 0 &&
      !snippetRecs.some(s => s.id === 'example_comment_001')
    ) {
      const snippetsWithExample = [exampleSnippet, ...snippetRecs];
      setSnippetRecs(snippetsWithExample);
    }
  }, [snippetRecs.length, exampleSnippet, isNewsThread, post?.postType]);

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
      snippet => snippet.userRating != null || snippet.avgRating != null
    );
    
    console.log("ThreadDetail: processRatingsData - found", ratedSnippets.length, "rated snippets");
    
    // Log injected snippet status
    const injectedSnippet = ratedSnippets.find(s => s.__injectedFromTikTok);
    if (injectedSnippet) {
      console.log("ThreadDetail: Injected snippet in rated snippets:", {
        id: injectedSnippet.id,
        userRating: injectedSnippet.userRating,
        avgRating: injectedSnippet.avgRating,
        didRate: injectedSnippet.didRate
      });
    }
    
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
    
    console.log("ThreadDetail: Setting graphRatings with", verticalData.length, "items");
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
      window.scrollTo({
        top: document.body.scrollHeight,
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

  const handleBack = useCallback(() => {
    if (onBack) onBack();
  }, [onBack]);

  const styles = ThreadDetailStyles;
  const graphsCount = graphRatings?.length || 0;
  const usersCount = uniqueUsers?.length || 0;

  // Get all snippets for TikTokModal (including injected ones, excluding example)
  const getTikTokSnippets = useCallback(() => {
    return snippetRecs.filter(s => s.id !== 'example_comment_001');
  }, [snippetRecs]);

  return (
    <div 
      className="thread-detail-container"
      style={{
        ...styles.container,
        opacity: isVisible ? 1 : 0,
        transform: `scale(${isVisible ? '1' : '0.98'})`,
      }}>
      
      <audio ref={audioRef} style={{ display: "none" }}>
        <source type="audio/mpeg" />
      </audio>
      
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "16px",
        backgroundColor: "#0f172a",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
      }}>
        <button 
          onClick={handleBack} 
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            border: "none",
            color: "#fff",
            marginRight: "16px",
          }}
        >
          <FiArrowLeft size={24} />
        </button>
        <h2 style={{
          margin: 0,
          fontSize: "24px",
          fontWeight: "700",
          color: themeColor,
        }}>
          {post?.postType === 'news' ? 'News' : post?.postType === 'parameter' ? 'Parameter' : post?.postType === 'groupchat' ? 'GroupChat' : 'Thread'}
        </h2>
      </div>
      
      {post ? (
        <div style={{
          padding: "24px",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          borderRadius: "16px",
          margin: "16px auto",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          position: "relative",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
          width: "calc(100% - 32px)",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
          }}>
            <div
              style={{ marginRight: "12px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <ClickableUserAvatar
                user={postUser}
                avatarSrc={postUser.avatar}
                size={48}
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
                  fontSize: "18px",
                  color: "#fff",
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
                fontSize: "14px",
                color: "#64748b",
              }}>
                {new Date(post.createdUtc * 1000).toLocaleDateString()}
              </div>
            </div>
            
            {!isNewsThread && (
              <div style={{
                position: "absolute",
                right: "24px",
                top: "24px",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: `${themeColor}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: themeColor,
              }}>
                <Music size={20} />
              </div>
            )}
          </div>
          
          <h2 style={{
            fontSize: "22px",
            fontWeight: "700",
            marginBottom: "16px",
            color: "#fff",
          }}>
            {post.title}
          </h2>
          {post.selftext && (
            <p style={{
              fontSize: "16px",
              lineHeight: 1.6,
              color: "#e2e8f0",
              marginBottom: "20px",
            }}>
              {post.selftext}
            </p>
          )}
          
          {post.imageUrl && (
            <div style={{ marginTop: '16px', marginBottom: '20px' }}>
              <img
                src={post.imageUrl}
                alt="Post visual"
                style={{
                  ...styles.postImage,
                  marginTop: '0',
                  marginBottom: '16px'
                }}
              />
              
              {post.postType === 'parameter' && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  {(postId.includes('parameter_thread_002') ? [
                    { name: 'Tyla', count: 9, color: '#CC5427' },
                    { name: 'Tate McRae', count: 15, color: '#3A9B93' },
                    { name: 'Olivia Rodrigo', count: 6, color: '#3686A3' },
                    { name: 'Sabrina Carpenter', count: 11, color: '#7BA387' }
                  ] : [
                    { name: 'Imagine Dragons', count: 7, color: '#CC5427' },
                    { name: 'Green Day', count: 12, color: '#3A9B93' },
                    { name: 'OneRepublic', count: 5, color: '#3686A3' },
                    { name: 'Maroon 5', count: 8, color: '#7BA387' }
                  ]).map((param, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      backgroundColor: param.color,
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}>
                      <span>{param.name}</span>
                      <span style={{
                        background: 'rgba(255,255,255,0.25)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}>
                        {param.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            paddingTop: "16px",
            paddingBottom: "12px",
            marginTop: "16px",
            color: `${themeColor}cc`,
            borderTop: `1px solid ${themeColor}33`,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              padding: "8px 12px",
              borderRadius: "8px",
            }}>
              <MessageCircle size={20} />
              <span>{postStats.num_comments}</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              padding: "8px 12px",
              borderRadius: "8px",
            }}>
              <Heart size={20} />
              <span>{postStats.ups}</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              padding: "8px 12px",
              borderRadius: "8px",
            }}>
              <Share2 size={20} />
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              padding: "8px 12px",
              borderRadius: "8px",
            }}>
              <Bookmark size={20} />
              <span>{postStats.bookmarks}</span>
            </div>
          </div>
          
          {!isNewsThread && (
            <div
              style={{
                marginTop: "22px",
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  gap: "8px",
                  padding: "8px",
                  borderRadius: "999px",
                  background: "rgba(15, 23, 42, 0.55)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
                  backdropFilter: "blur(10px)",
                }}
              >
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
                        ? `linear-gradient(180deg, ${themeColor}33, ${themeColor}14)`
                        : "transparent",
                    color: activeSection === "graphs" ? "#fff" : "#94a3b8",
                    borderRadius: "999px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.2px",
                    boxShadow:
                      activeSection === "graphs"
                        ? `0 0 0 1px ${themeColor}66, 0 10px 22px rgba(0,0,0,0.25)`
                        : "none",
                    transform: activeSection === "graphs" ? "translateY(-1px)" : "none",
                    transition: "all 0.18s ease",
                    outline: "none",
                  }}
                >
                  <BarChart3 size={18} color={activeSection === "graphs" ? themeColor : "#64748b"} />
                  <span style={{ fontSize: "15px" }}>Graphs</span>

                  <span
                    style={{
                      minWidth: "28px",
                      height: "22px",
                      padding: "0 8px",
                      borderRadius: "999px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 800,
                      background: activeSection === "graphs" ? `${themeColor}33` : "rgba(255,255,255,0.06)",
                      color: activeSection === "graphs" ? "#fff" : "#cbd5e1",
                      border: activeSection === "graphs" ? `1px solid ${themeColor}66` : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {graphsCount}
                  </span>

                  <span style={{ display: "inline-flex", opacity: activeSection === "graphs" ? 1 : 0.75 }}>
                    <InfoIconModal
                      title="Graphs"
                      iconSize={14}
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
                </div>

                {post?.postType === "groupchat" && (
                  <button
                    type="button"
                    onClick={() => handleTabClick("users")}
                    style={{
                      flex: 1,
                      border: "none",
                      cursor: "pointer",
                      background:
                        activeSection === "users"
                          ? `linear-gradient(180deg, ${themeColor}33, ${themeColor}14)`
                          : "transparent",
                      color: activeSection === "users" ? "#fff" : "#94a3b8",
                      borderRadius: "999px",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.2px",
                      boxShadow:
                        activeSection === "users"
                          ? `0 0 0 1px ${themeColor}66, 0 10px 22px rgba(0,0,0,0.25)`
                          : "none",
                      transform: activeSection === "users" ? "translateY(-1px)" : "none",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <Users size={18} color={activeSection === "users" ? themeColor : "#64748b"} />
                    <span style={{ fontSize: "15px" }}>Users</span>

                    <span
                      style={{
                        minWidth: "28px",
                        height: "22px",
                        padding: "0 8px",
                        borderRadius: "999px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 800,
                        background: activeSection === "users" ? `${themeColor}33` : "rgba(255,255,255,0.06)",
                        color: activeSection === "users" ? "#fff" : "#cbd5e1",
                        border: activeSection === "users" ? `1px solid ${themeColor}66` : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {usersCount}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
          
          <div style={{
            width: "calc(100% - 32px)",
            margin: "16px auto",
          }}>
            
          </div>
          
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
                <GraphSection 
                  graphRatings={graphRatings}
                  scatterData={scatterData}
                  openVerticalGraphModal={openVerticalGraphModal}
                  openScatterGraphModal={openScatterGraphModal}
                />
              )}
              
              {post?.postType === "groupchat" && activeSection === "users" && (
                <div style={{
                  ...styles.usersContainer,
                  width: "calc(100% - 32px)",
                  margin: "16px auto",
                }}>
                  {uniqueUsers.map((user) => (
                    <div 
                      key={user.name} 
                      style={styles.userMinimal}
                    >
                      <ClickableUserAvatar
                        user={buildProfileUser(user, user.name, user.avatar)}
                        avatarSrc={user.avatar}
                        size={56}
                        onUserClick={handleSelectUser}
                      />
                      <button
                        type="button"
                        onClick={() => handleSelectUser(buildProfileUser(user, user.name, user.avatar))}
                        style={{
                          ...styles.userName,
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        {user.name}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
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
      {!isNewsThread && (
        <div style={{
          width: "calc(100% - 32px)",
          margin: "8px auto 24px",
        }}>
          <ThreadCommentComposer
            onSubmit={handleSubmitComment}
            onOpenTikTokModal={openTikTokView}
          />
        </div>
      )}
      
      {post?.postType !== "groupchat" && (
        <div style={{
          ...styles.commentsSection,
          width: "calc(100% - 32px)",
          margin: "0 auto",
        }}>
          <h3 style={styles.commentsHeader}>
            Responses ({stableCommentOrder.length || comments.length})
          </h3>
          
          <div style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}>
            {(stableCommentOrder.length > 0 ? stableCommentOrder : ((isNewsThread || post?.postType === 'parameter') ? comments : [exampleComment, ...comments])).map((c, index) => {
              let snippetObj = null;
              
              // Debug logging for injected comments
              if (c.__injectedFromTikTok) {
                console.log(`ThreadDetail: Rendering injected comment ${c.id}:`, c);
              }
              
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
                  console.log(`ThreadDetail: Found attached snippet for comment ${c.id}:`, snippetObj);
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
                
                // Special handling for example comment
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
              
              const commentKey = c.id || `comment-${c.author}-${c.createdUtc || Date.now()}`;
              
              return (
                <ThreadCommentCard
                  key={commentKey}
                  comment={c}
                  snippet={isNewsThread ? null : snippetObj}
                  isPlaying={isThisSnippetPlaying}
                  activeSnippet={isNewsThread ? null : activeSnippet}
                  onPlayPause={isNewsThread ? null : () => playSnippetInComment(snippetObj)}
                  onRate={isNewsThread ? null : handleUserRate}
                  onRatingPause={isNewsThread ? null : handleRatingPause}
                  onUserClick={handleSelectUser}
                  isFirstSnippet={!isNewsThread && index === 0 && snippetObj && c.id === 'example_comment_001'}
                  isNewsThread={isNewsThread}
                  snippetsLoading={!isNewsThread && !usedCache && snippetsLoading}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {!isNewsThread && isTikTokOpen && (
        <TikTokModal
          snippets={getTikTokSnippets()}
          comments={comments.filter(c => c.id !== 'example_comment_001')}
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
