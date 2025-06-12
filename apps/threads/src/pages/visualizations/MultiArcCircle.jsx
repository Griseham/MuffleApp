import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiMessageCircle, FiHeart, FiRepeat, FiShare } from 'react-icons/fi';
import { Music, Shuffle } from 'lucide-react';

const MultiArcCircle = ({ arcsData, size = 60, ringWidth = 6, onClick, isSelected }) => {
  const rings = arcsData.map((arc, index) => {
    const outermostRadius = (size / 2) - (index * ringWidth) - (index * 2);
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

export default function UserProfileWithGenres() {
  const [activeTab, setActiveTab] = useState("Recents");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Handle entrance transition
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Example: placeholder data for the Recents feed
  const dummyRecentsData = [
    { id: 1, author: "Gray @Fullbodydays • 3h", text: "Lorem ipsum...", snippet: true },
    { id: 2, author: "Gray @Fullbodydays • 1h", text: "Vestibulum viverra...", snippet: false },
  ];

  // Shuffle and pick items
  const [randomRecents, setRandomRecents] = useState([]);
  useEffect(() => {
    const shuffled = [...dummyRecentsData].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, 2);
    setRandomRecents(picked);
  }, []);

  // Genre completion data - expanded with more genres
  const genreCompletionData = [
    {
      genre: "Rock",
      totalCompletion: 75,
      arcs: [
        { percent: 0.75, color: "#f56c42" }, // outer ring
        { percent: 0.4, color: "#f56c42" },  // second ring
        { percent: 0.2, color: "#f56c42" },  // third ring
      ],
      subgenres: [
        { name: "Hard Rock", subPct: 0.65, completion: 65 },
        { name: "Indie Rock", subPct: 0.4, completion: 40 },
        { name: "Psychedelic Rock", subPct: 0.2, completion: 20 },
      ],
    },
    {
      genre: "Pop",
      totalCompletion: 52,
      arcs: [
        { percent: 0.52, color: "#1db954" },
        { percent: 0.35, color: "#1db954" },
        { percent: 0.15, color: "#1db954" },
      ],
      subgenres: [
        { name: "Dance Pop", subPct: 0.52, completion: 52 },
        { name: "Electro Pop", subPct: 0.35, completion: 35 },
        { name: "Teen Pop", subPct: 0.15, completion: 15 },
      ],
    },
    {
      genre: "Hip-Hop",
      totalCompletion: 42,
      arcs: [
        { percent: 0.42, color: "#3b82f6" },
        { percent: 0.28, color: "#3b82f6" },
        { percent: 0.12, color: "#3b82f6" },
      ],
      subgenres: [
        { name: "Trap", subPct: 0.42, completion: 42 },
        { name: "Boom Bap", subPct: 0.28, completion: 28 },
        { name: "Alternative Hip-Hop", subPct: 0.12, completion: 12 },
      ],
    },
    {
      genre: "Electronic",
      totalCompletion: 30,
      arcs: [
        { percent: 0.3, color: "#9c27b0" },
        { percent: 0.15, color: "#9c27b0" },
      ],
      subgenres: [
        { name: "House", subPct: 0.3, completion: 30 },
        { name: "Techno", subPct: 0.15, completion: 15 },
      ],
    },
    {
      genre: "Country",
      totalCompletion: 10,
      arcs: [
        { percent: 0.1, color: "#ff9800" },
      ],
      subgenres: [
        { name: "Alt Country", subPct: 0.1, completion: 10 },
      ],
    },
  ];

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
    genreSectionTitle: {
      fontSize: "1.1rem",
      fontWeight: "600",
      color: "#a9b6fc",
      marginBottom: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
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
      fontSize: "0.75rem",
      color: "#a9b6fc",
      marginTop: "0.1rem",
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
    postText: {
      fontSize: "1rem",
      color: "#e1e1e1",
      lineHeight: 1.4,
      marginLeft: "3rem",
      marginTop: "0.25rem",
    },
    snippetPlaceholder: {
      width: "150px",
      height: "220px",
      backgroundImage: "linear-gradient(135deg, #303f9f 0%, #7b1fa2 100%)",
      borderRadius: "8px",
      marginLeft: "3rem",
      marginTop: "0.5rem",
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
          <button style={styles.backBtn}>
            <FiArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
            MoldyWolf
          </h2>
        </div>

        {/* Profile Banner */}
        <div style={styles.banner} />

        {/* Avatar + Follow Row */}
        <div style={styles.avatarRow}>
          <img 
            src="/api/placeholder/80/80"
            alt="User avatar" 
            style={styles.userAvatar} 
          />
          <button style={styles.followBtn}>Follow</button>
        </div>

        {/* Name & Bio */}
        <div style={styles.nameAndBio}>
          <div style={styles.displayName}>MoldyWolf</div>
          <div style={styles.handle}>@MoldyWolf699</div>
          <p style={styles.bioText}>
            Always looking for new music. Based in LA. #OpenToCollabs
          </p>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>217</span>
            <span style={styles.statLabel}> Following</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>118</span>
            <span style={styles.statLabel}> Followers</span>
          </div>
        </div>

        {/* NEW GENRE COMPLETION SECTION */}
        <div style={styles.genreCompletionSection}>
          <div style={styles.genreSectionTitle}>
            <span>Music Discovery</span>
            <span style={{fontSize: "0.8rem"}}>Completion Status</span>
          </div>
          
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
                          <span>Progress</span>
                          <span>{sub.completion}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
              ...(activeTab === "Stats" ? styles.tabItemActive : {}),
            }}
            onClick={() => setActiveTab("Stats")}
          >
            Stats
          </div>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === "Recents" && (
            <div style={styles.recentsContainer}>
              {randomRecents.map((item) => (
                <div style={styles.recentPost} key={item.id}>
                  <div style={styles.postHeader}>
                    <img 
                      src="/api/placeholder/48/48"
                      style={styles.postAvatar} 
                      alt="avatar" 
                    />
                    <div style={styles.postAuthor}>{item.author}</div>
                  </div>
                  <div style={styles.postText}>{item.text}</div>
                  {item.snippet && <div style={styles.snippetPlaceholder} />}
                  <div style={styles.postActions}>
                    <div style={styles.actionItem}>
                      <FiMessageCircle /> 1
                    </div>
                    <div style={styles.actionItem}>
                      <FiRepeat /> 1
                    </div>
                    <div style={styles.actionItem}>
                      <FiHeart /> 1
                    </div>
                    <div style={styles.actionItem}>
                      <FiShare />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Music controls bar */}
        <div style={styles.musicControls}>
          <div style={styles.musicIconWrapper}>
            <Music size={20} color="#fff" />
          </div>
          <div>
            <div style={styles.musicText}>Start playing music</div>
            <div style={styles.musicSubtext}>Click on any music snippet</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button style={styles.shuffleButton}>
              <Shuffle size={18} color="#fff" />
            </button>
          </div>
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
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}