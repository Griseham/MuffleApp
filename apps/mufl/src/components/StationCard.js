// StationCard.js - Compact Grid Design

import React, { useRef } from 'react';
import './StationCard.css';
import InfoIconModal from './InfoIconModal';
import ArtistCarousel from './ArtistCarousel';
import { isSafeHttpUrl } from '../utils/searchSecurity';

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
const VolumeBars = ({ level = 50, color = '#4ade80', size = 12 }) => {
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
const TimerRing = ({ minutes, total = 40, size = 24, stroke = 2.5, color = '#4ade80' }) => {
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

// --- SVG Icons ---
const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Radar info icons
const RadarIcon = ({ size = 20, color = '#4ade80' }) => (
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

const UsersIcon = ({ size = 20, color = '#FF6B35' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" />
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" fill="none" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" />
  </svg>
);

const VolumeIcon2 = ({ size = 20, color = '#00F5FF' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.3" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke={color} strokeWidth="2" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke={color} strokeWidth="2" />
  </svg>
);

// Radar info steps for the InfoIconModal
const radarInfoSteps = [
  {
    icon: <RadarIcon size={20} color="#4ade80" />,
    title: 'Artists',
    color: 'rgba(74, 222, 128, 0.1)',
    iconBg: 'rgba(74, 222, 128, 0.2)',
    content:
      'The radar shows the most popular artists in the room with a volume and a selected count.',
  },
  {
    icon: <UsersIcon size={20} color="#4ade80" />,
    title: 'Selected Count',
    color: 'rgba(74, 222, 128, 0.1)',
    iconBg: 'rgba(74, 222, 128, 0.2)',
    content:
      'The selected x-number count on the top right of each artist represents how many users selected that artist from the previous screen and joined this room. Those counts go down as the users who chose those artists leave.',
  },
  {
    icon: <VolumeIcon2 size={20} color="#4ade80" />,
    title: 'Artist Volume',
    color: 'rgba(74, 222, 128, 0.1)',
    iconBg: 'rgba(74, 222, 128, 0.2)',
    content:
      'The volume of each artist represents how their music is being rated by the users in that room.',
  },
];

// --- Artist Cell (compact grid with volume bars) ---
const ArtistCircle = ({ artist, index }) => {
  const placeholderImage =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4" fill="%23222"/><path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" fill="%23222"/></svg>';

  const candidateImage =
    artist?.image ||
    artist?.artworkUrl ||
    artist?.picture ||
    artist?.img;

  const safeImage = isSafeHttpUrl(candidateImage) ? candidateImage : placeholderImage;
  const count = artist?.count || 0;
  const name = artist?.name || 'Unknown';
  const isSeed = artist?.isSeed || false;
  const volume = artist?.volume || 0;

  // Normalize volume: if 1-6 scale, map to 0-100 percentage
  const volumePercent = volume <= 6 ? Math.round((volume / 6) * 100) : Math.min(volume, 100);

  return (
    <div className="artist-cell">
      <div className="artist-avatar-wrapper">
        <div className="artist-volume-badge">
          <VolumeBars level={volumePercent} color="#f5f7fb" size={13} />
        </div>
        <div className={`artist-avatar ${isSeed ? 'seed-artist' : ''}`}>
          <div
            className="artist-image"
            style={{ backgroundImage: `url(${safeImage})` }}
          />
        </div>
        {count > 0 && <span className="artist-selection-count">{count}</span>}
      </div>
      <span className="artist-name">{name}</span>
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
}) {
  const { volume, similarity } = station.freqNumber
    ? parseDisplayNumber(station.freqNumber)
    : { volume: station.volume || 0, similarity: station.similarity || 0 };

  const frequencyClass =
    activeSection === 'volume'
      ? ''
      : similarity < 0
        ? 'negative-similarity'
        : 'positive-similarity';

  const displayArtists = station.artists || [];

  const formatSimilarity = (sim) => {
    if (sim < 0) return `-${Math.abs(sim)}`;
    return sim.toString();
  };

  // Stable per-card duration between 1 and 39 minutes (never exceeds 40)
  const totalMinutesRef = useRef(Math.floor(Math.random() * 39) + 1);
  const totalMinutes = Math.min(40, Math.max(1, totalMinutesRef.current));
  const currentMinutes = Math.min(totalMinutes, station.minutes || totalMinutes);

  return (
    <div
      className={`station-card ${isCurrentStation ? 'selected' : ''} ${frequencyClass} ${!isInteractive ? 'non-interactive' : ''}`}
      onClick={isInteractive ? () => onJoinRoom(station) : undefined}
    >
      {/* Top row: indicator + name + user badge | frequency */}
      <div className="station-top">
        <div className="station-top-left">
          <div className="station-indicator" />
          <span className="station-name">{station.name}</span>
          <span className="station-user-badge">
            {station.users ?? station.userCount ?? station.listeners ?? 0} online
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
            color="#4ade80"
          />
        </div>
        <span className="timer-minutes">{currentMinutes}m</span>
        <span className="timer-duration">({totalMinutes}m)</span>
      </div>

      {/* Artists grid */}
      <div className="station-artists">
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

        <ArtistCarousel
          artists={displayArtists}
          artistsPerPage={10}
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
  );
});

export default StationCard;
