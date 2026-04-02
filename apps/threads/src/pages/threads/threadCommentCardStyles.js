const threadCommentCardStyles = {
  container: {
    padding: "20px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "16px",
    marginBottom: "16px",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
    backdropFilter: "blur(12px)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "12px",
    width: "100%",
  },
  
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(99, 102, 241, 0.3)",
    flexShrink: 0,
  },
  
  contentContainer: {
    flex: 1,
    minWidth: 0,
    width: "calc(100% - 52px)",
  },
  
  authorRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "2px",
    flexWrap: "wrap",
  },
  
  authorName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#f1f5f9",
    marginRight: "auto",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
    maxWidth: "calc(100% - 100px)",
  },
  
  timestampRow: {
    display: "flex",
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "12px",
  },
  
  commentBody: {
    fontSize: "15px",
    lineHeight: "1.5",
    color: "#cbd5e1",
    marginBottom: "16px",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  },
  
  snippetContainer: {
    display: "flex",
    flexDirection: "column",
    padding: "12px",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: "12px",
    marginBottom: "16px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    width: "100%",
    boxSizing: "border-box",
  },
  
  snippetHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  
  songInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    maxWidth: "100%",
    flexGrow: 1,
  },
  
  albumArt: {
    width: "48px",
    height: "48px",
    backgroundColor: "#0a0e1a",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  
  songDetails: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    flex: 1,
  },
  
  songTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "2px",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  
  artistName: {
    fontSize: "14px",
    color: "#64748b",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  
  bottomSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    paddingTop: "10px",
    flexWrap: "wrap",
    gap: "16px",
  },
  
  actionsRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    width: "100%",
    flexWrap: "wrap",
    gap: "10px",
  },

  controlsSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap",
    width: "100%",
  },
  
  ratingSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "nowrap",
  },

  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#94a3b8",
    cursor: "pointer",
    transition: "color 0.2s ease, transform 0.2s ease",
    backgroundColor: "transparent",
    border: "none",
    padding: "0",
    minWidth: "60px",
  },
  
  playButton: {
    width: "36px",
    height: "36px",
    backgroundColor: "#f1f5f9",
    color: "#0a0e1a",
    border: "none",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  
  timeDisplay: {
    fontSize: "14px",
    color: "#64748b",
    whiteSpace: "nowrap",
  },
  
  progressContainer: {
    marginBottom: "12px",
    width: "100%",
  },
  
  progressBar: {
    width: "100%",
    height: "4px",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: "2px",
    overflow: "hidden",
    position: "relative",
  },
  
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: "2px",
    transition: "width 0.2s linear",
  },
  
  ratingValue: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#f1f5f9",
    textAlign: "center",
    marginTop: "6px",
  },
  
  ratingBar: {
    width: "12px",
    height: "100px",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: "6px",
    position: "relative",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    flexShrink: 0,
  },
  
  ratingFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    backgroundColor: "#6366f1",
    transition: "height 0.3s ease-out",
  },
};

export default threadCommentCardStyles;