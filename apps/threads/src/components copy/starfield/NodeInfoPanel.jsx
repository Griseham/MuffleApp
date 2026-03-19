// NodeInfoPanel.jsx - Displays information about a selected constellation node
import React, { useContext } from "react";
import styles from "../starfieldStyles";
import { StarfieldContext } from "../context/StarfieldContext";

export default function NodeInfoPanel({ node, onClose }) {
  const { isFullscreen } = useContext(StarfieldContext);
  
  return (
    <div
      style={{
        ...(isFullscreen ? styles.starInfoPanelFS : styles.starInfoPanelWindowed),
        ...styles.starInfoPanel
      }}
    >
      <button
        onClick={onClose}
        style={{
          ...(isFullscreen ? styles.closeButtonFS : styles.closeButtonWindowed),
          ...styles.closeButton
        }}
      >
        ✕
      </button>

      <div style={{ 
        marginBottom: "0.5rem", 
        fontWeight: "bold", 
        fontSize: isFullscreen ? "1.5rem" : "1.1rem" 
      }}>
        {node.artist.name}
      </div>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        {node.artist.imageUrl ? (
          <img 
            src={node.artist.imageUrl}
            alt={node.artist.name}
            style={{ width: "60px", height: "60px", borderRadius: "8px" }}
          />
        ) : (
          <div style={{
            width: 60,
            height: 60,
            borderRadius: "8px",
            backgroundColor: "#1DB954", // Spotify green
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            color: "white",
            fontWeight: "bold"
          }}>
            {node.artist.name[0]}
          </div>
        )}
        
        <div>
          <div style={{ fontSize: "0.9rem", marginBottom: "5px" }}>
            Constellation Node #{node.nodeIndex + 1}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
            Coordinates: {Math.round(node.x)}, {Math.round(node.y)}
          </div>
        </div>
      </div>
      
      {node.artist.genres && node.artist.genres.length > 0 && (
        <div style={{ marginBottom: "15px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Genres:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {node.artist.genres.slice(0, 5).map((genre, i) => (
              <span key={i} style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "0.8rem"
              }}>
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={() => window.open(`https://open.spotify.com/artist/${node.artist.id}`, '_blank')}
        style={{
          ...styles.viewThreadButton,
          backgroundColor: "#1DB954" // Spotify green
        }}
      >
        View on Spotify
      </button>
    </div>
  );
}