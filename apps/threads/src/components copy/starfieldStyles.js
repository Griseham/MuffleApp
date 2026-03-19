// starfieldStyles.js
import { WINDOWED_WIDTH, WINDOWED_HEIGHT } from './starfieldCore';

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
    maxWidth: "800px",
    position: "relative",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  
  wrapper: {
    position: "relative",
    width: "100%", // Responsive width instead of fixed pixels
  },
  starfieldNormal: {
    width: "100%",
    height: "800px", // Match the starfield container height in CSS
    backgroundColor: "#0a0a1a",
    borderRadius: "0 0 12px 12px", // Only round bottom corners
    overflow: "auto",
    position: "relative",
    scrollBehavior: "smooth",
    boxShadow: "inset 0 0 50px rgba(0, 0, 50, 0.5)",
    scrollbarWidth: "thin", // Thinner scrollbars for better aesthetics
    scrollbarColor: "rgba(255,255,255,0.1) rgba(0,0,0,0.2)",
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
    top: 10,
    right: 10,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: "0.7rem",
    borderRadius: "12px",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    opacity: 1, // Ensure this is visible
    visibility: "visible", // Make sure it's visible
  },
  navButton: {
    backgroundColor: "rgba(60, 60, 80, 0.7)",
    color: "#fff",
    border: "none",
    padding: "0.6rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s ease",
    backdropFilter: "blur(4px)",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    fontSize: "0.9rem",
    letterSpacing: "0.5px",
    width: "100%", // Makes all buttons same width
  },
  friendButton: {
    backgroundColor: "rgba(60, 60, 80, 0.7)",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "0.5rem", // Better spacing between icon and text
    transition: "all 0.2s ease",
    backdropFilter: "blur(4px)",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    fontSize: "0.9rem",
    width: "100%", // Makes all buttons same width
  },
  loadFeedBtn: {
    backgroundColor: "#1d9bf0",
    color: "#fff",
    border: "none",
    padding: "0.8rem 2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "1.1rem",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 10px rgba(29, 155, 240, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
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
    padding: "0.8rem 2rem", 
    borderRadius: 12,
    fontWeight: "600",
    fontSize: "2rem",
    backdropFilter: "blur(4px)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    textAlign: "center",
    letterSpacing: "1px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  windowedCoords: {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    backgroundColor: "rgba(20, 20, 40, 0.7)",
    color: "#fff",
    padding: "0.4rem 1rem",
    borderRadius: "8px",
    fontWeight: "500",
    fontSize: "1.1rem",
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
    top: 10,
    left: 10,
    zIndex: 9999,
    backgroundColor: "rgba(20, 20, 40, 0.7)",
    padding: "0.8rem 1rem",
    borderRadius: "12px",
    fontSize: "0.9rem",
    backdropFilter: "blur(8px)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "opacity 0.3s ease",
    opacity: 1,
    visibility: "visible",
    pointerEvents: "auto",
  },
  legendTitle: {
    fontWeight: "600",
    marginBottom: "0.5rem",
    fontSize: "1rem",
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
    width: 10, 
    height: 10, 
    borderRadius: "50%",
    display: "inline-block", 
    marginRight: 8,
    boxShadow: "0 0 5px rgba(255,255,255,0.3)",
  },
  starInfoPanel: {
    position: "absolute",
    backgroundColor: "rgba(20, 20, 40, 0.9)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: "1rem",
    color: "#fff",
    zIndex: 9999,
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  },
  starInfoPanelFS: {
    minWidth: 300,
    maxWidth: 450,
    fontSize: "1.2rem"
  },
  starInfoPanelWindowed: {
    minWidth: 200,
    maxWidth: 300,
    fontSize: "1rem"
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
    width: 36,
    height: 36,
    fontSize: "1.2rem",
  },
  closeButtonWindowed: {
    width: 28,
    height: 28,
    fontSize: "0.9rem",
  },
  threadPreviewTitle: {
    marginTop: "0.5rem",
    marginBottom: "0.8rem",
    fontWeight: "bold",
  },
  threadPreviewTitleFS: {
    fontSize: "1.5rem",
  },
  threadPreviewTitleWindowed: {
    fontSize: "1.1rem",
  },
  threadPreviewImage: {
    width: "100%",
    maxHeight: "200px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "0.8rem",
  },
  viewThreadButton: {
    marginTop: "15px",
    backgroundColor: "#1d9bf0",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
  },
  feedControls: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.8rem",
    padding: "0.5rem",
    marginBottom: "1rem",
  },
  locationText: {
    fontSize: "1.25rem",
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
    fontSize: "1.25rem",
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
    fontSize: "2.2rem",
  },
  forYouLabelWindowed: {
    fontSize: "1.4rem",
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
    fontSize: "2.2rem",
  },
  friendLabelWindowed: {
    fontSize: "1.4rem",
  },
  avatarWrapper: {
    borderRadius: "50%",
    overflow: "hidden",
    border: "3px solid #fff",
    boxShadow: "0 0 20px rgba(0,0,0,0.7)",
  },
  avatarWrapperFS: {
    width: 90,
    height: 90,
  },
  avatarWrapperWindowed: {
    width: 60,
    height: 60,
  },
  friendText: {
    marginTop: 8,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    textShadow: "0 0 10px rgba(0,0,0,0.8)",
  },
  friendTextFS: {
    fontSize: "1.4rem",
  },
  friendTextWindowed: {
    fontSize: "0.9rem",
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
    width: 90,
  },
  friendIconWrapperWindowed: {
    width: 60,
  }
};

export default styles;