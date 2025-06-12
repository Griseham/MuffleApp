import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiMessageCircle, FiHeart, FiRepeat, FiShare, FiVolume2 } from 'react-icons/fi';
import { Music, TrendingUp, Shuffle, Mic, Search } from 'lucide-react';
import profileData from './ProfileData.json';
import artistData from './artistData';  // Import the artist data
import EnhancedDiscoverySection from './EnhancedDiscoverySection';


const MultiArcCircle = ({ arcsData, size = 70, ringWidth = 9, onClick, isSelected }) => {
  const rings = arcsData.map((arc, index) => {
    // Make the arcs fuller by using a smaller gap between rings
    const outermostRadius = (size / 2) - (index * ringWidth) - (index * 1); // reduced gap from 2 to 1
    const radius = outermostRadius - ringWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - arc.percent * circumference;

    return (
      <circle
        key={index}
        stroke={arc.color}
        fill="none"
        strokeWidth={ringWidth}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      style={{ 
        transform: "rotate(-90deg)",
        filter: isSelected ? "drop-shadow(0px 0px 6px rgba(255, 255, 255, 0.5))" : "none"
      }}
      onClick={onClick}
    >
      {rings}
    </svg>
  );
};

// Component for music snippets
const MusicSnippet = ({ snippet }) => {
  return (
    <div style={{
      width: "220px",
      height: "220px",
      backgroundImage: "linear-gradient(135deg, #303f9f 0%, #7b1fa2 100%)",
      borderRadius: "8px",
      marginLeft: "3rem",
      marginTop: "0.5rem",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Play button overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5.14V19.14L19 12.14L8 5.14Z" fill="white"/>
          </svg>
        </div>
      </div>
      
      {/* Track info at bottom */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        padding: "12px",
        background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)"
      }}>
        <div style={{ color: "white", fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>
          {snippet.songName}
        </div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
          {snippet.artistName}
        </div>
      </div>
    </div>
  );
};

// Artist Circle component for the discovery tab
const ArtistCircle = ({ artist }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        marginBottom: '0.25rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <img 
          src={artist.imageUrl} 
          alt={artist.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#a9b6fc',
      }}>{artist.name.length > 10 ? artist.name.substring(0, 10) + '...' : artist.name}</div>
    </div>
  );
};

export default function UserProfile({ user = profileData.userInfo, onBack }) {
  const [activeTab, setActiveTab] = useState("Recents");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Use data from ProfileData.json
  const genreCompletionData = profileData.genreData.genreCompletionData;
  const userPosts = profileData.userPosts;

  
  // Handle entrance transition
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);


  // Styles for the enhanced user profile
  const styles = {
    pageContainer: {
      width: "100%",
      height: "100vh",
      backgroundColor: "#0c111b",
      color: "#fff",
      overflowY: "auto",
      position: "relative",
    },
    cosmicBackground: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "300px",
      background: "linear-gradient(180deg, rgba(31, 38, 135, 0.4) 0%, rgba(12, 17, 27, 0) 100%)",
      zIndex: 0,
    },
    contentContainer: {
      position: "relative",
      maxWidth: "800px",
      margin: "0 auto",
      padding: "0",
      zIndex: 1,
    },
    header: {
      position: "sticky",
      top: 0,
      backgroundColor: "rgba(12, 17, 27, 0.8)",
      backdropFilter: "blur(8px)",
      padding: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      zIndex: 10,
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    backBtn: {
      cursor: "pointer",
      background: "none",
      border: "none",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    banner: {
      width: "100%",
      height: "150px",
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
    },
    avatarRow: {
      position: "relative",
      marginTop: "-40px",
      marginLeft: "1rem",
      display: "flex",
      alignItems: "flex-end",
      gap: "1rem",
    },
    userAvatar: {
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      border: "3px solid #0c111b",
      objectFit: "cover",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    },
    followBtn: {
      marginLeft: "auto",
      marginRight: "1rem",
      background: "linear-gradient(45deg, #1e40af, #3b82f6)",
      color: "#fff",
      border: "none",
      borderRadius: "9999px",
      padding: "0.5rem 1.25rem",
      cursor: "pointer",
      fontWeight: "bold",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    },
    nameAndBio: {
      padding: "0 1rem",
      marginTop: "0.5rem",
    },
    displayName: {
      fontSize: "1.25rem",
      fontWeight: "bold",
      background: "linear-gradient(45deg, #9c27b0, #3f51b5)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    handle: {
      fontSize: "0.9rem",
      color: "#a9b6fc",
      marginTop: "2px",
    },
    bioText: {
      marginTop: "0.5rem",
      fontSize: "0.95rem",
      color: "#ddd",
      lineHeight: "1.4",
    },
    statsRow: {
      display: "flex",
      gap: "1.5rem",
      marginLeft: "1rem",
      marginTop: "0.75rem",
    },
    statItem: {
      cursor: "pointer",
    },
    statNumber: {
      fontWeight: "bold",
      color: "#fff",
    },
    statLabel: {
      color: "#a9b6fc",
    },
    genreCompletionSection: {
      margin: "1.5rem 1rem 0",
      padding: "1rem",
      backgroundColor: "rgba(12, 17, 27, 0.7)",
      borderRadius: "1rem",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 8px 32px rgba(31, 38, 135, 0.1)",
      animation: "fadeSlideDown 0.5s ease-out",
    },
    circlesRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: "0.75rem",
      marginTop: "0.5rem",
      flexWrap: "wrap",
    },
    circleWrapper: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0.5rem",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    genreLabel: {
      color: "#fff",
      fontSize: "0.8rem",
      marginTop: "0.25rem",
      textAlign: "center",
    },
    completionValue: {
      fontSize: "1.1rem",
      color: "#ffffff",
      marginTop: "0.2rem",
      fontWeight: "600",
      textShadow: "0 1px 3px rgba(0,0,0,0.4)",
    },
    subgenresPanel: {
      marginTop: "1rem",
      backgroundColor: "rgba(26, 26, 42, 0.5)",
      borderRadius: "8px",
      padding: "1rem",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      animation: "fadeIn 0.3s ease-out",
      maxHeight: "0",
      overflow: "hidden",
      transition: "max-height 0.3s ease-out, padding 0.3s ease-out, margin 0.3s ease-out",
    },
    activatedPanel: {
      maxHeight: "300px",
      padding: "1rem",
      marginTop: "1rem",
    },
    subgenresContent: {
      textAlign: "center",
    },
    subgenresTitle: {
      margin: "0 0 1rem 0",
      color: "#fff",
      fontSize: "1rem",
    },
    subgenresBarsWrapper: {
      maxWidth: "400px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    subgenreRow: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
    },
    subgenreName: {
      color: "#a9b6fc",
      marginBottom: "0.25rem",
      fontSize: "0.85rem",
    },
    barOuter: {
      width: "100%",
      height: "6px",
      backgroundColor: "rgba(51, 51, 77, 0.5)",
      borderRadius: "999px",
      overflow: "hidden",
    },
    barInner: {
      height: "100%",
      borderRadius: "999px",
    },
    subgenreValue: {
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
      fontSize: "0.75rem",
      color: "#a9b6fc",
      marginTop: "0.25rem",
    },
    tabsContainer: {
      display: "flex",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      marginTop: "1rem",
    },
    tabItem: {
      flex: 1,
      textAlign: "center",
      padding: "0.75rem 0",
      cursor: "pointer",
      fontWeight: "bold",
      color: "#a9b6fc",
      borderBottom: "2px solid transparent",
      transition: "all 0.2s ease",
    },
    tabItemActive: {
      color: "#fff",
      borderBottom: "2px solid #3b82f6",
    },
    tabContent: {
      padding: "1rem",
      maxWidth: "750px",
      margin: "0 auto",
      backgroundColor: "rgba(12, 17, 27, 0.7)",
      borderRadius: "1rem",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 8px 32px rgba(31, 38, 135, 0.1)",
      marginTop: "1rem",
    },
    recentsContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    recentPost: {
      display: "flex",
      flexDirection: "column",
      padding: "1rem 0.75rem",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      transition: "background-color 0.2s ease",
      borderRadius: "0.5rem",
    },
    postHeader: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    postAvatar: {
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      objectFit: "cover",
    },
    postAuthor: {
      fontWeight: "bold",
      fontSize: "0.95rem",
      color: "#fff",
    },
    postedIn: {
      fontSize: "0.8rem",
      color: "#a9b6fc",
      margin: "0.25rem 0 0 3rem"
    },
    postText: {
      fontSize: "1rem",
      color: "#e1e1e1",
      lineHeight: 1.4,
      marginLeft: "3rem",
      marginTop: "0.25rem",
    },
    postActions: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "0.5rem",
      marginLeft: "3rem",
      marginRight: "1rem",
      color: "#a9b6fc",
    },
    actionItem: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      cursor: "pointer",
      fontSize: "0.9rem",
    },
    musicControls: {
      position: "sticky",
      bottom: "1rem",
      backgroundColor: "rgba(12, 17, 35, 0.9)",
      backdropFilter: "blur(10px)",
      borderRadius: "0.75rem",
      padding: "0.75rem 1rem",
      marginTop: "1rem",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.15)",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      maxWidth: "750px",
      margin: "1rem auto",
    },
    musicIconWrapper: {
      backgroundColor: "#1d4ed8",
      width: "2.5rem",
      height: "2.5rem",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 0 12px rgba(29, 78, 216, 0.4)",
    },
    musicText: {
      fontSize: "0.95rem",
      fontWeight: "600",
      color: "white",
      lineHeight: "1.2",
    },
    musicSubtext: {
      fontSize: "0.8rem",
      color: "#94a3b8",
      marginTop: "0.2rem",
    },
    shuffleButton: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      width: "2.5rem",
      height: "2.5rem",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s ease",
      backdropFilter: "blur(4px)",
    },
    discoveryDayRow: {
      marginBottom: '0.75rem',
      padding: '0.75rem',
      backgroundColor: 'rgba(26, 26, 42, 0.5)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
    },
    discoveryLabel: {
      fontSize: '0.85rem',
      color: '#a9b6fc',
      textAlign: 'left',
      minWidth: '80px',
      marginBottom: '0.5rem'
    },
    artistsContainer: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.75rem',
      marginBottom: '0.5rem'
    },
    plusCount: {
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: '#a9b6fc',
      display: 'flex',
      alignItems: 'center',
      height: '48px'
    },
    statsContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '0.25rem',
      minWidth: '180px'
    },

  };

  return (
    <div style={{
      ...styles.pageContainer,
      opacity: isVisible ? 1 : 0,
      transform: `scale(${isVisible ? '1' : '0.98'})`,
      transition: 'opacity 0.3s ease, transform 0.3s ease'
    }}>
      {/* Cosmic Background Effect */}
      <div style={styles.cosmicBackground} />

      <div style={styles.contentContainer}>
        {/* Header Bar */}
        <div style={styles.header}>
          <button onClick={onBack} style={styles.backBtn}>
            <FiArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
            {user.displayName}
          </h2>
        </div>

        {/* Profile Banner */}
        <div style={styles.banner} />

        {/* Avatar + Follow Row */}
        <div style={styles.avatarRow}>
          <img 
            src={user.avatar}
            alt={`${user.displayName} avatar`} 
            style={styles.userAvatar} 
          />
          <button style={styles.followBtn}>Follow</button>
        </div>

        {/* Name & Bio */}
        <div style={styles.nameAndBio}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <div style={styles.displayName}>{user.displayName}</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(29, 155, 240, 0.15)',
              borderRadius: '16px',
              padding: '0.4rem 0.8rem',
              border: '1px solid rgba(29, 155, 240, 0.3)',
            }}>
              <FiVolume2 size={16} color="#1d9bf0" strokeWidth={2} />
              <span style={{
                fontSize: '1rem', 
                color: '#1d9bf0', 
                fontWeight: '700'
              }}>1312</span>
            </div>
          </div>
          <div style={styles.handle}>@{user.username}</div>
          <p style={styles.bioText}>
            {user.bio}
          </p>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{user.following}</span>
            <span style={styles.statLabel}> Following</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{user.followers}</span>
            <span style={styles.statLabel}> Followers</span>
          </div>
        </div>

        {/* GENRE COMPLETION SECTION */}
        <div style={styles.genreCompletionSection}>
          <div style={styles.circlesRow}>
            {genreCompletionData.map((genreData) => {
              const isSelected = selectedGenre === genreData.genre;
              return (
                <div
                  key={genreData.genre}
                  style={{
                    ...styles.circleWrapper,
                    border: isSelected ? "2px solid #fff" : "2px solid transparent",
                    backgroundColor: isSelected ? "rgba(255, 255, 255, 0.05)" : "transparent",
                    borderRadius: "8px",
                  }}
                  onClick={() => {
                    setSelectedGenre(selectedGenre === genreData.genre ? null : genreData.genre);
                  }}
                >
                  <MultiArcCircle 
                    arcsData={genreData.arcs} 
                    isSelected={isSelected}
                  />
                  <div style={styles.genreLabel}>{genreData.genre}</div>
                  <div style={styles.completionValue}>{genreData.totalCompletion}%</div>
                </div>
              );
            })}
          </div>
          
          {/* Subgenres detail panel, shown when a genre is selected */}
          <div style={{
            ...styles.subgenresPanel,
            ...(selectedGenre ? styles.activatedPanel : {})
          }}>
            {selectedGenre && genreCompletionData
              .filter((g) => g.genre === selectedGenre)
              .map((genreData) => (
                <div key={genreData.genre} style={styles.subgenresContent}>
                  <h4 style={styles.subgenresTitle}>{genreData.genre} Subgenres</h4>
                  <div style={styles.subgenresBarsWrapper}>
                    {genreData.subgenres.map((sub) => (
                      <div key={sub.name} style={styles.subgenreRow}>
                        <span style={styles.subgenreName}>{sub.name}</span>
                        <div style={styles.barOuter}>
                          <div
                            style={{
                              ...styles.barInner,
                              width: `${sub.subPct * 100}%`,
                              backgroundColor: genreData.arcs[0].color,
                            }}
                          />
                        </div>
                        <div style={styles.subgenreValue}>
                          <span></span>
                          <span>{sub.completion}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
          
          {/* Discovery Stats Summary */}
          <div style={{
            marginTop: '1.5rem',
            backgroundColor: 'rgba(26, 26, 42, 0.5)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#a9b6fc',
              fontSize: '0.9rem',
            }}>
              <span style={{fontWeight: '500'}}>Discovered 2.51% of music</span>
              <span>276,000 artists</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          <div
            style={{
              ...styles.tabItem,
              ...(activeTab === "Recents" ? styles.tabItemActive : {}),
            }}
            onClick={() => setActiveTab("Recents")}
          >
            Recents
          </div>
          <div
            style={{
              ...styles.tabItem,
              ...(activeTab === "Discovery" ? styles.tabItemActive : {}),
            }}
            onClick={() => setActiveTab("Discovery")}
          >
            Discovery
          </div>
          <div
            style={{
              ...styles.tabItem,
              ...(activeTab === "Timeline" ? styles.tabItemActive : {}),
            }}
            onClick={() => setActiveTab("Timeline")}
          >
            Timeline
          </div>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === "Recents" && (
            <div style={styles.recentsContainer}>
              {userPosts.slice(0, 5).map((post) => (
                <div style={styles.recentPost} key={post.id}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                  }}>
                    {/* Main post content on the left */}
                    <div style={{flex: 1}}>
                      <div style={styles.postHeader}>
                        <img 
                          src={user.avatar}
                          style={styles.postAvatar} 
                          alt="avatar" 
                        />
                        <div style={styles.postAuthor}>{post.author} • {post.postedAt}</div>
                      </div>
                      <div style={styles.postText}>{post.text}</div>
                      {post.hasSnippet && <MusicSnippet snippet={post.snippet} />}
                    </div>
                    
                    {/* "Posted in" miniature post on the right */}
                    <div style={{
                      backgroundColor: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: '8px',
                      padding: '10px',
                      minWidth: '140px',
                      maxWidth: '180px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      alignSelf: 'flex-start',
                      marginTop: '2.5rem',
                    }}>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#a9b6fc',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>Posted in</div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#ffffff',
                        fontWeight: '500',
                        lineHeight: '1.3',
                      }}>{post.postedIn}</div>
                      <div style={{
                        height: '4px',
                        width: '40%',
                        backgroundImage: 'linear-gradient(to right, #3b82f6, rgba(59, 130, 246, 0))',
                        borderRadius: '2px',
                        marginTop: '2px',
                      }}></div>
                    </div>
                  </div>
                  
                  <div style={styles.postActions}>
                    <div style={styles.actionItem}>
                      <FiMessageCircle /> {post.interactions.comments}
                    </div>
                    <div style={styles.actionItem}>
                      <FiRepeat /> {post.interactions.reposts}
                    </div>
                    <div style={styles.actionItem}>
                      <FiHeart /> {post.interactions.likes}
                    </div>
                    <div style={styles.actionItem}>
                      <FiShare />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Discovery Tab Content - Using EnhancedDiscoverySection */}
          {activeTab === "Discovery" && (
            <EnhancedDiscoverySection artistData={artistData} styles={styles} />
          )}
          
          {/* Timeline Tab Content */}
          {activeTab === "Timeline" && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '3rem 1rem',
              color: '#a9b6fc',
              textAlign: 'center',
              minHeight: '300px'
            }}>
              <Music size={40} style={{ 
                marginBottom: '1rem', 
                opacity: 0.7,
                animation: 'fadeIn 1s ease-out'
              }} />
              <p style={{
                fontSize: '1rem',
                margin: 0,
                animation: 'fadeIn 1s ease-out 0.3s both'
              }}>
                In development
              </p>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '1rem',
                animation: 'fadeIn 1s ease-out 0.6s both'
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#a9b6fc',
                    opacity: 0.5,
                    animation: `bounce 1.4s ease-in-out infinite ${i * 0.2}s`
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

      
      </div>

      {/* Add keyframes for animations */}
      <style jsx>{`
  @keyframes fadeSlideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes bounce {
    0%, 80%, 100% { opacity: 0.3; }
    40% { opacity: 1; }
  }
`}</style>
</div>
);
}