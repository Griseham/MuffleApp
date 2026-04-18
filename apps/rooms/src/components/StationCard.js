// StationCard.js - Compact Grid Design

import React, { useEffect, useRef, useState } from 'react';
import './StationCard.css';
import InfoIconModal from './InfoIconModal';
import ArtistCarousel from './ArtistCarousel';
import { isSafeHttpUrl } from '../utils/searchSecurity';

const STATION_CARD_MOBILE_MEDIA_QUERY = '(max-width: 768px)';

const getInitialStationCardMobileView = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(STATION_CARD_MOBILE_MEDIA_QUERY).matches;
};

// Parse display number correctly
const parseDisplayNumber = (displayNumber) => {
  if (!displayNumber) return { volume: 0, similarity: 0 };

  const parts = displayNumber.split('.');
  const volume = parseInt(parts[0], 10);

  const simPart = parts[1] || '0';
  const isNegative = simPart.includes('-');
  const simValue = simPart.replace('-', '');
  const similarity = parseInt(simValue, 10) * (isNegative ? -1 : 1);

  return { volume, similarity };
};

// --- Volume Bars SVG (shows artist popularity) ---
const VolumeBars = ({ level = 50, color = '#60a5fa', size = 12 }) => {
  const bars = 4;
  const maxH = size;
  const barW = size / 6;
  const gap = size / 10;
  const heights = [0.3, 0.55, 0.8, 1.0];
  const activeCount = Math.ceil((level / 100) * bars);

  return (
    <svg
      width={bars * (barW + gap)}
      height={maxH}
      style={{ display: 'block' }}
    >
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * (barW + gap)}
          y={maxH - maxH * h}
          width={barW}
          height={maxH * h}
          rx={barW / 2}
          fill={i < activeCount ? color : 'rgba(255,255,255,0.08)'}
          opacity={i < activeCount ? 0.9 : 0.4}
        />
      ))}
    </svg>
  );
};

// --- Circular Timer Ring (progress out of totalMinutes) ---
const TimerRing = ({ minutes, total = 40, size = 24, stroke = 2.5, color = '#60a5fa' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(minutes / total, 1);

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: 'rotate(-90deg)', display: 'block', flexShrink: 0 }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
      />
    </svg>
  );
};

