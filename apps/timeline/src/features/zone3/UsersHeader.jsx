import { TrophyIcon } from "../Icons";
import { UserHoverTarget } from "../UserHoverCard";

export default function UsersHeader({ users, onRemoveUser, removableIds = [] }) {
  const removableSet = new Set(removableIds.map((id) => String(id)));

  return (
    <div className="users-header">
      {users.map((user) => {
        const pinColor = user.__pinColor;
        const isPinned = !!pinColor;
        const isRemovable = removableSet.has(String(user.id));
        const userVolume = user.__displayVolume ?? user.__stats?.volume ?? 0;
        const userRank = typeof user.__rank === "number" ? user.__rank : null;
        const avatarSrc = !user.isTopAlbums ? user.__avatarSrc ?? null : null;

        return (
          <div key={user.id}
            className={`user-column ${user.isTopAlbums ? "user-column-top" : ""} ${user.isYou ? "user-column-you" : ""} ${isPinned && !user.isYou && !user.isTopAlbums ? "user-column-pinned" : ""}`}
            style={isPinned && !user.isTopAlbums ? { background: `linear-gradient(180deg, ${pinColor}15 0%, transparent 100%)` } : undefined}>

            {/* Floating rank tag — top right corner */}
            {!user.isTopAlbums && userRank !== null && (
              <div
                className="user-rank-tag"
                style={isPinned && !user.isTopAlbums ? {
                  background: `${pinColor}22`,
                  borderColor: `${pinColor}44`,
                  color: pinColor,
                } : undefined}
              >
                #{userRank}
              </div>
            )}

            {user.isTopAlbums ? (
              <>
                <div className={`user-avatar user-avatar-glass ${user.isTopAlbums ? "user-avatar-top" : ""} ${user.isYou ? "user-avatar-you" : ""} ${isPinned && !user.isYou && !user.isTopAlbums ? "user-avatar-pinned" : ""}`}
                  style={isPinned && !user.isTopAlbums ? { background: `linear-gradient(135deg, ${pinColor}, ${pinColor}88)`, borderColor: `${pinColor}66` } : undefined}>
                  <div className="top-album-icon"><TrophyIcon /></div>
                </div>
                <div className="user-label-row">
                  <span className="user-name" style={isPinned && !user.isTopAlbums ? { color: pinColor } : undefined}>{user.name}</span>
                </div>
              </>
            ) : (
              <>
                <UserHoverTarget
                  user={{ ...user, avatar: avatarSrc }}
                  style={{ display: "inline-block" }}
                >
                <div className={`user-avatar user-avatar-glass ${user.isTopAlbums ? "user-avatar-top" : ""} ${user.isYou ? "user-avatar-you" : ""} ${isPinned && !user.isYou && !user.isTopAlbums ? "user-avatar-pinned" : ""}`}
                  style={isPinned && !user.isTopAlbums ? { background: `linear-gradient(135deg, ${pinColor}, ${pinColor}88)`, borderColor: `${pinColor}66` } : undefined}>
                  {avatarSrc ? <img src={avatarSrc} alt={user.name} className="user-avatar-img" loading="lazy" /> : null}
                </div>
                </UserHoverTarget>
                <div className="user-label-row">
                  <span className="user-name" style={isPinned && !user.isTopAlbums ? { color: pinColor } : undefined}>{user.name}</span>
                </div>
                {user.isYou && <span className="you-badge">You</span>}
                <div
                  className="user-volume-badge"
                  style={isPinned && !user.isTopAlbums ? {
                    background: `${pinColor}18`,
                    borderColor: `${pinColor}33`,
                  } : undefined}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <span>{userVolume.toLocaleString()}</span>
                </div>
              </>
            )}
            {isRemovable && (
              <button type="button" className="user-close-btn" onClick={() => onRemoveUser?.(user.id)} aria-label={`Remove ${user.name}`}>×</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
