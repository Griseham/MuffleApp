import PersonalTimeline from "./zone1/PersonalTimeline";
import ContextPanel from "./zone2/ContextPanel";
import TimelineGrid from "./zone3/TimelineGrid";
import { useTimelineState } from "./useTimelineState";
import "./timeline.css";
import "./zone1/zone1.css";
import "./zone2/zone2.css";
import "./zone3/zone3.css";

function TimelineLeftSidebar() {
  const handlePlaceholderNav = () => {};

  const navItems = [
    { key: "rooms", label: "Rooms", dataContent: "rooms" },
    { key: "threads", label: "Threads", dataContent: "threads" },
    { key: "timeline", label: "Timeline", dataContent: "timeline" },
  ];

  return (
    <aside className="timeline-left-sidebar" aria-label="Mufl navigation">
      <div className="timeline-left-sidebar__logo">
        <div className="timeline-left-sidebar__logo-wrapper">
          <div className="timeline-left-sidebar__logo-circle" />
        </div>
      </div>

      <div className="timeline-left-sidebar__nav-section">
        <div className="timeline-left-sidebar__nav-header">Mufl</div>
        {navItems.map(({ key, label, dataContent }) => {
          return (
            <button
              key={key}
              type="button"
              className="timeline-left-sidebar__nav-sub-item"
              data-content={dataContent}
              onClick={handlePlaceholderNav}
            >
              {label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="timeline-left-sidebar__nav-item"
        data-content="pitch"
        onClick={handlePlaceholderNav}
      >
        Pitch Deck
      </button>

      <button
        type="button"
        className="timeline-left-sidebar__nav-item"
        data-content="old-videos"
        onClick={handlePlaceholderNav}
      >
        Old Videos
      </button>
    </aside>
  );
}

export default function TimelineScreen() {
  const { state, actions } = useTimelineState();

  return (
    <div className="app-wrapper">
      <div className="timeline-shell">
        <TimelineLeftSidebar />

        <div className="app-root">
          <PersonalTimeline
            selectedArtist={state.selectedArtist}
            setSelectedArtist={actions.selectArtist}
            hoveredArtist={state.hoveredArtist}
            setHoveredArtist={actions.setHoveredArtist}
          />

          <div className="glowing-separator" aria-hidden="true">
            <div className="glow-line" />
            <div className="glow-pulse" />
          </div>

          <ContextPanel
            selectedArtist={state.selectedArtist}
            setSelectedArtist={actions.selectArtist}
            selectedAlbum={state.selectedAlbum}
            setSelectedAlbum={actions.selectAlbum}
          />

          <div className="glowing-separator" aria-hidden="true">
            <div className="glow-line" />
            <div className="glow-pulse" />
          </div>

          <TimelineGrid />
        </div>
      </div>
    </div>
  );
}
