import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useTimelineState } from "./useTimelineState";
import muflLogoSrc from "../assets/MuflLogo.png";
import "./timeline.css";
import "./zone1/zone1.css";
import "./zone2/zone2.css";
import "./zone3/zone3.css";

const PersonalTimeline = lazy(() => import("./zone1/PersonalTimeline"));
const ContextPanel = lazy(() => import("./zone2/ContextPanel"));
const TimelineGrid = lazy(() => import("./zone3/TimelineGrid"));

function TimelineZonesFallback() {
  return (
    <div className="timeline-zones-loading" role="status" aria-label="Loading timeline zones">
      <div className="timeline-zones-loading-circle" />
    </div>
  );
}

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
          <div className="timeline-left-sidebar__logo-circle">
            <img
              src={muflLogoSrc}
              alt="Mufl"
              className="timeline-left-sidebar__logo-image"
              loading="lazy"
            />
          </div>
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
        Archives
      </button>
    </aside>
  );
}

export default function TimelineScreen() {
  const { state, actions } = useTimelineState();
  const [showBootOverlay, setShowBootOverlay] = useState(true);
  const [zoneReadyState, setZoneReadyState] = useState({
    zone1: false,
    zone2: false,
    zone3: false,
  });

  const markZoneReady = useCallback((zoneKey) => {
    setZoneReadyState((prev) => {
      if (prev[zoneKey]) return prev;
      return { ...prev, [zoneKey]: true };
    });
  }, []);
  const handleZone1Ready = useCallback(() => markZoneReady("zone1"), [markZoneReady]);
  const handleZone2Ready = useCallback(() => markZoneReady("zone2"), [markZoneReady]);
  const handleZone3Ready = useCallback(() => markZoneReady("zone3"), [markZoneReady]);

  useEffect(() => {
    const allZonesReady = zoneReadyState.zone1 && zoneReadyState.zone2 && zoneReadyState.zone3;
    if (!allZonesReady || !showBootOverlay) return undefined;

    let frameA = 0;
    let frameB = 0;
    frameA = window.requestAnimationFrame(() => {
      frameB = window.requestAnimationFrame(() => {
        setShowBootOverlay(false);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameA);
      window.cancelAnimationFrame(frameB);
    };
  }, [showBootOverlay, zoneReadyState]);

  return (
    <div className="app-wrapper">
      <div className="timeline-shell">
        <TimelineLeftSidebar />

        <div className="app-root">
          <div className="timeline-zones-shell">
            <Suspense fallback={<TimelineZonesFallback />}>
              <PersonalTimeline
                selectedArtist={state.selectedArtist}
                setSelectedArtist={actions.selectArtist}
                hoveredArtist={state.hoveredArtist}
                setHoveredArtist={actions.setHoveredArtist}
                onReady={handleZone1Ready}
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
                onReady={handleZone2Ready}
              />

              <div className="glowing-separator" aria-hidden="true">
                <div className="glow-line" />
                <div className="glow-pulse" />
              </div>

              <TimelineGrid onReady={handleZone3Ready} />
            </Suspense>

            {showBootOverlay && (
              <div className="timeline-boot-overlay" role="status" aria-label="Loading timeline">
                <div className="timeline-zones-loading-circle" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
