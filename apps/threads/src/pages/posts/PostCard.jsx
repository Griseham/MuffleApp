import React, { useState, useMemo, useEffect } from 'react';
import { 
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, 
  Headphones, Volume2, Users, Music, Mic, Info
} from 'lucide-react';

// Mobile breakpoint: covers iPhone (390), Android (360), big phone (414)
// Tablet portrait (768) gets the desktop grid layout
const MOBILE_BREAKPOINT = 767;

function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
import InfoIconModal from '../../components/InfoIconModal';
import { 
  getRandomNumber, 
  getPostGenres, 
  getPostArtists, 
  hashString, 
  getAvatarSrc, 
  generateUsername, 
  sanitizeDeletedUsername,
  getTimeAgo, 
  formatCompactNumber 
} from './postCardUtils';
import { ClickableUserAvatar } from './UserHoverCard';
import { getAppleMusicArtistImages, getAppleMusicAlbumArtworks } from '../../services/appleMusic';

// ─── Expand section helpers ───────────────────────────────────────────────────
function _sr(seed) { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); }
function _hsh(s) { let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return Math.abs(h); }
const _ini = n => n.split(/[\s,]+/).map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
const _ahue = n => _hsh(n) % 360;
const _fire = n => 5 + Math.floor(_sr(_hsh(n) * 0.37) * 119);

const EXPAND_GENRE_LIST = [
  { name: 'R&B',         color: '#634F9C' },
  { name: 'Hip-Hop',     color: '#BB4F63' },
  { name: 'Rock',        color: '#E71D36' },
  { name: 'Jazz',        color: '#2EC4B6' },
  { name: 'Country',     color: '#BF9D7A' },
  { name: 'Trap',        color: '#BA6AA0' },
  { name: 'Pop',         color: '#D28A47' },
  { name: 'Electronic',  color: '#7B52AB' },
  { name: 'Reggae',      color: '#4AA96C' },
];

function _genresForUser(uid) {
  const out = [], used = new Set();
  for (let i = 0; i < 3; i++) {
    let idx = Math.floor(_sr(uid * 13 + i * 7) * EXPAND_GENRE_LIST.length);
    while (used.has(idx)) idx = (idx + 1) % EXPAND_GENRE_LIST.length;
    used.add(idx);
    out.push({ ...EXPAND_GENRE_LIST[idx], fill: 0.2 + _sr(uid * 7 + i * 31) * 0.75 });
  }
  return out;
}

const EXPAND_TOP_ARTISTS = [
  'SZA','Frank Ocean','Tyler, The Creator','Kendrick Lamar','Beyoncé','Drake','Childish Gambino','H.E.R.',
];
const EXPAND_FOLLOWED_ARTISTS = [
  'Daniel Caesar','Jorja Smith','Steve Lacy','Brent Faiyaz','Summer Walker','6LACK','Lucky Daye','Ravyn Lenae','Ari Lennox','PARTYNEXTDOOR',
];
const EXPAND_REC_ARTISTS = [
  'Snoh Aalegra','Charlotte Day Wilson','Pink Sweat$','UMI','Masego','KIRBY','Raveena','Sudan Archives','FKA twigs','James Blake','Moses Sumney','Caroline Polachek',
];
const _EXPAND_ALL_ARTISTS = [...new Set([
  ...EXPAND_TOP_ARTISTS,
  ...EXPAND_FOLLOWED_ARTISTS,
  ...EXPAND_REC_ARTISTS,
])];
const TRACK_KEY_SEPARATOR = '|||';
const _trackKey = (songName, artistName) => `${String(songName || '').trim()}${TRACK_KEY_SEPARATOR}${String(artistName || '').trim()}`;
const _expandUserAvatar = (name) => `/assets/image${(_hsh(String(name || 'user')) % 1000) + 1}.png`;
const _expandUser = (name) => ({
  displayName: String(name || 'user'),
  username: String(name || 'user'),
  name: String(name || 'user'),
  avatar: _expandUserAvatar(name),
});

const EXPAND_SONG_RESPONSES = [
  { id: 1, user: 'velvetpulse',  avatar: 'VP', avatarColor: '#5B21B6', comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',  song: 'Superstar',    artist: 'Usher',       albumColor: '#1a1a3e', accent: '#1d9bf0', avgRating: 84, totalRatings: 312 },
  { id: 2, user: 'lowfrequency', avatar: 'LF', avatarColor: '#9D174D', comment: 'Sed do eiusmod tempor incididunt ut labore et dolore.',      song: 'Pink + White', artist: 'Frank Ocean', albumColor: '#1a1a2e', accent: '#818CF8', avgRating: 91, totalRatings: 847 },
  { id: 3, user: 'chromewaves',  avatar: 'CW', avatarColor: '#0E7490', comment: 'Ut enim ad minim veniam, quis nostrud exercitation.',        song: 'Lost',         artist: 'Frank Ocean', albumColor: '#0c1a1f', accent: '#2EC4B6', avgRating: 76, totalRatings: 203 },
];

const EXPAND_SUB_COMMENTS = [
  { id: 1,  user: 'nocturnalvibes',   text: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',              rating: 88 },
  { id: 2,  user: 'static.frequency', text: 'Praesent commodo cursus magna vel scelerisque.',                   rating: 72 },
  { id: 3,  user: 'auralcanvas',      text: 'Nulla vitae elit libero, a pharetra augue mollis.',                rating: 91 },
  { id: 4,  user: 'prismhaze',        text: 'Cras mattis consectetur purus sit amet fermentum.',               rating: 65 },
  { id: 5,  user: 'softnoise',        text: 'Donec ullamcorper nulla non metus auctor fringilla.',              rating: 83 },
  { id: 6,  user: 'deepfield_',       text: 'Maecenas sed diam eget risus varius blandit.',                    rating: 79 },
  { id: 7,  user: 'echochamber44',    text: 'Etiam porta sem malesuada magna mollis euismod.',                 rating: 89 },
  { id: 8,  user: 'grainandtone',     text: 'Vestibulum id ligula porta felis euismod semper.',                rating: 94 },
  { id: 9,  user: 'voidpop',          text: 'Aenean lacinia bibendum nulla sed consectetur.',                  rating: 58 },
  { id: 10, user: 'ambienthalo',      text: 'Fusce dapibus tellus ac cursus commodo.',                         rating: 97 },
];

// Tooltip — renders downward so it's never clipped by overflow:auto scroll rows
function Tip({ children, text }) {
  const [v, setV] = React.useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setV(true)} onMouseLeave={() => setV(false)}>
      {children}
      {v && (
        <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: '50%', transform: 'translateX(-50%)', background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', zIndex: 9999, pointerEvents: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.7)', fontWeight: 500 }}>
          {text}
        </div>
      )}
    </div>
  );
}

// ── Artist → songs mapping (1–2 songs per artist, seeded) ──────────────────
const ARTIST_SONG_POOL = {
  'SZA':                [{ song: 'Kill Bill', accent: '#818CF8', albumColor: '#1a1030', avgRating: 93, totalRatings: 1420 }, { song: 'Good Days', accent: '#818CF8', albumColor: '#130a2a', avgRating: 89, totalRatings: 984 }],
  'Frank Ocean':        [{ song: 'Pink + White', accent: '#60A5FA', albumColor: '#0d1a2e', avgRating: 97, totalRatings: 2100 }, { song: 'Ivy', accent: '#60A5FA', albumColor: '#0f1e2e', avgRating: 94, totalRatings: 1650 }],
  'Tyler, The Creator': [{ song: 'See You Again', accent: '#F59E0B', albumColor: '#1a150a', avgRating: 88, totalRatings: 730 }, { song: 'November', accent: '#F59E0B', albumColor: '#150e05', avgRating: 86, totalRatings: 610 }],
  'Kendrick Lamar':     [{ song: 'Loyalty', accent: '#EF4444', albumColor: '#1e0a0a', avgRating: 91, totalRatings: 1200 }, { song: 'Love', accent: '#EF4444', albumColor: '#200808', avgRating: 87, totalRatings: 890 }],
  'Beyoncé':            [{ song: 'Cuff It', accent: '#D97706', albumColor: '#1a1200', avgRating: 90, totalRatings: 1100 }, { song: 'Virgo\'s Groove', accent: '#D97706', albumColor: '#1c1400', avgRating: 88, totalRatings: 870 }],
  'Drake':              [{ song: 'Passionfruit', accent: '#10B981', albumColor: '#041a12', avgRating: 85, totalRatings: 780 }],
  'Childish Gambino':   [{ song: 'Redbone', accent: '#A78BFA', albumColor: '#160a2a', avgRating: 96, totalRatings: 1850 }, { song: 'Heartbeat', accent: '#A78BFA', albumColor: '#120830', avgRating: 80, totalRatings: 540 }],
  'H.E.R.':             [{ song: 'Best Part', accent: '#2EC4B6', albumColor: '#041a18', avgRating: 92, totalRatings: 970 }],
  'Daniel Caesar':      [{ song: 'Best Part', accent: '#2EC4B6', albumColor: '#041a18', avgRating: 92, totalRatings: 970 }, { song: 'Get You', accent: '#2EC4B6', albumColor: '#021510', avgRating: 90, totalRatings: 850 }],
  'Jorja Smith':        [{ song: 'On My Mind', accent: '#34D399', albumColor: '#041410', avgRating: 86, totalRatings: 620 }],
  'Steve Lacy':         [{ song: 'Bad Habit', accent: '#FB923C', albumColor: '#1a0e00', avgRating: 91, totalRatings: 1380 }, { song: 'Helmet', accent: '#FB923C', albumColor: '#180c00', avgRating: 83, totalRatings: 460 }],
  'Brent Faiyaz':       [{ song: 'Dead Man Walking', accent: '#C084FC', albumColor: '#160820', avgRating: 89, totalRatings: 730 }],
  'Summer Walker':      [{ song: 'Come Thru', accent: '#F472B6', albumColor: '#1a0410', avgRating: 85, totalRatings: 560 }, { song: 'Over It', accent: '#F472B6', albumColor: '#180216', avgRating: 84, totalRatings: 490 }],
  '6LACK':              [{ song: 'Ex Calling', accent: '#94A3B8', albumColor: '#0e1018', avgRating: 83, totalRatings: 410 }],
  'Lucky Daye':         [{ song: 'I\'d Rather', accent: '#FCD34D', albumColor: '#1a1400', avgRating: 87, totalRatings: 390 }],
  'Ravyn Lenae':        [{ song: 'Sticky', accent: '#F9A8D4', albumColor: '#1a0818', avgRating: 84, totalRatings: 320 }],
  'Ari Lennox':         [{ song: 'Shea Butter Baby', accent: '#86EFAC', albumColor: '#041008', avgRating: 88, totalRatings: 440 }],
  'PARTYNEXTDOOR':      [{ song: 'Loyal', accent: '#7DD3FC', albumColor: '#041018', avgRating: 82, totalRatings: 360 }],
  'Snoh Aalegra':       [{ song: 'WHOA', accent: '#C4B5FD', albumColor: '#0e0820', avgRating: 90, totalRatings: 510 }],
  'Charlotte Day Wilson':[{ song: 'Work', accent: '#93C5FD', albumColor: '#06101e', avgRating: 89, totalRatings: 430 }],
  'Pink Sweat$':        [{ song: 'At My Worst', accent: '#FCA5A5', albumColor: '#1a0808', avgRating: 88, totalRatings: 760 }],
  'UMI':                [{ song: 'Love Affair', accent: '#6EE7B7', albumColor: '#031410', avgRating: 87, totalRatings: 380 }],
  'Masego':             [{ song: 'Tadow', accent: '#FDE68A', albumColor: '#1a1200', avgRating: 93, totalRatings: 620 }],
  'KIRBY':              [{ song: 'Die With U', accent: '#DDD6FE', albumColor: '#100e20', avgRating: 85, totalRatings: 280 }],
  'Raveena':            [{ song: 'Stronger', accent: '#FBCFE8', albumColor: '#1a0812', avgRating: 86, totalRatings: 300 }],
  'Sudan Archives':     [{ song: 'Selfish Soul', accent: '#FED7AA', albumColor: '#1a0e04', avgRating: 88, totalRatings: 340 }],
  'FKA twigs':          [{ song: 'Two Weeks', accent: '#F0ABFC', albumColor: '#1a0418', avgRating: 91, totalRatings: 890 }],
  'James Blake':        [{ song: 'Retrograde', accent: '#A5F3FC', albumColor: '#031418', avgRating: 92, totalRatings: 720 }],
  'Moses Sumney':       [{ song: 'Quarrel', accent: '#D9F99D', albumColor: '#0c1004', avgRating: 89, totalRatings: 290 }],
  'Caroline Polachek':  [{ song: 'So Hot You\'re Hurting My Feelings', accent: '#FEF08A', albumColor: '#1a1600', avgRating: 90, totalRatings: 430 }],
};

