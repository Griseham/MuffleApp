import { useState } from "react";

export default function AlbumCard({
  gradient,
  ranking,
  hideRank,
  artistName,
  albumName,
  artworkUrl,
  artistImageUrl,
  borderColor,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showRealArt = Boolean(artworkUrl) && !imgFailed;
  const showArtistAvatar = Boolean(artistImageUrl) && !avatarFailed;
  const artistInitial = String(artistName || "").trim().charAt(0).toUpperCase();

  return (
    <div className="album-card">
      <div
        className="album-cover"
        style={borderColor ? { border: `1px solid ${borderColor}` } : undefined}
      >
        {showRealArt ? (
          <img
            src={artworkUrl}
            alt={albumName || artistName || "album"}
            className="album-cover-img"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="cover-inner" style={{ background: gradient }} />
        )}
        {!hideRank && <div className="rank-badge">#{ranking}</div>}
      </div>
      <div className="artist-row">
        <div className="artist-avatar">
          {showArtistAvatar ? (
            <img
              src={artistImageUrl}
              alt={artistName || "artist"}
              className="artist-avatar-img"
              loading="lazy"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <span className="artist-avatar-fallback">{artistInitial || "?"}</span>
          )}
        </div>
        <span className="artist-name">{artistName}</span>
      </div>
    </div>
  );
}
