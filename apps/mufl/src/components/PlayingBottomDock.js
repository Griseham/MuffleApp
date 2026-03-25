import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArtistPool from "./ArtistPool";
import QueueLine from "./QueueLine";
import Widget from "./Widget";
import InfoIconModal from "./InfoIconModal";
import { UserIcon } from "./Icons/Icons";

const LeftSwipeIcon = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M10 7L5 12L10 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RightSwipeIcon = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M14 7L19 12L14 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MusicNoteIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path
      d="M9 18V5l12-2v13"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="18" r="3" strokeWidth="2" />
    <circle cx="18" cy="16" r="3" strokeWidth="2" />
  </svg>
);

// ✅ Legacy-identical swipe indicators (copied from BottomContainer.js)
const SwipeIndicators = ({ type, counts = {}, userVote }) => {
  // Color coding: red for left, green for right
  const baseColor = type === 'left' ? 'text-red-400' : 'text-green-400';
  const highlightColor = 'text-white';

  // Ensure counts exist for all levels (1, 2, 3)
  const safeCounts = {
    1: counts[1] || 0,
    2: counts[2] || 0,
    3: counts[3] || 0
  };

  return (
    <div className="flex items-center gap-3">
      {/* Single Arrow */}
      <div
        className={`flex items-center ${
          userVote === 1 ? highlightColor : baseColor
        } ${userVote === 1 ? 'font-bold' : ''}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 ${userVote === 1 ? 'drop-shadow-lg' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          {type === 'left' ? (
            <path d="M5 12L10 7M5 12L10 17" />
          ) : (
            <path d="M19 12L14 7M19 12L14 17" />
          )}
        </svg>
        <span className={`text-sm ml-1 ${userVote === 1 ? 'font-bold' : ''}`}>
          {safeCounts[1]}
        </span>
      </div>

      {/* Double Arrow */}
      <div
        className={`flex items-center ${
          userVote === 2 ? highlightColor : baseColor
        } ${userVote === 2 ? 'font-bold' : ''}`}
      >
        <svg
          viewBox="0 0 28 24"
          className={`w-7 h-5 ${userVote === 2 ? 'drop-shadow-lg' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          {type === 'left' ? (
            <>
              <path d="M5 12L10 7M5 12L10 17" />
              <path d="M13 12L18 7M13 12L18 17" />
            </>
          ) : (
            <>
              <path d="M20 12L15 7M20 12L15 17" />
              <path d="M12 12L7 7M12 12L7 17" />
            </>
          )}
        </svg>
        <span className={`text-sm ml-1 ${userVote === 2 ? 'font-bold' : ''}`}>
          {safeCounts[2]}
        </span>
      </div>

      {/* Triple Arrow */}
      <div
        className={`flex items-center ${
          userVote === 3 ? highlightColor : baseColor
        } ${userVote === 3 ? 'font-bold' : ''}`}
      >
        <svg
          viewBox="0 0 36 24"
          className={`w-8 h-5 ${userVote === 3 ? 'drop-shadow-lg' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          {type === 'left' ? (
            <>
              <path d="M5 12L10 7M5 12L10 17" />
              <path d="M13 12L18 7M13 12L18 17" />
              <path d="M21 12L26 7M21 12L26 17" />
            </>
          ) : (
            <>
              <path d="M23 12L18 7M23 12L18 17" />
              <path d="M15 12L10 7M15 12L10 17" />
              <path d="M7 12L2 7M7 12L2 17" />
            </>
          )}
        </svg>
        <span className={`text-sm ml-1 ${userVote === 3 ? 'font-bold' : ''}`}>
          {safeCounts[3]}
        </span>
      </div>
    </div>
  );
};

const ExpandCollapseIcon = ({ isExpanded }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`playing-bottom-dock__chevron ${isExpanded ? "is-expanded" : ""}`}
  >
    <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VALID_TABS = ["LeftSwipes", "QL", "Pool", "Chat", "Widget", "RightSwipes"];
const CHAT_HISTORY_LIMIT = 24;
const CHAT_SEED_COUNT = 3;
const CHAT_SNIPPETS = [
  "lorem ipsum",
  "dolor sit amet",
  "consectetur elit",
  "sed do eiusmod",
  "tempor incididunt",
  "ut labore",
  "et dolore",
  "magna aliqua",
  "ut enim",
  "minim veniam",
  "quis nostrud",
  "exercitation ullamco",
];
const USER_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f43f5e",
  "#a855f7",
  "#10b981",
  "#6366f1",
  "#f59e0b",
];

const getInfoContent = (tab) => {
  switch (tab) {
    case "LeftSwipes":
      return [
        {
          icon: <LeftSwipeIcon size={18} />,
          title: "Left Tab",
          content: "Songs you swiped left on, plus who recommended them and how others rated them."
        }
      ];
    case "RightSwipes":
      return [
        {
          icon: <RightSwipeIcon size={18} />,
          title: "Right Tab",
          content: "Songs you swiped right on, plus who recommended them and how others rated them."
        }
      ];
    case "QL":
      return [
        {
          icon: <UserIcon size={18} />,
          title: "Queue Line Rankings",
          content: "Top users move up/down as songs get pushed forward/back in the main queue."
        }
      ];
    case "Pool":
      return [
        {
          icon: <MusicNoteIcon size={18} />,
          title: "Artist Pool",
          content: "Pick artists to feed the widget. Pool refreshes continuously in the background."
        }
      ];
    case "Widget":
      return [
        {
          icon: <MusicNoteIcon size={18} />,
          title: "Widget",
          content: "Use selected artists to search/pick songs and add snippets into the main queue."
        }
      ];
    default:
      return [];
  }
};

const TabButton = ({ active, onClick, children, infoKey, showInfo, tabKey }) => (
  <button
    type="button"
    className={`playing-bottom-dock__tab ${active ? "is-active" : ""}`}
    onClick={onClick}
    id={`playing-bottom-dock-tab-${tabKey}`}
    role="tab"
    aria-selected={active}
    aria-controls={`playing-bottom-dock-panel-${tabKey}`}
  >
    {children}
    {showInfo && (
      <span className="playing-bottom-dock__info" onClick={(e) => e.stopPropagation()}>
        <InfoIconModal
          title={infoKey}
          steps={getInfoContent(infoKey)}
          iconSize={16}
          iconColor="#FFA500"
          showButtonText={false}
          sidePanel={true}
          modalId={`${infoKey}-modal`}
        />
      </span>
    )}
  </button>
);

const PlayingBottomDock = ({
  activeTab,
  setActiveTab,
  isExpanded,
  onToggleExpand,
  qlUsers = [],
  leftSwipeSongs = [],
  rightSwipeSongs = [],
  onSongFromWidget = () => {},
  poolArtists = [],
  roomArtists = [],
  onPoolUpdate = null,
  isBackgroundFetching = false,
  backgroundFetchProgress = 0,
  apiBaseUrl = ""
}) => {
  const chatRef = useRef(null);
  const chatMessageIdRef = useRef(0);
  const resolvedActiveTab = VALID_TABS.includes(activeTab) ? activeTab : "Pool";
  const safeQlUsers = Array.isArray(qlUsers) ? qlUsers : [];
  const safeLeftSwipeSongs = Array.isArray(leftSwipeSongs) ? leftSwipeSongs : [];
  const safeRightSwipeSongs = Array.isArray(rightSwipeSongs) ? rightSwipeSongs : [];
  const noopSetWidgetSelectedArtist = useCallback(() => {}, []);

  const makeChatUser = useCallback(() => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let suffix = "";
    for (let i = 0; i < 5; i += 1) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `user${suffix}`;
  }, []);

  const makeChatMessage = useCallback(() => {
    chatMessageIdRef.current += 1;
    return {
      id: `chat-message-${chatMessageIdRef.current}`,
      username: makeChatUser(),
      text: CHAT_SNIPPETS[Math.floor(Math.random() * CHAT_SNIPPETS.length)],
    };
  }, [makeChatUser]);

  const getUserColor = useCallback((username = "") => {
    let hash = 0;
    for (let i = 0; i < username.length; i += 1) {
      hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
    }
    return USER_COLORS[hash % USER_COLORS.length];
  }, []);

  const [chatMessages, setChatMessages] = useState(() =>
    Array.from({ length: CHAT_SEED_COUNT }, () => makeChatMessage())
  );
  const [selectedArtistsForWidget, setSelectedArtistsForWidget] = useState([]);

  useEffect(() => {
    if (activeTab === resolvedActiveTab) return;
    setActiveTab(resolvedActiveTab);
  }, [activeTab, resolvedActiveTab, setActiveTab]);

  const handleArtistSelect = (artist, isSelected) => {
    if (!artist?.id || !artist?.name) return;

    setSelectedArtistsForWidget((prev) => {
      const exists = prev.some((a) => a.id === artist.id);
      if (isSelected && !exists) return [...prev, artist];
      if (!isSelected) return prev.filter((a) => a.id !== artist.id);
      return prev;
    });
  };

  useEffect(() => {
    if (resolvedActiveTab !== "Chat") return;
    setChatMessages((prev) =>
      prev.length > 0 ? prev : Array.from({ length: CHAT_SEED_COUNT }, () => makeChatMessage())
    );

    const interval = setInterval(() => {
      setChatMessages((prev) => {
        const nextMessage = makeChatMessage();
        const trimmed = prev.slice(-(CHAT_HISTORY_LIMIT - 1));
        return [...trimmed, nextMessage];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [makeChatMessage, resolvedActiveTab]);

  useEffect(() => {
    if (resolvedActiveTab !== "Chat" || !chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages, resolvedActiveTab]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (!isExpanded) onToggleExpand(true);
  };

  const leftBadge = safeLeftSwipeSongs.length;
  const rightBadge = safeRightSwipeSongs.length;

  // ✅ Legacy-identical renderSwipeContent (copied from BottomContainer.js)
  const renderSwipeContent = (songs, type) => {
    const iconComponent = type === 'left' ? LeftSwipeIcon : RightSwipeIcon;
    const tabTitle = type === 'left' ? 'Left Swipes' : 'Right Swipes';

    return (
      <div className="swipe-content">
        <h3 className="swipe-header">
          {React.createElement(iconComponent, { size: 20, className: "mr-2" })}
          {tabTitle} ({songs.length})
        </h3>

        <div className="swipe-scroll">
          {songs.length > 0 ? (
            songs.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className="song-card-design3"
              >
                {/* Album Art or Song Icon */}
                <div className="song-icon">
                  {/* Show album art if available, otherwise show music note icon */}
                  {song.artworkUrl || song.image ? (
                    <img
                      src={song.artworkUrl || song.image}
                      alt={`${song.track} by ${song.artist}`}
                      className="song-icon-img"
                      onError={(e) => {
                        // Fallback to music icon if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}

                  {/* Fallback music icon - shown by default if no image, or if image fails */}
                  <div
                    className="song-icon-fallback"
                    style={{
                      display: (song.artworkUrl || song.image) ? 'none' : 'flex'
                    }}
                  >
                    <MusicNoteIcon size={18} className="text-gray-400" />
                  </div>
                </div>

                {/* Song Info */}
                <div className="song-info">
                  <h4 className="song-title">{song.track || song.title}</h4>
                  <p className="song-artist">{song.artist}</p>
                </div>

                {/* Middle Section - User Info with Avatar */}
                <div className="middle-section">
                  <div className="by-label">By:</div>
                  <div className="user-container">
                    <div className="user-avatar">
                      {/* Use real avatar if available from recommendedBy, otherwise fallback */}
                      {song.recommendedBy?.avatar ? (
                        <img
                          src={song.recommendedBy.avatar}
                          alt={song.recommendedBy.username}
                          className="user-avatar-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.querySelector('.user-avatar-fallback').style.display = 'flex';
                          }}
                        />
                      ) : null}

                      {/* Fallback for user avatar */}
                      <div
                        className="user-avatar-fallback"
                        style={{
                          display: song.recommendedBy?.avatar ? 'none' : 'flex'
                        }}
                      >
                        {song.recommendedBy?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    </div>

                    <div className="user-name">
                      {song.recommendedBy?.username || 'Unknown'}
                    </div>
                  </div>
                </div>

                {/* Arrow Indicators - Single Row */}
                <div className="indicators-container">
                  <SwipeIndicators
                    type="left"
                    counts={song.leftCounts || { 1: 0, 2: 0, 3: 0 }}
                    userVote={song.userVoteDirection === 'left' ? song.userVoteStrength : null}
                  />

                  <div className="separator"></div>

                  <SwipeIndicators
                    type="right"
                    counts={song.rightCounts || { 1: 0, 2: 0, 3: 0 }}
                    userVote={song.userVoteDirection === 'right' ? song.userVoteStrength : null}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="swipe-empty">
              No {type} swipes yet. Try swiping songs to the {type}!
            </div>
          )}
        </div>
      </div>
    );
  };

  const widgetSelectedArtists = useMemo(
    () =>
      selectedArtistsForWidget.map((a) => ({
        id: a.id,
        name: a.name,
        image: a.image,
        isRoomArtist: a.isRoomArtist || false
      })),
    [selectedArtistsForWidget]
  );

  const roomSignature = useMemo(
    () => roomArtists.map((artist) => artist?.id || artist?.name || "").join("|"),
    [roomArtists]
  );

  useEffect(() => {
    setSelectedArtistsForWidget([]);
  }, [roomSignature]);

  return (
    <section className={`playing-bottom-dock ${isExpanded ? "is-expanded" : "is-collapsed"}`}>
      <div className="playing-bottom-dock__header">
        <div className="playing-bottom-dock__tabs" role="tablist" aria-label="Playing dock tabs">
          <TabButton
            active={resolvedActiveTab === "LeftSwipes"}
            onClick={() => handleTabClick("LeftSwipes")}
            infoKey="LeftSwipes"
            showInfo
            tabKey="LeftSwipes"
          >
            <LeftSwipeIcon />
            <span className="playing-bottom-dock__label">LEFT</span>
            {leftBadge > 0 && <span className="playing-bottom-dock__badge">{leftBadge}</span>}
          </TabButton>

          <TabButton
            active={resolvedActiveTab === "QL"}
            onClick={() => handleTabClick("QL")}
            infoKey="QL"
            showInfo
            tabKey="QL"
          >
            <span className="playing-bottom-dock__label">QL</span>
          </TabButton>

          <TabButton
            active={resolvedActiveTab === "Pool"}
            onClick={() => handleTabClick("Pool")}
            infoKey="Pool"
            showInfo
            tabKey="Pool"
          >
            <span className={`playing-bottom-dock__label ${poolArtists?.length ? "is-accent" : ""}`}>POOL</span>
          </TabButton>

          <TabButton
            active={resolvedActiveTab === "Chat"}
            onClick={() => handleTabClick("Chat")}
            infoKey="Chat"
            tabKey="Chat"
          >
            <span className="playing-bottom-dock__label">CHAT</span>
          </TabButton>

          <TabButton
            active={resolvedActiveTab === "Widget"}
            onClick={() => handleTabClick("Widget")}
            infoKey="Widget"
            showInfo
            tabKey="Widget"
          >
            <span className="playing-bottom-dock__label">WIDGET</span>
          </TabButton>

          <TabButton
            active={resolvedActiveTab === "RightSwipes"}
            onClick={() => handleTabClick("RightSwipes")}
            infoKey="RightSwipes"
            showInfo
            tabKey="RightSwipes"
          >
            <RightSwipeIcon />
            <span className="playing-bottom-dock__label">RIGHT</span>
            {rightBadge > 0 && <span className="playing-bottom-dock__badge">{rightBadge}</span>}
          </TabButton>
        </div>

        <button
          type="button"
          className="playing-bottom-dock__toggle"
          onClick={() => onToggleExpand(!isExpanded)}
          aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
        >
          <ExpandCollapseIcon isExpanded={isExpanded} />
        </button>
      </div>

      <div className="playing-bottom-dock__body">
        <div
          id="playing-bottom-dock-panel-Pool"
          role="tabpanel"
          aria-labelledby="playing-bottom-dock-tab-Pool"
          hidden={resolvedActiveTab !== "Pool"}
          className={`playing-bottom-dock__panel playing-bottom-dock__panel--pool ${resolvedActiveTab === "Pool" ? "" : "is-hidden"}`}
        >
          <ArtistPool
            poolArtists={poolArtists}
            roomArtists={roomArtists}
            onPoolUpdate={onPoolUpdate}
            onArtistSelect={handleArtistSelect}
            isBackgroundFetching={isBackgroundFetching}
            backgroundFetchProgress={backgroundFetchProgress}
            apiBaseUrl={apiBaseUrl}
            disableExternalFetch={true}
          />
        </div>

        <div
          id="playing-bottom-dock-panel-QL"
          role="tabpanel"
          aria-labelledby="playing-bottom-dock-tab-QL"
          hidden={resolvedActiveTab !== "QL"}
          className={`playing-bottom-dock__panel ${resolvedActiveTab === "QL" ? "" : "is-hidden"}`}
        >
          <QueueLine qlUsers={safeQlUsers} />
        </div>

        <div
          id="playing-bottom-dock-panel-Chat"
          role="tabpanel"
          aria-labelledby="playing-bottom-dock-tab-Chat"
          hidden={resolvedActiveTab !== "Chat"}
          className={`playing-bottom-dock__panel ${resolvedActiveTab === "Chat" ? "" : "is-hidden"}`}
        >
          <div className="playing-bottom-dock__chat-wrapper">
            <div className="playing-bottom-dock__chat playing-bottom-dock__chat--stream" ref={chatRef}>
              {chatMessages.map((message, index) => (
                <div 
                  key={message.id}
                  className={`playing-bottom-dock__chat-message playing-bottom-dock__chat-message--stream ${
                    index === chatMessages.length - 1 ? "is-latest" : ""
                  }`}
                  style={{ "--user-color": getUserColor(message.username) }}
                >
                  <span 
                    className="playing-bottom-dock__chat-dot"
                    data-user={message.username}
                  />
                  <span 
                    className="playing-bottom-dock__chat-user playing-bottom-dock__chat-user--stream"
                    data-user={message.username}
                  >
                    {message.username}
                  </span>
                  <span className="playing-bottom-dock__chat-text">{message.text}</span>
                </div>
              ))}
            </div>
            <div className="playing-bottom-dock__chat-input-bar">
              <input
                type="text"
                className="playing-bottom-dock__chat-input"
                placeholder="Demo chat stream"
                readOnly
                aria-label="Demo chat stream"
              />
              <button
                type="button"
                className="playing-bottom-dock__chat-send"
                disabled
                aria-label="Chat send unavailable in demo"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div
          id="playing-bottom-dock-panel-Widget"
          role="tabpanel"
          aria-labelledby="playing-bottom-dock-tab-Widget"
          hidden={resolvedActiveTab !== "Widget"}
          className={`playing-bottom-dock__panel ${resolvedActiveTab === "Widget" ? "" : "is-hidden"}`}
        >
          <Widget
            apiBaseUrl={apiBaseUrl}
            selectedArtists={widgetSelectedArtists}
            queuedSongs={[]}
            setWidgetSelectedArtist={noopSetWidgetSelectedArtist}
            onRemoveArtist={(artistId) =>
              setSelectedArtistsForWidget((prev) => prev.filter((a) => a.id !== artistId))
            }
            onSongFromWidget={onSongFromWidget}
          />
        </div>

        <div
          id="playing-bottom-dock-panel-LeftSwipes"
          role="tabpanel"
          aria-labelledby="playing-bottom-dock-tab-LeftSwipes"
          hidden={resolvedActiveTab !== "LeftSwipes"}
          className={`playing-bottom-dock__panel ${resolvedActiveTab === "LeftSwipes" ? "" : "is-hidden"}`}
        >
          {renderSwipeContent(safeLeftSwipeSongs, "left")}
        </div>

        <div
          id="playing-bottom-dock-panel-RightSwipes"
          role="tabpanel"
          aria-labelledby="playing-bottom-dock-tab-RightSwipes"
          hidden={resolvedActiveTab !== "RightSwipes"}
          className={`playing-bottom-dock__panel ${resolvedActiveTab === "RightSwipes" ? "" : "is-hidden"}`}
        >
          {renderSwipeContent(safeRightSwipeSongs, "right")}
        </div>
      </div>
    </section>
  );
};

export default PlayingBottomDock;
