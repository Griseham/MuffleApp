// src/styles/CommentStyles.js
const CommentStyles = {
    commentCard: {
      display: "flex",
      flexDirection: "row",
      gap: "0.75rem",
      padding: "0.75rem",
      borderBottom: "1px solid #2a2a2a",
      borderTop: "1px solid #2a2a2a",
      backgroundColor: "#191919",
      transition: "background 0.2s ease",
    },
    tweetAvatar: {
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      objectFit: "cover",
    },
    tweetContent: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
    },
    tweetHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    tweetUsername: {
      fontSize: "1rem",
      fontWeight: "bold",
      color: "#fff",
    },
    tweetTimestamp: {
      fontSize: "0.85rem",
      color: "#888",
    },
    tweetBody: {
      marginTop: "4px",
      fontSize: "0.95rem",
      lineHeight: 1.4,
      color: "#ddd",
      wordBreak: "break-word",
    },
  };
  
  export default CommentStyles;
  