// ThreadDetailStyles.js — Glassmorphic Editorial Design

const ThreadDetailStyles = {
  // =========================
  // Main Container
  // =========================
  container: {
    backgroundColor: "#0a0e1a",
    background: "linear-gradient(165deg, #0a0e1a 0%, #111827 40%, #0f172a 100%)",
    color: "#fff",
    minHeight: "100vh",
    maxWidth: "1200px",
    width: "92%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
  // Header — frosted glass bar
  // =========================
  header: {
    display: "flex",
    alignItems: "center",
    padding: "18px 20px",
    position: "sticky",
    top: 0,
    backgroundColor: "rgba(10, 14, 26, 0.6)",
    backdropFilter: "blur(24px) saturate(1.4)",
    zIndex: 20,
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    width: "100%",
  },
  
  backBtn: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#e2e8f0",
    cursor: "pointer",
    padding: 0,
    marginRight: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s, transform 0.1s",
    backdropFilter: "blur(8px)",
    boxShadow: "none",
  },

  headerTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: "#94a3b8",
  },

  // Music icon badge in header
  headerMusicBadge: {
    marginLeft: "auto",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #ec4899)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 2px 12px rgba(99, 102, 241, 0.3)",
  },
  
  // =========================
  // Main Post Card — frosted glass
  // =========================
  postCard: {
    padding: "0",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    backgroundImage: "none",
    borderRadius: "20px",
    margin: "20px auto",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
    backdropFilter: "blur(20px)",
    width: "calc(100% - 32px)",
    maxWidth: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    position: "relative",
  },
  
  originalPosterContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "18px 20px 14px",
    position: "relative",
    zIndex: 1,
  },
  
  opAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(99, 102, 241, 0.4)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    background: "#1e293b",
  },
  
  opDetails: {
    display: "flex",
    flexDirection: "column",
  },
  
  opUsername: {
    fontWeight: "700",
    fontSize: "15px",
    color: "#f1f5f9",
    marginBottom: "2px",
  },
  
  opTimestamp: {
    fontSize: "12px",
    color: "#64748b",
  },
  
  postImage: {
    width: "100%", 
    maxHeight: "500px",
    objectFit: "contain",
    borderRadius: "14px",
    display: "block",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(10, 14, 26, 0.6)",
    marginTop: "0",
    marginBottom: "0",
    boxShadow: "none",
  },
  
  // Stats row with pill badges
  statsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: "100%",
    marginTop: "0",
    padding: "14px 20px 18px",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    color: "#94a3b8",
  },
  
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: "13px",
    fontWeight: "600",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  
  // Tab controls — glassmorphic capsule
  graphControls: {
    display: "flex",
    gap: "8px",
    padding: "6px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    margin: "0",
    backgroundColor: "transparent",
    width: "100%",
    boxSizing: "border-box",
  },
  
  activeTab: {
    flex: 1,
    padding: "12px 16px",
    cursor: "pointer",
    color: "#e0e7ff",
    fontWeight: "700",
    position: "relative",
    textAlign: "center",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(236, 72, 153, 0.15))",
    boxShadow: "0 0 0 1px rgba(99, 102, 241, 0.4), 0 8px 20px rgba(0, 0, 0, 0.2)",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    outline: "none",
  },
  
  inactiveTab: {
    flex: 1,
    padding: "12px 16px",
    cursor: "pointer",
    color: "#64748b",
    width: "100%",
    textAlign: "center",
    transition: "all 0.2s ease",
    borderRadius: "999px",
    border: "none",
    background: "transparent",
    boxShadow: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "700",
    outline: "none",
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
    width: "calc(100% - 32px)",
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
    width: "calc(100% - 32px)",
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
    border: "2px solid rgba(99, 102, 241, 0.3)",
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
    backgroundColor: "rgba(10, 14, 26, 0.9)",
    backdropFilter: "blur(12px)",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
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
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: "#94a3b8",
    margin: "16px 0",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    background: "none",
    backgroundClip: "unset",
    WebkitBackgroundClip: "unset",
    WebkitTextFillColor: "unset",
  },
  
  // Enhanced comment box
  commentBox: {
    padding: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    marginTop: "16px",
    marginBottom: "16px",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
    width: "100%",
  },
  
  avatarSmall: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(99, 102, 241, 0.3)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  
  commentInputArea: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
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
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "9999px",
    padding: "10px 20px",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "15px",
    transition: "background-color 0.2s, transform 0.2s",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  },
  
  // =========================
  // Search / Snippet
  // =========================
  searchBox: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "16px",
    padding: "12px",
    margin: "16px",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    backdropFilter: "blur(20px)",
    display: "flex",
    gap: "8px",
    width: "calc(100% - 32px)",
  },
  
  searchInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "12px",
    color: "#e7e9ea",
    fontSize: "16px",
    outline: "none",
  },
  
  searchButton: {
    backgroundColor: "#6366f1",
    border: "none",
    borderRadius: "12px",
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
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "16px",
    padding: "12px",
    margin: "0 16px 16px",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    width: "calc(100% - 32px)",
  },
  
  resultLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  
  resultArtwork: {
    width: "60px",
    height: "60px",
    borderRadius: "12px",
    objectFit: "contain",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    backgroundColor: "rgba(10, 14, 26, 0.5)",
  },
  
  resultInfo: {
    display: "flex",
    flexDirection: "column",
  },
  
  resultTitle: {
    color: "#f1f5f9",
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  
  resultArtist: {
    color: "#64748b",
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
    backgroundColor: "#6366f1",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 12px rgba(99, 102, 241, 0.3)",
    transition: "transform 0.2s, background-color 0.2s",
  },
  
  attachButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#6366f1",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 12px rgba(99, 102, 241, 0.3)",
    transition: "transform 0.2s, background-color 0.2s",
  },
  
  // Snippet preview styles
  snippetPreview: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "16px",
    padding: "12px",
    marginBottom: "12px",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    width: "100%",
  },
  
  snippetArt: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    objectFit: "contain",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    backgroundColor: "rgba(10, 14, 26, 0.5)",
  },
  
  snippetInfo: {
    flex: 1,
    paddingLeft: "12px",
  },
  
  snippetName: {
    color: "#f1f5f9",
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  
  snippetArtist: {
    color: "#64748b",
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
    backgroundColor: "rgba(99, 102, 241, 0.8)",
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
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    backdropFilter: "blur(12px)",
    width: "calc(100% - 32px)",
  },
  
  loadingSpinner: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "3px solid rgba(99, 102, 241, 0.3)",
    borderTopColor: "#6366f1",
    margin: "16px auto",
    animation: "spin 1s linear infinite",
  },
  
  loadingText: {
    color: "#94a3b8",
    fontSize: "16px"
  }
};

export default ThreadDetailStyles;