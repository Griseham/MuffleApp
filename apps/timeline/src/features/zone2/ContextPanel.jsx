import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { CloseIcon, BackIcon, HeartIcon, PlusIcon } from "../Icons";
import { TOP_ALBUMS } from "../../backend/timelineMockData";
import {
  CACHE_READY_TIMELINE_ARTISTS,
  getCacheReadyArtistByName,
} from "../../backend/cacheReadyArtists";
import albumArtworksCache from "../../backend/cache/album_artworks.json";
import AlbumDetail from "./AlbumDetail";

// ===== small helper (inlined) =====
function formatLikes(num) {
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

const TRACK_KEY_SEPARATOR = "|||";

function normalizeAppleArtworkUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return null;
  return raw.replace("{w}x{h}", "300x300").replace("{w}", "300").replace("{h}", "300");
}

function normalizeName(name) {
  return String(name || "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeLooseTitle(title) {
  return normalizeName(title).replace(/[^a-z0-9]+/g, "");
}

function createTrackLookupKey(songName, artistName) {
  return `${String(songName || "").trim()}${TRACK_KEY_SEPARATOR}${String(artistName || "").trim()}`;
}

function normalizeTrackLookupKey(songName, artistName) {
  return createTrackLookupKey(songName, artistName).toLowerCase();
}

function getRepresentativeTrackName(artist, album) {
  const albumTracks = artist?.albumTracks?.[album?.id];
  if (Array.isArray(albumTracks) && albumTracks.length > 0 && albumTracks[0]?.title) {
    return String(albumTracks[0].title).trim();
  }
  return String(album?.title || "").trim();
}

function normalizeAlbum(album, fallbackColor) {
  return {
    ...album,
    artworkUrl: normalizeAppleArtworkUrl(album?.artworkUrl || null),
    color: album?.color || fallbackColor || "#6B8E8E",
  };
}

function normalizeAlbumTracks(albumTracks = {}) {
  return Object.fromEntries(
    Object.entries(albumTracks).map(([albumId, tracks]) => [
      String(albumId),
      Array.isArray(tracks)
        ? tracks.map((track) => ({
            ...track,
            artworkUrl: normalizeAppleArtworkUrl(track?.artworkUrl || null),
          }))
        : [],
    ])
  );
}

function mergeArtistProfile(baseArtist, profile) {
  if (!profile) return baseArtist;
  const fallbackColor = profile.color || baseArtist?.color || "#6B8E8E";
  return {
    ...baseArtist,
    ...profile,
    id: profile.id || baseArtist?.id,
    name: profile.name || baseArtist?.name,
    initials: profile.initials || baseArtist?.initials,
    color: fallbackColor,
    artworkUrl: normalizeAppleArtworkUrl(profile.artworkUrl || baseArtist?.artworkUrl || null),
    albums: Array.isArray(profile.albums)
      ? profile.albums.map((album) => normalizeAlbum(album, fallbackColor))
      : (baseArtist?.albums || []).map((album) => normalizeAlbum(album, fallbackColor)),
    topSongs: Array.isArray(profile.topSongs)
      ? profile.topSongs.map((song) => ({
          ...song,
          artworkUrl: normalizeAppleArtworkUrl(song?.artworkUrl || null),
        }))
      : (baseArtist?.topSongs || []),
    albumTracks: profile.albumTracks
      ? normalizeAlbumTracks(profile.albumTracks)
      : normalizeAlbumTracks(baseArtist?.albumTracks || {}),
  };
}

function buildAlbumArtworkLookup() {
  const byTrack = new Map();

  for (const [rawKey, entry] of Object.entries(albumArtworksCache || {})) {
    const [songName = "", artistName = ""] = String(rawKey || "").split(TRACK_KEY_SEPARATOR);
    const normalizedKey = normalizeTrackLookupKey(songName, artistName);
    if (!normalizedKey || byTrack.has(normalizedKey)) continue;
    byTrack.set(normalizedKey, entry);
  }

  return byTrack;
}

const LOCAL_ALBUM_ARTWORK_BY_TRACK = buildAlbumArtworkLookup();

function getLocalAlbumArtwork(songName, artistName) {
  return LOCAL_ALBUM_ARTWORK_BY_TRACK.get(normalizeTrackLookupKey(songName, artistName)) || null;
}

function hydrateArtistFromLocalCache(baseArtist) {
  const fallbackColor = baseArtist?.color || "#6B8E8E";
  const artistArtworkUrl = normalizeAppleArtworkUrl(baseArtist?.artworkUrl || null);

  const hydratedAlbums = (baseArtist?.albums || []).map((album) => {
    const representativeTrack = getRepresentativeTrackName(baseArtist, album);
    const artworkEntry = getLocalAlbumArtwork(representativeTrack, baseArtist?.name);
    return normalizeAlbum(
      {
        ...album,
        artworkUrl: artworkEntry?.artworkUrl || album?.artworkUrl || null,
      },
      fallbackColor
    );
  });

  const albumArtworkById = new Map(
    hydratedAlbums.map((album) => [String(album.id), album.artworkUrl || null])
  );

  const hydratedTopSongs = (baseArtist?.topSongs || []).map((song) => {
    const artworkEntry = getLocalAlbumArtwork(song?.title, baseArtist?.name);
    return {
      ...song,
      artworkUrl: normalizeAppleArtworkUrl(
        artworkEntry?.artworkUrl || song?.artworkUrl || albumArtworkById.get(String(song?.albumId)) || null
      ),
    };
  });

  const hydratedAlbumTracks = Object.fromEntries(
    Object.entries(baseArtist?.albumTracks || {}).map(([albumId, tracks]) => [
      String(albumId),
      Array.isArray(tracks)
        ? tracks.map((track) => ({
            ...track,
            artworkUrl: normalizeAppleArtworkUrl(
              track?.artworkUrl || albumArtworkById.get(String(albumId)) || null
            ),
          }))
        : [],
    ])
  );

  return mergeArtistProfile(baseArtist, {
    ...baseArtist,
    artworkUrl: artistArtworkUrl,
    albums: hydratedAlbums,
    topSongs: hydratedTopSongs,
    albumTracks: hydratedAlbumTracks,
  });
}

function buildZone2Artists() {
  return CACHE_READY_TIMELINE_ARTISTS.map((artist) => hydrateArtistFromLocalCache(artist));
}

function buildZone2TopAlbums(zone2Artists) {
  return TOP_ALBUMS
    .slice(0, 7)
    .map((album) => {
      const matchedArtist = findArtistByIdentity(zone2Artists, album);
      const matchedAlbum = findAlbumByIdentity(matchedArtist, album);
      const artworkEntry = getLocalAlbumArtwork(album.title, album.artist);

      return {
        ...album,
        artworkUrl: normalizeAppleArtworkUrl(
          matchedAlbum?.artworkUrl || artworkEntry?.artworkUrl || null
        ),
        artistArtworkUrl: normalizeAppleArtworkUrl(matchedArtist?.artworkUrl || null),
        resolvedAlbumTitle:
          matchedAlbum?.title ||
          String(artworkEntry?.albumName || "").trim() ||
          album.title,
        hasResolvedArtist: Boolean(matchedArtist),
        hasResolvedAlbum: Boolean(matchedAlbum),
      };
    });
}

function findArtistByIdentity(artists, artistLike) {
  if (!artistLike) return null;

  const targetName = normalizeName(artistLike.name || artistLike.artist);
  if (!targetName) return null;

  if (artistLike.name) {
    const byId = artists.find((artist) => String(artist.id) === String(artistLike.id));
    if (byId) return byId;
  }

  return artists.find((artist) => normalizeName(artist.name) === targetName) || null;
}

function findAlbumByIdentity(artist, albumLike) {
  if (!artist || !albumLike) return null;

  const byId = artist.albums?.find((album) => String(album.id) === String(albumLike.id));
  if (byId) return byId;

  const rawCandidates = [
    albumLike.title,
    albumLike.resolvedAlbumTitle,
    albumLike.albumName,
  ].filter(Boolean);
  if (rawCandidates.length === 0) return null;

  const exactTitleSet = new Set(rawCandidates.map((title) => normalizeName(title)).filter(Boolean));
  const exactLooseSet = new Set(rawCandidates.map((title) => normalizeLooseTitle(title)).filter(Boolean));
  const prefixLooseCandidates = rawCandidates
    .map((title) => String(title || "").replace(/(\.\.\.|…)+$/g, "").trim())
    .map((title) => normalizeLooseTitle(title))
    .filter(Boolean);

  return (
    artist.albums?.find((album) => {
      const albumExact = normalizeName(album.title);
      if (exactTitleSet.has(albumExact)) return true;

      const albumLoose = normalizeLooseTitle(album.title);
      if (exactLooseSet.has(albumLoose)) return true;

      return prefixLooseCandidates.some((candidate) => candidate.length >= 4 && albumLoose.startsWith(candidate));
    }) || null
  );
}

// ===== subviews (inlined) =====
function ContextSidebar({ artists, selectedArtist, onSelectArtist }) {
  const [failedArtistImages, setFailedArtistImages] = useState(() => new Set());
  const onArtistImageError = useCallback((artistId) => {
    setFailedArtistImages((prev) => {
      if (prev.has(artistId)) return prev;
      const next = new Set(prev);
      next.add(artistId);
      return next;
    });
  }, []);

  return (
    <div className="context-sidebar">
      <div className="context-sidebar-header">
        <span className="context-sidebar-title">Following</span>
      </div>

      <div className="context-artist-list">
        {artists.map((artist) => {
          const hasArtistImage = Boolean(artist.artworkUrl) && !failedArtistImages.has(artist.id);
          return (
            <button
              type="button"
              key={artist.id}
              className={`context-artist-item ${selectedArtist?.id === artist.id ? "active" : ""}`}
              onClick={() => onSelectArtist(artist)}
              aria-label={`Open ${artist.name}`}
              aria-pressed={selectedArtist?.id === artist.id}
            >
              <div className="context-artist-avatar" style={{ background: artist.color }}>
                {hasArtistImage ? (
                  <img
                    src={artist.artworkUrl}
                    alt={artist.name}
                    className="context-artist-avatar-img"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => onArtistImageError(artist.id)}
                  />
                ) : (
                  <span>{artist.initials}</span>
                )}
              </div>
              <span className="context-artist-name">{artist.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TopAlbumsView({ albums, onSelectArtist, onSelectAlbum }) {
  const [failedCoverImages, setFailedCoverImages] = useState(() => new Set());
  const [failedArtistImages, setFailedArtistImages] = useState(() => new Set());

  const onCoverImageError = useCallback((albumId) => {
    setFailedCoverImages((prev) => {
      if (prev.has(albumId)) return prev;
      const next = new Set(prev);
      next.add(albumId);
      return next;
    });
  }, []);

  const onArtistImageError = useCallback((albumId) => {
    setFailedArtistImages((prev) => {
      if (prev.has(albumId)) return prev;
      const next = new Set(prev);
      next.add(albumId);
      return next;
    });
  }, []);

  return (
    <div className="top-albums-view">
      <div className="top-albums-header">
        <h2 className="top-albums-title">Top albums of the month</h2>
      </div>

      <div className="top-albums-grid">
        {albums.map((album, index) => {
          const hasCoverImage = Boolean(album.artworkUrl) && !failedCoverImages.has(album.id);
          const hasArtistImage = Boolean(album.artistArtworkUrl) && !failedArtistImages.has(album.id);
          return (
            <div key={album.id} className={`top-album-item ${album.featured ? "featured" : ""}`}>
              {index === 0 && <div className="rank-number">1</div>}

              <button
                type="button"
                className="top-album-cover"
                style={{
                  background: `linear-gradient(135deg, ${album.color} 0%, ${album.color}88 50%, #1a1a1a 100%)`,
                }}
                onClick={() => onSelectAlbum(album)}
                aria-label={`Open album ${album.title}`}
              >
                {hasCoverImage ? (
                  <img
                    src={album.artworkUrl}
                    alt={`${album.title} cover`}
                    className="top-album-cover-img"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => onCoverImageError(album.id)}
                  />
                ) : (
                  <span className="top-album-initials">{album.initials}</span>
                )}
              </button>

              <div className="top-album-info">
                <button
                  type="button"
                  className="top-album-title-text top-album-title-trigger"
                  onClick={() => onSelectAlbum(album)}
                  aria-label={`Open album ${album.title}`}
                >
                  {album.title}
                </button>
                <button
                  type="button"
                  className="top-album-artist-row top-album-artist-trigger"
                  onClick={() => onSelectArtist(album)}
                  aria-label={`Open artist ${album.artist}`}
                >
                  <div className="top-album-artist-avatar" style={{ background: album.color }}>
                    {hasArtistImage ? (
                      <img
                        src={album.artistArtworkUrl}
                        alt={album.artist}
                        className="top-album-artist-avatar-img"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => onArtistImageError(album.id)}
                      />
                    ) : (
                      <span>{album.initials}</span>
                    )}
                  </div>
                  <span className="top-album-artist-name">{album.artist}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== Design D: Album Card with Hover Reveal =====
function AlbumCard({ album, artist, isHovered, onHover, onClick, isFeatured }) {
  const [failedArtworkUrl, setFailedArtworkUrl] = useState(null);
  const isRated = album.userRating !== null && album.userRating !== undefined;
  const hasAlbumArtwork = Boolean(album.artworkUrl) && failedArtworkUrl !== album.artworkUrl;
  
  const getRatingColor = (rating) => {
    if (rating >= 8) return '#6BCB77';
    if (rating >= 6) return '#6B8E8E';
    return '#FFD93D';
  };

  const getGlowGradient = (rating) => {
    if (rating >= 8) return 'linear-gradient(to top, rgba(107, 203, 119, 0.8), transparent)';
    if (rating >= 6) return 'linear-gradient(to top, rgba(107, 142, 142, 0.8), transparent)';
    return 'linear-gradient(to top, rgba(255, 217, 61, 0.6), transparent)';
  };

  return (
    <button
      type="button"
      className={`album-card-d ${isFeatured ? 'featured' : ''}`}
      onMouseEnter={() => onHover(album.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      aria-label={`Open album ${album.title}`}
    >
      {/* Card Cover */}
      <div 
        className={`album-card-cover-d ${isHovered ? 'hovered' : ''}`}
        style={{
          background: isRated 
            ? `linear-gradient(135deg, ${album.color} 0%, ${album.color}66 50%, #1a1a1a 100%)`
            : 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        }}
      >
        {hasAlbumArtwork ? (
          <img
            src={album.artworkUrl}
            alt={`${album.title} cover`}
            className="album-cover-image-d"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailedArtworkUrl(album.artworkUrl || "__missing__")}
          />
        ) : (
          <span className={`album-initials-d ${isRated ? '' : 'unrated'}`}>
            {artist.initials}
          </span>
        )}

        {/* Rating Badge (top right, visible when not hovered) */}
        {isRated && !isHovered && (
          <div className="album-badge-d">
            <span style={{ color: getRatingColor(album.userRating) }}>
              {album.userRating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Unrated Indicator (center, visible when not hovered) */}
        {!isRated && !isHovered && (
          <div className="album-unrated-d">
            <div className="unrated-icon-d">
              <PlusIcon />
            </div>
          </div>
        )}

        {/* Bottom Glow for rated albums */}
        {isRated && (
          <div 
            className="album-glow-d"
            style={{
              height: `${(album.userRating / 10) * 6}px`,
              background: getGlowGradient(album.userRating),
            }}
          />
        )}

        {/* Hover Overlay */}
        {isHovered && (
          <div className="album-overlay-d">
            {isRated ? (
              <div className="album-score-d">
                <span className="score-label-d">YOUR RATING</span>
                <span className="score-value-d">{album.userRating.toFixed(1)}</span>
              </div>
            ) : (
              <div className="album-rate-btn-d">
                <span>Rate this album</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Album Info */}
      <div className="album-info-d">
        <div className={`album-title-d ${isRated ? '' : 'unrated'}`}>
          {album.title}
        </div>
        <div className="album-year-d">{album.year}</div>
      </div>
    </button>
  );
}

function AlbumsGrid({ artist, onSelectAlbum, isLoading }) {
  const [hoveredAlbum, setHoveredAlbum] = useState(null);
  const [failedHeaderImageUrl, setFailedHeaderImageUrl] = useState(null);

  // Calculate stats
  const ratedCount = artist.albums.filter(a => a.userRating !== null && a.userRating !== undefined).length;
  const totalCount = artist.albums.length;
  const avgRating = ratedCount > 0 
    ? artist.albums.filter(a => a.userRating != null).reduce((sum, a) => sum + a.userRating, 0) / ratedCount 
    : 0;
  const hasHeaderImage = Boolean(artist.artworkUrl) && failedHeaderImageUrl !== artist.artworkUrl;

  return (
    <div className="albums-view-d">
      {/* Header */}
      <div className="albums-header-d">
        <div className="header-left-d">
          <div 
            className="header-avatar-d"
            style={{ background: `linear-gradient(135deg, ${artist.color}, ${artist.color}66)` }}
          >
            {hasHeaderImage ? (
              <img
                src={artist.artworkUrl}
                alt={artist.name}
                className="header-avatar-image-d"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setFailedHeaderImageUrl(artist.artworkUrl || "__missing__")}
              />
            ) : (
              <span>{artist.initials}</span>
            )}
          </div>
          <div className="header-text-d">
            <h2 className="header-name-d">{artist.name}</h2>
            <span className="header-label-d">Discography</span>
          </div>
        </div>

        <div className="header-right-d">
          {/* Progress */}
          <div className="progress-pill-d">
            <div className="progress-track-d">
              <div 
                className="progress-fill-d"
                style={{ width: `${(ratedCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="progress-text-d">{ratedCount}/{totalCount}</span>
          </div>

          {/* Average */}
          {ratedCount > 0 && (
            <div className="avg-pill-d">
              <span className="avg-value-d">{avgRating.toFixed(1)}</span>
              <span className="avg-label-d">avg</span>
            </div>
          )}
        </div>
      </div>

      {/* Albums Grid */}
      {isLoading && artist.albums.length === 0 ? (
        <div className="zone2-empty-state">Loading discography...</div>
      ) : artist.albums.length === 0 ? (
        <div className="zone2-empty-state">No albums available yet.</div>
      ) : (
        <div className="albums-grid-d">
          {artist.albums.map((album, index) => (
            <AlbumCard
              key={album.id}
              album={album}
              artist={artist}
              isFeatured={index === 0}
              isHovered={hoveredAlbum === album.id}
              onHover={setHoveredAlbum}
              onClick={() => onSelectAlbum(album)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SongsPanel({ songs, artist, toggleLike, likedSongs, selectedAlbum, isLoading }) {
  const [failedSongArtworkUrls, setFailedSongArtworkUrls] = useState(() => new Set());
  const onSongArtworkError = useCallback((artworkUrl) => {
    setFailedSongArtworkUrls((prev) => {
      if (!artworkUrl || prev.has(artworkUrl)) return prev;
      const next = new Set(prev);
      next.add(artworkUrl);
      return next;
    });
  }, []);

  if (!artist) return null;
  if (selectedAlbum) return null;

  return (
    <div className="context-songs">
      <div className="songs-header">Top Songs</div>

      {isLoading && songs.length === 0 ? (
        <div className="zone2-empty-state zone2-empty-state-songs">Loading top songs...</div>
      ) : songs.length === 0 ? (
        <div className="zone2-empty-state zone2-empty-state-songs">No top songs available yet.</div>
      ) : (
      <div className="songs-list">
        {songs.map((song) => {
          const isLiked = likedSongs.has(song.id);
          const displayLikes = isLiked ? song.likes + 1 : song.likes;
          const hasSongArtwork = Boolean(song.artworkUrl) && !failedSongArtworkUrls.has(song.artworkUrl);

          return (
            <div key={song.id} className="song-item">
              <div className="song-artwork">
                {hasSongArtwork ? (
                  <img
                    src={song.artworkUrl}
                    alt={`${song.title} artwork`}
                    className="song-artwork-img"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => onSongArtworkError(song.artworkUrl)}
                  />
                ) : (
                  <span className="song-artwork-fallback">{artist.initials}</span>
                )}
              </div>

              <div className="song-info">
                <span className="song-name">{song.title}</span>
              </div>

              <button
                className={`song-like-btn ${isLiked ? "liked" : ""}`}
                onClick={() => toggleLike(song.id)}
                type="button"
                aria-label={`${isLiked ? "Unlike" : "Like"} ${song.title}`}
                aria-pressed={isLiked}
              >
                <HeartIcon filled={isLiked} />
                <span className="song-likes">{formatLikes(displayLikes)}</span>
              </button>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

// ==================== CONTEXT PANEL (ZONE 2) ====================
export default function ContextPanel({
  selectedArtist,
  setSelectedArtist,
  selectedAlbum,
  setSelectedAlbum,
}) {
  const ALBUM_TRANSITION_MS = 280;
  const [likedSongs, setLikedSongs] = useState(() => new Set());
  const [activeAlbumView, setActiveAlbumView] = useState(null);
  const [isAlbumClosing, setIsAlbumClosing] = useState(false);
  const albumCloseTimerRef = useRef(null);
  const zone2Artists = useMemo(() => buildZone2Artists(), []);
  const zone2TopAlbums = useMemo(() => buildZone2TopAlbums(zone2Artists), [zone2Artists]);

  const selectedArtistForView = useMemo(() => {
    if (!selectedArtist) return null;

    const byId = zone2Artists.find((artist) => String(artist.id) === String(selectedArtist.id));
    if (byId) return byId;

    const byName = zone2Artists.find(
      (artist) => normalizeName(artist.name) === normalizeName(selectedArtist.name)
    );
    return byName || selectedArtist;
  }, [selectedArtist, zone2Artists]);

  const sidebarArtists = useMemo(() => {
    const followedArtists = zone2Artists.filter((artist) => artist.isFollowedArtist);
    if (!selectedArtistForView?.name) return followedArtists;

    const selectedName = normalizeName(selectedArtistForView.name);
    const alreadyVisible = followedArtists.some(
      (artist) => normalizeName(artist.name) === selectedName
    );

    if (alreadyVisible) return followedArtists;
    return [...followedArtists, selectedArtistForView];
  }, [selectedArtistForView, zone2Artists]);

  const selectedAlbumForView = useMemo(() => {
    if (!selectedAlbum || !selectedArtistForView) return selectedAlbum;
    return findAlbumByIdentity(selectedArtistForView, selectedAlbum) || selectedAlbum;
  }, [selectedAlbum, selectedArtistForView]);

  const tracksForAlbum = useMemo(() => {
    if (!selectedArtistForView || !selectedAlbumForView) return [];
    return selectedArtistForView.albumTracks?.[selectedAlbumForView.id] || [];
  }, [selectedArtistForView, selectedAlbumForView]);

  const topSongs = useMemo(() => {
    if (!selectedArtistForView) return [];
    return selectedArtistForView.topSongs || [];
  }, [selectedArtistForView]);

  const isSelectedArtistLoading = false;

  useEffect(() => () => {
    if (albumCloseTimerRef.current) {
      window.clearTimeout(albumCloseTimerRef.current);
      albumCloseTimerRef.current = null;
    }
  }, []);

  const toggleLike = useCallback((songId) => {
    setLikedSongs((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  }, []);

  const handleArtistSelect = useCallback((artist) => {
    if (albumCloseTimerRef.current) {
      window.clearTimeout(albumCloseTimerRef.current);
      albumCloseTimerRef.current = null;
    }
    setIsAlbumClosing(false);
    setActiveAlbumView(null);
    setSelectedArtist(artist);
    setSelectedAlbum(null);
  }, [setSelectedAlbum, setSelectedArtist]);

  const handleTopAlbumArtistSelect = useCallback((album) => {
    const matchedArtist = findArtistByIdentity(zone2Artists, album);
    if (matchedArtist) {
      handleArtistSelect(matchedArtist);
      return;
    }

    const cacheReadyArtist = getCacheReadyArtistByName(album.artist);
    if (cacheReadyArtist) {
      handleArtistSelect(hydrateArtistFromLocalCache(cacheReadyArtist));
    }
  }, [handleArtistSelect, zone2Artists]);

  const handleTopAlbumSelect = useCallback((album) => {
    if (albumCloseTimerRef.current) {
      window.clearTimeout(albumCloseTimerRef.current);
      albumCloseTimerRef.current = null;
    }

    const matchedArtist = findArtistByIdentity(zone2Artists, album);
    const fallbackArtist = getCacheReadyArtistByName(album.artist);
    const nextArtist = matchedArtist || (fallbackArtist ? hydrateArtistFromLocalCache(fallbackArtist) : null);
    if (!nextArtist) return;
    const matchedAlbum = findAlbumByIdentity(nextArtist, album);

    const nextAlbum =
      matchedAlbum || {
        ...album,
        title: album.resolvedAlbumTitle || album.title,
        artworkUrl: album.artworkUrl || null,
        color: album.color || nextArtist.color || "#6B8E8E",
      };

    const nextTracks = nextArtist.albumTracks?.[nextAlbum.id] || [];
    setIsAlbumClosing(false);
    setActiveAlbumView({ artist: nextArtist, album: nextAlbum, tracks: nextTracks });
    setSelectedArtist(nextArtist);
    setSelectedAlbum(nextAlbum);
  }, [setSelectedAlbum, setSelectedArtist, zone2Artists]);

  const handleAlbumSelect = useCallback((album) => {
    if (albumCloseTimerRef.current) {
      window.clearTimeout(albumCloseTimerRef.current);
      albumCloseTimerRef.current = null;
    }
    if (!selectedArtistForView) return;
    const matchedAlbum = findAlbumByIdentity(selectedArtistForView, album) || album;
    const nextTracks = selectedArtistForView.albumTracks?.[matchedAlbum.id] || [];
    setIsAlbumClosing(false);
    setActiveAlbumView({ artist: selectedArtistForView, album: matchedAlbum, tracks: nextTracks });
    setSelectedAlbum(matchedAlbum);
  }, [selectedArtistForView, setSelectedAlbum]);

  const handleClose = () => {
    if (selectedAlbumForView || activeAlbumView) {
      if (albumCloseTimerRef.current) {
        window.clearTimeout(albumCloseTimerRef.current);
        albumCloseTimerRef.current = null;
      }
      setSelectedAlbum(null);
      setIsAlbumClosing(true);
      albumCloseTimerRef.current = window.setTimeout(() => {
        setIsAlbumClosing(false);
        setActiveAlbumView(null);
        albumCloseTimerRef.current = null;
      }, ALBUM_TRANSITION_MS);
      return;
    }

    if (albumCloseTimerRef.current) {
      window.clearTimeout(albumCloseTimerRef.current);
      albumCloseTimerRef.current = null;
    }
    setIsAlbumClosing(false);
    setActiveAlbumView(null);
    setSelectedArtist(null);
    setSelectedAlbum(null);
  };

  const displayedAlbumView =
    selectedAlbumForView && selectedArtistForView
      ? {
          artist: selectedArtistForView,
          album: selectedAlbumForView,
          tracks: tracksForAlbum,
        }
      : activeAlbumView;
  const isAlbumPanelVisible = Boolean(selectedAlbumForView || isAlbumClosing);
  const isAlbumLeaving = isAlbumClosing && !selectedAlbumForView;
  const albumForSongsPanel = selectedAlbumForView || displayedAlbumView?.album || null;

  return (
    <div className={`context-panel ${isAlbumPanelVisible ? "album-open" : ""}`}>
      <div className="context-body">
        {!selectedArtist ? (
          <TopAlbumsView
            albums={zone2TopAlbums}
            onSelectArtist={handleTopAlbumArtistSelect}
            onSelectAlbum={handleTopAlbumSelect}
          />
        ) : (
          <>
            {/* Hide the left Following sidebar ONLY while album is selected (full-bleed) */}
            {!isAlbumPanelVisible && (
              <ContextSidebar
                artists={sidebarArtists}
                selectedArtist={selectedArtistForView}
                onSelectArtist={handleArtistSelect}
              />
            )}

            <div className={`context-main ${isAlbumPanelVisible ? "album-mode" : "grid-mode"}`}>
              <div className="context-toolbar">
                <div className="context-toolbar-left">
                  {isAlbumPanelVisible && (
                    <>
                      <button className="context-back-btn" onClick={handleClose} type="button">
                        <BackIcon />
                        <span>Back</span>
                      </button>
                    </>
                  )}
                </div>

                <button
                  className="close-btn"
                  onClick={handleClose}
                  type="button"
                  aria-label={isAlbumPanelVisible ? "Close album detail" : "Close artist context"}
                >
                  <CloseIcon />
                </button>
              </div>

              {isAlbumPanelVisible && displayedAlbumView ? (
                <div className={`context-album-panel ${isAlbumLeaving ? "is-leaving" : "is-entering"}`}>
                  <AlbumDetail
                    artist={displayedAlbumView.artist}
                    album={displayedAlbumView.album}
                    tracks={displayedAlbumView.tracks}
                    toggleLike={toggleLike}
                    likedSongs={likedSongs}
                  />
                </div>
              ) : (
                <AlbumsGrid
                  artist={selectedArtistForView}
                  onSelectAlbum={handleAlbumSelect}
                  isLoading={isSelectedArtistLoading}
                />
              )}
            </div>

            <SongsPanel
              songs={topSongs}
              artist={selectedArtistForView}
              selectedAlbum={albumForSongsPanel}
              toggleLike={toggleLike}
              likedSongs={likedSongs}
              isLoading={isSelectedArtistLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}