// Get 1–2 songs for an artist, seeded so consistent per artist
function _songsForArtistFromPool(name, sourcePool) {
  const pool = sourcePool[name];
  if (!pool) return [];
  if (pool.length === 1) return pool;
  // Seeded: ~50% chance of 1 vs 2 songs
  const count = (_hsh(name) % 2) + 1;
  return pool.slice(0, count);
}

function _songsForArtist(name) {
  return _songsForArtistFromPool(name, ARTIST_SONG_POOL);
}

const _EXPAND_ALL_TRACKS = (() => {
  const seen = new Set();
  const list = [];

  Object.entries(ARTIST_SONG_POOL).forEach(([artistName, songs]) => {
    songs.forEach((songObj) => {
      const songName = songObj?.song;
      const key = _trackKey(songName, artistName);
      if (!songName || seen.has(key)) return;
      seen.add(key);
      list.push({ songName, artistName });
    });
  });

  EXPAND_SONG_RESPONSES.forEach((songObj) => {
    const songName = songObj?.song;
    const artistName = songObj?.artist;
    const key = _trackKey(songName, artistName);
    if (!songName || !artistName || seen.has(key)) return;
    seen.add(key);
    list.push({ songName, artistName });
  });

  return list;
})();

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const _clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const _rangeFromSeed = (seed, min, max) => {
  const span = Math.max(1, max - min + 1);
  return min + (Math.abs(seed) % span);
};
const _normalizeCounter = (value, fallback, minimumValid = 1) => {
  if (Number.isFinite(value) && value >= minimumValid) {
    return Math.round(value);
  }
  return Math.round(fallback);
};

const _parseVolumePoints = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.max(0, Math.round(parsed));
  }
  return fallback;
};

const _normalizeGenrePointChange = (change, fallbackPercent) => {
  if (typeof change === 'string' && change.trim()) {
    return change.trim();
  }
  if (Number.isFinite(change)) {
    return `+${change.toFixed(1)}%`;
  }
  return `+${(fallbackPercent * 100).toFixed(1)}%`;
};

const _groupChatHash = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
};

const _buildStableGroupChatFallback = (post = {}) => {
  const seed = _groupChatHash(String(post?.id || post?.title || ""));
  const roomVolume = 500 + (seed % 4500);
  const volumePoints = 5 + (seed % 30);
  const palette = ["#00d4aa", "#ff6b9d", "#a855f7", "#f59e0b", "#3b82f6"];
  const genres = ["Metal", "Hip-Hop", "R&B", "Electronic", "Pop", "Rock", "Indie", "Jazz"];

  const pickedSet = new Set([
    genres[seed % genres.length],
    genres[(seed * 7) % genres.length],
    genres[(seed * 13) % genres.length],
  ]);

  let cursor = seed;
  while (pickedSet.size < 2) {
    pickedSet.add(genres[cursor % genres.length]);
    cursor += 1;
  }

  const picked = Array.from(pickedSet).slice(0, 3);
  const genreStats = picked.map((name, i) => ({
    name,
    change: `+${(((seed % 17) + 3 + i) / 10).toFixed(1)}%`,
    color: palette[i % palette.length],
  }));

  return { roomVolume, volumePoints, genreStats };
};

function _buildRealisticPostCounters(post = {}) {
  const postType = String(post?.postType || "thread").toLowerCase();
  const idSeed = hashString(`${post?.id || post?.title || post?.author || "post"}:${postType}`);
  const mixSeed = hashString(`${post?.author || "author"}:${post?.createdUtc || 0}:${post?.selftext || ""}`);

  let likesRange = [220, 5200];
  let commentsRange = [55, 1300];
  let bookmarksRange = [40, 980];
  let minimums = { likes: 80, comments: 20, bookmarks: 12 };

  if (postType === "news") {
    likesRange = [480, 9600];
    commentsRange = [110, 2800];
    bookmarksRange = [95, 1900];
    minimums = { likes: 180, comments: 40, bookmarks: 28 };
  } else if (postType === "groupchat") {
    likesRange = [300, 6800];
    commentsRange = [90, 3400];
    bookmarksRange = [70, 1500];
    minimums = { likes: 120, comments: 35, bookmarks: 22 };
  } else if (postType === "parameter") {
    likesRange = [260, 6200];
    commentsRange = [85, 2100];
    bookmarksRange = [55, 1400];
    minimums = { likes: 100, comments: 30, bookmarks: 18 };
  }

  const fallbackLikes = _rangeFromSeed(idSeed + 17, likesRange[0], likesRange[1]);
  const fallbackComments = _rangeFromSeed((idSeed * 3) + 29, commentsRange[0], commentsRange[1]);
  const derivedBookmarks = Math.round((fallbackLikes * 0.18) + (fallbackComments * 0.24) + _rangeFromSeed(mixSeed, 8, 110));
  const fallbackBookmarks = _clamp(derivedBookmarks, bookmarksRange[0], bookmarksRange[1]);

  const likes = _normalizeCounter(post?.ups, fallbackLikes, minimums.likes);
  const comments = _normalizeCounter(post?.num_comments, fallbackComments, minimums.comments);
  const bookmarks = _normalizeCounter(post?.bookmarks, fallbackBookmarks, minimums.bookmarks);

  return {
    likes,
    comments,
    bookmarks: _clamp(bookmarks, 8, Math.max(80, Math.round(likes * 0.82))),
  };
}

// Artist pool — multi-select, Design B pill rows
const EXPAND_ARTIST_SECS = [
  { key: 'top', label: 'TOP',          artists: EXPAND_TOP_ARTISTS,      accent: '#1d9bf0', badgeType: 'none'  },
  { key: 'fol', label: 'FOLLOWED',     artists: EXPAND_FOLLOWED_ARTISTS, accent: '#10b981', badgeType: 'check' },
  { key: 'rec', label: 'RECOMMENDED',  artists: EXPAND_REC_ARTISTS,      accent: '#A78BFA', badgeType: 'star'  },
];

const EXAMPLE_EXPAND_ARTIST_SECS = [
  { key: 'top', label: 'TOP',         artists: ['Placeholder Artist A', 'Placeholder Artist B', 'Placeholder Artist C'], accent: '#1d9bf0', badgeType: 'none'  },
  { key: 'fol', label: 'FOLLOWED',    artists: ['Placeholder Artist D', 'Placeholder Artist E', 'Placeholder Artist F'], accent: '#10b981', badgeType: 'check' },
  { key: 'rec', label: 'RECOMMENDED', artists: ['Placeholder Artist G', 'Placeholder Artist H', 'Placeholder Artist I'], accent: '#A78BFA', badgeType: 'star'  },
];

