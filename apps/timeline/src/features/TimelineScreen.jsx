import PersonalTimeline from "./zone1/PersonalTimeline";
import ContextPanel from "./zone2/ContextPanel";
import TimelineGrid from "./zone3/TimelineGrid";
import { useTimelineState } from "./useTimelineState";
import "./timeline.css";
import "./zone1/zone1.css";
import "./zone2/zone2.css";
import "./zone3/zone3.css";

export default function TimelineScreen() {
  const { state, actions } = useTimelineState();

  return (
    <div className="app-wrapper">
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
  );
}
