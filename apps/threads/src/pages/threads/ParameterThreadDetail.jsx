// src/pages/threads/ParameterThreadDetail.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, 
  Tooltip, Cell, ResponsiveContainer, ZAxis 
} from 'recharts'; 
import { 
  ArrowLeft, Heart, MessageCircle, Share2, Bookmark, 
  Play, Pause, BarChart3, GitBranch, Users, Music
} from 'lucide-react';
import InfoIconModal from '../InfoIconModal';

// Import components
import GraphModal from "../modals/GraphModal";
import TikTokModal from "../modals/TikTokModal";
import ThreadCommentCard from './ThreadCommentCard';
import ThreadCommentComposer from './ThreadCommentComposer';

// Import utilities and styles
import { authorToAvatar, getAvatarSrc } from "../utils/utils";
import { FiArrowLeft } from "react-icons/fi";
import ThreadDetailStyles from "./ThreadDetailStyles";
import './../../styles/threadDetailStyles.css';

// Parameter-specific color scheme
const PARAMETER_COLORS = {
  'Imagine Dragons': '#FF6B35',
  'Green Day': '#4ECDC4', 
  'OneRepublic': '#45B7D1',
  'Maroon 5': '#96CEB4'
};

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
    imageUrl: '/assets/parameter-placeholder.png'
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
        artwork: '/threads/assets/image23.png',
        previewUrl: '/backend/public/HeartShapedBox.mp3',
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
        artwork: '/threads/assets/image24.png',
        previewUrl: '/backend/public/HeartShapedBox.mp3',
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
        artwork: '/threads/assets/image25.png',
        previewUrl: '/backend/public/HeartShapedBox.mp3',
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
        artwork: '/threads/assets/image26.png',
        previewUrl: '/backend/public/HeartShapedBox.mp3',
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
        artwork: '/threads/assets/image27.png',
        previewUrl: '/backend/public/HeartShapedBox.mp3',
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
        artwork: '/threads/assets/image28.png',
        previewUrl: '/backend/public/HeartShapedBox.mp3',
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
        artwork: '/threads/assets/image29.png',
        previewUrl: '/backend/public/HeartShapedBox.mp3',
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
        artwork: '/threads/assets/image30.png',
        previewUrl: '/backend/public/HeartShapedBox.mp3',
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
        artwork: '/threads/assets/image31.png',
        previewUrl: '/backend/public/HeartShapedBox.mp3',
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
        artwork: '/threads/assets/image32.png',
        previewUrl: '/backend/public/HeartShapedBox.mp3',
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
      userRating: 85,
      avgRating: 78,
      totalRatings: 342,
      didRate: true
    },
    {
      commentId: 'param_comment_002',
      id: 'param_comment_002',
      parameter: 'Green Day',
      userRating: 92,
      avgRating: 88,
      totalRatings: 456,
      didRate: true
    },
    {
      commentId: 'param_comment_003',
      id: 'param_comment_003',
      parameter: 'OneRepublic',
      userRating: 78,
      avgRating: 82,
      totalRatings: 298,
      didRate: true
    },
    {
      commentId: 'param_comment_004',
      id: 'param_comment_004',
      parameter: 'Maroon 5',
      userRating: 88,
      avgRating: 85,
      totalRatings: 378,
      didRate: true
    }
  ]
};

