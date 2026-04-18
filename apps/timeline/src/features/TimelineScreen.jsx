import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTimelineState } from "./useTimelineState";
import muflLogoSrc from "../assets/MuflLogo.png";
import "./timeline.css";
import "./zone1/zone1.css";
import "./zone2/zone2.css";
import "./zone3/zone3.css";

const SIDEBAR_EXTERNAL_TARGETS = {
  rooms: { label: "Rooms", url: "https://mufl.app/rooms/" },
  threads: { label: "Threads", url: "https://mufl.app/threads/" },
  timeline: { label: "Timeline", url: "https://mufl.app/timeline/" },
  pitch: { label: "Pitch Deck", url: "https://mufl.app/?tab=pitch" },
  archives: { label: "Archives", url: "https://mufl.app/?tab=archives" },
};

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
  const [pendingTarget, setPendingTarget] = useState(null);
  const activeTab = "timeline";

  const handleNavClick = useCallback((targetKey) => {
    if (targetKey === activeTab) return;
    const target = SIDEBAR_EXTERNAL_TARGETS[targetKey];
    if (!target) return;
    setPendingTarget({ key: targetKey, ...target });
  }, []);

  const closeModal = useCallback(() => setPendingTarget(null), []);

  const confirmOpen = useCallback(() => {
    if (typeof window !== "undefined" && pendingTarget?.url) {
      window.open(pendingTarget.url, "_blank", "noopener,noreferrer");
    }
    setPendingTarget(null);
  }, [pendingTarget]);

  useEffect(() => {
    if (!pendingTarget || typeof window === "undefined") return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setPendingTarget(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingTarget]);

  const navItems = [
    { key: "rooms", label: "Rooms", dataContent: "rooms" },
    { key: "threads", label: "Threads", dataContent: "threads" },
    { key: "timeline", label: "Timeline", dataContent: "timeline" },
  ];

  return (
    <>
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
            const isActive = key === activeTab;
            return (
              <button
                key={key}
                type="button"
                className={`timeline-left-sidebar__nav-sub-item${isActive ? " active" : ""}`}
                data-content={dataContent}
                aria-current={isActive ? "page" : undefined}
                onClick={() => handleNavClick(key)}
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
          onClick={() => handleNavClick("pitch")}
        >
          Pitch Deck
        </button>

        <button
          type="button"
          className="timeline-left-sidebar__nav-item"
          data-content="old-videos"
          onClick={() => handleNavClick("archives")}
        >
          Archives
        </button>
      </aside>

      {pendingTarget && typeof document !== "undefined" && createPortal(
        <div
          role="presentation"
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 32000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            background: "rgba(3, 7, 18, 0.7)",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidebar-confirm-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(92vw, 420px)",
              borderRadius: "16px",
              border: "1px solid rgba(169, 182, 252, 0.35)",
              background: "linear-gradient(160deg, rgba(16,22,38,0.96), rgba(11,16,27,0.98))",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.45)",
              color: "#dbe6ff",
              padding: "1.2rem 1.1rem 1rem",
            }}
          >
            <h3
              id="sidebar-confirm-title"
              style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#eef2ff" }}
            >
              Open {pendingTarget.label} in new tab?
            </h3>
            <p
              style={{
                margin: "0.65rem 0 0",
                fontSize: "0.92rem",
                lineHeight: 1.55,
                color: "rgba(219, 230, 255, 0.84)",
              }}
            >
              Do you want to open <strong>{pendingTarget.label}</strong> in a new tab?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.65rem",
                marginTop: "1rem",
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                style={{
                  borderRadius: "10px",
                  border: "1px solid rgba(148, 163, 184, 0.38)",
                  background: "rgba(30, 41, 59, 0.85)",
                  color: "#d4def7",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  padding: "0.5rem 0.8rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmOpen}
                style={{
                  borderRadius: "10px",
                  border: "1px solid rgba(169, 182, 252, 0.42)",
                  background: "linear-gradient(120deg, rgba(96, 165, 250, 0.35), rgba(129, 140, 248, 0.5))",
                  color: "#f8faff",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  padding: "0.5rem 0.85rem",
                  cursor: "pointer",
                }}
              >
                Open
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
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
