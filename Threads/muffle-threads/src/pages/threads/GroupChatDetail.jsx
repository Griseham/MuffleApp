// src/pages/GroupChatDetail.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Music, Search, Plus, Users, Send, MessageCircle, Heart, Share2, Bookmark } from "lucide-react";
import styles from "./GroupChatDetailStyles";
import { validateAndSanitizeInput, checkRateLimit, sanitizeComment, sanitizeSearchQuery } from "../../utils/security";

// Helper function to generate avatar URLs
function authorToAvatar(author) {
  if (!author || typeof author !== "string") {
    return "/assets/default-avatar.png";
  }

  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash);
  }
  const mod = Math.abs(hash) % 1000;
  return `/assets/image${mod + 1}.png`;
}

// Helper function to format timestamps
function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
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
  const [isSearching, setIsSearching] = useState(false);
  const [attachedSnippet, setAttachedSnippet] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [randomTypingUser, setRandomTypingUser] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

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
        
        // Fetch comments
        const commentsResponse = await fetch(`http://localhost:4000/api/posts/${post.id}/comments`);
        const commentsData = await commentsResponse.json();
        
        // Fetch snippets
        let snippetsData = [];
        try {
          const snippetsResponse = await fetch(`http://localhost:4000/api/posts/${post.id}/snippets`);
          const snippetsJson = await snippetsResponse.json();
          if (snippetsJson.success) {
            snippetsData = snippetsJson.data || [];
          }
        } catch (e) {
          console.log("No snippets found:", e.message);
        }

        // Create snippets map
        const snippetsMap = {};
        snippetsData.forEach(s => {
          if (s.snippetData?.attributes) {
            snippetsMap[s.commentId] = {
              id: s.commentId,
              name: s.snippetData.attributes.name,
              artistName: s.snippetData.attributes.artistName,
              artwork: s.snippetData.attributes.artwork?.url
                ?.replace("{w}", "100")
                ?.replace("{h}", "100") || "/assets/default-artist.png",
              previewUrl: s.snippetData.attributes.previews?.[0]?.url
            };
          }
        });

        // Process messages with better reply distribution
        const processedMessages = [];
        const topLevelComments = [];
        const repliesByParent = {};
        
        // Handle different API response formats
        const comments = commentsData.data?.topLevel || commentsData.data || post.comments || [];
        const replies = commentsData.data?.replies || [];
        
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

        // Create a natural conversation flow - mix comments and replies
        const allReplies = [];
        Object.keys(repliesByParent).forEach(parentId => {
          const replies = repliesByParent[parentId];
          // Only take 1 reply per comment to avoid clustering
          if (replies.length > 0) {
            allReplies.push(replies[0]); // Take the first (usually best) reply
          }
        });

        // Combine all messages and shuffle for natural conversation
        const allMessages = [...topLevelComments, ...allReplies];
        
        // Sort by timestamp first
        allMessages.sort((a, b) => a.timestamp - b.timestamp);
        
        // Create a more natural conversation flow
        const conversationFlow = [];
        let commentCount = 0;
        let replyCount = 0;
        
        for (let i = 0; i < allMessages.length; i++) {
          const message = allMessages[i];
          
          if (!message.isReply) {
            // Regular comment
            conversationFlow.push(message);
            commentCount++;
            
            // After every 2-3 comments, try to add a reply if available
            if (commentCount % (Math.random() > 0.5 ? 2 : 3) === 0) {
              const availableReply = allMessages.find((m, idx) => 
                idx > i && m.isReply && !conversationFlow.includes(m)
              );
              if (availableReply) {
                conversationFlow.push(availableReply);
                replyCount++;
              }
            }
          }
        }
        
        // Add any remaining messages that weren't included
        allMessages.forEach(msg => {
          if (!conversationFlow.includes(msg)) {
            conversationFlow.push(msg);
          }
        });
        
        // Final shuffle to make it feel more natural while keeping some order
        const shuffledMessages = [];
        for (let i = 0; i < conversationFlow.length; i += 4) {
          const chunk = conversationFlow.slice(i, i + 4);
          // Randomly reorder small chunks
          if (chunk.length > 2) {
            // Shuffle while keeping first message in place to maintain some flow
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
        
        console.log(`Loaded ${shuffledMessages.length} messages for group chat`);
        
        if (shuffledMessages.length === 0) {
          setMessages([]);
          setAllMessages([]);
          setLoading(false);
          return;
        }

        setAllMessages(shuffledMessages);
        setMessageIndex(0);
        setMessages([]);
        
        // Start message streaming
        startMessageSequence(shuffledMessages);
        
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
    
    // Clear any existing interval
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
    }

    // Show first 2 messages immediately
    const initialCount = Math.min(2, allMsgs.length);
    setMessages(allMsgs.slice(0, initialCount));
    setMessageIndex(initialCount);
    
    setTimeout(() => scrollToBottom(), 100);

    // If there are more messages, start streaming them
    if (allMsgs.length > initialCount) {
      let currentIndex = initialCount;
      
      messageIntervalRef.current = setInterval(() => {
        if (currentIndex < allMsgs.length) {
          const nextMessage = allMsgs[currentIndex];
          
          // Show typing indicator
          setRandomTypingUser(nextMessage.author);
          setIsTyping(true);
          
          // Add message after "typing"
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, nextMessage]);
            setMessageIndex(currentIndex + 1);
            currentIndex++;
            scrollToBottom();
          }, 1000 + Math.random() * 1000); // 1-2 seconds
          
        } else {
          // All messages sent
          clearInterval(messageIntervalRef.current);
          messageIntervalRef.current = null;
        }
      }, 3000); // New message every 3 seconds
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
      isActive: Math.random() > 0.3
    }));
    
    setUniqueUsers(userArray);
    
    if (onUserListUpdate) {
      onUserListUpdate(userArray);
    }
  }, [messages, onUserListUpdate]);

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
    
    // Rate limiting check
    const userId = "user_local"; // In real app, use actual user ID
    if (!checkRateLimit(`comment_${userId}`, 5, 60000)) { // 5 comments per minute
      alert("You're sending messages too quickly. Please wait a moment.");
      return;
    }
    
    // Validate and sanitize comment
    const validation = validateAndSanitizeInput(newComment, {
      type: 'comment',
      maxLength: 500,
      minLength: 1
    });
    
    if (!validation.isValid) {
      alert(`Invalid message: ${validation.error}`);
      return;
    }
    
    const newMessage = {
      id: `user_${Date.now()}`,
      author: "You",
      body: validation.sanitized,
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
    audioRef.current.src = snippet.previewUrl;
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
    
    // Rate limiting for search requests
    const userId = "user_local"; // In real app, use actual user ID
    if (!checkRateLimit(`search_${userId}`, 10, 60000)) { // 10 searches per minute
      alert("You're searching too frequently. Please wait a moment.");
      return;
    }
    
    // Validate and sanitize search query
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
      const response = await fetch(`http://localhost:4000/api/apple-music-search?query=${encodeURIComponent(sanitizedQuery)}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setSearchedSnippet(data.data);
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
    setAttachedSnippet({
      id: snippet.id,
      name: snippet.attributes.name,
      artistName: snippet.attributes.artistName,
      artwork: snippet.attributes.artwork?.url?.replace("{w}", "100")?.replace("{h}", "100") || "/assets/default-artist.png",
      previewUrl: snippet.attributes.previews?.[0]?.url || null
    });
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
                <img 
                  src={authorToAvatar(msg.parentAuthor)} 
                  style={styles.replyingToAvatar} 
                  alt={msg.parentAuthor} 
                />
                <span style={styles.replyingTo}>
                  Replying to {msg.parentAuthor}
                </span>
              </div>
            )}
            
            <div style={isUserMessage ? styles.sentChatBubble : styles.chatBubble}>
              <p style={styles.messageBody}>{sanitizeComment(msg.body || '')}</p>
              
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0c111b',
        color: '#fff'
      }}>
        {/* Loading spinner */}
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTop: '4px solid #ff69b4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <div style={{
          fontSize: '18px',
          fontWeight: '500',
          color: '#d393e3'
        }}>
          Loading group chat...
        </div>
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
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '768px',
      margin: '0 auto',
      backgroundColor: '#0c111b',
      color: '#fff',
      minHeight: '100vh',
      position: 'relative',
      opacity: isVisible ? 1 : 0,
      transform: `scale(${isVisible ? '1' : '0.98'})`,
      transition: 'opacity 0.3s ease, transform 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'rgba(12, 17, 27, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <button 
          onClick={onBack} 
          style={{
            background: 'rgba(30, 39, 50, 0.8)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '10px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '20px'
          }}
        >
          ←
        </button>
        <h2 style={{ 
          margin: 0, 
          fontSize: '20px', 
          fontWeight: '700',
          background: 'linear-gradient(45deg, #ff69b4, #b83280)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Group Chat
        </h2>
      </div>

      {/* Post Card */}
      {post && (
        <div style={{
          padding: "24px",
          backgroundColor: "rgba(30, 14, 36, 0.8)",
          borderRadius: "16px",
          margin: "16px",
          border: "1px solid rgba(255, 150, 220, 0.15)"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
            <img
              src={authorToAvatar(post.author)}
              alt={post.author}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255, 150, 220, 0.3)"
              }}
            />
            <div>
              <div style={{ fontWeight: "700", fontSize: "16px", color: "#fff" }}>
                {post.author}
              </div>
              <div style={{ fontSize: "14px", color: "#d393e3" }}>
                {new Date(post.createdUtc * 1000).toLocaleString()}
              </div>
            </div>
          </div>
          
          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600, color: "#fff" }}>
            {post.title}
          </p>
          
          {post.selftext && (
            <p style={{ margin: "0.75rem 0", fontSize: "0.95rem", color: "#e2c7ee" }}>
              {post.selftext}
            </p>
          )}
          
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post visual"
              style={{
                width: "100%", 
                maxHeight: "400px",
                objectFit: "cover",
                borderRadius: "12px",
                marginTop: "8px",
                aspectRatio: "16/9"
              }}
            />
          )}
        </div>
      )}

      {/* Chat Container */}
      <div style={styles.container}>
        <audio ref={audioRef} style={{ display: "none" }} />
        
        {/* Tools */}
        <div style={styles.toolsContainer}>
          <button 
            style={styles.toolButton}
            onClick={() => setIsSongSearchVisible(!isSongSearchVisible)}
          >
            <Music size={20} />
          </button>
          <button 
            style={styles.toolButton}
            onClick={() => setActiveSection(activeSection === "users" ? null : "users")}
          >
            <Users size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div style={styles.chatAreaContainer}>
          <div ref={chatRef} style={styles.chatArea}>
            {/* Join message at the top */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#8899a6',
              fontSize: '14px',
              fontStyle: 'italic',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '20px'
            }}>
              You joined the group chat
            </div>
            
            {renderMessages()}
            
            {/* Typing indicator at the bottom */}
            {isTyping && (
              <div style={{
                ...styles.typingIndicator,
                marginTop: '10px',
                marginBottom: '0px'
              }}>
                <img 
                  src={authorToAvatar(randomTypingUser)} 
                  alt={randomTypingUser}
                  style={{ width: "24px", height: "24px", borderRadius: "50%", marginRight: "8px" }}
                />
                {randomTypingUser} is typing...
              </div>
            )}
          </div>
        </div>

        {/* Song Search */}
        {isSongSearchVisible && (
          <div style={{
            backgroundColor: "rgba(30, 15, 40, 0.8)",
            borderRadius: "12px",
            padding: "12px",
            marginBottom: "12px",
            border: "1px solid rgba(255, 150, 220, 0.2)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const input = e.target.value;
                  // Real-time validation and sanitization
                  if (input.length <= 100) {
                    const sanitized = sanitizeSearchQuery(input);
                    setSearchQuery(sanitized);
                  }
                }}
                placeholder="Search for a song..."
                maxLength={100}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(30, 15, 40, 0.6)",
                  border: "1px solid rgba(255, 150, 220, 0.2)",
                  color: "#FFF",
                  padding: "10px 12px",
                  borderRadius: "8px"
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSongSearch()}
              />
              <button
                onClick={handleSongSearch}
                disabled={isSearching}
                style={{
                  backgroundColor: "#d53f8c",
                  color: "#FFF",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  cursor: isSearching ? "not-allowed" : "pointer"
                }}
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>

            {searchedSnippet && (
              <div style={{
                display: "flex",
                alignItems: "center",
                padding: "12px",
                backgroundColor: "rgba(40, 20, 60, 0.8)",
                borderRadius: "8px",
                marginTop: "12px",
                gap: "12px"
              }}>
                <img
                  src={searchedSnippet.attributes.artwork?.url?.replace("{w}", "100")?.replace("{h}", "100") || "/assets/default-artist.png"}
                  alt={searchedSnippet.attributes.name}
                  style={{ width: "50px", height: "50px", borderRadius: "8px" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: "bold" }}>
                    {searchedSnippet.attributes.name}
                  </div>
                  <div style={{ color: "#d393e3" }}>
                    {searchedSnippet.attributes.artistName}
                  </div>
                </div>
                <button
                  onClick={() => handleAttachSnippet(searchedSnippet)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#9c27b0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <Plus size={18} color="#fff" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div style={styles.inputContainer}>
          {attachedSnippet && (
            <div style={styles.attachmentPreview}>
              <img src={attachedSnippet.artwork} alt={attachedSnippet.name} style={styles.snippetArtwork} />
              <div style={styles.snippetInfo}>
                <div style={styles.snippetTitle}>{attachedSnippet.name}</div>
                <div style={styles.snippetArtist}>{attachedSnippet.artistName}</div>
              </div>
              <button onClick={() => setAttachedSnippet(null)} style={styles.removeButton}>
                Remove
              </button>
            </div>
          )}
          
          <div style={styles.messageRow}>
            <textarea
              placeholder="Type a message..."
              style={styles.inputBox}
              value={newComment}
              onChange={(e) => {
                const input = e.target.value;
                // Real-time length validation
                if (input.length <= 500) {
                  setNewComment(input);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              maxLength={500}
              rows={2}
            />
            <button
              onClick={handleSubmitComment}
              style={styles.sendButton}
              disabled={!newComment.trim() && !attachedSnippet}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Users Section */}
        {activeSection === "users" && (
          <div style={styles.usersContainer}>
            {uniqueUsers.length > 0 ? (
              uniqueUsers.map((user) => (
                <div key={user.name} style={styles.userMinimal}>
                  <div style={{ position: "relative" }}>
                    <img src={user.avatar} alt={user.name} style={styles.userAvatar} />
                    {user.isActive && <div style={styles.onlineIndicator}></div>}
                  </div>
                  <p style={styles.userName}>{user.name}</p>
                </div>
              ))
            ) : (
              <p style={styles.noUsersText}>No users found</p>
            )}
          </div>
        )}

        {/* Scroll Button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            style={{
              position: "absolute",
              bottom: "100px",
              right: "20px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#d53f8c",
              color: "#fff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10
            }}
          >
            ↓
          </button>
        )}
      </div>
    </div>
  );
}