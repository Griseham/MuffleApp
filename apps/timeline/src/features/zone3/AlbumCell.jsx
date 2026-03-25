import AlbumCard from "./AlbumCard";

export default function AlbumCell({
  user,
  showAlbum,
  ranking,
  showRankings = false,
  gradient,
  artistName,
  albumName,
  artworkUrl,
  artistImageUrl,
}) {
  if (user.isAddButton) {
    return (
      <div className="grid-cell grid-cell-add">
        <div className="empty-cell" />
      </div>
    );
  }

  const pinColor = user.__pinColor;
  const isPinned = !!pinColor && !user.isTopAlbums;

  return (
    <div
      className={`grid-cell ${isPinned ? "grid-cell-pinned" : ""}`}
      style={isPinned ? { background: `${pinColor}08` } : undefined}
    >
      {showAlbum ? (
        <AlbumCard
          gradient={isPinned ? `linear-gradient(135deg, ${pinColor}44, ${pinColor}22)` : gradient}
          ranking={ranking}
          hideRank={!showRankings}
          artistName={artistName}
          albumName={albumName}
          artworkUrl={artworkUrl}
          artistImageUrl={artistImageUrl}
          borderColor={isPinned ? `${pinColor}33` : undefined}
        />
      ) : (
        <div className="empty-cell" />
      )}
    </div>
  );
}
