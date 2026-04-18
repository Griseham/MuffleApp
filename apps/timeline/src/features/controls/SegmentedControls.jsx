import { GENRES } from "../../backend/timelineMockData";
import InfoIconModal from "../InfoIconModal";

/**
 * Multi-toggle tabs — each tab can be independently active/inactive.
 * Props:
 *   tabs: Array<{ id, label, icon? }>
 *   activeIds: Set<string> | string[]  — which tab ids are currently active
 *   onToggle: (id: string) => void     — called when a tab is clicked
 */
export function MultiToggleTabs({ tabs, activeIds, onToggle, disabledIds = [] }) {
  const activeSet = new Set(activeIds);
  const disabledSet = new Set(disabledIds);

  return (
    <div className="segmented-tabs">
      {tabs.map((tab) => {
        const isActive = activeSet.has(tab.id);
        const isDisabled = disabledSet.has(tab.id) || tab.disabled;
        const infoModal = tab.infoModal;
        return (
          <div key={tab.id} className="segmented-tab-item">
            <button
              type="button"
              className={`segmented-tab ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
              onClick={() => {
                if (isDisabled) return;
                onToggle(tab.id);
              }}
              disabled={isDisabled}
              aria-disabled={isDisabled}
            >
              {tab.icon && <span className="segmented-icon">{tab.icon}</span>}
              <span className="segmented-label">{tab.label}</span>
              {isActive && <span className="segmented-underline" />}
            </button>

            {infoModal && (
              <InfoIconModal
                title={infoModal.title || `${tab.label} Info`}
                steps={infoModal.steps || []}
                modalId={infoModal.modalId}
                showButtonText={false}
                iconSize={infoModal.iconSize ?? 22}
                iconColor={infoModal.iconColor || "#FFA500"}
                buttonClassName={`zone-header-info-btn zone1-tab-info-btn ${infoModal.buttonClassName || ""}`.trim()}
                buttonStyle={{ padding: 0, ...(infoModal.buttonStyle || {}) }}
                sidePanel={infoModal.sidePanel ?? true}
                ariaLabel={infoModal.ariaLabel || `${tab.label} information`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SegmentVolumeSlider({ value, onChange = () => {} }) {
  const pct = Math.max(0, Math.min(100, (value / 3200) * 100));

  return (
    <div className="zone1-volume" role="group" aria-label="Volume">
      <span className="zone1-volume-label">Vol</span>

      <div className="zone1-volume-track">
        <div className="zone1-volume-fill" style={{ width: `${pct}%` }} />
        <div className="zone1-volume-handle" style={{ left: `${pct}%` }} />
        <input
          className="zone1-volume-input"
          type="range"
          min="0"
          max="3200"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>

      <span className="zone1-volume-value">{value}</span>
    </div>
  );
}

export function GenreChipSelect({ value, onChange = () => {}, options = GENRES }) {
  return (
    <div className="genre-chips genre-chips-inline">
      {options.map((genre) => (
        <button
          key={genre}
          type="button"
          className={`genre-chip ${value === genre ? "genre-chip-active" : ""}`}
          onClick={() => onChange(genre)}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
