// GroupChatDetailStyles.js - Dark Gradient Cards Design

const GroupChatDetailStyles = {
  // =========================
  // Page Container
  // =========================
  pageContainer: {
    minHeight: '100vh',
    background: '#0a0a0f',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  },

  // =========================
  // Header
  // =========================
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    padding: '16px 20px',
    background: 'linear-gradient(90deg, rgba(255,105,180,0.1), transparent)',
    borderRadius: '16px',
    border: '1px solid rgba(255,105,180,0.2)',
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  backButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },

  headerTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: '#fff',
  },

  headerSubtitle: {
    margin: '2px 0 0',
    color: '#666',
    fontSize: '12px',
  },

  volumeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(255,105,180,0.15)',
    borderRadius: '20px',
    border: '1px solid rgba(255,105,180,0.3)',
  },

  volumeNumber: {
    color: '#10b981',
    fontWeight: 700,
    fontSize: '16px',
  },

  // =========================
  // Post + Stats Row
  // =========================
  postStatsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
  },

  postCard: {
    flex: 1,
    background: 'linear-gradient(145deg, #151520, #1a1a25)',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid rgba(255,105,180,0.15)',
    boxShadow: '0 0 30px rgba(255, 105, 180, 0.1)',
  },

  postHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },

  postAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    objectFit: 'cover',
    border: '2px solid rgba(255,105,180,0.3)',
  },

  postAuthor: {
    color: '#fff',
    fontWeight: 600,
    fontSize: '15px',
  },

  postDate: {
    color: '#555',
    fontSize: '13px',
  },

  postTitle: {
    color: '#ccc',
    fontSize: '15px',
    lineHeight: 1.5,
    margin: '0 0 12px 0',
  },

  postText: {
    color: '#999',
    fontSize: '14px',
    lineHeight: 1.5,
    margin: '0 0 12px 0',
  },

  postImage: {
    width: '100%',
    height: 'clamp(220px, 38vw, 360px)',
    objectFit: 'cover',
    objectPosition: 'center',
    borderRadius: '12px',
    border: '1px solid rgba(255,105,180,0.15)',
    background: 'rgba(0,0,0,0.25)',
    display: 'block',
  },

  // =========================
  // Stats Card (Volume + Genre)
  // =========================
  statsCard: {
    width: '160px',
    background: 'linear-gradient(145deg, #151520, #1a1a25)',
    borderRadius: '20px',
    padding: '16px',
    border: '1px solid rgba(255,105,180,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  volumeSection: {
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },

  volumeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  volumeLabel: {
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
  },

  volumeChange: {
    marginLeft: 'auto',
    color: '#10b981',
    fontSize: '15px',
    fontWeight: 700,
  },

  genreSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  genreRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  genreTag: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
  },

  genreChange: {
    color: '#10b981',
    fontSize: '13px',
    fontWeight: 700,
  },

  // =========================
  // Chat Container
  // =========================
  chatContainer: {
    background: 'linear-gradient(145deg, #0d0d12, #12121a)',
    borderRadius: '24px',
    border: '1px solid rgba(255,105,180,0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '560px',
    height: 'calc(100vh - 420px)',
  },

  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },

  chatHeaderText: {
    color: '#666',
    fontSize: '13px',
  },

  toolButtons: {
    display: 'flex',
    gap: '8px',
  },

  toolButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid rgba(255,105,180,0.3)',
    color: '#ff69b4',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s',
  },

  // =========================
  // Users Panel
  // =========================
  usersPanel: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,105,180,0.03)',
  },

  usersPanelScroll: {
    display: 'flex',
    gap: '16px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },

  userCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    minWidth: '70px',
  },

  userAvatarWrapper: {
    position: 'relative',
  },

  userAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255,105,180,0.3)',
  },

  userOnlineIndicator: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid #0d0d12',
  },

  userNameSmall: {
    color: '#aaa',
    fontSize: '11px',
    textAlign: 'center',
    maxWidth: '60px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // =========================
  // Music Panel
  // =========================
  musicPanel: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,105,180,0.03)',
  },

  searchInputWrapper: {
    display: 'flex',
    gap: '8px',
  },

  searchInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,105,180,0.2)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },

  searchInputDisabled: {
    opacity: 0.65,
    cursor: 'not-allowed',
  },

  searchButton: {
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #ff69b4, #ff1493)',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchButtonDisabled: {
    background: 'rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'not-allowed',
  },

  searchResults: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  searchResultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '12px',
  },

  searchResultArtwork: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: '#333',
    display: 'block',
    objectFit: 'cover',
    flexShrink: 0,
  },

  searchResultInfo: {
    flex: 1,
    minWidth: 0,
  },

  searchResultName: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  searchResultArtist: {
    color: '#666',
    fontSize: '11px',
  },

  addButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    background: '#ff69b4',
    border: 'none',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  notice: {
    marginTop: '12px',
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    lineHeight: 1.4,
  },

  noticeWarning: {
    color: '#ffd7e8',
    background: 'rgba(255,105,180,0.12)',
    border: '1px solid rgba(255,105,180,0.2)',
  },

  noticeInfo: {
    color: '#cbd5e1',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  },

  // =========================
  // Messages Area
  // =========================
  messagesArea: {
    padding: '16px 20px',
    overflowY: 'auto',
    flex: 1,
    minHeight: '360px',
    maxHeight: 'none',
  },

  joinMessage: {
    textAlign: 'center',
    color: '#444',
    fontSize: '12px',
    marginBottom: '16px',
    padding: '8px',
  },

  emptyState: {
    textAlign: 'center',
    color: '#777',
    fontSize: '13px',
    padding: '24px 12px',
  },

  // =========================
  // Message Styles
  // =========================
  messageContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },

  sentMessageContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },

  avatarColumn: {
    position: 'relative',
    flexShrink: 0,
  },

  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
  },

  onlineIndicator: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '10px',
    height: '10px',
    background: '#00ff88',
    borderRadius: '50%',
    border: '2px solid #12121a',
  },

  chatBubbleWrapper: {
    flex: 1,
    maxWidth: '75%',
  },

  sentChatBubbleWrapper: {
    maxWidth: '75%',
  },

  messageAuthor: {
    color: '#ff69b4',
    fontWeight: 600,
    fontSize: '13px',
    marginBottom: '4px',
  },

  replyContainer: {
    marginBottom: '4px',
  },

  replyingTo: {
    color: '#555',
    fontSize: '11px',
  },

  chatBubble: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    borderTopLeftRadius: '4px',
    padding: '12px 16px',
  },

  sentChatBubble: {
    background: 'linear-gradient(135deg, #ff69b4, #ff1493)',
    borderRadius: '16px',
    borderTopRightRadius: '4px',
    padding: '12px 16px',
  },

  messageBody: {
    margin: 0,
    color: '#ddd',
    fontSize: '14px',
    lineHeight: 1.5,
  },

  messageTime: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: '11px',
    marginTop: '6px',
    textAlign: 'right',
  },

  // =========================
  // Snippet in Message
  // =========================
  snippetContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
    padding: '10px 12px',
    background: 'linear-gradient(90deg, rgba(255,105,180,0.15), transparent)',
    borderRadius: '10px',
    borderLeft: '3px solid #ff69b4',
  },

  snippetArtwork: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    objectFit: 'cover',
  },

  snippetInfo: {
    flex: 1,
    minWidth: 0,
  },

  snippetTitle: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  snippetArtist: {
    color: '#ff69b4',
    fontSize: '11px',
  },

  playButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#ff69b4',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },

  playButtonDisabled: {
    background: 'rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'not-allowed',
  },

  // =========================
  // Typing Indicator
  // =========================
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#555',
    fontSize: '12px',
    padding: '8px 0',
  },

  typingAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    overflow: 'hidden',
  },

  typingDots: {
    display: 'flex',
    gap: '3px',
    marginLeft: '4px',
  },

  typingDot: {
    width: '5px',
    height: '5px',
    background: '#ff69b4',
    borderRadius: '50%',
  },

  // =========================
  // Attached Preview
  // =========================
  attachedPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    background: 'rgba(255,105,180,0.1)',
    borderTop: '1px solid rgba(255,105,180,0.2)',
  },

  attachedArtwork: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    objectFit: 'cover',
  },

  attachedInfo: {
    flex: 1,
  },

  attachedName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
  },

  attachedArtist: {
    color: '#ff69b4',
    fontSize: '12px',
  },

  removeAttachment: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // =========================
  // Input Area
  // =========================
  inputArea: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(0,0,0,0.2)',
  },

  messageInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },

  sendButton: {
    padding: '12px 24px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #ff69b4, #ff1493)',
    border: 'none',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },

  // =========================
  // Scroll Button
  // =========================
  scrollButton: {
    position: 'fixed',
    bottom: '100px',
    right: '30px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff69b4, #ff1493)',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255,105,180,0.4)',
    zIndex: 100,
  },

  // =========================
  // Loading State
  // =========================
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0a0a0f',
    color: '#fff',
  },

  loadingSpinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderTop: '4px solid #ff69b4',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },

  loadingText: {
    fontSize: '18px',
    fontWeight: 500,
    color: '#ff69b4',
  },
};

export default GroupChatDetailStyles;
