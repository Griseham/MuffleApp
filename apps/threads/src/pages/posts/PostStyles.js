// src/styles/PostStyles.js
const PostStyles = {
    postCard: {
      padding: "1rem 1.25rem",
      backgroundColor: "#1a1a1a",
      borderBottom: "1px solid #333",
      borderRadius: "0px",
      marginBottom: "0px",
    },
    originalPosterContainer: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      marginBottom: "0.5rem",
    },
    opAvatar: {
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      objectFit: "cover",
    },
    opDetails: {
      display: "flex",
      flexDirection: "column",
    },
    opUsername: {
      fontWeight: "bold",
      fontSize: "1rem",
      color: "#fff",
    },
    opTimestamp: {
      fontSize: "0.85rem",
      color: "#888",
      marginLeft: "auto",
    },
    postImage: {
      width: "100%",
      borderRadius: "10px",
      marginTop: "0.5rem",
      transition: "transform 0.2s ease-in-out",
    },
    groupChatImage: {
      width: "50%",
      borderRadius: "10px",
      marginTop: "0.5rem",
      transition: "transform 0.2s ease-in-out",
    },
    statsRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1.8rem",
      marginTop: "0.75rem",
      color: "#9e9e9e",
      fontSize: "1.1rem",
      padding: "10px 0",
      borderTop: "1px solid rgba(255,255,255,0.1)",
    },
    statItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      cursor: "pointer",
      transition: "color 0.2s ease, transform 0.2s ease",
      ":hover": {
        color: "#fff",
        transform: "scale(1.1)",
      },
    },
  };
  
  export default PostStyles;
  