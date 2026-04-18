import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './RadioTuner.css';
import {
  BAND_SIZE,
  MAX_SIMILARITY,
  MAX_VOLUME,
  MIN_SIMILARITY,
  MIN_VOLUME,
  SIMILARITY_BAND_SIZE,
  clamp,
  formatNumber,
  generateFrequencyPoints,
  generateVolumeBandPoints,
  getBandParams,
  snap
} from './radioUtils';

const MODE_CONFIG = {
  volume: {
    label: 'Volume',
    min: MIN_VOLUME,
    max: MAX_VOLUME,
    bandSize: BAND_SIZE,
    totalBands: Math.floor(MAX_VOLUME / BAND_SIZE) + 1,
    accentClass: 'volume'
  },
  similarity: {
    label: 'Similarity',
    min: MIN_SIMILARITY,
    max: MAX_SIMILARITY,
    bandSize: SIMILARITY_BAND_SIZE,
    totalBands: Math.round((MAX_SIMILARITY - MIN_SIMILARITY) / SIMILARITY_BAND_SIZE),
    accentClass: 'similarity'
  }
};

const buildThrottler = (onChange) => {
  let lastCall = 0;
  let timeoutId = null;
  const waitMs = 120;

  const throttled = (payload) => {
    const now = Date.now();
    const elapsed = now - lastCall;

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (elapsed >= waitMs) {
      lastCall = now;
      onChange(payload);
      return;
    }

    timeoutId = setTimeout(() => {
      lastCall = Date.now();
      timeoutId = null;
      onChange(payload);
    }, waitMs - elapsed);
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
};

const clampBandIndex = (mode, value) => {
  const config = MODE_CONFIG[mode];
  const index = Math.floor((value - config.min) / config.bandSize);
  return clamp(index, 0, config.totalBands - 1);
};

const getBandSnapshot = (mode, value) => {
  const config = MODE_CONFIG[mode];
  const bandIndex = clampBandIndex(mode, value);
  const bandStart = config.min + bandIndex * config.bandSize;
  const rawBandEnd = bandStart + config.bandSize;
  const bandEnd = Math.min(config.max, rawBandEnd);
  const safeBandSize = Math.max(1, bandEnd - bandStart);
  const ratio = clamp((value - bandStart) / safeBandSize, 0, 1);

  return {
    bandIndex,
    bandStart,
    bandEnd,
    ratio
  };
};

const getSimilarityToneClass = (value) => {
  if (value < 0) return 'is-negative';
  if (value >= 500) return 'is-positive';
  return 'is-neutral';
};

const getStationMarkers = (mode, bandIndex) => {
  if (mode === 'volume') {
    return generateVolumeBandPoints(bandIndex).map((point) => ({
      key: `vol-${bandIndex}-${point.pos}-${point.freq}`,
      freq: point.freq,
      ratio: clamp(point.pos / BAND_SIZE, 0, 1),
      colorClass:
        point.freq < 30 ? 'is-hot' : point.freq < 60 ? 'is-cool' : 'is-bright'
    }));
  }

  const { MIN, MAX, BAND } = getBandParams('similarity');
  const bandCenter = MIN + bandIndex * BAND + BAND / 2;
  const normalized = (bandCenter - MIN) / (MAX - MIN);

  return generateFrequencyPoints(normalized, 10, bandIndex + 1).map((point, index) => ({
    key: `sim-${bandIndex}-${index}-${point.freq}`,
    freq: point.freq,
    ratio: clamp(point.position, 0, 1),
    colorClass:
      point.freq < 800 ? 'is-hot' : point.freq < 1600 ? 'is-cool' : 'is-bright'
  }));
};

const buildTicks = (count = 13) =>
  Array.from({ length: count }, (_, index) => ({
    key: `tick-${index}`,
    ratio: index / (count - 1)
  }));

export default function RadioTuner({
  initialVolume = 1326,
  initialSimilarity = 80,
  rulerWidth = 1600,
  onChange = () => {},
  showHeader = true,
  showKnob = true,
  className = '',
  disabled = false
}) {
  const [volume, setVolume] = useState(clamp(Math.round(initialVolume), MIN_VOLUME, MAX_VOLUME));
  const [similarity, setSimilarity] = useState(
    clamp(Math.round(initialSimilarity), MIN_SIMILARITY, MAX_SIMILARITY)
  );
  const [activeSection, setActiveSection] = useState('volume');
  const [isDragging, setIsDragging] = useState(false);

  const rulerRef = useRef(null);
  const throttledOnChange = useMemo(() => buildThrottler(onChange), [onChange]);

  useEffect(() => {
    return () => throttledOnChange.cancel?.();
  }, [throttledOnChange]);

  const snappedVolume = snap(volume);
  const snappedSimilarity = snap(similarity);
  const activeDisplayValue = activeSection === 'volume' ? snappedVolume : snappedSimilarity;
  const activeBand = useMemo(
    () => getBandSnapshot(activeSection, activeDisplayValue),
    [activeDisplayValue, activeSection]
  );
  const stationMarkers = useMemo(
    () => getStationMarkers(activeSection, activeBand.bandIndex),
    [activeBand.bandIndex, activeSection]
  );
  const landedMarker = useMemo(() => {
    if (!stationMarkers.length) return null;

    return stationMarkers.reduce((closest, marker) => {
      const markerDistance = Math.abs(marker.ratio - activeBand.ratio);
      const currentDistance = Math.abs(closest.ratio - activeBand.ratio);
      return markerDistance < currentDistance ? marker : closest;
    });
  }, [activeBand.ratio, stationMarkers]);

  const payload = useMemo(
    () => ({
      activeSection,
      volume: snappedVolume,
      similarity: snappedSimilarity,
      bandIndex: activeBand.bandIndex,
      bandFreqs: stationMarkers.map((marker) => marker.freq),
      landedFreq: landedMarker?.freq ?? null,
      hasPoint: Boolean(landedMarker)
    }),
    [activeBand.bandIndex, activeSection, landedMarker, snappedSimilarity, snappedVolume, stationMarkers]
  );

  useEffect(() => {
    throttledOnChange({
      ...payload,
      previewOnly: true
    });
  }, [payload, throttledOnChange]);

  const buildPayloadForValues = useCallback((mode, nextVolume, nextSimilarity) => {
    const snappedNextVolume = snap(nextVolume);
    const snappedNextSimilarity = snap(nextSimilarity);
    const modeValue = mode === 'volume' ? snappedNextVolume : snappedNextSimilarity;
    const band = getBandSnapshot(mode, modeValue);
    const markers = getStationMarkers(mode, band.bandIndex);
    const landed = markers.length
      ? markers.reduce((closest, marker) => {
          const markerDistance = Math.abs(marker.ratio - band.ratio);
          const currentDistance = Math.abs(closest.ratio - band.ratio);
          return markerDistance < currentDistance ? marker : closest;
        })
      : null;

    return {
      activeSection: mode,
      volume: snappedNextVolume,
      similarity: snappedNextSimilarity,
      bandIndex: band.bandIndex,
      bandFreqs: markers.map((marker) => marker.freq),
      landedFreq: landed?.freq ?? null,
      hasPoint: Boolean(landed)
    };
  }, []);

  const emitImmediatePayload = useCallback(
    (nextPayload) => {
      throttledOnChange.cancel?.();
      onChange({
        ...nextPayload,
        commitNow: true,
        previewOnly: false
      });
    },
    [onChange, throttledOnChange]
  );

  const applyModeValue = useCallback((mode, nextValue) => {
    if (mode === 'volume') {
      setVolume(Math.round(clamp(nextValue, MIN_VOLUME, MAX_VOLUME)));
      return;
    }

    setSimilarity(Math.round(clamp(nextValue, MIN_SIMILARITY, MAX_SIMILARITY)));
  }, []);

  const applyRatioToActiveBand = useCallback(
    (ratio) => {
      const config = MODE_CONFIG[activeSection];
      const nextValue = activeBand.bandStart + ratio * config.bandSize;
      applyModeValue(activeSection, nextValue);
    },
    [activeBand.bandStart, activeSection, applyModeValue]
  );

  const updateFromClientX = useCallback(
    (clientX) => {
      if (!rulerRef.current || disabled) return;

      const rect = rulerRef.current.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      applyRatioToActiveBand(ratio);
    },
    [applyRatioToActiveBand, disabled]
  );

  const getRatioFromClientX = useCallback(
    (clientX) => {
      if (!rulerRef.current) return activeBand.ratio;
      const rect = rulerRef.current.getBoundingClientRect();
      return clamp((clientX - rect.left) / rect.width, 0, 1);
    },
    [activeBand.ratio]
  );

  const handlePointerDown = useCallback(
    (event) => {
      if (disabled || !rulerRef.current) return;
      setIsDragging(true);
      rulerRef.current.setPointerCapture(event.pointerId);
      updateFromClientX(event.clientX);
    },
    [disabled, updateFromClientX]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!isDragging) return;
      if (event.cancelable) event.preventDefault();
      updateFromClientX(event.clientX);
    },
    [isDragging, updateFromClientX]
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (!rulerRef.current) return;

      const ratio = getRatioFromClientX(event.clientX);
      const config = MODE_CONFIG[activeSection];
      const nextValue = activeBand.bandStart + ratio * config.bandSize;
      const nextVolume = activeSection === 'volume' ? nextValue : volume;
      const nextSimilarity = activeSection === 'similarity' ? nextValue : similarity;

      applyModeValue(activeSection, nextValue);
      emitImmediatePayload(buildPayloadForValues(activeSection, nextVolume, nextSimilarity));

      setIsDragging(false);
      if (rulerRef.current.hasPointerCapture(event.pointerId)) {
        rulerRef.current.releasePointerCapture(event.pointerId);
      }
    },
    [
      activeBand.bandStart,
      activeSection,
      applyModeValue,
      buildPayloadForValues,
      emitImmediatePayload,
      getRatioFromClientX,
      similarity,
      volume
    ]
  );

  const moveBand = useCallback(
    (direction) => {
      if (disabled) return;

      const config = MODE_CONFIG[activeSection];
      const nextBandIndex = clamp(activeBand.bandIndex + direction, 0, config.totalBands - 1);
      const nextBandStart = config.min + nextBandIndex * config.bandSize;
      const nextValue = nextBandStart + activeBand.ratio * config.bandSize;

      applyModeValue(activeSection, nextValue);
    },
    [
      activeBand.bandIndex,
      activeBand.ratio,
      activeSection,
      applyModeValue,
      disabled
    ]
  );

  const handleWheel = useCallback(
    (event) => {
      if (disabled) return;
      if (event.cancelable) event.preventDefault();

      const ratioDelta = event.deltaY > 0 ? -0.05 : 0.05;
      applyRatioToActiveBand(activeBand.ratio + ratioDelta);
    },
    [activeBand.ratio, applyRatioToActiveBand, disabled]
  );

  const progressPercent =
    activeSection === 'volume'
      ? (snappedVolume / MAX_VOLUME) * 100
      : ((snappedSimilarity - MIN_SIMILARITY) / (MAX_SIMILARITY - MIN_SIMILARITY)) * 100;

  const ticks = useMemo(() => buildTicks(), []);
  const bandLabel = `${formatNumber(Math.round(activeBand.bandStart))} - ${formatNumber(
    Math.round(activeBand.bandEnd)
  )}`;

  return (
    <div
      className={`rt2 ${disabled ? 'is-disabled' : ''} ${className}`}
      style={{ '--rt-width': `${rulerWidth}px` }}
    >
      {showHeader && (
        <div className="rt2__display">
          <button
            type="button"
            className={`rt2__value-card ${activeSection === 'volume' ? 'is-active is-volume' : ''}`}
            onClick={() => setActiveSection('volume')}
            disabled={disabled}
          >
            <span className="rt2__value-label">Volume</span>
            <span className="rt2__value-number">{formatNumber(snappedVolume)}</span>
          </button>

          <div className="rt2__divider">.</div>

          <button
            type="button"
            className={`rt2__value-card ${activeSection === 'similarity' ? 'is-active is-similarity' : ''} ${getSimilarityToneClass(
              snappedSimilarity
            )}`}
            onClick={() => setActiveSection('similarity')}
            disabled={disabled}
          >
            <span className="rt2__value-label">Similarity</span>
            <span className="rt2__value-number">{formatNumber(snappedSimilarity)}</span>
          </button>
        </div>
      )}

      <div className="rt2__progress">
        <div
          className={`rt2__progress-fill rt2__progress-fill--${MODE_CONFIG[activeSection].accentClass}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="rt2__stage">
        <div className="rt2__panel">
          <div className="rt2__panel-header">
            <div>
              <div className="rt2__panel-title">{MODE_CONFIG[activeSection].label} band</div>
              <div className="rt2__panel-range">{bandLabel}</div>
            </div>
            <div className="rt2__panel-meta">
              Band {activeBand.bandIndex + 1} / {MODE_CONFIG[activeSection].totalBands}
            </div>
          </div>

          <div
            ref={rulerRef}
            className={`rt2__ruler rt2__ruler--${MODE_CONFIG[activeSection].accentClass}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            role="slider"
            aria-valuemin={MODE_CONFIG[activeSection].min}
            aria-valuemax={MODE_CONFIG[activeSection].max}
            aria-valuenow={activeDisplayValue}
          >
            <div className="rt2__ticks">
              {ticks.map((tick) => (
                <span key={tick.key} className="rt2__tick" style={{ left: `${tick.ratio * 100}%` }} />
              ))}
            </div>

            <div className="rt2__rail" />

            <div className="rt2__labels">
              <span className="rt2__edge-label">{formatNumber(Math.round(activeBand.bandStart))}</span>
              <span className="rt2__edge-label">{formatNumber(Math.round(activeBand.bandEnd))}</span>
            </div>

            <div className="rt2__stations">
              {stationMarkers.map((marker) => {
                const isActive = landedMarker?.key === marker.key;
                return (
                  <button
                    key={marker.key}
                    type="button"
                    className={`rt2__station ${marker.colorClass} ${isActive ? 'is-active' : ''}`}
                    style={{ left: `${marker.ratio * 100}%` }}
                    aria-label={`Set ${MODE_CONFIG[activeSection].label.toLowerCase()} marker ${marker.freq}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      applyRatioToActiveBand(marker.ratio);
                      emitImmediatePayload(
                        buildPayloadForValues(
                          activeSection,
                          activeSection === 'volume'
                            ? activeBand.bandStart + marker.ratio * MODE_CONFIG.volume.bandSize
                            : volume,
                          activeSection === 'similarity'
                            ? activeBand.bandStart + marker.ratio * MODE_CONFIG.similarity.bandSize
                            : similarity
                        )
                      );
                    }}
                    disabled={disabled}
                  >
                    <span className="rt2__station-number">{marker.freq}</span>
                  </button>
                );
              })}
            </div>

            <div
              className={`rt2__cursor rt2__cursor--${MODE_CONFIG[activeSection].accentClass}`}
              style={{ left: `${activeBand.ratio * 100}%` }}
            />
          </div>

          <div className="rt2__footer">
            <div className="rt2__status">
              <span className="rt2__status-label">Landing on</span>
              <span className="rt2__status-value">{landedMarker?.freq ?? '---'}</span>
            </div>
          </div>
        </div>

        {showKnob && (
          <div className="rt2__controls">
            <div className="rt2__band-nav">
              <button
                type="button"
                className="rt2__arrow"
                onClick={() => moveBand(-1)}
                disabled={disabled || activeBand.bandIndex <= 0}
                aria-label={`Previous ${MODE_CONFIG[activeSection].label.toLowerCase()} band`}
              >
                &larr;
              </button>
              <span className="rt2__band-pill">Band {activeBand.bandIndex + 1}</span>
              <button
                type="button"
                className="rt2__arrow"
                onClick={() => moveBand(1)}
                disabled={disabled || activeBand.bandIndex >= MODE_CONFIG[activeSection].totalBands - 1}
                aria-label={`Next ${MODE_CONFIG[activeSection].label.toLowerCase()} band`}
              >
                &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