const EXAMPLE_ARTIST_SONG_POOL = {
  'Placeholder Artist A': [{ song: 'Song title', accent: '#60A5FA', albumColor: '#0f172a', avgRating: 84, totalRatings: 120 }],
  'Placeholder Artist B': [{ song: 'Song title', accent: '#A78BFA', albumColor: '#1e1b4b', avgRating: 79, totalRatings: 94 }],
  'Placeholder Artist C': [{ song: 'Song title', accent: '#34D399', albumColor: '#052e2b', avgRating: 88, totalRatings: 143 }],
  'Placeholder Artist D': [{ song: 'Song title', accent: '#F59E0B', albumColor: '#3b2300', avgRating: 75, totalRatings: 81 }],
  'Placeholder Artist E': [{ song: 'Song title', accent: '#F472B6', albumColor: '#3d1024', avgRating: 82, totalRatings: 111 }],
  'Placeholder Artist F': [{ song: 'Song title', accent: '#22D3EE', albumColor: '#083344', avgRating: 86, totalRatings: 138 }],
  'Placeholder Artist G': [{ song: 'Song title', accent: '#FB7185', albumColor: '#3f0c1c', avgRating: 77, totalRatings: 96 }],
  'Placeholder Artist H': [{ song: 'Song title', accent: '#FDE68A', albumColor: '#3b3200', avgRating: 80, totalRatings: 107 }],
  'Placeholder Artist I': [{ song: 'Song title', accent: '#93C5FD', albumColor: '#0b2a4a', avgRating: 85, totalRatings: 126 }],
};

const EXAMPLE_SONG_RESPONSES = [
  { id: 1, user: 'User', avatar: 'PU', avatarColor: '#334155', comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', song: 'Song title', artist: 'Artist', albumColor: '#0f172a', accent: '#60A5FA', avgRating: 84, totalRatings: 120 },
  { id: 2, user: 'User', avatar: 'PU', avatarColor: '#334155', comment: 'Sed do eiusmod tempor incididunt ut labore magna.', song: 'Song title', artist: 'Artist', albumColor: '#1e1b4b', accent: '#A78BFA', avgRating: 79, totalRatings: 94 },
  { id: 3, user: 'User', avatar: 'PU', avatarColor: '#334155', comment: 'Ut enim ad minim veniam quis nostrud exercitation.', song: 'Song title', artist: 'Artist', albumColor: '#052e2b', accent: '#34D399', avgRating: 88, totalRatings: 143 },
];

const _isExampleArtistPlaceholder = (name = '') => String(name).startsWith('Placeholder Artist ');
const _displayExpandArtistName = (name = '') => (_isExampleArtistPlaceholder(name) ? 'Artist' : String(name));
const _displayExpandArtistChip = (name = '') => _displayExpandArtistName(name).split(',')[0].split(' ')[0];
const _displayExpandArtistInitials = (name = '') => (_isExampleArtistPlaceholder(name) ? 'A' : _ini(name));

function _ArtistPool({ onToggle, selected, artistImages, sections = EXPAND_ARTIST_SECS, isMobile = false }) {
  const chipAvatarSize = isMobile ? 28 : 30;
  const chipBadgeSize = isMobile ? 11 : 12;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 14, marginBottom: isMobile ? 14 : 16 }}>
      {sections.map(sec => (
        <div key={sec.key}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 7, marginBottom: isMobile ? 8 : 9 }}>
            <div style={{ width: 3, height: isMobile ? 12 : 13, borderRadius: 2, background: sec.accent, flexShrink: 0 }} />
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: sec.accent, letterSpacing: 1 }}>{sec.label}</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right,${sec.accent}35,transparent)` }} />
            <span style={{ fontSize: isMobile ? 9 : 10, color: '#475569' }}>{sec.artists.length}</span>
          </div>
          {/* paddingTop gives tooltip room to render downward without being clipped */}
          <div style={{ display: 'flex', gap: isMobile ? 6 : 8, overflowX: 'auto', paddingBottom: 4, paddingTop: 2, scrollbarWidth: 'none' }}>
            {sec.artists.map((name, i) => {
              const h = _ahue(name);
              const isSel = selected.has(name);
              const count = _fire(name);
              const artistImage = artistImages?.[name] || null;
              const displayArtistName = _displayExpandArtistName(name);
              return (
                <div key={i} onClick={() => onToggle(name)} style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 7,
                  background: isSel ? `hsl(${h},38%,18%)` : 'rgba(15,24,35,0.75)',
                  border: `1px solid ${isSel ? `hsl(${h},52%,44%)` : `${sec.accent}30`}`,
                  borderRadius: 20, padding: isMobile ? '5px 10px 5px 5px' : '6px 11px 6px 6px', cursor: 'pointer', transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                  boxShadow: isSel ? `0 0 0 1px ${sec.accent}55, 0 0 12px ${sec.accent}20` : 'none',
                  transform: isSel ? 'scale(1.04)' : 'scale(1)',
                }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.borderColor = `${sec.accent}70`; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.borderColor = `${sec.accent}30`; }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {artistImage ? (
                      <img
                        src={artistImage}
                        alt={displayArtistName}
                        loading="lazy"
                        decoding="async"
                        style={{ width: chipAvatarSize, height: chipAvatarSize, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid hsl(${h},48%,40%)`, display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: chipAvatarSize, height: chipAvatarSize, borderRadius: '50%', background: `hsl(${h},40%,22%)`, border: `1.5px solid hsl(${h},48%,40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 9 : 10, fontWeight: 700, color: `hsl(${h},75%,80%)` }}>
                        {_displayExpandArtistInitials(name)}
                      </div>
                    )}
                    {sec.badgeType === 'check' && (
                      <div style={{ position: 'absolute', top: -2, right: -2, width: chipBadgeSize, height: chipBadgeSize, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', border: '1px solid #1e2732', fontWeight: 900 }}>✓</div>
                    )}
                    {sec.badgeType === 'star' && (
                      <div style={{ position: 'absolute', top: -2, right: -2, width: chipBadgeSize, height: chipBadgeSize, borderRadius: '50%', background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', border: '1px solid #1e2732' }}>✦</div>
                    )}
                  </div>
                  <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: isSel ? '#ffffff' : '#8899a6', whiteSpace: 'nowrap' }}>
                    {_displayExpandArtistChip(name)}
                  </span>
                  <Tip text={`${count}× recommended today`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <svg width={isMobile ? "7" : "8"} height={isMobile ? "7" : "8"} viewBox="0 0 24 24" fill="#f97316"><path d="M12 2C9.5 6 14 10 11 14c-1-2-3-2.5-3-2.5C8.5 17 10.5 22 15 22c4 0 6-3 6-6 0-4-4-5-4-8-2 2-1.5 5-3.5 5S12 9 12 2z" /></svg>
                      <span style={{ fontSize: isMobile ? 8 : 9, color: '#fb923c', fontWeight: 700 }}>{count}</span>
                    </div>
                  </Tip>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Filled genre pill
function _GenrePill({ name, color, fill }) {
  const pct = Math.round(fill * 100);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', borderRadius: 6, overflow: 'hidden', border: `1px solid ${color}55`, height: 21, flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color, opacity: 0.9 }} />
      <div style={{ position: 'absolute', left: `${pct}%`, top: 0, bottom: 0, right: 0, background: `${color}20` }} />
      <span style={{ position: 'relative', zIndex: 1, fontSize: 11, fontWeight: 700, color: '#fff', padding: '0 8px', whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
        {name}
      </span>
    </div>
  );
}

// Vertical rating bar for song response cards
function VertRatingBar({ avgRating, userRating, onRate, compact = false }) {
  const [hovering, setHovering] = React.useState(false);
  const [hoverVal, setHoverVal] = React.useState(0);
  const barRef = React.useRef(null);
  const didRate = userRating > 0;
  const getPoint = (event) => {
    if (event.touches?.length) return event.touches[0];
    if (event.changedTouches?.length) return event.changedTouches[0];
    return event;
  };
  function getVal(point) {
    const r = barRef.current.getBoundingClientRect();
    if (compact) {
      return Math.max(0, Math.min(100, Math.round(((point.clientX - r.left) / r.width) * 100)));
    }
    return Math.max(0, Math.min(100, Math.round((1 - (point.clientY - r.top) / r.height) * 100)));
  }
  const fill = didRate ? userRating : (hovering ? hoverVal : avgRating);
  return (
    <div style={compact
      ? {
          display: 'grid',
          gridTemplateColumns: 'auto minmax(0, 1fr) auto',
          alignItems: 'center',
          gap: 10,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }
      : {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: '12px 14px',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
        }
    }>
      <span style={{ fontSize: compact ? 10 : 9, color: '#475569', letterSpacing: 1, marginBottom: compact ? 0 : 4 }}>RATE</span>
      <div ref={barRef}
        onMouseMove={e => { if (!didRate) setHoverVal(getVal(getPoint(e))); }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onTouchStart={e => {
          if (!didRate) {
            const point = getPoint(e);
            const nextValue = getVal(point);
            setHoverVal(nextValue);
            onRate(nextValue);
          }
        }}
        onClick={e => { if (!didRate) onRate(getVal(getPoint(e))); }}
        style={compact
          ? {
              width: '100%',
              height: 10,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 999,
              position: 'relative',
              cursor: didRate ? 'default' : 'pointer',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.07)',
            }
          : {
              width: 14,
              height: 80,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 7,
              position: 'relative',
              cursor: didRate ? 'default' : 'pointer',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.07)',
            }
        }
      >
        <div style={compact
          ? {
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${fill}%`,
              background: didRate ? 'linear-gradient(to right,#1d9bf0,#60c5ff)' : hovering ? 'linear-gradient(to right,#1d9bf0aa,#1d9bf0)' : 'linear-gradient(to right,#1e2732,#2a3a4a)',
              transition: 'width .2s ease',
              borderRadius: 999,
            }
          : {
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: `${fill}%`,
              background: didRate ? 'linear-gradient(to top,#1d9bf0,#60c5ff)' : hovering ? 'linear-gradient(to top,#1d9bf0aa,#1d9bf0)' : 'linear-gradient(to top,#1e2732,#2a3a4a)',
              transition: 'height .2s ease',
              borderRadius: 7,
            }
        } />
      </div>
      <span style={{ fontSize: compact ? 12 : 11, color: didRate ? '#1d9bf0' : '#475569', fontWeight: 700, minWidth: compact ? 30 : 'auto', textAlign: 'right' }}>
        {didRate ? userRating : (compact ? avgRating : (hovering ? hoverVal : '—'))}
      </span>
    </div>
  );
}

