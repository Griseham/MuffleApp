import { useState } from "react";

export function useTimelineState() {
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [hoveredArtist, setHoveredArtist] = useState(null);

  const selectArtist = (artist) => {
    setSelectedArtist(artist);
    setSelectedAlbum(null);
  };

  const selectAlbum = (album) => setSelectedAlbum(album);

  const clearSelection = () => {
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setHoveredArtist(null);
  };

  return {
    state: {
      selectedArtist,
      selectedAlbum,
      hoveredArtist,
    },
    actions: {
      selectArtist,
      selectAlbum,
      clearSelection,
      setHoveredArtist,
    },
  };
}
