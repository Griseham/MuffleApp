// ThreadDetailStyles.js

const ThreadDetailStyles = {
  // =========================
  // Main Container
  // =========================
  container: {
    backgroundColor: "#0c111b",
    color: "#fff",
    minHeight: "100vh",
    maxWidth: "1200px",
    width: "92%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflowX: "hidden",
    padding: "0 0 20px 0",
    position: "relative",
    opacity: 1,
    transform: "scale(1)",
    transition: "opacity 0.3s ease, transform 0.3s ease",
    zIndex: 1
  },
  
  containerHidden: {
    opacity: 0,
    transform: "scale(0.98)"
  },
  
  // =========================
  // Header
  // =========================
  header: {
    display: "flex",
    alignItems: "center",
    padding: "16px",
    position: "sticky",
    top: 0,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(12px)",
    zIndex: 20,
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    width: "100%",
  },
  
  backBtn: {
    background: "rgba(30, 39, 50, 0.8)",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    padding: "10px",
    marginRight: "20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s, transform 0.1s",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },

  headerTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(45deg, #9c27b0, #3f51b5)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  
  // =========================
  // Main Post Card
  // =========================
  postCard: {
    padding: "24px",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    backgroundImage: "linear-gradient(to bottom, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.7) 100%)",
    borderRadius: "16px",
    margin: "16px auto",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    backdropFilter: "blur(12px)",
    width: "calc(100% - 32px)",
    maxWidth: "100%",
    boxSizing: "border-box"
  },
  
  originalPosterContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
  },
  
  opAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(29, 155, 240, 0.3)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  
  opDetails: {
    display: "flex",
    flexDirection: "column",
  },
  
  opUsername: {
    fontWeight: "700",
    fontSize: "16px",
    color: "#fff",
    marginBottom: "4px",
  },
  
  opTimestamp: {
    fontSize: "14px",
    color: "#8899a6",
  },
  
  postImage: {
    width: "100%", 
    maxHeight: "500px",
    objectFit: "contain",
    borderRadius: "16px",
    marginTop: "16px",
    marginBottom: "20px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(15, 23, 42, 0.3)",
  },
  
  // Stats row with improved icons
  statsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    // Adjusted to allow more space for larger containers
    maxWidth: "480px",
    marginTop: "16px",
    color: "#a9b6fc",
    padding: "16px 0",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
  },
  
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    transition: "color 0.2s ease, transform 0.1s",
    fontSize: "15px",
    fontWeight: "500",
    padding: "8px 12px",
    borderRadius: "8px",
    hoverBackground: "rgba(255, 255, 255, 0.05)",
  },
  
  // Twitter-style tabs
  graphControls: {
    display: "flex",
    justifyContent: "space-around",
    borderBottom: "1px solid rgb(47, 51, 54)",
    margin: "0",
    backgroundColor: "rgb(0, 0, 0)",
    width: "100%",
  },
  
  activeTab: {
    padding: "16px 0",
    cursor: "pointer",
    color: "#fff",
    fontWeight: "700",
    position: "relative",
    width: "33.33%",
    textAlign: "center",
    borderBottom: "4px solid #1d9bf0",
    transition: "all 0.3s ease",
  },
  
  inactiveTab: {
    padding: "16px 0",
    cursor: "pointer",
    color: "#8899a6",
    width: "33.33%",
    textAlign: "center",
    transition: "all 0.3s ease",
    borderBottom: "4px solid transparent",
  },
  
  tabText: {
    margin: 0,
    fontSize: "15px",
  },
  
  // Graph containers
  graphContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    padding: "16px",
    backgroundColor: "rgba(15, 23, 42, 0.3)",
    borderRadius: "16px",
    margin: "16px 0",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    width: "calc(100% - 32px)", // Adjusted width calculation
  },
  
  graphCard: {
    padding: "16px",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: "12px",
    cursor: "pointer",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  
  graphTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "8px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    paddingBottom: "8px",
  },
  
  // =========================
  // Users / Artists
  // =========================
  usersContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "16px",
    padding: "20px",
    background: "rgba(15, 23, 42, 0.4)",
    borderRadius: "16px",
    marginTop: "16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    width: "calc(100% - 32px)", // Adjusted width calculation
  },
  
  userMinimal: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px",
    transition: "transform 0.2s ease",
    cursor: "pointer",
  },
  
  userAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(29, 155, 240, 0.3)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  
  userName: {
    fontSize: "14px",
    color: "#fff",
    textAlign: "center",
    maxWidth: "70px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    marginTop: "8px",
    fontWeight: "500",
  },
  
  // =========================
  // Action bar
  // =========================
  actionBarContainer: {
    backgroundColor: "rgba(12, 17, 27, 0.9)",
    backdropFilter: "blur(12px)",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    width: "100%",
  },
  
  actionButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    cursor: "pointer",
  },
  
  actionIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "rgba(30, 39, 50, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "transform 0.2s, background-color 0.2s",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  
  tiktokIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #ee1d52 0%, #ff003f 25%, #25f4ee 100%)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    transition: "transform 0.2s",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  },
  
  iconLabel: {
    fontSize: "12px",
    color: "#8899a6",
    marginTop: "4px",
  },
  
  // =========================
  // Comments Section
  // =========================
  commentsSection: {
    display: "flex",
    flexDirection: "column",
    width: "calc(100% - 32px)",
    padding: "0 16px",
    margin: "0 auto",
    maxWidth: "100%",
    boxSizing: "border-box"
  },
  
  commentsHeader: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff",
    margin: "16px 0",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    background: "linear-gradient(45deg, #9c27b0, #3f51b5)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  
  // Enhanced comment box
  commentBox: {
    padding: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    marginTop: "16px",
    marginBottom: "16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 32px rgba(31, 38, 135, 0.1)",
    width: "100%", // Full width of the container
  },
  
  avatarSmall: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(29, 155, 240, 0.3)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  
  commentInputArea: {
    width: "100%",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "12px",
    color: "#e7e9ea",
    resize: "none",
    outline: "none",
    fontSize: "16px",
    lineHeight: "24px",
    minHeight: "60px",
    transition: "border-color 0.2s ease",
  },
  
  composerBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  
  composerActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "8px",
  },
  
  postButton: {
    background: "linear-gradient(45deg, #1e40af, #3b82f6)",
    border: "none",
    borderRadius: "9999px",
    padding: "10px 20px",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "15px",
    transition: "background-color 0.2s, transform 0.2s",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  },
  
  // =========================
  // Search / Snippet
  // =========================
  searchBox: {
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: "12px",
    padding: "12px",
    margin: "16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    display: "flex",
    gap: "8px",
    width: "calc(100% - 32px)", // Adjusted width calculation
  },
  
  searchInput: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "12px",
    color: "#e7e9ea",
    fontSize: "16px",
    outline: "none",
  },
  
  searchButton: {
    backgroundColor: "#1d9bf0",
    border: "none",
    borderRadius: "8px",
    padding: "0 16px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  
  // Search result styles
  searchResult: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: "12px",
    padding: "12px",
    margin: "0 16px 16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    width: "calc(100% - 32px)", // Adjusted width calculation
  },
  
  resultLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  
  resultArtwork: {
    width: "60px",
    height: "60px",
    borderRadius: "8px",
    objectFit: "contain",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  
  resultInfo: {
    display: "flex",
    flexDirection: "column",
  },
  
  resultTitle: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  
  resultArtist: {
    color: "#8899a6",
    fontSize: "14px",
  },
  
  resultActions: {
    display: "flex",
    gap: "8px",
  },
  
  playButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#1db954",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    transition: "transform 0.2s, background-color 0.2s",
  },
  
  attachButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#1d9bf0",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    transition: "transform 0.2s, background-color 0.2s",
  },
  
  // Snippet preview styles
  snippetPreview: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    width: "100%",
  },
  
  snippetArt: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    objectFit: "contain",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  
  snippetInfo: {
    flex: 1,
    paddingLeft: "12px",
  },
  
  snippetName: {
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  
  snippetArtist: {
    color: "#8899a6",
    fontSize: "13px",
  },
  
  removeButton: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
  },
  
  // =========================
  // Status indicators
  // =========================
  cacheIndicator: {
    position: "absolute",
    top: "16px",
    right: "16px",
    backgroundColor: "rgba(29, 78, 216, 0.8)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
    zIndex: 50,
    backdropFilter: "blur(8px)"
  },
  
  loadingContainer: {
    padding: "1rem",
    textAlign: "center",
    margin: "32px 16px",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    width: "calc(100% - 32px)", // Adjusted width calculation
  },
  
  loadingSpinner: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "3px solid rgba(29, 155, 240, 0.3)",
    borderTopColor: "#1d9bf0",
    margin: "16px auto",
    animation: "spin 1s linear infinite",
  },
  
  loadingText: {
    color: "#fff",
    fontSize: "16px"
  }
};

export default ThreadDetailStyles;