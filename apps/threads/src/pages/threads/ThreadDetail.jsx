import React, { useState, useEffect, useCallback } from "react";
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
import { getAvatarForUser } from '../../utils/avatarService';
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


/** Consistent avatar per author string */



// Theme color function - news threads use same color as regular threads in detail view
const getThemeColor = (postType) => {
  if (postType === 'groupchat') return '#FF69B4';
  if (postType === 'parameter') return '#00C4B4';
  return '#1d9bf0'; // default thread color (including news)
};

export default function ThreadDetail({ postId, postData, onBack, onSelectUser }) {
  const [isVisible, setIsVisible] = useState(false);
  const { 
    post, 
    comments, 
    setComments, 
    snippetRecs, 
    setSnippetRecs, 
    uniqueUsers, 
    usedCache 
  } = useThreadData(postId, postData);
  

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
  const { exampleComment, exampleSnippet } = createExampleData();
  
  // Stable comment order - only shuffle once when comments change
  const [stableCommentOrder, setStableCommentOrder] = useState([]);

  const getSnippetId = useCallback((snippet) => {
    return snippet?.id || snippet?.commentId;
  }, []);

  const { 
    audioRef, 
    activeSnippet, 
    playSnippet, 
    handleUserRate, 
    stopAudio 
  } = useAudioRating(snippetRecs, setSnippetRecs, getSnippetId);

  useEffect(() => {
    // Scroll to top when entering thread detail
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Create stable comment order when comments are first loaded
  useEffect(() => {
    if (comments.length > 0) {
      // For news threads and parameter threads, don't add example comment
      const isParameterThread = post?.postType === 'parameter';
      const finalComments = (isNewsThread || isParameterThread) ? comments : [exampleComment, ...comments];
      setStableCommentOrder(finalComments);
    }
  }, [comments.length, isNewsThread, post?.postType]); // Only run when comments length changes

  useEffect(() => {
    // Skip adding example snippet for news threads and parameter threads
    const isParameterThread = post?.postType === 'parameter';
    if (!isNewsThread && !isParameterThread && snippetRecs.length > 0 && !snippetRecs.some(s => s.id === 'example_comment_001')) {
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

  const updateScatterData = useCallback((snippets) => {
    const newScatterData = processScatterData(snippets, comments, getSnippetId);
    setScatterData(newScatterData);
  }, [comments, getSnippetId]);

  const processRatingsData = useCallback(() => {
    if (snippetRecs.length === 0) return;
    
    const ratedSnippets = snippetRecs.filter(
      snippet => snippet.userRating != null || snippet.avgRating != null
    );
    
    if (ratedSnippets.length === 0) return;
    
    const verticalData = ratedSnippets
      .map(snippet => {
        const snippetId = snippet.id || snippet.commentId;
        const relatedComment = comments.find(c => c.id === snippetId);
        const commentAuthor = relatedComment?.author || "Unknown";
        
        return {
          snippetId,
          userRating: snippet.userRating ?? 0,
          avgRating: snippet.avgRating ?? 0,
          userAvatar: getAvatarForUser(commentAuthor)
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

  const handleRatingPause = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  const handleSubmitComment = useCallback((newComment) => {
    if (!newComment) return;
    
    setComments(prevComments => [...prevComments, newComment]);
    
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }, [setComments]);

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

  const handleBackWithTransition = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onBack) onBack();
    }, 300);
  }, [onBack]);

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
          border: `2px solid ${themeColor}`,
          position: "relative",
          boxShadow: `0 8px 32px ${themeColor}33`,
          width: "calc(100% - 32px)",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
          }}>
            <img
              src={getAvatarForUser(post.author)}
              alt="User avatar"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                objectFit: "cover",
                marginRight: "12px",
                border: "2px solid rgba(255, 255, 255, 0.1)",
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
            <div style={{
              display: "flex",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginTop: "24px",
              width: "100%",
            }}>
              <div 
    onClick={() => handleTabClick("graphs")}
    style={{
      padding: "16px 0",
      width: "50%",
      textAlign: "center",
      color: activeSection === "graphs" ? themeColor : "#64748b",
      fontWeight: "600",
      borderBottom: activeSection === "graphs" ? `3px solid ${themeColor}` : "3px solid transparent",
      cursor: "pointer",
      backgroundColor: activeSection === "graphs" ? `${themeColor}11` : "transparent",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px"
    }}
  >
    <h4 style={{ margin: 0, fontSize: "15px" }}>Graphs</h4>
    <InfoIconModal
      title="Graphs"
      iconSize={14}
      showButtonText={false}
      steps={[
        {
          icon: <BarChart3 size={18} color="#a9b6fc" />,
          title: "Use Graphs for Insights",
          content: "Use these graphs to glean more info on each thread"
        },
        {
          icon: <Users size={18} color="#a9b6fc" />,
          title: "Engage to Add Data", 
          content: "Engaging and rating snippets will add more users to each graph"
        }
      ]}
    />
  </div>
              <div 
                onClick={() => handleTabClick("users")}
                style={{
                  padding: "16px 0",
                  width: "50%",
                  textAlign: "center",
                  color: activeSection === "users" ? themeColor : "#64748b",
                  fontWeight: "600",
                  borderBottom: activeSection === "users" ? `3px solid ${themeColor}` : "3px solid transparent",
                  cursor: "pointer",
                  backgroundColor: activeSection === "users" ? `${themeColor}11` : "transparent",
                  transition: "all 0.2s ease",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "15px" }}>Users</h4>
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
              
              {activeSection === "users" && (
                <div style={{
                  ...styles.usersContainer,
                  width: "calc(100% - 32px)",
                  margin: "16px auto",
                }}>
                  {uniqueUsers.map((user) => (
                    <div 
                      key={user.name} 
                      style={styles.userMinimal}
                      onClick={() => onSelectUser && onSelectUser(user)}
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        style={styles.userAvatar}
                      />
                      <p style={styles.userName}>{user.name}</p>
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
        <ThreadCommentComposer 
          onSubmit={handleSubmitComment} 
          onOpenTikTokModal={openTikTokView}
        />
      )}
      
      {post?.postType !== "groupchat" && (
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
            {(stableCommentOrder.length > 0 ? stableCommentOrder : ((isNewsThread || post?.postType === 'parameter') ? comments : [exampleComment, ...comments])).map((c, index) => {
              let snippetObj = null;
              
              // Debug logging for parameter threads
              if (post?.postType === 'parameter') {
   
              }
              
              // For news threads, don't process any snippets
              if (!isNewsThread) {
                snippetObj = snippetRecs.find((s) => s.commentId === c.id);
                
                if (post?.postType === 'parameter' && snippetObj) {
                }
                
                if (c.id === 'example_comment_001') {
                  snippetObj = exampleSnippet;
                } else if (c.snippet) {
                  snippetObj = {
                    id: c.id,
                    commentId: c.id,
                    name: c.snippet.name,
                    artistName: c.snippet.artistName,
                    artwork: c.snippet.artwork,
                    previewUrl: c.snippet.previewUrl,
                    userRating: c.snippet.userRating,
                    avgRating: c.snippet.avgRating,
                    totalRatings: c.snippet.totalRatings,
                    didRate: c.snippet.didRate,
                  };
                } else if (snippetObj) {
                  snippetObj = formatSnippetData(snippetObj, c, comments);
                  if (post?.postType === 'parameter') {
                  }
                }
              }
              const isThisSnippetPlaying =
              activeSnippet?.snippetId === getSnippetId(snippetObj) &&
              activeSnippet?.isPlaying;
              
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
                  isFirstSnippet={!isNewsThread && index === 0 && snippetObj && c.id === 'example_comment_001'}
                  isNewsThread={isNewsThread}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {!isNewsThread && isTikTokOpen && (
        <TikTokModal
          snippets={snippetRecs.filter(s => s.id !== 'example_comment_001')}
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