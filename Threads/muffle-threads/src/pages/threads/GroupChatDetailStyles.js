const GroupChatDetailStyles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "calc(90vh - 160px)", // Adjusted for header and tabs
    background: "linear-gradient(135deg, rgba(30, 14, 36, 0.95) 0%, rgba(50, 10, 60, 0.9) 100%)", // Pinkish purple glow
    color: "#FFF",
    padding: "1rem",
    borderRadius: "16px",
    boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.4)",
    position: "relative",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 150, 220, 0.15)",
    margin: "16px 0",
  },
  
  chatAreaContainer: {
    flex: 1,
    position: "relative",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "inset 0 0 20px rgba(255, 100, 255, 0.1)",
    background: "rgba(18, 10, 23, 0.7)",
    marginBottom: "1rem",
  },
  
  chatArea: {
    flex: 1,
    height: "100%",
    overflowY: "auto",
    padding: "1rem",
    display: "flex",
    flexDirection: "column", // Reverse to show new messages from bottom
    scrollBehavior: "smooth",
  },
  
  // Background glow effect
  glowOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "150px",
    background: "linear-gradient(to top, rgba(255, 100, 200, 0.1), transparent)",
    pointerEvents: "none",
    zIndex: 1,
  },
  
  // Message containers
  messageContainer: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "0.8rem",
    position: "relative",
    opacity: 1,
    transform: "translateY(0)",
    transition: "opacity 0.3s, transform 0.3s",
    animation: "fadeIn 0.3s ease-out",
    zIndex: 2,
  },
  
  sentMessageContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "0.8rem",
    position: "relative",
    opacity: 1,
    transform: "translateY(0)",
    transition: "opacity 0.3s, transform 0.3s",
    animation: "fadeIn 0.3s ease-out",
    zIndex: 2,
  },
  
  // Avatar styling
  avatarColumn: {
    marginRight: "0.8rem",
    position: "relative",
  },
  
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "2px solid rgba(255, 150, 220, 0.3)",
    boxShadow: "0 0 10px rgba(255, 100, 255, 0.2)",
    objectFit: "cover",
    transition: "transform 0.2s",
    ":hover": {
      transform: "scale(1.05)",
    },
  },
  
  // Online indicator
  onlineIndicator: {
    position: "absolute",
    bottom: "2px",
    right: "2px",
    width: "12px",
    height: "12px",
    backgroundColor: "#4bdc39",
    borderRadius: "50%",
    border: "2px solid rgba(18, 10, 23, 0.8)",
    zIndex: 3,
  },
  
  // Message bubble styles
  chatBubbleWrapper: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "75%",
    alignSelf: "flex-start",
  },
  
  chatBubble: {
    backgroundColor: "rgba(40, 20, 60, 0.8)",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "18px",
    wordBreak: "break-word",
    textAlign: "left",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 150, 220, 0.15)",
    backdropFilter: "blur(8px)",
  },
  
  sentChatBubbleWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    maxWidth: "75%",
  },
  
  sentChatBubble: {
    background: "linear-gradient(135deg, #d53f8c 0%, #b83280 100%)",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "18px 18px 0 18px",
    wordBreak: "break-word",
    textAlign: "left",
    boxShadow: "0 4px 12px rgba(213, 63, 140, 0.3)",
  },
  
  // System messages
  systemText: {
    textAlign: "center",
    fontSize: "0.9rem",
    fontStyle: "italic",
    color: "#d393e3",
    padding: "10px 20px",
    margin: "10px auto",
    backgroundColor: "rgba(255, 150, 220, 0.1)",
    borderRadius: "20px",
    maxWidth: "80%",
    border: "1px solid rgba(255, 150, 220, 0.1)",
  },
  
  // Reply styling
  replyContainer: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: "6px 10px",
    borderRadius: "10px",
    marginBottom: "6px",
    gap: "8px",
  },
  
  replyingToAvatar: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "1px solid rgba(255, 150, 220, 0.3)",
  },
  
  replyingTo: {
    fontSize: "0.85rem",
    color: "#d393e3",
    fontStyle: "italic",
  },
  
  // Message content
  messageBody: {
    margin: 0,
    color: "#fff",
    fontSize: "0.95rem",
    lineHeight: "1.5",
  },
  
  messageAuthor: {
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: "#d8a6e6",
    marginBottom: "4px",
  },
  
  messageTime: {
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: "4px",
    textAlign: "right",
  },
  
  // Input area
  inputContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "rgba(50, 20, 60, 0.8)",
    padding: "1rem",
    borderRadius: "16px",
    gap: "0.75rem",
    border: "1px solid rgba(255, 150, 220, 0.2)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    zIndex: 5,
  },
  
  messageRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "0.75rem",
  },
  
  inputBox: {
    flex: 1,
    backgroundColor: "rgba(30, 15, 40, 0.6)",
    border: "1px solid rgba(255, 150, 220, 0.2)",
    color: "#FFF",
    resize: "none",
    fontSize: "1rem",
    padding: "0.8rem",
    borderRadius: "12px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    ":focus": {
      borderColor: "rgba(255, 150, 220, 0.4)",
      boxShadow: "0 0 0 2px rgba(255, 150, 220, 0.1)",
    },
  },
  
  sendButton: {
    backgroundColor: "#d53f8c",
    color: "#FFF",
    border: "none",
    padding: "0.75rem 1.25rem",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.2s ease-in-out",
    boxShadow: "0 4px 10px rgba(213, 63, 140, 0.3)",
    ":hover": {
      backgroundColor: "#b83280",
      transform: "translateY(-2px)",
    },
    ":active": {
      transform: "translateY(1px)",
    },
  },
  
  // Music snippet styling
  snippetContainer: {
    marginTop: "0.8rem",
    backgroundColor: "rgba(30, 15, 40, 0.8)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    border: "1px solid rgba(255, 150, 220, 0.2)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  
  snippetArtwork: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 150, 220, 0.2)",
    objectFit: "contain",
    backgroundColor: "rgba(30, 15, 40, 0.5)",
  },
  
  snippetInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  
  snippetTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: "0.95rem",
    marginBottom: "2px",
  },
  
  snippetArtist: {
    color: "#d393e3",
    fontSize: "0.85rem",
  },
  
  playButton: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#d53f8c",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(213, 63, 140, 0.3)",
    transition: "transform 0.2s, background-color 0.2s",
    ":hover": {
      transform: "scale(1.1)",
      backgroundColor: "#b83280",
    },
  },
  
  // Attachment preview
  attachmentPreview: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    backgroundColor: "rgba(30, 15, 40, 0.7)",
    borderRadius: "12px",
    padding: "0.75rem",
    border: "1px solid rgba(255, 150, 220, 0.2)",
    marginBottom: "0.5rem",
  },
  
  removeButton: {
    marginLeft: "auto",
    backgroundColor: "rgba(40, 20, 60, 0.8)",
    color: "#FFF",
    border: "none",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "0.85rem",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "rgba(213, 63, 140, 0.3)",
    },
  },
  
  // Users section styling
  usersContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "16px",
    padding: "20px",
    backgroundColor: "rgba(30, 15, 40, 0.8)",
    borderRadius: "16px",
    marginTop: "16px",
    border: "1px solid rgba(255, 150, 220, 0.2)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  
  userMinimal: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px",
    transition: "transform 0.2s ease",
    cursor: "pointer",
    ":hover": {
      transform: "translateY(-2px)",
    },
  },
  
  userAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(255, 150, 220, 0.3)",
    boxShadow: "0 2px 8px rgba(213, 63, 140, 0.2)",
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

  noUsersText: {
    color: "#d393e3",
    textAlign: "center",
    padding: "20px",
    fontStyle: "italic",
  },
  
  addMoreButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "rgba(213, 63, 140, 0.3)",
    border: "2px dashed rgba(255, 150, 220, 0.4)",
    cursor: "pointer",
    transition: "background-color 0.2s, transform 0.2s",
    ":hover": {
      background: "rgba(213, 63, 140, 0.5)",
      transform: "scale(1.05)",
    },
  },
  
  addMoreText: {
    color: "#fff",
    fontSize: "12px",
    fontWeight: "bold",
  },
  
  // Tools and feature buttons
  toolsContainer: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
    justifyContent: "flex-end",
  },
  
  toolButton: {
    backgroundColor: "rgba(30, 15, 40, 0.6)",
    color: "#d393e3",
    border: "1px solid rgba(255, 150, 220, 0.2)",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "rgba(213, 63, 140, 0.2)",
      transform: "translateY(-2px)",
    },
  },
  
  // Animation keyframes
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
  
  // Typing indicator
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    padding: "8px 16px",
    fontSize: "0.9rem",
    color: "#d393e3",
    fontStyle: "italic",
  },
  
  // Skeleton loader for messages
  messageSkeleton: {
    backgroundColor: "rgba(40, 20, 60, 0.4)",
    height: "80px",
    borderRadius: "18px",
    marginBottom: "16px",
    width: "70%",
    animation: "pulse 1.5s infinite",
  },
  
  '@keyframes pulse': {
    '0%': {
      opacity: 0.6,
    },
    '50%': {
      opacity: 0.3,
    },
    '100%': {
      opacity: 0.6,
    },
  },
};
  
  export default GroupChatDetailStyles;
  