// Song response card — "Inset Sleeve": square album art with rounded corners, glow shadow, gradient bg bleed
function SongCard({ data, songName, artistName, albumArtUrl, onExpand, onUserClick, expanded, isMobile = false }) {
  const [localRating, setLocalRating] = React.useState(0);
  const displaySong = songName || data.song;
  const displayArtist = _displayExpandArtistName(artistName || data.artist);
  const responseUser = _expandUser(data.user);
  const albumArtSize = isMobile ? 88 : 120;
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${data.albumColor} 0%, rgba(15,24,35,0.95) 40%, rgba(15,24,35,0.95) 100%)`,
        border: `1px solid ${expanded ? data.accent + '70' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        padding: isMobile ? '12px' : '14px',
        transition: 'all .2s',
      }}
      onClick={onExpand}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${data.accent}50`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = expanded ? `${data.accent}70` : 'rgba(255,255,255,0.08)'; }}
    >
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 14 }}>
        <div style={{ display: 'flex', gap: isMobile ? 12 : 14, alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
          {/* Inset square album art with rounded corners + glow */}
          <div style={{
            width: albumArtSize, height: albumArtSize, flexShrink: 0, borderRadius: 12, overflow: 'hidden',
            position: 'relative',
            boxShadow: `0 4px 24px ${data.accent}25, 0 0 0 1px rgba(255,255,255,0.06)`,
          }}>
            {albumArtUrl ? (
              <img
                src={albumArtUrl}
                alt={`${displaySong} album art`}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: data.albumColor }} />
            )}
            {/* Play button overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.15)',
            }}>
              <div style={{
                width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: '50%',
                background: `${data.accent}30`, border: `1.5px solid ${data.accent}80`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}>
                <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill={data.accent}><polygon points="6,3 20,12 6,21" /></svg>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div>
              {/* Song title + inline rating badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: '#fff', letterSpacing: -0.3, lineHeight: 1.2, minWidth: 0, wordBreak: 'break-word' }}>{displaySong}</span>
                <span style={{
                  fontSize: 9, color: data.accent,
                  background: `${data.accent}18`, padding: '2px 7px', borderRadius: 4,
                  fontWeight: 700, letterSpacing: 0.5,
                }}>{data.avgRating}</span>
              </div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: '#64748b', marginBottom: 8 }}>{displayArtist}</div>

              {/* Comment */}
              <p style={{ margin: 0, fontSize: isMobile ? 12 : 13, color: '#8899a6', lineHeight: 1.5 }}>{data.comment}</p>
            </div>

            {/* Footer: user + rated count */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <ClickableUserAvatar
                  user={responseUser}
                  avatarSrc={responseUser.avatar}
                  size={22}
                  onUserClick={onUserClick}
                />
                <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{data.user}</span>
              </div>
              <span style={{ fontSize: 11, color: '#475569' }}>{data.totalRatings} rated</span>
            </div>
          </div>
        </div>

        <VertRatingBar avgRating={data.avgRating} userRating={localRating} onRate={v => setLocalRating(v)} compact={isMobile} />
      </div>
    </div>
  );
}

// Rating threshold scrollbar
function RatingScrollbar({ value, onChange }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const [active, setActive] = React.useState(false);
  function getVal(clientY) {
    const r = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(100, Math.round((1 - (clientY - r.top) / r.height) * 100)));
  }
  function onDown(e) {
    if (!active) { setActive(true); return; }
    setDragging(true); onChange(getVal(e.clientY));
  }
  React.useEffect(() => {
    if (!dragging) return;
    const mv = e => onChange(getVal(e.clientY));
    const up = () => setDragging(false);
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
  }, [dragging]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', borderLeft: '1px solid rgba(255,255,255,0.07)', minWidth: 44 }}>
      <span style={{ fontSize: 9, color: '#475569', letterSpacing: 1 }}>MAX</span>
      <div style={{ position: 'relative', flex: 1, minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {[100, 75, 50, 25, 0].map(n => (
          <div key={n} style={{ position: 'absolute', right: 17, top: `${100 - n}%`, transform: 'translateY(-50%)', fontSize: 8, color: '#475569', userSelect: 'none' }}>{n}</div>
        ))}
        <div ref={trackRef} onMouseDown={onDown}
          style={{ width: 10, height: '100%', background: active ? 'rgba(29,155,240,0.12)' : 'rgba(255,255,255,0.04)', borderRadius: 5, position: 'relative', cursor: active ? 'ns-resize' : 'pointer', border: active ? '1px solid rgba(29,155,240,0.4)' : '1px solid rgba(255,255,255,0.07)', transition: 'all .3s' }}
        >
          {!active && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#475569' }} /></div>}
          {active && <>
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${value}%`, background: 'linear-gradient(to top,#1d9bf0cc,#1d9bf0)', borderRadius: 5, transition: 'height .08s' }} />
            <div style={{ position: 'absolute', top: `${100 - value}%`, left: '50%', transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: '50%', background: '#1d9bf0', border: '2px solid #7dd3fc', boxShadow: '0 0 12px #1d9bf080', transition: 'top .08s' }} />
          </>}
        </div>
      </div>
      {active
        ? <div style={{ fontSize: 14, fontWeight: 800, color: '#1d9bf0' }}>≤{value}</div>
        : <span style={{ fontSize: 8, color: '#475569', textAlign: 'center', maxWidth: 40, lineHeight: 1.3 }}>tap to filter</span>
      }
    </div>
  );
}