export default function ParameterThreadDetail({ postId, onBack, onSelectUser }) {
  // Transition state
  const [isVisible, setIsVisible] = useState(false);
  
  // Data states
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [snippetRecs, setSnippetRecs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI states
  const [graphRatings, setGraphRatings] = useState([]);
  const [parameterScatterData, setParameterScatterData] = useState([]);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [activeGraphType, setActiveGraphType] = useState('vertical');
  const [isTikTokOpen, setIsTikTokOpen] = useState(false);
  
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
      
      // Use mock data for parameter thread
      if (postId === 'parameter_thread_001') {
        setPost(parameterThreadMockData.post);
        setComments(parameterThreadMockData.comments);
        setSnippetRecs(parameterThreadMockData.snippetRecs);
        setIsLoading(false);
        return;
      }
      
      // For other parameter threads, try to load from API (future implementation)
      try {
        const cacheResp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cached-posts/${postId}`);
        
        if (cacheResp.ok) {
          const { data: cachedData } = await cacheResp.json();
          
          if (cachedData && cachedData.postType === 'parameter') {
            setPost(cachedData);
            setComments(cachedData.comments || []);
            setSnippetRecs(cachedData.snippetRecs || []);
            setIsLoading(false);
            return;
          }
        }
        
        console.log("Parameter thread not found in cache");
        setIsLoading(false);
        
      } catch (error) {
        console.error("Error loading parameter thread:", error);
        setIsLoading(false);
      }
    }
    
    if (postId) {
      loadParameterThread();
    }
  }, [postId]);

  // Process parameter-specific graph data
  useEffect(() => {
    if (snippetRecs.length === 0 || !post?.parameters) return;
    
    // Process vertical ratings data
    const ratedSnippets = snippetRecs.filter(
      snippet => snippet.userRating != null || snippet.avgRating != null
    );
    
    if (ratedSnippets.length > 0) {
      const verticalData = ratedSnippets.map(snippet => {
        const snippetId = snippet.id || snippet.commentId;
        const relatedComment = comments.find(c => c.id === snippetId);
        const commentAuthor = relatedComment?.author || "Unknown";
        
        return {
          snippetId,
          userRating: snippet.userRating ?? 0,
          avgRating: snippet.avgRating ?? 0,
          userAvatar: authorToAvatar(commentAuthor),
          parameter: snippet.parameter || relatedComment?.parameter
        };
      });
      
      setGraphRatings(verticalData);
    }
    
    // Process parameter scatter data - group users by artist/parameter
    const userParameterMap = new Map();
    
    comments.forEach(comment => {
      if (comment.parameter && comment.author) {
        if (!userParameterMap.has(comment.author)) {
          userParameterMap.set(comment.author, {
            username: comment.author,
            parameter: comment.parameter,
            ratings: [],
            totalRatings: 0,
            avgRating: 0
          });
        }
        
        // Find snippet for this comment
        const snippet = snippetRecs.find(s => s.commentId === comment.id);
        if (snippet && snippet.userRating) {
          const userData = userParameterMap.get(comment.author);
          userData.ratings.push(snippet.userRating);
          userData.totalRatings = userData.ratings.length;
          userData.avgRating = userData.ratings.reduce((sum, rating) => sum + rating, 0) / userData.ratings.length;
        }
      }
    });
    
    // Convert to scatter data with colors
    const scatterData = Array.from(userParameterMap.values())
      .filter(user => user.totalRatings > 0)
      .map(user => ({
        username: user.username,
        ratingCount: user.totalRatings * 10 + Math.floor(Math.random() * 50), // Simulate more ratings
        average: user.avgRating,
        parameter: user.parameter,
        color: PARAMETER_COLORS[user.parameter] || '#64748b'
      }));
    
    setParameterScatterData(scatterData);
  }, [snippetRecs, comments, post]);

  // Count songs per parameter
  const getParameterCounts = useCallback(() => {
    if (!post?.parameters) return {};
    
    const counts = {};
    post.parameters.forEach(param => {
      counts[param] = comments.filter(comment => comment.parameter === param && comment.snippet).length;
    });
    return counts;
  }, [post, comments]);

  // Audio and rating handlers
  const getSnippetId = useCallback((snippet) => {
    return snippet?.id || snippet?.commentId;
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
  
    const randomAvg = ratingVal + ((Math.random() - 0.5) * 20);
    const clampedAvg = Math.max(0, Math.min(100, randomAvg));
    
    setSnippetRecs(prev => {
      return prev.map(s => {
        const sId = getSnippetId(s);
        if (sId === realId) {
          return {
            ...s,
            userRating: ratingVal,
            avgRating: clampedAvg,
            totalRatings: 200 + Math.floor(Math.random() * 300),
            didRate: true
          };
        }
        return s;
      });
    });
    
    setActiveSnippet(prev => ({
      ...prev,
      userRating: ratingVal,
      didRate: true
    }));
  }, [getSnippetId]);

  const handleRatingPause = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  const handleSubmitComment = useCallback((newComment) => {
    if (!newComment) return;
    setComments(prevComments => [...prevComments, newComment]);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  // Modal handlers
  const openVerticalGraphModal = useCallback(() => {
    setActiveGraphType('vertical');
    setIsGraphModalOpen(true);
  }, []);

  const openScatterGraphModal = useCallback(() => {
    setActiveGraphType('parameter-scatter');
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

  const styles = ThreadDetailStyles;
  const parameterCounts = getParameterCounts();

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
      
      {/* Header */}
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
          onClick={onBack} 
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
          color: "#22c55e",
        }}>
          Parameter Thread
        </h2>
      </div>
      
      {/* Main Post */}
      {post ? (
        <div style={{
          padding: "24px",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          borderRadius: "16px",
          margin: "16px auto",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          position: "relative",
          boxShadow: "0 8px 32px rgba(34, 197, 94, 0.2)",
          width: "calc(100% - 32px)",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}>
          {/* User info */}
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
          }}>
            <img
              src={getAvatarSrc(post)}
              alt="User avatar"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                objectFit: "cover",
                marginRight: "12px",
                border: "2px solid rgba(34, 197, 94, 0.3)",
              }}
            />
            <div style={{
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{
                fontWeight: "700",
                fontSize: "18px",
                color: "#fff",
              }}>{post.author}</div>
              <div style={{
                fontSize: "14px",
                color: "#64748b",
              }}>
                {new Date(post.createdUtc * 1000).toLocaleDateString()}
              </div>
              </div>
            
            {/* Parameter thread icon */}
            <div style={{
              position: "absolute",
              right: "24px",
              top: "24px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#22c55e",
            }}>
              <BarChart3 size={20} />
            </div>
          </div>
          
          {/* Post title and content */}
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
          
          {/* Parameter count display */}
          {post.parameters && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "rgba(34, 197, 94, 0.05)",
              borderRadius: "12px",
              border: "1px solid rgba(34, 197, 94, 0.2)",
            }}>
              {post.parameters.map(param => (
                <div key={param} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: "rgba(34, 197, 94, 0.15)",
                  borderRadius: "20px",
                  border: `2px solid ${PARAMETER_COLORS[param] || '#22c55e'}`,
                }}>
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: PARAMETER_COLORS[param] || '#22c55e',
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
              ))}
            </div>
          )}
          
          {/* Post image placeholder */}
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post visual"
              style={styles.postImage}
            />
          )}
          
         {/* Stats row */}
         <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            paddingTop: "16px",
            paddingBottom: "12px",
            marginTop: "16px",
            color: "#22c55e",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
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
              <span>{post.num_comments}</span>
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
              <span>{post.ups}</span>
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
            </div>
          </div>
          
          {/* Only Graphs Tab for Parameter Threads */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            marginTop: "24px",
            width: "100%",
          }}>
            <div style={{
              padding: "16px 0",
              width: "100%",
              textAlign: "center",
              color: "#22c55e",
              fontWeight: "600",
              borderBottom: "3px solid #22c55e",
              backgroundColor: "rgba(34, 197, 94, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}>
              <h4 style={{ margin: 0, fontSize: "15px" }}>Parameter Analysis</h4>
              <InfoIconModal
                title="Parameter Analysis"
                iconSize={14}
                showButtonText={false}
                steps={[
                  {
                    icon: <BarChart3 size={18} color="#a9b6fc" />,
                    title: "Compare Parameters",
                    content: "View ratings and engagement data across all 4 artists in this parameter thread"
                  },
                  {
                    icon: <Users size={18} color="#a9b6fc" />,
                    title: "Artist Distribution", 
                    content: "See which users recommended songs from which artists and how they performed"
                  }
                ]}
              />
            </div>
          </div>
          
          {/* Parameter Graphs */}
          <div style={{
            width: "calc(100% - 32px)",
            margin: "16px auto",
            backgroundImage: 'radial-gradient(circle at top right, rgba(34, 197, 94, 0.1), transparent 70%)',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
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
              height: '220px', 
              marginBottom: '40px',
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              cursor: 'pointer',
            }}
            onClick={openVerticalGraphModal}
            title="Click to enlarge">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={graphRatings}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  barGap={5}
                  barCategoryGap="20%"
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
                    cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                    content={(props) => {
                      const { active, payload, label } = props;
                      if (active && payload && payload.length) {
                        const item = graphRatings.find(d => d.snippetId === label);
                        return (
                          <div style={{
                            backgroundColor: '#0f172a',
                            padding: '12px',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                          }}>
                            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>
                              {item ? item.parameter : label}
                            </div>
                            {payload.map((entry, index) => (
                              <div key={`tooltip-${index}`} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                color: entry.name === 'userRating' ? '#22c55e' : '#3b82f6',
                                margin: '4px 0'
                              }}>
                                <div style={{ 
                                  width: '10px', 
                                  height: '10px', 
                                  backgroundColor: entry.name === 'userRating' ? '#22c55e' : '#3b82f6', 
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
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="userRating" 
                    name="userRating" 
                    barSize={16}
                    fill="#22c55e"
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
            
            <div style={{ 
              height: '320px',
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              cursor: 'pointer',
            }}
            onClick={openScatterGraphModal}
            title="Click to enlarge">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis 
                    type="number" 
                    dataKey="ratingCount" 
                    name="Ratings"
                    domain={['auto', 'auto']}
                    tick={{ fill: '#8899a6', fontSize: 12 }}
                    stroke="rgba(255, 255, 255, 0.05)"
                    label={{ 
                      value: 'Number of Ratings', 
                      position: 'insideBottom', 
                      fill: '#8899a6',
                      dy: 20
                    }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="average" 
                    name="Average" 
                    domain={[0, 100]}
                    tick={{ fill: '#8899a6', fontSize: 12 }}
                    stroke="rgba(255, 255, 255, 0.05)"
                    label={{ 
                      value: 'Rating Value', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: '#8899a6',
                      dx: -10
                    }}
                  />
                  <ZAxis range={[80, 80]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: 'rgba(34, 197, 94, 0.4)', strokeWidth: 2 }}
                    content={(props) => {
                      const { active, payload } = props;
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{
                            backgroundColor: '#0f172a',
                            padding: '12px',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <div style={{ 
                                width: '16px', 
                                height: '16px', 
                                borderRadius: '50%', 
                                backgroundColor: data.color,
                              }} />
                              <p style={{ color: '#fff', margin: '0', fontWeight: 'bold' }}>
                                {data.username}
                              </p>
                            </div>
                            <div style={{ marginBottom: '4px', color: '#94a3b8', fontSize: '12px' }}>
                              Artist: {data.parameter}
                            </div>
                            <div style={{ display: 'flex', marginTop: '8px', gap: '16px' }}>
                              <div>
                                <p style={{ color: '#64748b', margin: '0 0 4px 0', fontSize: '12px' }}>Ratings</p>
                                <p style={{ color: '#22c55e', margin: '0', fontWeight: 'bold' }}>{data.ratingCount}</p>
                              </div>
                              <div>
                                <p style={{ color: '#64748b', margin: '0 0 4px 0', fontSize: '12px' }}>Average</p>
                                <p style={{ color: '#3b82f6', margin: '0', fontWeight: 'bold' }}>{data.average}%</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    name="Parameter Users" 
                    data={parameterScatterData} 
                  >
                    {parameterScatterData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth={1}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            </div>
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
          Responses ({comments.length})
        </h3>
        
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}>
          {comments.map((c, index) => {
            let snippetObj = c.snippet;
            
            if (!snippetObj) {
              // Try to find snippet in snippetRecs
              const snippetRec = snippetRecs.find((s) => s.commentId === c.id);
              if (snippetRec) {
                snippetObj = {
                  id: c.id,
                  commentId: c.id,
                  name: snippetRec.name || c.snippet?.name,
                  artistName: snippetRec.artistName || c.snippet?.artistName,
                  artwork: snippetRec.artwork || c.snippet?.artwork,
                  previewUrl: snippetRec.previewUrl || c.snippet?.previewUrl,
                  userRating: snippetRec.userRating,
                  avgRating: snippetRec.avgRating,
                  totalRatings: snippetRec.totalRatings,
                  didRate: snippetRec.didRate,
                };
              }
            }
            
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
                isFirstSnippet={index === 0 && snippetObj}
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
          snippets={snippetRecs}
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