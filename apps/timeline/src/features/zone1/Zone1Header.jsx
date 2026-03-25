import { useMemo, useState } from "react";
import { GenreChipSelect, MultiToggleTabs, SegmentVolumeSlider } from "../controls/SegmentedControls";
import { ChartIcon, VolumeIcon, GenreIcon, TrophyIcon, ForYouIcon, PlusIcon } from "../Icons";
import InfoIconModal from "../InfoIconModal";
import { ZONE1_TIMELINE_INFO_STEPS } from "../infoContent";

const VIEW_TABS = [
  { id: "topAlbums", label: "Top Albums", icon: <TrophyIcon /> },
  { id: "mostAnticipated", label: "Most Anticipated", icon: <ForYouIcon /> },
  { id: "timeline", label: "Timeline", icon: <ChartIcon /> },
];

const FILTER_TABS = [
  { id: "volume",   label: "Volume",   icon: <VolumeIcon /> },
  { id: "genre",    label: "Genre",    icon: <GenreIcon /> },
];

const ZONE1_GENRE_OPTIONS = ["Hip-Hop", "Pop", "R&B", "Electronic"];

export default function Zone1Header({
  activeViewTab,
  onViewTabChange,
  volumeActive,
  onVolumeActiveChange,
  genreActive,
  onGenreActiveChange,
  zone1Volume,
  onVolumeChange,
  zone1Genre,
  onGenreChange,
  friendTimelines,
  availableFriendTimelines,
  maxFriendTimelines,
  onAddFriendTimeline,
  onRemoveFriendTimeline,
}) {
  const [expandAddUser, setExpandAddUser] = useState(false);
  const activeFilterIds = [
    ...(volumeActive ? ["volume"] : []),
    ...(genreActive  ? ["genre"]  : []),
  ];

  const handleViewToggle = (id) => {
    onViewTabChange(id);
  };

  const handleFilterToggle = (id) => {
    if (id === "volume") {
      onVolumeActiveChange(!volumeActive);
    } else if (id === "genre") {
      onGenreActiveChange(!genreActive);
    }
  };

  const showFilters = ["timeline", "topAlbums", "mostAnticipated"].includes(activeViewTab);
  const showAddUsers = activeViewTab === "topAlbums";
  const canAddFriend = friendTimelines.length < maxFriendTimelines;
  const friendIds = useMemo(
    () => new Set(friendTimelines.map((friend) => String(friend.id))),
    [friendTimelines]
  );
  const friendsToShow = useMemo(
    () => availableFriendTimelines.filter((friend) => !friendIds.has(String(friend.id))),
    [availableFriendTimelines, friendIds]
  );

  const handleAddFriend = (friend) => {
    onAddFriendTimeline(friend);
    setExpandAddUser(false);
  };

  return (
    <div className="zone1-header">
      <div className="zone1-header-left">
        <div className="zone1-title-row">
          <h2 className="zone1-title">Timeline</h2>
          <InfoIconModal
            title="Zone 1 Timeline"
            steps={ZONE1_TIMELINE_INFO_STEPS}
            modalId="zone1-timeline-info"
            showButtonText={false}
            iconSize={16}
            iconColor="#FFA500"
            buttonClassName="zone-header-info-btn"
            ariaLabel="Zone 1 timeline information"
          />
        </div>
      </div>

      <div className="zone1-header-right">
        <div className="zone1-tabs-wrap">
          {showAddUsers && (
            <div className="zone1-add-user-section">
              <div className="zone1-add-user-avatars">
                {friendTimelines.map((friend) => (
                  <div key={friend.id} className="zone1-pinned-avatar-item">
                    <div
                      className="zone1-pinned-avatar"
                      style={{
                        background: `linear-gradient(135deg, ${friend.color}, ${friend.color}88)`,
                        boxShadow: `0 0 10px ${friend.color}44`,
                      }}
                    >
                      {friend.avatar}
                    </div>
                    <button
                      className="zone1-pinned-avatar-remove"
                      type="button"
                      aria-label={`Remove ${friend.name}`}
                      onClick={() => onRemoveFriendTimeline(friend.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {canAddFriend && (
                  <div className="zone1-add-user-wrap">
                    <button
                      type="button"
                      className={`zone1-add-user-trigger ${expandAddUser ? "is-expanded" : ""}`}
                      onClick={() => setExpandAddUser((open) => !open)}
                      aria-label="Add user timeline"
                    >
                      <PlusIcon />
                    </button>

                    {expandAddUser && (
                      <div className="zone1-add-user-dropdown">
                        {friendsToShow.length > 0 ? (
                          friendsToShow.map((friend) => (
                            <button
                              key={friend.id}
                              type="button"
                              className="zone1-add-user-option"
                              onClick={() => handleAddFriend(friend)}
                            >
                              <span
                                className="zone1-add-user-option-avatar"
                                style={{
                                  background: `linear-gradient(135deg, ${friend.color}, ${friend.color}88)`,
                                }}
                              >
                                {friend.avatar}
                              </span>
                              <span className="zone1-add-user-option-name">{friend.name}</span>
                            </button>
                          ))
                        ) : (
                          <span className="zone1-add-user-empty">No more users</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <MultiToggleTabs
            tabs={VIEW_TABS}
            activeIds={[activeViewTab]}
            onToggle={handleViewToggle}
          />

          {showFilters && (
            <>
              <div className="zone1-tabs-separator" aria-hidden="true" />
              <MultiToggleTabs
                tabs={FILTER_TABS}
                activeIds={activeFilterIds}
                onToggle={handleFilterToggle}
                disabledIds={activeViewTab === "topAlbums" ? ["volume", "genre"] : []}
              />
            </>
          )}
        </div>

        {showFilters && (volumeActive || genreActive) && (
          <div
            className={`zone1-filters-row ${genreActive ? "has-genre" : ""} ${volumeActive ? "has-volume" : ""}`}
          >
            {volumeActive && (
              <SegmentVolumeSlider value={zone1Volume} onChange={onVolumeChange} />
            )}

            {genreActive && (
              <GenreChipSelect
                value={zone1Genre}
                onChange={onGenreChange}
                options={ZONE1_GENRE_OPTIONS}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
