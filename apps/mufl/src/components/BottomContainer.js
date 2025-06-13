import React, { useRef, useState, useEffect } from "react";
import { UserIcon, PlayIcon, PauseIcon, MusicNoteIcon, AlbumIcon } from "./Icons/Icons";
import QueueLine from "./QueueLine";
import ArtistPool from "./ArtistPool";
import Widget from "./Widget";
import InfoIconModal from "./InfoIconModal";

// Swipe icon components
const LeftSwipeIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 7L5 12L10 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RightSwipeIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M14 7L19 12L14 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Updated SwipeIndicators component - Design 3 style (single row)
const SwipeIndicators = ({ type, counts, userVote }) => {
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
    <div className="w-full pb-4 relative">
      <div className={`bottom-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Tabs with Expand/Collapse Button */}
        <div className="tab-navigation">
          <div className="tab-buttons">
            {/* Left swipe tab with icon and badge */}
            <button
              className={`tab-button ${activeTab === "LeftSwipes" ? "active" : ""} relative`}
              onClick={() => handleTabClick("LeftSwipes")}
            >
              <LeftSwipeIcon size={16} className="inline-block mr-1" />
              LEFT
              {leftSwipeSongs.length > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs text-black">{getLeftSwipesBadgeCount()}</span>
              )}
              {activeTab === "LeftSwipes" && (
                <div className="absolute -top-2 -right-2">
                  <InfoIconModal
                    title="Left Swipes"
                    steps={getInfoContent('Left')}
                    iconSize={14}
                    showButtonText={false}
                    sidePanel={true}
                    modalId="leftSwipes-modal"
                  />
                </div>
              )}
            </button>
            
            {/* QL tab */}
            <button
              className={`tab-button ${activeTab === "QL" ? "active" : ""} relative`}
              onClick={() => handleTabClick("QL")}
            >
              QL
              {activeTab === "QL" && (
                <div className="absolute -top-2 -right-2">
                  <InfoIconModal
                    title="Queue Line"
                    steps={getInfoContent('QL')}
                    iconSize={14}
                    showButtonText={false}
                    sidePanel={true}
                    modalId="queueLine-modal"
                  />
                </div>
              )}
            </button>
            
            {/* Pool tab with dynamic label */}
            <button
              className={`tab-button ${activeTab === "Pool" ? "active" : ""} ${poolArtists.length > 0 ? "enhanced" : ""} relative`}
              onClick={() => handleTabClick("Pool")}
            >
              {getPoolTabLabel()}
              {activeTab === "Pool" && (
                <div className="absolute -top-2 -right-2">
                  <InfoIconModal
                    title="Artist Pool"
                    steps={getInfoContent('Pool')}
                    iconSize={14}
                    showButtonText={false}
                    sidePanel={true}
                    modalId="artistPool-modal"
                  />
                </div>
              )}
            </button>
            
            {/* Chat tab */}
            <button
              className={`tab-button ${activeTab === "Chat" ? "active" : ""}`}
              onClick={() => handleTabClick("Chat")}
            >
              CHAT
            </button>
            
            {/* Widget tab */}
            <button
              className={`tab-button ${activeTab === "Widget" ? "active" : ""} relative`}
              onClick={() => handleTabClick("Widget")}
            >
              WIDGET
              {activeTab === "Widget" && (
                <div className="absolute -top-2 -right-2">
                  <InfoIconModal
                    title="Widget"
                    steps={getInfoContent('Widget')}
                    iconSize={14}
                    showButtonText={false}
                    sidePanel={true}
                    modalId="widget-modal"
                  />
                </div>
              )}
            </button>
            
            {/* Right swipe tab with icon and badge */}
            <button
              className={`tab-button ${activeTab === "RightSwipes" ? "active" : ""} relative`}
              onClick={() => handleTabClick("RightSwipes")}
            >
              <RightSwipeIcon size={16} className="inline-block mr-1" />
              RIGHT
              {rightSwipeSongs.length > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs text-black">{getRightSwipesBadgeCount()}</span>
              )}
              {activeTab === "RightSwipes" && (
                <div className="absolute -top-2 -right-2">
                  <InfoIconModal
                    title="Right Swipes"
                    steps={getInfoContent('Right')}
                    iconSize={14}
                    showButtonText={false}
                    sidePanel={true}
                    modalId="rightSwipes-modal"
                  />
                </div>
              )}
            </button>
          </div>
          
          {/* Expand/Collapse Button */}
          <button 
            className="expand-collapse-button"
            onClick={() => onToggleExpand(!isExpanded)}
            aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
          >
            <ExpandCollapseIcon isExpanded={isExpanded} />
          </button>
        </div>

        {/* Content Area - conditionally rendered based on expansion state */}
        {isExpanded && (
          <div className="content-area">
            {/* Left Swipes Tab Content */}
            {activeTab === "LeftSwipes" && renderSwipeContent(leftSwipeSongs, 'left')}
            
            {/* Right Swipes Tab Content */}
            {activeTab === "RightSwipes" && renderSwipeContent(rightSwipeSongs, 'right')}
            
            {/* QL tab content */}
            {activeTab === "QL" && <QueueLine qlUsers={qlUsers} />}
            
            {/* UPDATED: Pool tab with synchronized countdown and artist selection */}
            {activeTab === "Pool" && (
              <ArtistPool
                poolArtists={poolArtists}
                roomArtists={roomArtists}
                countdown={countdown} // Pass synchronized countdown (20 seconds)
                onPoolUpdate={onPoolUpdate} // Pass callback for pool updates
                onArtistSelect={handleArtistSelect} // NEW: Handle artist selections
              />
            )}
            
            {/* Chat tab content */}
            {activeTab === "Chat" && (
              <div
                className="chat-content"
                ref={chatContainerRef}
              >
                {chatMessages.map((m, i) => (
                  <div key={i} className="chat-message">
                    <div className="flex items-center">
                      <span className="text-white font-medium">{m.username}</span>
                      <span className="text-gray-500 mx-2">•</span>
                      <span className="text-gray-400">{m.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Widget Tab Content - Only real selections from artist pool */}
            {activeTab === 'Widget' && (
              <Widget 
                selectedArtists={selectedArtistsForWidget} 
                queuedSongs={queuedSongs} 
                setWidgetSelectedArtist={setWidgetSelectedArtist} 
                onRemoveArtist={(artistId) => {
                  setSelectedArtistsForWidget(prev => 
                    prev.filter(artist => artist.id !== artistId)
                  );
                }}
                onSongFromWidget={onSongFromWidget}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Enhanced Styles for Design 3 and Full Width */}
      <style jsx>{`
        /* Bottom container centered with playing screen */
        .bottom-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0 auto;
  width: 100%;
  max-width: 800px;

  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, #1a1a1a, #000000);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transition: height 0.3s ease;
  z-index: 30;
  padding: 0 20px;
  box-sizing: border-box;
}

        .bottom-container.expanded {
          min-height: 360px;
          height: 360px;
        }
        
        .bottom-container.collapsed {
          height: 72px;
        }
        
        /* Tab navigation */
        .tab-navigation {
          display: flex;
          width: 100%;
          height: 64px;
          padding: 0 0;                   /* Remove horizontal padding since container has it */
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 10;
          backdrop-filter: blur(5px);
        }
        
        /* Tab buttons container */
        .tab-buttons {
          display: flex;
          justify-content: center;
          flex: 1;
          gap: 12px; /* Reduced gap to fit more buttons */
        }
        
        /* Tab button styling */
        .tab-button {
          position: relative;
          font-size: 12px; /* Slightly smaller font */
          font-weight: bold;
          letter-spacing: 0.05em;
          padding: 8px 10px; /* Reduced padding */
          transition: all 0.2s;
          border: none;
          background: transparent;
          color: #808080;
          cursor: pointer;
          display: flex;
          align-items: center;
          white-space: nowrap; /* Prevent text wrapping */
        }
        
        .tab-button:hover {
          color: white;
        }
        
        .tab-button.active {
          color: white;
        }
        
        .tab-button.active:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 1px;
          background-color: white;
        }
        
        /* Enhanced styling for pool tab when it has room artists */
        .tab-button.enhanced {
          color: #4ade80;
        }
        
        .tab-button.enhanced:hover {
          color: #22c55e;
        }
        
        .tab-button.enhanced.active {
          color: #4ade80;
        }
        
        /* Expand/collapse button */
        .expand-collapse-button {
          background: transparent;
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .expand-collapse-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        /* Content area with fixed height */
        .content-area {
          flex: 1;
          padding: 16px 4px;              /* Reduce horizontal padding since container has it */
          overflow: hidden;
          position: relative;
          height: calc(100% - 64px);
        }
        /* Swipe content styles */
        .swipe-content {
          height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
        
        .swipe-header {
          display: flex;
          align-items: center;
          color: white;
          font-size: 18px;
          font-weight: medium;
          margin-bottom: 16px;
        }
        
        /* Design 3 Song Card Layout */
        .song-card-design3 {
          display: flex;
          align-items: stretch;
          margin-bottom: 12px;
          padding: 16px;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.2s;
        }
        
        .song-card-design3:hover {
          background-color: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        

.song-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-right: 16px;
  flex-shrink: 0;
  overflow: hidden; /* Ensure images fit properly within rounded corners */
  position: relative; /* For proper fallback positioning */
}
        
        .song-info {
          flex: 1;
          min-width: 0;
          margin-right: 16px;
        }
        
        .song-title {
          font-weight: medium;
          font-size: 15px;
          color: white;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .song-artist {
          font-size: 13px;
          color: #a0a0a0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Middle section - User info with SVG avatar */
        .middle-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 20px;
          min-width: 60px;
        }
        
        .by-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 2px;
        }
        
        .user-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.1);
          overflow: hidden; /* Ensure SVG fits properly */
        }
        
        .user-name {
          font-size: 10px;
          color: #888;
          font-weight: 500;
        }
        
        /* Indicators container */
        .indicators-container {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .separator {
          width: 1px;
          height: 30px;
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        /* Chat content styles */
        .chat-content {
          height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
        
        .chat-message {
          margin-bottom: 12px;
          padding: 12px 14px;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        /* Filter for glow effect */
        .drop-shadow {
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.3));
        }
        
        /* Scrollbars */
        .chat-content::-webkit-scrollbar-thumb,
        .swipe-content::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        
        .chat-content::-webkit-scrollbar-track,
        .swipe-content::-webkit-scrollbar-track {
          background-color: rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
          .bottom-container {
            width: calc(100% - 16px);     /* Less margin on mobile */
            max-width: none;
            padding: 0 12px;              /* Less padding on mobile */
          }
          
          .content-area {
            padding: 12px 2px;            /* Even less padding on mobile */
          }
        }
      `}</style>
    </div>
  );
};

export default BottomContainer;