// src/components/PostControls.jsx
import React from "react";
import { FiPlus, FiMinus } from "react-icons/fi";
import VerticalRatingsGraph from "./VerticalRatingsGraph";
import ScatterRatingsGraph from "./ScatterRatingsGraph";
import styles from "./ThreadDetailStyles";

export default function PostControls({
  post,
  activeSection,
  setActiveSection,
  uniqueUsers,
  artistList,
  graphRatings,
  scatterData,
  isSongSearchVisible,
  setIsSongSearchVisible,
  searchQuery,
  setSearchQuery,
  isSearching,
  handleSongSearch,
  searchedSnippet,
  onPlaySnippet,
}) {
  const handleTabClick = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div>
      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          {/* You can render counts (e.g. post.num_comments, post.ups) here */}
        </div>
      </div>

      {/* Graph Controls (Tabs) */}
      <div style={styles.graphControls}>
        <div
          onClick={() => handleTabClick("graphs")}
          style={activeSection === "graphs" ? styles.activeTab : styles.inactiveTab}
        >
          <h4 style={styles.tabText}>Graphs</h4>
        </div>
        <div
          onClick={() => handleTabClick("users")}
          style={activeSection === "users" ? styles.activeTab : styles.inactiveTab}
        >
          <h4 style={styles.tabText}>Users</h4>
        </div>
        <div
          onClick={() => handleTabClick("artists")}
          style={activeSection === "artists" ? styles.activeTab : styles.inactiveTab}
        >
          <h4 style={styles.tabText}>Artists</h4>
        </div>
      </div>

      {/* Graphs Section */}
      {activeSection === "graphs" && (
        <div style={styles.topGraphsContainer}>
          <VerticalRatingsGraph ratings={graphRatings} placeholders={6} />
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <ScatterRatingsGraph scatter={scatterData} placeholders={4} />
          </div>
        </div>
      )}

      {/* Users Section */}
      {activeSection === "users" && (
        <div style={styles.usersContainer}>
          {uniqueUsers.map((user) => (
            <div key={user.name} style={styles.userMinimal}>
              <img src={user.avatar} alt={user.name} style={styles.userAvatar} />
              <p style={styles.userName}>{user.name}</p>
            </div>
          ))}
          <div style={styles.addMoreButton}>
            <p style={styles.addMoreText}>
              + {Math.floor(Math.random() * (19 - 7 + 1)) + 7}
            </p>
          </div>
        </div>
      )}

      {/* Artists Section */}
      {activeSection === "artists" && (
        <div
          style={{
            width: "100%",
            height: 450,
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#1a1a1a",
            borderRadius: "10px",
          }}
        >
          {/* Render artist scatter chart here */}
        </div>
      )}

      {/* Icon Row for Song Search */}
      <div style={styles.iconRow}>
        <div onClick={() => setIsSongSearchVisible((prev) => !prev)}>
          {isSongSearchVisible ? (
            <FiMinus style={styles.icon} />
          ) : (
            <FiPlus style={styles.icon} />
          )}
        </div>
      </div>

      {/* Song Search Block */}
      {isSongSearchVisible && (
        <div
          style={{
            margin: "1rem 0",
            padding: "0.5rem",
            backgroundColor: "#333",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a song..."
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "4px",
              border: "none",
              fontSize: "1rem",
            }}
          />
          <button
            onClick={handleSongSearch}
            style={{
              padding: "0.5rem 1rem",
              marginLeft: "0.5rem",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#1db954",
              color: "#fff",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
      )}

      {/* Searched Snippet Preview */}
      {searchedSnippet && (
        <div
          style={{
            margin: "1rem 0",
            padding: "1rem",
            backgroundColor: "#222",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Artwork & Song Info */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={
                searchedSnippet.attributes.artwork?.url
                  .replace("{w}", "100")
                  .replace("{h}", "100") || "/assets/default-artist.png"
              }
              alt={searchedSnippet.attributes.name}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "8px",
                marginRight: "1rem",
              }}
            />
            <div>
              <div
                style={{
                  color: "#fff",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                {searchedSnippet.attributes.name}
              </div>
              <div style={{ color: "#ccc", fontSize: "0.9rem" }}>
                {searchedSnippet.attributes.artistName}
              </div>
            </div>
          </div>
          {/* Right: Play and Attach Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => onPlaySnippet(searchedSnippet)}
              style={{
                backgroundColor: "#1db954",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                cursor: "pointer",
              }}
              title="Play"
            >
              ▶
            </button>
            <button
              onClick={() => {
                /* Attach snippet to comment logic */
              }}
              style={{
                backgroundColor: "#1db954",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                cursor: "pointer",
              }}
              title="Attach snippet to comment"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