// Sub-comment view — bigger, more readable text
function SubCommentView({ song, onClose, onUserClick, isMobile = false }) {
  const [threshold, setThreshold] = React.useState(100);
  const [filterActive, setFilterActive] = React.useState(false);
  const sorted = [...EXPAND_SUB_COMMENTS].sort((a, b) => b.rating - a.rating);
  const displayed = filterActive ? sorted.filter(c => c.rating <= threshold) : sorted;
  return (
    <div style={{ marginTop: 10, background: '#171f28', border: '1px solid rgba(29,155,240,0.35)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: isMobile ? '12px 12px 10px' : '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: '#ffffff', wordBreak: 'break-word' }}>{song.song || song.displaySong}</span>
          <span style={{ fontSize: isMobile ? 11 : 12, color: '#475569' }}> · {_displayExpandArtistName(song.artist || song.displayArtist)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {filterActive && (
            <button onClick={() => { setFilterActive(false); setThreshold(100); }} style={{ fontSize: 11, color: '#1d9bf0', background: 'none', border: 'none', cursor: 'pointer' }}>clear</button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8899a6', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
      </div>
      {isMobile && (
        <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#8899a6' }}>
              {filterActive ? <>ratings ≤ <span style={{ color: '#1d9bf0', fontWeight: 700 }}>{threshold}</span></> : 'all ratings'}
            </span>
            {filterActive && (
              <button onClick={() => { setFilterActive(false); setThreshold(100); }} style={{ fontSize: 11, color: '#1d9bf0', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                show all
              </button>
            )}
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={threshold}
            onChange={(e) => {
              setThreshold(Number(e.target.value));
              setFilterActive(true);
            }}
            style={{ width: '100%', accentColor: '#1d9bf0' }}
          />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', maxHeight: isMobile ? 'none' : 360 }}>
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: isMobile ? 320 : 'none' }}>
          {displayed.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#475569', fontSize: 13 }}>no ratings ≤ {threshold}</div>
          )}
          {displayed.map(c => {
            const commentUser = _expandUser(c.user);
            return (
              <div key={c.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <ClickableUserAvatar
                      user={commentUser}
                      avatarSrc={commentUser.avatar}
                      size={28}
                      onUserClick={onUserClick}
                    />
                    <span style={{ fontSize: 13, color: '#8899a6' }}>@{c.user}</span>
                  </div>
                  <div style={{ flexShrink: 0, padding: '3px 10px', borderRadius: 6, background: 'rgba(29,155,240,0.15)', border: '1px solid rgba(29,155,240,0.4)', fontSize: 14, fontWeight: 800, color: '#1d9bf0' }}>
                    {c.rating}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{c.text}</p>
              </div>
            );
          })}
        </div>
        {!isMobile && (
          <RatingScrollbar value={threshold} onChange={v => { setThreshold(v); setFilterActive(true); }} />
        )}
      </div>
      {filterActive && !isMobile && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#8899a6' }}>
            ratings <span style={{ color: '#1d9bf0', fontWeight: 700 }}>≤ {threshold}</span>
            <span style={{ color: '#475569' }}> · {displayed.length} comment{displayed.length !== 1 ? 's' : ''}</span>
          </span>
          <button onClick={() => { setFilterActive(false); setThreshold(100); }} style={{ fontSize: 11, color: '#1d9bf0', background: 'none', border: 'none', cursor: 'pointer' }}>show all</button>
        </div>
      )}
    </div>
  );
}

// ─── Animated song list drawer ───────────────────────────────────────────────
// Inject keyframe animations once
const _expandAnimStyleId = '_expand-anim-styles';
if (typeof document !== 'undefined' && !document.getElementById(_expandAnimStyleId)) {
  const s = document.createElement('style');
  s.id = _expandAnimStyleId;
  s.textContent = `
    @keyframes _expandChipIn { from { opacity:0; transform:scale(.85) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }
  `;
  document.head.appendChild(s);
}

// Smoothly transitions height when song list content changes (default ↔ playlist)
function AnimatedSongList({ children, transitionKey }) {
  const contentRef = React.useRef(null);
  const [height, setHeight] = React.useState('auto');
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const prevKeyRef = React.useRef(transitionKey);
  const rafRef = React.useRef(null);

  React.useEffect(() => {
    if (prevKeyRef.current !== transitionKey) {
      prevKeyRef.current = transitionKey;
      if (contentRef.current) {
        // Lock current height before content swap
        const currentH = contentRef.current.scrollHeight;
        setHeight(currentH + 'px');
        setIsTransitioning(true);

        // After a frame, measure new content and animate to it
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = requestAnimationFrame(() => {
            if (contentRef.current) {
              const newH = contentRef.current.scrollHeight;
              setHeight(newH + 'px');
            }
          });
        });
      }
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [transitionKey]);

  const handleTransitionEnd = React.useCallback((e) => {
    if (e.propertyName === 'height') {
      setIsTransitioning(false);
      setHeight('auto');
    }
  }, []);

  return (
    <div
      style={{
        height,
        overflow: isTransitioning ? 'hidden' : 'visible',
        transition: isTransitioning ? 'height .4s cubic-bezier(.4,0,.2,1)' : 'none',
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
}

// Wrapper for individual song cards to stagger their entry
function AnimatedSongEntry({ children, index, transitionKey }) {
  const [visible, setVisible] = React.useState(false);
  const prevKeyRef = React.useRef(transitionKey);
  const timeoutRef = React.useRef(null);

  React.useEffect(() => {
    // Reset and re-trigger animation when transitionKey changes
    if (prevKeyRef.current !== transitionKey) {
      prevKeyRef.current = transitionKey;
      setVisible(false);
    }
    timeoutRef.current = setTimeout(() => setVisible(true), 60 + index * 70);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [transitionKey, index]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1)',
    }}>
      {children}
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────
const PostCard = ({ post, onClick, onUserClick, POST_TYPE_INDICATORS, _isCached }) => {
  const isMobile = useIsMobile();
  const isCompactPhone = useIsMobile(390);
  const [genres] = useState(() => getPostGenres(post.id));
  const [_artists] = useState(() => getPostArtists(post.id));
  const [headerVolume] = useState(() => getRandomNumber(800, 4300));
  const [sideVolume] = useState(() => getRandomNumber(3, 23));
  const [liveUsers] = useState(() => getRandomNumber(1000, 20000));
  const [_recommendations] = useState(() => getRandomNumber(50, 350));
  const [artistsDiscovered] = useState(() => getRandomNumber(15, 100));
  const [_totalArtists] = useState(() => getRandomNumber(artistsDiscovered + 20, 300));

  const feedCounters = useMemo(() => _buildRealisticPostCounters(post), [post]);
  const likesCount = feedCounters.likes;
  const commentsCount = feedCounters.comments;
  const bookmarksCount = feedCounters.bookmarks;

  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Expand section state (thread-only)
  const [expandOpen, setExpandOpen] = useState(false);
  const [expandedResponse, setExpandedResponse] = useState(null);
  const [selectedArtists, setSelectedArtists] = useState(() => new Set());
  const [expandArtistImages, setExpandArtistImages] = useState({});
  const [expandAlbumArtworks, setExpandAlbumArtworks] = useState({});
  const username = sanitizeDeletedUsername(post.username || generateUsername(post.author));
  const timeAgo = getTimeAgo(post.createdUtc);
  const isExamplePost = post.id === 'example_post_001';
  const expandArtistSections = isExamplePost ? EXAMPLE_EXPAND_ARTIST_SECS : EXPAND_ARTIST_SECS;
  const expandSongPool = isExamplePost ? EXAMPLE_ARTIST_SONG_POOL : ARTIST_SONG_POOL;
  const expandSongResponses = isExamplePost ? EXAMPLE_SONG_RESPONSES : EXPAND_SONG_RESPONSES;
  const shouldLoadExpandAssets = post.postType === 'thread' && !isExamplePost && expandOpen;

  const expandAllArtists = useMemo(
    () => (post.postType === 'thread'
      ? [...new Set(expandArtistSections.flatMap((sec) => sec.artists || []))]
      : EMPTY_ARRAY),
    [expandArtistSections, post.postType]
  );

  const expandAllTracks = useMemo(() => {
    if (post.postType !== 'thread') {
      return EMPTY_ARRAY;
    }

    const seen = new Set();
    const list = [];

    Object.entries(expandSongPool).forEach(([artistName, songs]) => {
      songs.forEach((songObj) => {
        const songName = songObj?.song;
        const key = _trackKey(songName, artistName);
        if (!songName || seen.has(key)) return;
        seen.add(key);
        list.push({ songName, artistName });
      });
    });

    expandSongResponses.forEach((songObj) => {
      const songName = songObj?.song;
      const artistName = songObj?.artist;
      const key = _trackKey(songName, artistName);
      if (!songName || !artistName || seen.has(key)) return;
      seen.add(key);
      list.push({ songName, artistName });
    });

    return list;
  }, [expandSongPool, expandSongResponses, post.postType]);

  useEffect(() => {
    let mounted = true;
    if (!shouldLoadExpandAssets || expandAllArtists.length === 0 || Object.keys(expandArtistImages).length > 0) {
      return undefined;
    }

    getAppleMusicArtistImages(expandAllArtists)
      .then((images) => {
        if (mounted && images) {
          setExpandArtistImages(images);
        }
      })
      .catch((_error) => { /* intentionally empty */ });

    return () => {
      mounted = false;
    };
  }, [shouldLoadExpandAssets, expandAllArtists, expandArtistImages]);

  useEffect(() => {
    let mounted = true;
    if (!shouldLoadExpandAssets || expandAllTracks.length === 0 || Object.keys(expandAlbumArtworks).length > 0) {
      return undefined;
    }

    getAppleMusicAlbumArtworks(expandAllTracks)
      .then((artworks) => {
        if (mounted && artworks) {
          setExpandAlbumArtworks(artworks);
        }
      })
      .catch((_error) => { /* intentionally empty */ });

    return () => {
      mounted = false;
    };
  }, [shouldLoadExpandAssets, expandAllTracks, expandAlbumArtworks]);

  const getThemeColor = (postType) => {
    if (postType === 'news') return '#e8d5a8';
    if (postType === 'parameter') return '#00C4B4';
    return POST_TYPE_INDICATORS[postType]?.color || '#1d9bf0';
  };

  const themeColor = getThemeColor(post.postType);
  const postLabel = POST_TYPE_INDICATORS[post.postType]?.label || 'Thread';
  const isNews = post.postType === 'news';
  const isGroupChat = post.postType === 'groupchat';

  const groupChatFallbackStats = useMemo(
    () => _buildStableGroupChatFallback(post),
    [post]
  );

  const groupChatVolumePoints = useMemo(
    () => _parseVolumePoints(post?.volumeChange, groupChatFallbackStats.volumePoints),
    [groupChatFallbackStats.volumePoints, post?.volumeChange]
  );

  const groupChatRoomVolume = useMemo(() => {
    const parsed = Number(post?.roomVolume);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
    return groupChatFallbackStats.roomVolume;
  }, [groupChatFallbackStats.roomVolume, post?.roomVolume]);

  const groupChatGenreStats = useMemo(() => {
    const minimumGenres = 2;
    const normalized = [];
    const pushUniqueGenre = (genreStat, index) => {
      if (!genreStat || normalized.length >= 3) return;
      const name = String(genreStat?.name || '').trim();
      if (!name || normalized.some((item) => item.name === name)) return;
      normalized.push({
        name,
        color: genreStat?.color || genres[index]?.color || '#64748b',
        change: _normalizeGenrePointChange(genreStat?.change, genres[index]?.percentage || 0),
      });
    };

    const postGenreStats = Array.isArray(post?.genreStats) ? post.genreStats : [];
    postGenreStats.forEach(pushUniqueGenre);

    groupChatFallbackStats.genreStats.forEach(pushUniqueGenre);

    if (normalized.length < minimumGenres) {
      const fallbackPalette = ['#00d4aa', '#ff6b9d', '#a855f7', '#f59e0b', '#3b82f6'];
      const fallbackNames = ['Electronic', 'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Indie', 'Jazz', 'Metal'];
      let cursor = Math.abs(hashString(String(post?.id || post?.title || 'groupchat')));
      while (normalized.length < minimumGenres) {
        const name = fallbackNames[cursor % fallbackNames.length];
        pushUniqueGenre({
          name,
          color: fallbackPalette[normalized.length % fallbackPalette.length],
          change: `+${(((cursor % 17) + 3 + normalized.length) / 10).toFixed(1)}%`,
        }, normalized.length);
        cursor += 1;
      }
    }

    return normalized.slice(0, 3);
  }, [genres, groupChatFallbackStats.genreStats, post?.genreStats, post?.id, post?.title]);

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleUserClick = (user) => {
    if (onUserClick) {
      onUserClick(user);
    }
  };

  const getRgbaFromHex = (hex, alpha = 0.3) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const hasImage = !!post.imageUrl;

  const generateBackground = (postId) => {
    const seed = hashString(postId);
    const patternType = seed % 4;

    switch (patternType) {
      case 0:
        return `
          radial-gradient(circle at ${seed % 100}% ${(seed % 77)}%, 
          ${getRgbaFromHex(themeColor, 0.12)} 0%, 
          rgba(30, 39, 50, 0.01) 60%), 
          linear-gradient(to bottom, #1e2732 0%, #171f28 100%)
        `;
      case 1:
        return `
          linear-gradient(120deg, ${getRgbaFromHex(themeColor, 0.07)} 0%, rgba(30, 39, 50, 0.02) 100%),
          radial-gradient(circle at ${seed % 80 + 10}% ${seed % 70 + 15}%, rgba(42, 55, 68, 0.8) 0%, #1e2732 60%)
        `;
      case 2:
        return `
          linear-gradient(${seed % 360}deg, ${getRgbaFromHex(themeColor, 0.08)} 0%, rgba(30, 39, 50, 0) 70%),
          radial-gradient(ellipse at ${seed % 100}% ${seed % 100}%, rgba(42, 55, 68, 0.4) 0%, #1e2732 80%)
        `;
      default:
        return `
          linear-gradient(to bottom, #1e2732 0%, rgba(30, 39, 50, 0.95) 100%),
          radial-gradient(circle at ${(seed % 40) + 30}% ${(seed % 30) + 40}%, ${getRgbaFromHex(themeColor, 0.15)} 0%, rgba(30, 39, 50, 0) 70%)
        `;
    }
  };

  const backgroundStyle = useMemo(() => generateBackground(post.id), [post.id, themeColor]);
  const hasInlineExpandedContent = expandOpen || expandedResponse !== null;

  return (
    <div 
      style={{
        backgroundColor: '#1e2732',
        backgroundImage: backgroundStyle,
        borderRadius: 'clamp(12px, 2.8vw, 16px)',
        overflow: 'hidden',
        marginBottom: 'clamp(12px, 2.8vw, 16px)',
        border: isNews ? `1px solid ${getRgbaFromHex(themeColor, 0.3)}` : '1px solid rgba(255, 255, 255, 0.05)',
        width: '100%',
        position: 'relative',
        boxShadow: `0 -4px 12px ${getRgbaFromHex(themeColor, 0.2)}`,
        opacity: post.id === 'example_post_001' ? 0.92 : 1,
        contentVisibility: hasInlineExpandedContent ? 'visible' : 'auto',
        containIntrinsicSize: hasInlineExpandedContent ? undefined : (hasImage ? '720px' : '540px')
      }}
    >
      {/* Post type indicator */}
      <div style={{
        position: 'relative',
        height: '4px',
        backgroundColor: themeColor,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute',
          top: '6px',
          backgroundColor: themeColor,
          borderRadius: '4px',
          padding: '2px clamp(8px, 2.8vw, 12px)',
          fontSize: 'clamp(11px, 3.2vw, 12px)',
          fontWeight: '600',
          color: isNews || post.postType === 'parameter' ? 'black' : 'white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          zIndex: 5
        }}>
          {postLabel}
        </div>
      </div>

      {/* Main content area */}
      <div 
        style={{ 
          padding: 'clamp(14px, 4vw, 20px)', 
          cursor: post.id === 'example_post_001' ? 'default' : 'pointer' // No cursor change for example post
        }}
        onClick={post.id === 'example_post_001' ? undefined : () => onClick(post)} // Disable click for example post
      >
        {post.id === 'example_post_001' && (
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#0c111b',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: 'clamp(10px, 2.8vw, 12px)',
              fontWeight: '800',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              width: 'fit-content',
              marginBottom: '10px'
            }}
          >
            Example Post · Not Clickable
          </div>
        )}
        {/* User info header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(12px, 2.8vw, 16px)',
          flexWrap: 'wrap',
          rowGap: '10px',
          columnGap: '10px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 2.4vw, 12px)',
            minWidth: 0,
            flex: '1 1 210px',
          }}>
            <div 
              style={{ position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <ClickableUserAvatar 
                user={{
                  displayName: post.author,
                  username: username,
                  avatar: post.avatar || getAvatarSrc(post),
                }}
                avatarSrc={post.avatar || getAvatarSrc(post)}
                size={44}
                onUserClick={(user) => {
                  const completeUser = {
                    ...user,
                    avatar: post.avatar || getAvatarSrc(post)
                  };
                  handleUserClick(completeUser);
                }}
              />
              
              <div style={{
                position: 'absolute',
                bottom: '2px',
                left: '36px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: themeColor,
                pointerEvents: 'none'
              }}></div>
              
              {/* INFO ICON 3: User profile info - Only show for example post */}
              {post.id === 'example_post_001' && (
                <div style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px',
                  zIndex: 10
                }}
                  onClick={(e) => e.stopPropagation()} // Prevent post click when clicking icon
                >
                  <InfoIconModal
                    title="User Profile"
                    modalId={`user-profile-info-${post.id}`}
                    iconSize={16}
                    showButtonText={false}
                    steps={[
                      {
                        icon: <Users size={18} color="#a9b6fc" />,
                        title: "User Profile",
                        content: "Click on any user's profile picture to view their music taste, volume stats, and recent activity"
                      },
                      {
                        icon: <Music size={18} color="#a9b6fc" />,
                        title: "Music Discovery",
                        content: "Explore what music other users are into and discover new artists through their recommendations"
                      },
                      {
                        icon: <Headphones size={18} color="#a9b6fc" />,
                        title: "Follow Users",
                        content: "Follow users with similar music taste to get personalized recommendations in your feed"
                      }
                    ]}
                  />
                </div>
              )}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}>
              <span style={{
                fontSize: 'clamp(14px, 3.9vw, 16px)',
                fontWeight: '700',
                color: 'white',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {username}
              </span>
              <span style={{
                fontSize: 'clamp(12px, 3.2vw, 14px)',
                color: '#8899a6'
              }}>
                {timeAgo}
              </span>
            </div>
          </div>

          {/* Header stats - Live users for news, volume for regular posts */}
          {isNews ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(20, 30, 40, 0.5)',
              padding: '6px 10px',
              borderRadius: '12px',
              color: 'white'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#f44336',
                marginRight: '1px'
              }}></div>
              <Users size={16} color="#d0d7de" />
              <span style={{ fontWeight: '700', fontSize: 'clamp(12px, 3.3vw, 14px)' }}>{formatCompactNumber(liveUsers)} Live</span>
            </div>
          ) : isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
              <button style={{
                color: '#8899a6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 6px'
              }}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(15, 24, 35, 0.7)',
                padding: '6px 10px',
                borderRadius: '12px',
                color: 'white',
                position: 'relative'
              }}>
                <Volume2 size={20} />
                <span style={{ 
                  fontWeight: '700', 
                  fontSize: 'clamp(15px, 4vw, 18px)',
                  color: '#10b981' 
                }}>
                  {isGroupChat ? groupChatRoomVolume : headerVolume}
                </span>
                {/* INFO ICON 1: Main volume info - Only show for example post */}
                {post.id === 'example_post_001' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-2px', 
                    right: '-12px'
                  }}
                    onClick={(e) => e.stopPropagation()} // Prevent post click when clicking icon
                  >
                    <InfoIconModal
                      title="Post Main Volume"
                      modalId={`volume-info-${post.id}`}
                      iconSize={16}
                      showButtonText={false}
                      steps={[
                        {
                          icon: <Volume2 size={18} color="#a9b6fc" />,
                          title: "Volume Rating",
                          content: "Volume rating of this thread. Reflected by overall user ratings to the song recommendations and volumes of the users who engaged with the post"
                        }
                      ]}
                    />
                  </div>
                )}
              </div>
              <button style={{
                color: '#8899a6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                marginLeft: '4px'
              }}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Post Content Section */}
        {isNews ? (
          // News layout - more tweet-like with no right column
          <div>
            <div style={{
              fontSize: 'clamp(17px, 5vw, 20px)',
              fontWeight: '700',
              lineHeight: '1.3',
              color: 'white',
              marginBottom: '12px'
            }}>
              {post.title || post.selftext}
            </div>

            {post.imageUrl && (
              <div style={{
                marginTop: '12px',
                marginBottom: '16px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <img 
                  src={post.imageUrl} 
                  alt="News" 
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              padding: '14px 0 8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              marginTop: '8px',
              flexWrap: 'wrap',
              rowGap: '6px',
            }}>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#ffffff'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle size={22} />
                <span style={{ marginLeft: '6px', fontSize: 'clamp(13px, 3.6vw, 15px)', fontWeight: '500', color: 'white' }}>
                  {formatCompactNumber(commentsCount)}
                </span>
              </button>

              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                color: isBookmarked ? '#fbbf24' : '#ffffff'
              }}
                onClick={handleBookmark}
              >
                <Bookmark size={22} fill={isBookmarked ? '#fbbf24' : 'none'} />
                <span style={{ marginLeft: '6px', fontSize: 'clamp(13px, 3.6vw, 15px)', fontWeight: '500', color: 'white' }}>
                  {isBookmarked ? formatCompactNumber(bookmarksCount + 1) : formatCompactNumber(bookmarksCount)}
                </span>
              </button>

              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                color: isLiked ? '#f91880' : '#ffffff'
              }}
                onClick={handleLike}
              >
                <Heart size={22} fill={isLiked ? '#f91880' : 'none'} />
                <span style={{ marginLeft: '6px', fontSize: 'clamp(13px, 3.6vw, 15px)', fontWeight: '500', color: 'white' }}>
                  {isLiked ? formatCompactNumber(likesCount + 1) : formatCompactNumber(likesCount)}
                </span>
              </button>

              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                color: '#8899a6'
              }}
                onClick={(e) => e.stopPropagation()}
              >
                <Share2 size={22} />
              </button>
            </div>
          </div>
        ) : isMobile ? (
          // ── MOBILE: Stacked clean layout ──
          <div className="postcard-mobile-stacked">
            {/* Post title - full width */}
            <div style={{
              fontSize: 'clamp(17px, 4.8vw, 20px)',
              lineHeight: '1.35',
              color: 'white',
              marginBottom: 'clamp(12px, 3vw, 16px)',
              fontWeight: '700',
              letterSpacing: '-0.01em'
            }}>
              {post.title || post.selftext}
            </div>

            <div className="postcard-mobile-thread-vol-row">
              <div className="postcard-mobile-thread-vol-left">
                <Volume2 size={15} color="#a9b6fc" />
                <span className="postcard-mobile-thread-vol-label">Thread Volume</span>
              </div>
              <div className="postcard-mobile-thread-vol-value">
                {isGroupChat ? groupChatRoomVolume : headerVolume}
              </div>
              {post.id === 'example_post_001' && (
                <div
                  style={{ marginLeft: 4 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <InfoIconModal
                    title="Post Main Volume"
                    modalId={`volume-info-mobile-${post.id}`}
                    iconSize={14}
                    showButtonText={false}
                    steps={[
                      {
                        icon: <Volume2 size={18} color="#a9b6fc" />,
                        title: "Volume Rating",
                        content: "Volume rating of this thread. Reflected by overall user ratings to the song recommendations and volumes of the users who engaged with the post"
                      }
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Post image - full width */}
            {post.imageUrl && (
              <div style={{
                marginBottom: '14px',
                borderRadius: '14px',
                overflow: 'hidden'
              }}>
                <img 
                  src={post.imageUrl} 
                  alt="Post" 
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}

            {/* Genre stats section - stacked below content */}
            <div className="postcard-mobile-genre-section">
              {/* Volume row */}
              <div className="postcard-mobile-vol-row">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#9ca3af',
                  fontSize: '13px'
                }}>
                  <Volume2 size={14} color="#9ca3af" />
                  <span>Vol</span>
                </div>
                <div style={{
                  color: '#10b981',
                  fontWeight: '700',
                  fontSize: '14px'
                }}>
                  +{isGroupChat ? groupChatVolumePoints : sideVolume}
                </div>
                {post.id === 'example_post_001' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-2px', 
                    right: '-12px'
                  }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <InfoIconModal
                      title="Post Genres"
                      modalId={`genres-info-${post.id}`}
                      iconSize={16}
                      showButtonText={false}
                      steps={[
                        {
                          icon: <Music size={18} color="#a9b6fc" />,
                          title: "Joining and Engaging",
                          content: "Joining and engaging in different threads will give you volume and genre points."
                        },
                        {
                          icon: <Volume2 size={18} color="#a9b6fc" />,
                          title: "Higher Volume Benefits",
                          content: "The higher your volume, the more engagement your posts might get and users earn more from engaging in your posts."
                        },
                        {
                          icon: <Users size={18} color="#a9b6fc" />,
                          title: "Community Recognition",
                          content: "Having a lot of genre stats and a high volume will show the community that you have great music taste and might be worth following."
                        },
                        {
                          icon: <Mic size={18} color="#a9b6fc" />,
                          title: "Promote Artists",
                          content: "Your song recommendations will be prioritized and you can promote your favorite underrated artists."
                        }
                      ]}
                    />
                  </div>
                )}
              </div>

              {/* Genre tags - flexible wrap layout */}
              <div className="postcard-mobile-genre-grid">
                {post.postType === 'parameter' ? (
                  <>
                    {genres.slice(0, 3).map((genre, i) => (
                      <div key={i} className="postcard-mobile-genre-chip">
                        <span className="postcard-mobile-genre-tag" style={{ backgroundColor: genre.color }}>
                          {genre.name}
                        </span>
                        <span className="postcard-mobile-genre-pct">
                          +{(genre.percentage * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                    {(Array.isArray(post.parameters) ? post.parameters : []).map((parameterName, i) => (
                      <div key={`param-${i}`} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        backgroundColor: ['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 4],
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '600',
                        width: '100%'
                      }}>
                        <span>{parameterName}</span>
                        <span>{post.parameterCounts?.[parameterName] ?? 0}</span>
                      </div>
                    ))}
                  </>
                ) : isGroupChat ? (
                  groupChatGenreStats.map((genre, i) => (
                    <div key={`${genre.name}-${i}`} className="postcard-mobile-genre-chip">
                      <span className="postcard-mobile-genre-tag" style={{ backgroundColor: genre.color }}>
                        {genre.name}
                      </span>
                      <span className="postcard-mobile-genre-pct">
                        {genre.change}
                      </span>
                    </div>
                  ))
                ) : (
                  genres.slice(0, 3).map((genre, i) => (
                    <div key={i} className="postcard-mobile-genre-chip">
                      <span className="postcard-mobile-genre-tag" style={{ backgroundColor: genre.color }}>
                        {genre.name}
                      </span>
                      <span className="postcard-mobile-genre-pct">
                        +{(genre.percentage * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Stats row - full width */}
            <div className="postcard-mobile-stats-row">
              <button 
                className="postcard-mobile-stat-btn"
                style={{ color: isLiked ? '#f91880' : '#9ca3af' }}
                onClick={handleLike}
              >
                <Heart size={20} fill={isLiked ? '#f91880' : 'none'} />
                <span>{isLiked ? formatCompactNumber(likesCount + 1) : formatCompactNumber(likesCount)}</span>
              </button>
              
              <button 
                className="postcard-mobile-stat-btn"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle size={20} />
                <span>{formatCompactNumber(commentsCount)}</span>
              </button>
              
              <button 
                className="postcard-mobile-stat-btn"
                onClick={(e) => e.stopPropagation()}
              >
                <Share2 size={20} />
              </button>
              
              <button 
                className="postcard-mobile-stat-btn"
                style={{ color: isBookmarked ? '#fbbf24' : '#9ca3af' }}
                onClick={handleBookmark}
              >
                <Bookmark size={20} fill={isBookmarked ? '#fbbf24' : 'none'} />
                <span>{isBookmarked ? formatCompactNumber(bookmarksCount + 1) : formatCompactNumber(bookmarksCount)}</span>
              </button>
            </div>
          </div>
        ) : (
          // ── DESKTOP / TABLET: Original grid layout with right column ──
          // Regular post layout with right column
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) clamp(104px, 30vw, 160px)',
            columnGap: 'clamp(8px, 2.4vw, 16px)',
            rowGap: '10px',
            alignItems: 'start',
          }}> 
            <div style={{
              minWidth: 0,
            }}>
              <div style={{
                fontSize: 'clamp(16px, 4.6vw, 19px)',
                lineHeight: '1.4',
                color: 'white',
                marginBottom: 'clamp(14px, 3vw, 20px)',
                fontWeight: '600',
                letterSpacing: '0.01em'
              }}>
                {post.title || post.selftext}
              </div>

              {post.imageUrl && (
                <div style={{
                  marginTop: '12px',
                  marginBottom: '16px',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={post.imageUrl} 
                    alt="Post" 
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: 'auto',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}

              <div style={{
                display: 'flex',
                paddingTop: '0',
                width: '100%',
                marginBottom: '16px',
                padding: '8px 0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  width: '100%', 
                  justifyContent: 'space-between',
                  paddingRight: '4px',
                  flexWrap: 'wrap',
                  rowGap: '6px',
                }}>
                  <button 
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      color: isLiked ? '#f91880' : '#ffffff'
                    }}
                    onClick={handleLike}
                  >
                    <Heart size={22} fill={isLiked ? '#f91880' : 'none'} />
                    <span style={{ marginLeft: '6px', fontSize: 'clamp(13px, 3.6vw, 15px)', fontWeight: '500', color: 'white' }}>
                      {isLiked ? formatCompactNumber(likesCount + 1) : formatCompactNumber(likesCount)}
                    </span>
                  </button>
                  
                  <button style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#ffffff'
                  }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageCircle size={22} />
                    <span style={{ marginLeft: '6px', fontSize: 'clamp(13px, 3.6vw, 15px)', fontWeight: '500', color: 'white' }}>
                      {formatCompactNumber(commentsCount)}
                    </span>
                  </button>
                  
                  <button style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#8899a6'
                  }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Share2 size={22} />
                  </button>
                  
                  <button style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    color: isBookmarked ? '#fbbf24' : '#ffffff'
                  }}
                    onClick={handleBookmark}
                  >
                    <Bookmark size={22} fill={isBookmarked ? '#fbbf24' : 'none'} />
                    <span style={{ marginLeft: '6px', fontSize: 'clamp(13px, 3.6vw, 15px)', fontWeight: '500', color: 'white' }}>
                      {isBookmarked ? formatCompactNumber(bookmarksCount + 1) : formatCompactNumber(bookmarksCount)}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right side stats column */}
            <div style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingLeft: '4px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              minWidth: 0,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                backgroundColor: 'rgba(15, 24, 35, 0.7)',
                borderRadius: '8px',
                marginBottom: '6px',
                marginTop: '4px',
                position: 'relative'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'white',
                  fontSize: 'clamp(12px, 3.2vw, 14px)'
                }}>
                  <Volume2 size={13} color="white" />
                  <span>Vol</span>
                </div>
                <div style={{
                  color: '#10b981',
                  fontWeight: '700',
                  fontSize: 'clamp(12px, 3.6vw, 15px)'
                }}>
                  +{isGroupChat ? groupChatVolumePoints : sideVolume}
                </div>
                {/* INFO ICON 2: Post genres info - Only show for example post */}
                {post.id === 'example_post_001' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-2px', 
                    right: '-12px'
                  }}
                    onClick={(e) => e.stopPropagation()} // Prevent post click when clicking icon
                  >
                    <InfoIconModal
                      title="Post Genres"
                      modalId={`genres-info-${post.id}`}
                      iconSize={16}
                      showButtonText={false}
                      steps={[
                        {
                          icon: <Music size={18} color="#a9b6fc" />,
                          title: "Joining and Engaging",
                          content: "Joining and engaging in different threads will give you volume and genre points."
                        },
                        {
                          icon: <Volume2 size={18} color="#a9b6fc" />,
                          title: "Higher Volume Benefits",
                          content: "The higher your volume, the more engagement your posts might get and users earn more from engaging in your posts."
                        },
                        {
                          icon: <Users size={18} color="#a9b6fc" />,
                          title: "Community Recognition",
                          content: "Having a lot of genre stats and a high volume will show the community that you have great music taste and might be worth following."
                        },
                        {
                          icon: <Mic size={18} color="#a9b6fc" />,
                          title: "Promote Artists",
                          content: "Your song recommendations will be prioritized and you can promote your favorite underrated artists."
                        }
                      ]}
                    />
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {post.postType === 'parameter' ? (
                  <>
                    {/* Regular genres first */}
                    {genres.slice(0, 3).map((genre, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2px',
                        width: '100%'
                      }}>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: genre.color,
                          color: 'white',
                          fontWeight: '600',
                          fontSize: 'clamp(11px, 3.2vw, 13px)',
                          display: 'inline-block',
                          textAlign: 'center',
                          maxWidth: '68%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {genre.name}
                        </div>
                        <div style={{
                          color: '#10b981',
                          fontWeight: '700',
                          fontSize: 'clamp(11px, 3.2vw, 13px)',
                          whiteSpace: 'nowrap'
                        }}>
                          +{(genre.percentage * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                    
                    {/* Parameter counts below genres */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginTop: '8px'
                    }}>
                      {(Array.isArray(post.parameters) ? post.parameters : []).map((parameterName, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          backgroundColor: ['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 4],
                          color: 'white',
                          fontSize: 'clamp(12px, 3.6vw, 15px)',
                          fontWeight: '600'
                        }}>
                          <span>{parameterName}</span>
                          <span>{post.parameterCounts?.[parameterName] ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : isGroupChat ? (
                  groupChatGenreStats.map((genre, i) => (
                    <div key={`${genre.name}-${i}`} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '2px',
                      width: '100%'
                    }}>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: genre.color,
                        color: 'white',
                        fontWeight: '600',
                        fontSize: 'clamp(11px, 3.2vw, 13px)',
                        display: 'inline-block',
                        textAlign: 'center',
                        maxWidth: '68%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {genre.name}
                      </div>
                      <div style={{
                        color: '#10b981',
                        fontWeight: '700',
                        fontSize: 'clamp(11px, 3.2vw, 13px)',
                        whiteSpace: 'nowrap'
                      }}>
                        {genre.change}
                      </div>
                    </div>
                  ))
                ) : (
                  // Regular thread - show genres only
                  genres.slice(0, 3).map((genre, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '2px',
                      width: '100%'
                    }}>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: genre.color,
                        color: 'white',
                        fontWeight: '600',
                        fontSize: 'clamp(11px, 3.2vw, 13px)',
                        display: 'inline-block',
                        textAlign: 'center',
                        maxWidth: '68%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {genre.name}
                      </div>
                      <div style={{
                        color: '#10b981',
                        fontWeight: '700',
                        fontSize: 'clamp(11px, 3.2vw, 13px)',
                        whiteSpace: 'nowrap'
                      }}>
                        +{(genre.percentage * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Expand arrow — thread only ── */}
      {post.postType === 'thread' && (
        <>
          <div
            style={{
              width: '100%',
              borderTop: `1px solid ${expandOpen ? 'rgba(29,155,240,0.3)' : 'rgba(255,255,255,0.07)'}`,
              position: 'relative',
            }}
          >
            <button
              onClick={e => {
                e.stopPropagation();
                setExpandOpen(o => {
                  if (o) { setSelectedArtists(new Set()); setExpandedResponse(null); }
                  return !o;
                });
              }}
              style={{
                width: '100%',
                padding: '7px 0',
                background: expandOpen ? 'rgba(29,155,240,0.1)' : 'rgba(255,255,255,0.02)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: expandOpen ? '#1d9bf0' : '#475569',
                transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,155,240,0.12)'; e.currentTarget.style.color = '#1d9bf0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = expandOpen ? 'rgba(29,155,240,0.1)' : 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = expandOpen ? '#1d9bf0' : '#475569'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ transform: expandOpen ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }}>
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>

            {isExamplePost && (
              <div
                style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <InfoIconModal
                  title="Expanded Thread"
                  modalId={`example-expand-info-${post.id}`}
                  iconSize={14}
                  showButtonText={false}
                  steps={[
                    {
                      icon: <Info size={18} color="#a9b6fc" />,
                      title: "Expanded Thread",
                      content: "Reveals the top 3 songs recommended in this thread as well as a list of the top artist, recommended artists from the algorithm and artists you follow that show up in this thread, recommended by other users.\n\nSo you can make your own mini playlist as you scroll.",
                    },
                  ]}
                />
              </div>
            )}
          </div>

          {expandOpen && (
            <div
              style={{ padding: isMobile ? (isCompactPhone ? '14px 10px' : '16px 12px') : '18px 16px', borderTop: '1px solid rgba(29,155,240,0.2)', background: 'rgba(10,16,26,0.88)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Artist pool */}
              <_ArtistPool
                onToggle={name => {
                  setSelectedArtists(prev => {
                    const next = new Set(prev);
                    if (next.has(name)) next.delete(name); else next.add(name);
                    return next;
                  });
                  setExpandedResponse(null);
                }}
                selected={selectedArtists}
                artistImages={expandArtistImages || EMPTY_OBJECT}
                sections={expandArtistSections}
                isMobile={isMobile}
              />

              {/* Selected artist chips row */}
              {selectedArtists.size > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 5 : 6, marginBottom: isMobile ? 12 : 14 }}>
                  {[...selectedArtists].map((name, i) => {
                    const h = _ahue(name);
                    return (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: isMobile ? '4px 8px 4px 7px' : '4px 10px 4px 8px', borderRadius: 20, background: `hsl(${h},38%,16%)`, border: `1px solid hsl(${h},52%,40%)`, fontSize: isMobile ? 11 : 12, color: `hsl(${h},75%,80%)`, fontWeight: 600, animation: `_expandChipIn .25s cubic-bezier(.4,0,.2,1) ${i * 0.04}s both` }}>
                        <span>{_displayExpandArtistName(name).split(',')[0]}</span>
                        <button onClick={() => setSelectedArtists(prev => { const n = new Set(prev); n.delete(name); return n; })}
                          style={{ background: 'none', border: 'none', color: `hsl(${h},60%,60%)`, cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0, marginTop: -1 }}>×</button>
                      </div>
                    );
                  })}
                  <button onClick={() => { setSelectedArtists(new Set()); setExpandedResponse(null); }}
                    style={{ padding: isMobile ? '4px 9px' : '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, color: '#475569', cursor: 'pointer', transition: 'all .2s' }}>
                    clear all
                  </button>
                </div>
              )}

              {/* Playlist section — animated drawer */}
              {(() => {
                // Build a stable transition key that changes when song list content changes
                const songListKey = selectedArtists.size > 0
                  ? 'playlist-' + [...selectedArtists].sort().join(',')
                  : 'default';
                const songLayoutKey = `${songListKey}|expanded:${expandedResponse ?? 'none'}`;

                if (selectedArtists.size > 0) {
                  const playlist = [];
                  [...selectedArtists].forEach(artistName => {
                    const songs = _songsForArtistFromPool(artistName, expandSongPool);
                    songs.forEach((s, si) => {
                      const template = expandSongResponses[(_hsh(artistName) + si) % expandSongResponses.length];
                      playlist.push({ key: `${artistName}-${si}`, artistName, songName: s.song, trackKey: _trackKey(s.song, artistName), albumColor: s.albumColor, accent: s.accent, avgRating: s.avgRating, totalRatings: s.totalRatings, template });
                    });
                  });
                  return (
                    <AnimatedSongList transitionKey={songLayoutKey}>
                      <div>
                        <div style={{ fontSize: isMobile ? 9 : 10, color: '#475569', letterSpacing: isMobile ? 1.4 : 2, marginBottom: 10 }}>
                          PLAYLIST · {playlist.length} SONG{playlist.length !== 1 ? 'S' : ''}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {playlist.map((item, idx) => (
                            <AnimatedSongEntry key={item.key} index={idx} transitionKey={songListKey}>
                              <div>
                                <SongCard
                                  data={{ ...item.template, albumColor: item.albumColor, accent: item.accent, avgRating: item.avgRating, totalRatings: item.totalRatings }}
                                  songName={item.songName}
                                  artistName={item.artistName}
                                  albumArtUrl={expandAlbumArtworks[item.trackKey]?.artworkUrl || null}
                                  onExpand={() => setExpandedResponse(p => p === item.key ? null : item.key)}
                                  onUserClick={handleUserClick}
                                  expanded={expandedResponse === item.key}
                                  isMobile={isMobile}
                                />
                                {expandedResponse === item.key && (
                                  <SubCommentView
                                    song={{ song: item.songName, artist: item.artistName }}
                                    onUserClick={handleUserClick}
                                    onClose={() => setExpandedResponse(null)}
                                    isMobile={isMobile}
                                  />
                                )}
                              </div>
                            </AnimatedSongEntry>
                          ))}
                        </div>
                      </div>
                    </AnimatedSongList>
                  );
                }

                return (
                  <AnimatedSongList transitionKey={songLayoutKey}>
                    <div>
                      <div style={{ fontSize: isMobile ? 9 : 10, color: '#475569', letterSpacing: isMobile ? 1.4 : 2, marginBottom: 10 }}>
                        TOP RESPONSES WITH SONGS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {expandSongResponses.map((r, idx) => (
                          <AnimatedSongEntry key={r.id} index={idx} transitionKey={songListKey}>
                            <div>
                              <SongCard
                                data={r}
                                albumArtUrl={expandAlbumArtworks[_trackKey(r.song, r.artist)]?.artworkUrl || null}
                                onExpand={() => setExpandedResponse(p => p === r.id ? null : r.id)}
                                onUserClick={handleUserClick}
                                expanded={expandedResponse === r.id}
                                isMobile={isMobile}
                              />
                              {expandedResponse === r.id && (
                                <SubCommentView song={r} onUserClick={handleUserClick} onClose={() => setExpandedResponse(null)} isMobile={isMobile} />
                              )}
                            </div>
                          </AnimatedSongEntry>
                        ))}
                      </div>
                    </div>
                  </AnimatedSongList>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostCard;
