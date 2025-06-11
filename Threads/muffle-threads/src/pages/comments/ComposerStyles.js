// src/styles/ComposerStyles.js
const ComposerStyles = {
    commentBox: {
      display: "flex",
      backgroundColor: "#1a1a1a",
      padding: "0.75rem",
      borderTop: "1px solid #333",
      gap: "0.75rem",
    },
    avatarSmall: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      objectFit: "cover",
    },
    composerBody: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    },
    commentInputArea: {
      width: "100%",
      backgroundColor: "#2b2b2b",
      border: "1px solid #444",
      borderRadius: "6px",
      padding: "0.5rem",
      color: "#fff",
      resize: "none",
      outline: "none",
      fontSize: "1rem",
    },
    composerActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "0.5rem",
    },
    postButton: {
      backgroundColor: "#1d9bf0",
      border: "none",
      borderRadius: "6px",
      padding: "0.5rem 1rem",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "background 0.2s ease",
      ":hover": {
        backgroundColor: "#18a247",
      },
    },
  };
  
  export default ComposerStyles;
  