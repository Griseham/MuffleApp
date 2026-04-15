import { useEffect, useId, useMemo, useRef, useState } from "react";
import { GenreChipSelect, MultiToggleTabs, SegmentVolumeSlider } from "../controls/SegmentedControls";
import { ChartIcon, VolumeIcon, GenreIcon, TrophyIcon, ForYouIcon, PlusIcon } from "../Icons";
import InfoIconModal from "../InfoIconModal";
import { UserHoverTarget } from "../UserHoverCard";
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
const ZONE1_INFO_ICON_SIZE = 22;

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
  tabInfoModals,
}) {
  const [expandAddUser, setExpandAddUser] = useState(false);
  const addUserWrapRef = useRef(null);
  const addUserMenuId = useId();
  const activeFilterIds = [
    ...(volumeActive ? ["volume"] : []),
    ...(genreActive  ? ["genre"]  : []),
  ];

  const handleViewToggle = (id) => {
    setExpandAddUser(false);
    if (id === "topAlbums") {
      onVolumeActiveChange(false);
      onGenreActiveChange(false);
    } else if (id === "mostAnticipated") {
      onVolumeActiveChange(false);
    }
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
  const isAddUserOpen = expandAddUser && showAddUsers && canAddFriend;
  const friendIds = useMemo(
    () => new Set(friendTimelines.map((friend) => String(friend.id))),
    [friendTimelines]
  );
  const friendsToShow = useMemo(
    () => availableFriendTimelines.filter((friend) => !friendIds.has(String(friend.id))),
    [availableFriendTimelines, friendIds]
  );
  const viewTabs = useMemo(
    () => VIEW_TABS.map((tab) => ({ ...tab, infoModal: tabInfoModals?.[tab.id] || null })),
    [tabInfoModals]
  );
  const filterTabs = useMemo(
    () => FILTER_TABS.map((tab) => ({ ...tab, infoModal: tabInfoModals?.[tab.id] || null })),
    [tabInfoModals]
  );
  const addUsersInfoModal = tabInfoModals?.addUsers || null;
  const disabledFilterIds = activeViewTab === "topAlbums"
    ? ["volume", "genre"]
    : activeViewTab === "mostAnticipated"
      ? ["volume"]
      : [];

  const handleAddFriend = (friend) => {
    onAddFriendTimeline(friend);
    setExpandAddUser(false);
  };

  useEffect(() => {
    if (!isAddUserOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!addUserWrapRef.current?.contains(event.target)) {
        setExpandAddUser(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setExpandAddUser(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAddUserOpen]);

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
            iconSize={ZONE1_INFO_ICON_SIZE}
            iconColor="#FFA500"
            buttonClassName="zone-header-info-btn"
            buttonStyle={{ padding: 0 }}
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
                    <UserHoverTarget
                      user={{
                        ...friend,
                        avatar: friend.avatarSrc || friend.avatar,
                        __avatarSrc: friend.avatarSrc || null,
                        isPinnedFriend: true,
                      }}
                      style={{ display: "inline-flex" }}
                    >
                      <div
                        className="zone1-pinned-avatar"
                        style={{
                          background: `linear-gradient(135deg, ${friend.color}, ${friend.color}88)`,
                          boxShadow: `0 0 10px ${friend.color}44`,
                        }}
                      >
                        {friend.avatarSrc ? (
                          <img
                            src={friend.avatarSrc}
                            alt={friend.name}
                            className="zone1-pinned-avatar-img"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          friend.avatar
                        )}
                      </div>
                    </UserHoverTarget>
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
                  <div className="zone1-add-user-wrap" ref={addUserWrapRef}>
                    <button
                      type="button"
                      className={`zone1-add-user-trigger ${isAddUserOpen ? "is-expanded" : ""}`}
                      onClick={() => setExpandAddUser((open) => !open)}
                      aria-label="Add user timeline"
                      aria-expanded={isAddUserOpen}
                      aria-haspopup="menu"
                      aria-controls={isAddUserOpen ? addUserMenuId : undefined}
                    >
                      <PlusIcon />
                    </button>

                    {isAddUserOpen && (
                      <div
                        className="zone1-add-user-dropdown"
                        id={addUserMenuId}
                        role="menu"
                        aria-label="Available friend timelines"
                      >
                        {friendsToShow.length > 0 ? (
                          friendsToShow.map((friend) => (
                            <button
                              key={friend.id}
                              type="button"
                              className="zone1-add-user-option"
                              onClick={() => handleAddFriend(friend)}
                              role="menuitem"
                            >
                              <span
                                className="zone1-add-user-option-avatar"
                                style={{
                                  background: `linear-gradient(135deg, ${friend.color}, ${friend.color}88)`,
                                }}
                              >
                                {friend.avatarSrc ? (
                                  <img
                                    src={friend.avatarSrc}
                                    alt={friend.name}
                                    className="zone1-add-user-option-avatar-img"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  friend.avatar
                                )}
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
              {addUsersInfoModal && (
                <InfoIconModal
                  title={addUsersInfoModal.title || "Add Users"}
                  steps={addUsersInfoModal.steps || []}
                  modalId={addUsersInfoModal.modalId}
                  showButtonText={false}
                  iconSize={ZONE1_INFO_ICON_SIZE}
                  iconColor={addUsersInfoModal.iconColor || "#FFA500"}
                  buttonClassName="zone-header-info-btn zone1-add-user-info-btn"
                  buttonStyle={{ padding: 0 }}
                  sidePanel={addUsersInfoModal.sidePanel ?? true}
                  ariaLabel={addUsersInfoModal.ariaLabel || "Add users information"}
                />
              )}
            </div>
          )}

          <MultiToggleTabs
            tabs={viewTabs}
            activeIds={[activeViewTab]}
            onToggle={handleViewToggle}
          />

          {showFilters && (
            <>
              <div className="zone1-tabs-separator" aria-hidden="true" />
              <MultiToggleTabs
                tabs={filterTabs}
                activeIds={activeFilterIds}
                onToggle={handleFilterToggle}
                disabledIds={disabledFilterIds}
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
