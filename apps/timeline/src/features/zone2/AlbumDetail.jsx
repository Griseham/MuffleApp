import { useMemo, useState, memo } from "react";
import { HeartIcon } from "../Icons";
import { UserHoverTarget } from "../UserHoverCard";
const REVIEW_AVATAR_COUNT = 999;

// Genre base ratings - these will be adjusted by volume when active
const GENRES = [
  { name: "Hip-Hop", baseRating: 9.2, color: "#6BCB77" },
  { name: "R&B", baseRating: 8.5, color: "#4ECDC4" },
  { name: "Indie", baseRating: 8.1, color: "#45B7D1" },
  { name: "Pop", baseRating: 7.4, color: "#96CEB4" },
  { name: "Electronic", baseRating: 7.0, color: "#FFEAA7" },
  { name: "Rock", baseRating: 6.8, color: "#DDA0DD" },
];

// Mock review data for the reviews tab
const MOCK_REVIEWS = [
  { id: 1, user: "user345", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia.", rating: 92 },
  { id: 2, user: "melodyFan88", text: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", rating: 85 },
  { id: 3, user: "basshead_x", text: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.", rating: 78 },
  { id: 4, user: "vinyl_guru", text: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.", rating: 65 },
  { id: 5, user: "nightowl99", text: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.", rating: 55 },
  { id: 6, user: "echo.wav", text: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit.", rating: 43 },
  { id: 7, user: "kr0n1k", text: "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.", rating: 91 },
  { id: 8, user: "skywlkr", text: "Quis autem vel eum iure reprehenderit qui in ea voluptate velit.", rating: 72 },
  { id: 9, user: "lofi_dreamer", text: "At vero eos et accusamus et iusto odio dignissimos ducimus.", rating: 38 },
  { id: 10, user: "sub_zero42", text: "Nam libero tempore, cum soluta nobis est eligendi optio cumque.", rating: 82 },
  { id: 11, user: "beat.smith", text: "Temporibus autem quibusdam et aut officiis debitis rerum necessitatibus.", rating: 60 },
  { id: 12, user: "wavPool", text: "Itaque earum rerum hic tenetur sapiente delectus ut aut reiciendis.", rating: 29 },
];

const formatLikes = (num) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

const getRatingColor = (rating) => {
  if (rating >= 8) return "#6BCB77";
  if (rating >= 6) return "#6B8E8E";
  if (rating >= 4) return "#FFEAA7";
  return "#FF6B6B";
};

const getReviewRatingColor = (r) => {
  if (r >= 80) return "#6BCB77";
  if (r >= 60) return "#6B8E8E";
  if (r >= 40) return "#FFEAA7";
  return "#FF6B6B";
};

const hashStringToInt = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

const getReviewAvatarSrc = (review) => {
  const seed = String(review?.user || review?.id || "review-user");
  const avatarNumber = (Math.abs(hashStringToInt(seed)) % REVIEW_AVATAR_COUNT) + 1;
  return `/assets/image${avatarNumber}.png`;
};

// Volume icon component - with muted state
const VolumeIcon = ({ muted }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    {muted ? (
      <>
        <line x1="22" y1="9" x2="16" y2="15" />
        <line x1="16" y1="9" x2="22" y2="15" />
      </>
    ) : (
      <>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    )}
  </svg>
);

// ==================== NUMBER PICKER RATING ====================
function NumberPickerRating({ value, onChange }) {
  const ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="number-picker-rating">
      <div className="number-picker-label">Your Rating</div>

      <div className="number-picker-buttons">
        {ratings.map((num) => {
          const isSelected = Math.round(value) === num;
          const isLower = num <= Math.round(value);

          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`number-picker-btn ${isSelected ? "selected" : ""} ${isLower && !isSelected ? "lower" : ""}`}
              style={{
                "--btn-color": getRatingColor(num),
              }}
            >
              {num}
            </button>
          );
        })}
      </div>

      <div
        className="number-picker-value"
        style={{ color: getRatingColor(value) }}
      >
        {value.toFixed(1)}
      </div>
    </div>
  );
}

// ==================== GENRE CARD WITH ANIMATED FILL ====================
function GenreCard({ genre, volume, maxVolume = 3200, isVolumeMuted }) {
  const mult = isVolumeMuted ? 1 : (0.5 + (volume / maxVolume) * 0.5);
  const rating = Math.min(10, genre.baseRating * mult);
  const fillHeight = (rating / 10) * 100;

  return (
    <div
      className={`genre-card-d ${isVolumeMuted ? "muted" : ""}`}
      style={{
        "--genre-color": genre.color,
        "--fill-height": `${fillHeight}%`,
      }}
    >
      <div className="genre-card-fill" />
      <div className="genre-card-content">
        <div className="genre-card-name">{genre.name}</div>
        <div className="genre-card-rating" style={{ color: genre.color }}>
          {rating.toFixed(1)}
        </div>
        <div className="genre-card-bar">
          <div
            className="genre-card-bar-fill"
            style={{ width: `${fillHeight}%`, background: genre.color }}
          />
        </div>
      </div>
    </div>
  );
}

// ==================== TRACK WITH POPULARITY BAR ====================
function TrackWithBar({ track, index, isPlaying, isLiked, onToggleLike }) {
  const likes = Math.round(track.likes || 0);
  const barWidth = (likes / 3000) * 100;
  const barColor = likes > 2000 ? "#6BCB77" : likes > 1000 ? "#6B8E8E" : "#554E48";
  const displayLikes = isLiked ? likes + 1 : likes;

  return (
    <div
      className={`track-bar-item ${isPlaying ? "playing" : ""}`}
      style={{ "--bar-width": `${barWidth}%`, "--bar-color": barColor }}
    >
      <div className="track-bar-bg" />
      <div className="track-bar-content">
        <div className={`track-bar-num ${isPlaying ? "playing" : ""}`}>
          {isPlaying ? "▶" : index + 1}
        </div>
        <span className="track-bar-title">{track.title}</span>
        <button
          type="button"
          className={`track-bar-like ${isLiked ? "liked" : ""}`}
          onClick={() => onToggleLike?.(track.id)}
          style={{ "--like-color": barColor }}
        >
          <HeartIcon filled={isLiked} />
          <span>{formatLikes(displayLikes)}</span>
        </button>
      </div>
    </div>
  );
}

// ==================== REVIEW ITEM (Signal Pulses) ====================
function ReviewItem({ review }) {
  const c = getReviewRatingColor(review.rating);
  const ringSize = 32 + (review.rating / 100) * 6;
  const avatarSrc = getReviewAvatarSrc(review);
  const fallbackLabel = String(review.user || "?").slice(0, 1).toUpperCase();

  return (
    <div className="review-item">
      <UserHoverTarget
        user={{
          id: `review-${review.id}`,
          name: review.user,
          avatar: avatarSrc,
        }}
        style={{ display: "inline-block" }}
      >
        <div className="review-avatar">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className="review-avatar-image"
              loading="lazy"
            />
          ) : (
            <span className="review-avatar-fallback">{fallbackLabel}</span>
          )}
        </div>
      </UserHoverTarget>

      <div className="review-body">
        <div className="review-username">
          {review.user}
          {review.rating >= 85 && (
            <span
              className="review-high-badge"
              style={{ "--badge-color": c }}
            >
              HIGH
            </span>
          )}
        </div>
        <div className="review-text">{review.text}</div>
      </div>

      <div
        className={`review-rating-ring ${review.rating >= 80 ? "has-halo" : ""}`}
        style={{
          "--ring-color": c,
          "--ring-size": `${ringSize}px`,
        }}
      >
        {review.rating >= 80 && <div className="review-rating-halo" />}
        <span className="review-rating-number">{review.rating}</span>
      </div>
    </div>
  );
}

// ==================== REVIEWS PANEL ====================
function ReviewsPanel() {
  return (
    <div className="reviews-panel">
      <div className="reviews-list">
        {MOCK_REVIEWS.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

// ==================== MAIN ALBUM DETAIL COMPONENT ====================
function AlbumDetail({ artist, album, tracks = [], toggleLike, likedSongs }) {
  const [userRating, setUserRating] = useState(5);
  const [volume, setVolume] = useState(1600);
  const [isVolumeMuted, setIsVolumeMuted] = useState(true);
  const [failedAlbumArtworkUrl, setFailedAlbumArtworkUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("reviews"); // Reviews is default

  const avgRating = useMemo(() => {
    const mult = isVolumeMuted ? 1 : (0.5 + (volume / 3200) * 0.5);
    return (
      GENRES.reduce((sum, g) => sum + Math.min(10, g.baseRating * mult), 0) /
      GENRES.length
    );
  }, [volume, isVolumeMuted]);

  const accent = album?.color || "#6B8E8E";
  const trackCount = tracks?.length || 0;
  const hasAlbumArtwork = Boolean(album?.artworkUrl) && failedAlbumArtworkUrl !== album?.artworkUrl;

  const handleVolumeToggle = () => {
    setIsVolumeMuted(!isVolumeMuted);
  };

  return (
    <div className="album-detail-d" style={{ "--album-accent": accent }}>
      {/* Header Card */}
      <div className="album-header-card-d">
        <div className="album-header-row-d">
          <div className="album-art-d">
            {hasAlbumArtwork ? (
              <img
                src={album.artworkUrl}
                alt={`${album.title} cover`}
                className="album-art-image-d"
                loading="lazy"
                onError={() => setFailedAlbumArtworkUrl(album.artworkUrl || "__missing__")}
              />
            ) : (
              <span className="album-art-initials-d">{artist.initials}</span>
            )}
          </div>

          <div className="album-info-section-d">
            <h1 className="album-title-d">{album.title}</h1>
            <p className="album-meta-d">
              {artist.name} · {album.year} · {trackCount} songs
            </p>

            <div className="album-ratings-d">
              <div className="rating-block-d">
                <div className="rating-block-label">Avg</div>
                <div
                  className="rating-block-value"
                  style={{ color: "#6B8E8E" }}
                >
                  {avgRating.toFixed(1)}
                </div>
              </div>

              <div className="rating-divider-d" />

              <NumberPickerRating value={userRating} onChange={setUserRating} />
            </div>
          </div>
        </div>
      </div>

      {/* Volume Control Card */}
      <div className={`volume-card-d ${isVolumeMuted ? "muted" : ""}`}>
        <div className="volume-header-d">
          <button 
            type="button"
            className={`volume-toggle-btn ${isVolumeMuted ? "muted" : ""}`}
            onClick={handleVolumeToggle}
            aria-label={isVolumeMuted ? "Unmute volume filter" : "Mute volume filter"}
          >
            <VolumeIcon muted={isVolumeMuted} />
          </button>
          <span className="volume-value-d">{volume} / 3200</span>
        </div>

        <div className="volume-track-d">
          <div
            className="volume-fill-d"
            style={{ width: `${(volume / 3200) * 100}%` }}
          />
          <input
            type="range"
            min="0"
            max="3200"
            value={volume}
            onChange={(e) => {
              setVolume(parseInt(e.target.value));
              if (isVolumeMuted) {
                setIsVolumeMuted(false);
              }
            }}
            className="volume-input-d"
          />
        </div>
      </div>

      {/* Genre Cards Grid */}
      <div className="genre-cards-grid-d">
        {GENRES.map((genre) => (
          <GenreCard 
            key={genre.name} 
            genre={genre} 
            volume={volume} 
            isVolumeMuted={isVolumeMuted}
          />
        ))}
      </div>

      {/* Tabs: Reviews / Tracklist */}
      <div className="album-tabs-d">
        <button
          type="button"
          className={`album-tab-btn ${activeTab === "reviews" ? "active" : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews ({MOCK_REVIEWS.length})
        </button>
        <button
          type="button"
          className={`album-tab-btn ${activeTab === "tracklist" ? "active" : ""}`}
          onClick={() => setActiveTab("tracklist")}
        >
          Tracklist
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "reviews" ? (
        <div className="tracklist-card-d">
          <ReviewsPanel />
        </div>
      ) : (
        <div className="tracklist-card-d">
          <div className="tracklist-items-d">
            {tracks.map((track, i) => (
              <TrackWithBar
                key={track.id}
                track={track}
                index={i}
                isPlaying={i === 0}
                isLiked={likedSongs?.has(track.id)}
                onToggleLike={toggleLike}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AlbumDetail);
