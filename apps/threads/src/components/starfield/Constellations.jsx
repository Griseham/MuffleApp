// Constellations.jsx
import React, { useContext } from "react";
import { TOTAL_WIDTH, TOTAL_HEIGHT } from "../utils";
import ConstellationOverlay from "../ConstellationOverlay";
import { StarfieldContext } from "../context/Context";

export default function Constellations() {
  const { artists, handleConstellationNodeClick } = useContext(StarfieldContext);

  const validatedArtists = artists.map((artist) => {
    if (!artist.coordinate || typeof artist.coordinate.x !== 'number' || typeof artist.coordinate.y !== 'number') {
      return {
        ...artist,
        coordinate: {
          x: TOTAL_WIDTH / 2,
          y: TOTAL_HEIGHT / 2
        }
      };
    }
    const constellationIndex = artist.constellationIndex ?? 0;
    return { ...artist, constellationIndex };
  });

  return (
    <>
      {validatedArtists.length > 0 ? (
        <ConstellationOverlay
          artists={validatedArtists}
          onNodeClick={handleConstellationNodeClick}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            top: TOTAL_HEIGHT / 2 + 300,
            left: TOTAL_WIDTH / 2,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            color: "rgba(255,255,255,0.5)",
            fontSize: "24px",
            textAlign: "center",
            whiteSpace: "nowrap"
          }}
        >
          Search for an artist to see constellations
        </div>
      )}
    </>
  );
}
