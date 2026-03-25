import { useState } from "react";

// ==================== DESIGN H: PINNED AVATARS BAR ====================

export default function PinnedAvatarsBar({
  youUser,
  pinnedFriends,
  availableFriends,
  onAddFriend,
  onRemoveFriend,
}) {
  const [expandAdd, setExpandAdd] = useState(false);

  // "You" is always shown first in the comparing bar
  const youColor = "#E8A87C";

  // Filter out already-pinned friends from the available list
  const friendsToShow = availableFriends.filter(
    (f) => !pinnedFriends.find((pf) => pf.id === f.id)
  );

  const canAddMore = pinnedFriends.length < 3;

  const handleAddFriend = (friend) => {
    onAddFriend(friend);
    setExpandAdd(false);
  };

  return (
    <div className="pinned-avatars-bar">
      <span className="pinned-label">Comparing</span>

      {/* You (always shown) */}
      <div className="pinned-avatar-item">
        <div
          className="pinned-avatar"
          style={{
            background: `linear-gradient(135deg, ${youColor}, ${youColor}88)`,
            boxShadow: `0 0 12px ${youColor}44`,
          }}
        >
          Y
        </div>
        <span className="pinned-avatar-name">You</span>
      </div>

      {/* Pinned Friends */}
      {pinnedFriends.map((friend) => (
        <div key={friend.id} className="pinned-avatar-item">
          <div
            className="pinned-avatar"
            style={{
              background: `linear-gradient(135deg, ${friend.color}, ${friend.color}88)`,
              boxShadow: `0 0 12px ${friend.color}44`,
            }}
          >
            {friend.avatar}
          </div>
          <span className="pinned-avatar-name">{friend.name}</span>
          <button
            className="pinned-avatar-remove"
            onClick={() => onRemoveFriend(friend.id)}
            type="button"
            aria-label={`Remove ${friend.name}`}
          >
            ×
          </button>
        </div>
      ))}

      {/* Add Button */}
      {canAddMore && (
        <div className="pinned-add-wrapper">
          <button
            className={`pinned-add-btn ${expandAdd ? "is-expanded" : ""}`}
            onClick={() => setExpandAdd(!expandAdd)}
            type="button"
            aria-label="Add friend to compare"
          >
            +
          </button>

          {/* Dropdown with available friends */}
          {expandAdd && (
            <div className="pinned-add-dropdown">
              {friendsToShow.length > 0 ? (
                friendsToShow.map((friend) => (
                  <button
                    key={friend.id}
                    className="pinned-add-friend-btn"
                    onClick={() => handleAddFriend(friend)}
                    type="button"
                    style={{
                      background: `linear-gradient(135deg, ${friend.color}, ${friend.color}88)`,
                    }}
                    title={friend.name}
                  >
                    {friend.avatar}
                  </button>
                ))
              ) : (
                <span className="pinned-add-empty">No more friends</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="pinned-spacer" />

      {/* Optional: Scroll indicator or other controls can go here */}
    </div>
  );
}