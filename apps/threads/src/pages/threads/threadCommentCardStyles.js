const threadCommentCardStyles = {
  container: {
    padding: "20px",
    backgroundColor: "#101010",
    borderRadius: "8px",
    marginBottom: "16px",
    border: "1px solid #2a2a2a",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
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
    border: "2px solid #2a2a2a",
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
    color: "#ffffff",
    marginRight: "auto",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
    maxWidth: "calc(100% - 100px)",
  },
  
  timestampRow: {
    display: "flex",
    color: "#666666",
    fontSize: "14px",
    marginBottom: "12px",
  },
  
  commentBody: {
    fontSize: "15px",
    lineHeight: "1.5",
    color: "#dddddd",
    marginBottom: "16px",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  },
  
  snippetContainer: {
    display: "flex",
    flexDirection: "column",
    padding: "12px",
    backgroundColor: "#1a1a1a",
    borderRadius: "6px",
    marginBottom: "16px",
    border: "1px solid #333333",
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
    backgroundColor: "#000000",
    border: "1px solid #333333",
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
    color: "#ffffff",
    marginBottom: "2px",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  
  artistName: {
    fontSize: "14px",
    color: "#999999",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  
  bottomSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
    borderTop: "1px solid #333333",
    paddingTop: "10px",
    flexWrap: "wrap",
    gap: "16px",
  },
  
  actionsRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid #333333",
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
    color: "#999999",
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
    backgroundColor: "#ffffff",
    color: "#000000",
    border: "none",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  
  timeDisplay: {
    fontSize: "14px",
    color: "#999999",
    whiteSpace: "nowrap",
  },
  
  progressContainer: {
    marginBottom: "12px",
    width: "100%",
  },
  
  progressBar: {
    width: "100%",
    height: "4px",
    backgroundColor: "#333333",
    borderRadius: "2px",
    overflow: "hidden",
    position: "relative",
  },
  
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "2px",
    transition: "width 0.2s linear",
  },
  
  ratingValue: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginTop: "6px",
  },
  
  ratingBar: {
    width: "12px",
    height: "100px",
    backgroundColor: "#333333",
    borderRadius: "6px",
    position: "relative",
    overflow: "hidden",
    border: "1px solid #444444",
    flexShrink: 0,
  },
  
  ratingFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    backgroundColor: "#ffffff",
    transition: "height 0.3s ease-out",
  },
};

export default threadCommentCardStyles;