// styles.js - Mobile responsive starfield component styles
import { WINDOWED_WIDTH, WINDOWED_HEIGHT } from './utils';

// Mobile detection utility
const isMobile = () => window.innerWidth <= 768;

const styles = {
    searchContainer: {
        padding: '0.75rem',
        backgroundColor: 'rgba(20, 20, 40, 0.7)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      },
      searchInputGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem'
      },
      searchInput: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        color: '#fff',
        padding: '0.6rem 0.8rem',
        fontSize: '0.9rem',
        outline: 'none'
      },
      searchButton: {
        backgroundColor: 'rgba(29, 155, 240, 0.8)',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '0.6rem 1rem',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer'
      },
      searchButtonDisabled: {
        opacity: 0.6,
        cursor: 'default'
      },
      searchResults: {
        maxHeight: '150px',
        overflowY: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '8px',
        marginBottom: '0.75rem'
      },
      searchResultItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem 0.75rem',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'background-color 0.2s'
      },
      searchResultItemHover: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      },
      artistAvatar: {
        width: '40px',
        height: '40px',
        marginRight: '0.75rem',
        borderRadius: '50%',
        overflow: 'hidden'
      },
      artistImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      },
      artistName: {
        fontWeight: 'bold',
        color: '#fff'
      },
      artistGenres: {
        fontSize: '0.8rem',
        color: '#aaa'
      },
      errorMessage: {
        color: '#ff6b6b',
        fontSize: '0.9rem',
        marginBottom: '0.75rem'
      },
      selectedArtists: {
        display: 'flex',
        gap: '0.75rem',
        overflowX: 'auto',
        padding: '0.5rem 0'
      },
      selectedArtistItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      },
      selectedArtistAvatar: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid'
      },
      selectedArtistName: {
        fontSize: '0.8rem',
        color: '#fff',
        marginTop: '0.25rem',
        maxWidth: '70px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center'
      },
      removeArtistButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        cursor: 'pointer',
        padding: 0
      },
      constellationLine: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 10
      },
  container: {
    backgroundColor: "#050510",
    color: "#fff",
    padding: "0",
    textAlign: "center",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    margin: "0 auto 1.5rem auto",
    width: "100%",
    maxWidth: "1200px",
    position: "relative",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  
  wrapper: {
    position: "relative",
    width: "100%", // Responsive width instead of fixed pixels
  },
  starfieldNormal: {
    width: "100%",
    height: "800px", // Default height - will be overridden for mobile
    backgroundColor: "#0a0a1a",
    borderRadius: "0 0 12px 12px", // Only round bottom corners
    overflow: "auto",
    position: "relative",
    scrollBehavior: "smooth",
    boxShadow: "inset 0 0 50px rgba(0, 0, 50, 0.5)",
    scrollbarWidth: "thin", // Thinner scrollbars for better aesthetics
    scrollbarColor: "rgba(255,255,255,0.1) rgba(0,0,0,0.2)",
    // Mobile specific styles
    ...(isMobile() && {
      borderRadius: "0", // No border radius on mobile
      height: `${Math.max(window.innerHeight * 0.85, 400)}px`, // Mobile height
    })
  },
  starfieldFS: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0a0a1a",
    overflow: "auto",
    position: "relative",
    scrollBehavior: "smooth",
  },
  navBtns: {
    position: "absolute",
    top: isMobile() ? 8 : 10,
    right: isMobile() ? 8 : 10,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: isMobile() ? "0.4rem" : "0.5rem",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: isMobile() ? "0.5rem" : "0.7rem",
    borderRadius: isMobile() ? "10px" : "12px",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    opacity: 1,
    visibility: "visible",
    // Mobile responsive sizing
    ...(isMobile() && {
      maxWidth: "140px", // Limit width on mobile
    })
  },
  navButton: {
    backgroundColor: "rgba(60, 60, 80, 0.7)",
    color: "#fff",
    border: "none",
    padding: isMobile() ? "0.5rem 0.8rem" : "0.6rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s ease",
    backdropFilter: "blur(4px)",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    fontSize: isMobile() ? "0.8rem" : "0.9rem",
    letterSpacing: "0.5px",
    width: "100%",
    // Better touch targets on mobile
    ...(isMobile() && {
      minHeight: "44px", // iOS recommended touch target size
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    })
  },
  friendButton: {
    backgroundColor: "rgba(60, 60, 80, 0.7)",
    color: "#fff",
    border: "none",
    padding: isMobile() ? "0.4rem 0.8rem" : "0.5rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: isMobile() ? "0.4rem" : "0.5rem",
    transition: "all 0.2s ease",
    backdropFilter: "blur(4px)",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    fontSize: isMobile() ? "0.8rem" : "0.9rem",
    width: "100%",
    // Better touch targets on mobile
    ...(isMobile() && {
      minHeight: "44px",
    })
  },
  loadFeedBtn: {
    backgroundColor: "#1d9bf0",
    color: "#fff",
    border: "none",
    padding: isMobile() ? "0.7rem 1.5rem" : "0.8rem 2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: isMobile() ? "1rem" : "1.1rem",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 10px rgba(29, 155, 240, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    // Better touch targets on mobile
    ...(isMobile() && {
      minHeight: "48px",
    })
  },
  loadFeedBtnDisabled: {
    backgroundColor: "rgba(29, 155, 240, 0.4)",
    color: "rgba(255, 255, 255, 0.7)",
    cursor: "default",
  },
  fsCoords: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    backgroundColor: "rgba(20, 20, 40, 0.7)",
    color: "#fff",
    padding: isMobile() ? "0.6rem 1.5rem" : "0.8rem 2rem", 
    borderRadius: 12,
    fontWeight: "600",
    fontSize: isMobile() ? "1.5rem" : "2rem",
    backdropFilter: "blur(4px)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    textAlign: "center",
    letterSpacing: "1px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    // Mobile adjustments
    ...(isMobile() && {
      top: 8,
      maxWidth: "90vw",
    })
  },
  windowedCoords: {
    position: "absolute",
    top: isMobile() ? 8 : 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    backgroundColor: "rgba(20, 20, 40, 0.7)",
    color: "#fff",
    padding: isMobile() ? "0.3rem 0.8rem" : "0.4rem 1rem",
    borderRadius: "8px",
    fontWeight: "500",
    fontSize: isMobile() ? "0.9rem" : "1.1rem",
    backdropFilter: "blur(4px)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  legendBox: {
    position: "absolute",
    top: isMobile() ? 8 : 10,
    left: isMobile() ? 8 : 10,
    zIndex: 9999,
    backgroundColor: "rgba(20, 20, 40, 0.7)",
    padding: isMobile() ? "0.6rem 0.8rem" : "0.8rem 1rem",
    borderRadius: isMobile() ? "10px" : "12px",
    fontSize: isMobile() ? "0.8rem" : "0.9rem",
    backdropFilter: "blur(8px)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "opacity 0.3s ease",
    opacity: 1,
    visibility: "visible",
    pointerEvents: "auto",
    // Mobile responsive sizing
    ...(isMobile() && {
      maxWidth: "150px",
    })
  },
  legendTitle: {
    fontWeight: "600",
    marginBottom: "0.5rem",
    fontSize: isMobile() ? "0.9rem" : "1rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
    paddingBottom: "0.3rem",
    color: "#eee",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "0.3rem",
    transition: "transform 0.2s ease",
  },
  legendDot: {
    width: isMobile() ? 8 : 10, 
    height: isMobile() ? 8 : 10, 
    borderRadius: "50%",
    display: "inline-block", 
    marginRight: isMobile() ? 6 : 8,
    boxShadow: "0 0 5px rgba(255,255,255,0.3)",
  },
  starInfoPanel: {
    position: "absolute",
    backgroundColor: "rgba(20, 20, 40, 0.9)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: isMobile() ? "0.8rem" : "1rem",
    color: "#fff",
    zIndex: 9999,
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  },
  starInfoPanelFS: {
    minWidth: isMobile() ? 250 : 300,
    maxWidth: isMobile() ? 320 : 450,
    fontSize: isMobile() ? "1rem" : "1.2rem"
  },
  starInfoPanelWindowed: {
    minWidth: isMobile() ? 180 : 200,
    maxWidth: isMobile() ? 280 : 300,
    fontSize: isMobile() ? "0.9rem" : "1rem"
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(100, 100, 120, 0.7)",
    border: "none",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
    fontWeight: "bold",
    transition: "background-color 0.2s ease",
  },
  closeButtonFS: {
    width: isMobile() ? 32 : 36,
    height: isMobile() ? 32 : 36,
    fontSize: isMobile() ? "1rem" : "1.2rem",
  },
  closeButtonWindowed: {
    width: isMobile() ? 24 : 28,
    height: isMobile() ? 24 : 28,
    fontSize: isMobile() ? "0.8rem" : "0.9rem",
  },
  threadPreviewTitle: {
    marginTop: "0.5rem",
    marginBottom: "0.8rem",
    fontWeight: "bold",
  },
  threadPreviewTitleFS: {
    fontSize: isMobile() ? "1.2rem" : "1.5rem",
  },
  threadPreviewTitleWindowed: {
    fontSize: isMobile() ? "1rem" : "1.1rem",
  },
  threadPreviewImage: {
    width: "100%",
    maxHeight: isMobile() ? "150px" : "200px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "0.8rem",
  },
  viewThreadButton: {
    marginTop: "15px",
    backgroundColor: "#1d9bf0",
    color: "#fff",
    border: "none",
    padding: isMobile() ? "0.6rem 1rem" : "0.5rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
    fontSize: isMobile() ? "0.9rem" : "1rem",
    // Better touch targets on mobile
    ...(isMobile() && {
      minHeight: "44px",
    })
  },
  feedControls: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: isMobile() ? "0.6rem" : "0.8rem",
    padding: "0.5rem",
    marginBottom: "1rem",
  },
  locationText: {
    fontSize: isMobile() ? "1rem" : "1.25rem",
    fontWeight: "600",
    color: "#f8f8f8",
    padding: "0.3rem 1rem",
    backgroundColor: "rgba(30, 30, 50, 0.7)",
    borderRadius: "8px",
    marginBottom: "0.3rem",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  feedTitle: {
    marginTop: "0.5rem",
    fontSize: isMobile() ? "1rem" : "1.25rem",
    fontWeight: "600",
    color: "#f8f8f8",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
  },

  boundaryCircle: {
    border: "2px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 0 80px rgba(255, 255, 255, 0.05), inset 0 0 60px rgba(255, 255, 255, 0.03)",
    background: "radial-gradient(circle, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 70%)",
    pointerEvents: "none",
    borderRadius: "50%", 
    position: "absolute",
  },
  forYouBoundaryCircle: {
    border: "2px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 0 100px rgba(255, 255, 255, 0.08), inset 0 0 80px rgba(255, 255, 255, 0.04)",
    background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 70%)",
    pointerEvents: "none",
    borderRadius: "50%",
    position: "absolute",
  },
  forYouLabel: {
    color: "#fff",
    fontWeight: "700",
    position: "absolute",
    textShadow: "0 0 20px rgba(0,0,0,0.9)",
    zIndex: 10,
    whiteSpace: "nowrap",
    letterSpacing: "1px",
    opacity: 0.8,
    pointerEvents: "none",
  },
  forYouLabelFS: {
    fontSize: isMobile() ? "1.5rem" : "2.2rem",
  },
  forYouLabelWindowed: {
    fontSize: isMobile() ? "1rem" : "1.4rem",
  },
  friendLabel: {
    color: "#fff",
    fontWeight: "700",
    position: "absolute",
    textShadow: "0 0 20px rgba(0,0,0,0.9)",
    zIndex: 10,
    whiteSpace: "nowrap",
    letterSpacing: "1px",
    opacity: 0.8,
    pointerEvents: "none",
  },
  friendLabelFS: {
    fontSize: isMobile() ? "1.5rem" : "2.2rem",
  },
  friendLabelWindowed: {
    fontSize: isMobile() ? "1rem" : "1.4rem",
  },
  avatarWrapper: {
    borderRadius: "50%",
    overflow: "hidden",
    border: "3px solid #fff",
    boxShadow: "0 0 20px rgba(0,0,0,0.7)",
  },
  avatarWrapperFS: {
    width: isMobile() ? 70 : 90,
    height: isMobile() ? 70 : 90,
  },
  avatarWrapperWindowed: {
    width: isMobile() ? 50 : 60,
    height: isMobile() ? 50 : 60,
  },
  friendText: {
    marginTop: 8,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    textShadow: "0 0 10px rgba(0,0,0,0.8)",
  },
  friendTextFS: {
    fontSize: isMobile() ? "1rem" : "1.4rem",
  },
  friendTextWindowed: {
    fontSize: isMobile() ? "0.8rem" : "0.9rem",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  friendIconWrapper: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 100
  },
  friendIconWrapperFS: {
    width: isMobile() ? 70 : 90,
  },
  friendIconWrapperWindowed: {
    width: isMobile() ? 50 : 60,
  }
};

export default styles;