// Radar info icons
const RadarIcon = ({ size = 20, color = '#FFA500' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1" fill="none" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke={color} strokeWidth="1.5" />
    <circle cx="16" cy="8" r="1.5" fill={color} />
    <circle cx="8" cy="16" r="1" fill={color} />
    <circle cx="14" cy="14" r="1" fill={color} />
  </svg>
);

const UsersIcon = ({ size = 20, color = '#FFA500' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" />
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" fill="none" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" />
  </svg>
);

const VolumeIcon2 = ({ size = 20, color = '#FFA500' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.3" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke={color} strokeWidth="2" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke={color} strokeWidth="2" />
  </svg>
);

// Radar info steps for the InfoIconModal
const radarInfoSteps = [
  {
    icon: <RadarIcon size={20} color="#FFA500" />,
    title: 'Artists',
    color: 'rgba(245, 158, 11, 0.12)',
    iconBg: 'rgba(245, 158, 11, 0.22)',
    content:
      'The radar shows the most popular artists in the room with a volume and a selected count.',
  },
  {
    icon: <UsersIcon size={20} color="#FFA500" />,
    title: 'Selected Count',
    color: 'rgba(245, 158, 11, 0.12)',
    iconBg: 'rgba(245, 158, 11, 0.22)',
    content:
      'The selected x-number count on the bottom right of each artist represents how many users selected that artist from the previous screen then joined this room. Those counts go down as the users who chose those artists leave.',
  },
  {
    icon: <VolumeIcon2 size={20} color="#FFA500" />,
    title: 'Artist Volume',
    color: 'rgba(245, 158, 11, 0.12)',
    iconBg: 'rgba(245, 158, 11, 0.22)',
    content:
      'The volume of each artist represents how their music is being rated by the users in that room.',
  },
];

// --- Artist Cell (compact grid with volume bars) ---
const ArtistCircle = ({ artist, index }) => {
  const placeholderImage =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23292929"/><stop offset="100%" stop-color="%231e1e1e"/></linearGradient><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23959595"/><stop offset="100%" stop-color="%236f6f6f"/></linearGradient></defs><rect width="300" height="300" rx="999" fill="url(%23bg)"/><circle cx="150" cy="150" r="104" fill="url(%23c)"/><circle cx="150" cy="150" r="102" fill="none" stroke="%23b9b9b9" stroke-opacity="0.35" stroke-width="4"/><path d="M102 212 L150 88 L198 212" fill="none" stroke="%23f7f7f7" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="M124 166 H176" fill="none" stroke="%23f7f7f7" stroke-width="18" stroke-linecap="round"/></svg>';
  const isPlaceholder = Boolean(artist?.isPlaceholder);

  const candidateImage =
    !isPlaceholder &&
    (artist?.image ||
      artist?.artworkUrl ||
      artist?.picture ||
      artist?.img);

  const safeImage = isSafeHttpUrl(candidateImage) ? candidateImage : placeholderImage;
  const count = artist?.count || 0;
  const name = artist?.name || (isPlaceholder ? 'Artist' : 'Unknown');
  const isSeed = !isPlaceholder && (artist?.isSeed || false);
  const volume = artist?.volume || 0;

  // Normalize volume: if 1-6 scale, map to 0-100 percentage
  const volumePercent = volume <= 6 ? Math.round((volume / 6) * 100) : Math.min(volume, 100);

  return (
    <div className={`artist-cell ${isPlaceholder ? 'placeholder-cell' : ''}`}>
      <div className="artist-avatar-wrapper">
        <div className="artist-volume-badge">
          <VolumeBars level={volumePercent} color="#f5f7fb" size={13} />
        </div>
        <div className={`artist-avatar ${isSeed ? 'seed-artist' : ''} ${isPlaceholder ? 'placeholder-artist' : ''}`}>
          <div
            className={`artist-image ${isPlaceholder ? 'placeholder-image' : ''}`}
            style={{ backgroundImage: `url(${safeImage})` }}
          />
        </div>
        <span className="artist-selection-count">{count}</span>
      </div>
      <span className={`artist-name ${isPlaceholder ? 'placeholder-name' : ''}`}>{name}</span>
    </div>
  );
};

// --- StationCard Component ---
const StationCard = React.memo(function StationCard({
  station,
  onJoinRoom,
  isCurrentStation,
  activeSection = 'volume',
  selectedArtists = [],
  stationIndex = 0,
  totalStations = 1,
  isInteractive = true,
  isMobileView: forcedMobileView = null
}) {
  const hasForcedMobileView = typeof forcedMobileView === 'boolean';
  const [isMobileView, setIsMobileView] = useState(() =>
    hasForcedMobileView ? forcedMobileView : getInitialStationCardMobileView()
  );

  useEffect(() => {
    if (!hasForcedMobileView) return;
    setIsMobileView(Boolean(forcedMobileView));
  }, [hasForcedMobileView, forcedMobileView]);

  useEffect(() => {
    if (hasForcedMobileView) return undefined;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia(STATION_CARD_MOBILE_MEDIA_QUERY);
    const updateMobileView = (event) => setIsMobileView(event.matches);

    setIsMobileView(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMobileView);
      return () => mediaQuery.removeEventListener('change', updateMobileView);
    }

    mediaQuery.addListener(updateMobileView);
    return () => mediaQuery.removeListener(updateMobileView);
  }, [hasForcedMobileView]);

  const { volume, similarity } = station.freqNumber
    ? parseDisplayNumber(station.freqNumber)
    : { volume: station.volume || 0, similarity: station.similarity || 0 };

  const frequencyClass =
    activeSection === 'volume'
      ? ''
      : similarity < 0
        ? 'negative-similarity'
        : 'positive-similarity';

  const realArtists = (Array.isArray(station?.artists) ? station.artists : []).slice(0, 20);
  const placeholderArtists = Array.from({ length: 10 }, (_, idx) => ({
    id: `placeholder-${station?.id || station?.name || stationIndex}-${idx}`,
    roomArtistKey: `placeholder-${station?.id || station?.name || stationIndex}-${idx}`,
    name: 'Artist',
    volume: (idx % 6) + 1,
    count: (idx % 9) + 1,
    isPlaceholder: true
  }));
  const displayArtists = [...realArtists, ...placeholderArtists];

  const formatSimilarity = (sim) => {
    if (sim < 0) return `-${Math.abs(sim)}`;
    return sim.toString();
  };

  // Keep a stable per-card current time between 5m and total-5m.
  const rawTotalMinutes = Number(station?.totalMinutes);
  const totalMinutes =
    Number.isFinite(rawTotalMinutes) && rawTotalMinutes > 0
      ? Math.round(rawTotalMinutes)
      : 40;
  const maxCurrentMinutes = Math.max(5, totalMinutes - 5);
  const fallbackCurrentMinutesRef = useRef(null);
  if (fallbackCurrentMinutesRef.current == null) {
    fallbackCurrentMinutesRef.current =
      Math.floor(Math.random() * (maxCurrentMinutes - 5 + 1)) + 5;
  }
  const rawStationMinutes = Number(station.minutes);
  const hasInRangeStationMinutes =
    Number.isFinite(rawStationMinutes) &&
    rawStationMinutes >= 5 &&
    rawStationMinutes <= maxCurrentMinutes;
  const currentMinutes = hasInRangeStationMinutes
    ? Math.round(rawStationMinutes)
    : fallbackCurrentMinutesRef.current;
  const progressRatio = Math.min(currentMinutes / totalMinutes, 1);
  const artistsPerPage = isMobileView ? 5 : 10;

  return (
    <div
      className={`station-card ${isCurrentStation ? 'selected' : ''} ${frequencyClass} ${!isInteractive ? 'non-interactive' : ''}`}
      onClick={
        isInteractive
          ? () =>
              onJoinRoom({
                ...station,
                minutes: currentMinutes,
                totalMinutes
              })
          : undefined
      }
    >
      {/* Top row: indicator + name + user badge | frequency */}
      <div className="station-top">
        <div className="station-top-left">
          <div className="station-indicator" />
          <span className="station-name">{station.name}</span>
          <span className="station-user-badge">
            {station.users ?? station.userCount ?? station.listeners ?? 0} users online
          </span>
        </div>
        <div className={`station-frequency ${frequencyClass}`}>
          {volume}
          <span className="frequency-decimal">.{formatSimilarity(similarity)}</span>
        </div>
      </div>

      {/* Timer row: ring + minutes + duration */}
      <div className="station-timer-row">
        <div className="timer-ring-wrapper">
          <TimerRing
            minutes={currentMinutes}
            total={totalMinutes}
            size={24}
            stroke={2.5}
            color="#60a5fa"
          />
        </div>
        <span className="timer-minutes">{currentMinutes}m</span>
        <span className="timer-duration">({totalMinutes}m)</span>
        <div className="station-progress-track" aria-hidden="true">
          <div
            className="station-progress-fill"
            style={{ width: `${Math.max(0, progressRatio) * 100}%` }}
          />
        </div>
      </div>

      {/* Artists grid */}
      <div className="station-artists">
        <div className="station-artists-header">
          <span className="station-artists-title">Top Artists</span>
          {stationIndex === 0 && (
            <div
              className="radar-info-icon"
              onClick={(e) => e.stopPropagation()}
            >
              <InfoIconModal
                title="Radar"
                steps={radarInfoSteps}
                iconSize={22}
                iconColor="#FFA500"
                buttonText=""
                showButtonText={false}
                modalId="station-radar-modal"
                sidePanel={true}
              />
            </div>
          )}
        </div>

        <div className="station-artists-body">
          <ArtistCarousel
            artists={displayArtists}
            artistsPerPage={artistsPerPage}
            gridClassName="station-artists-grid"
            renderArtist={(artist, index) => (
              <ArtistCircle
                key={
                  artist?.roomArtistKey ||
                  `${artist?.id || artist?.name || 'artist'}-${index}`
                }
                artist={artist}
                index={index}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
});

export default StationCard;
