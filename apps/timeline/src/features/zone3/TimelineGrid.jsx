import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { USERS } from "../../backend/timelineMockData";
import UsersHeader from "./UsersHeader";
import GridBody from "./GridBody";
import { TrophyIcon, VolumeIcon } from "../Icons";
import InfoIconModal from "../InfoIconModal";
import { UserHoverTarget } from "../UserHoverCard";
import { getAvatarSrcFromNumber } from "../avatarAssets";

const ACTIVE_GENRES = ["Hip-Hop", "Pop", "R&B"];
const DISABLED_GENRES = ["Rock"];
const GENRES = [...ACTIVE_GENRES, ...DISABLED_GENRES];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const ZONE3_INFO_ICON_SIZE = 22;
const ZONE3_TIMELINE_INFO_STEPS = [
  {
    title: "Month, Year, Decade",
    content: "Use these buttons to switch views between top albums of the month, year and decade.",
  },
  {
    title: "Me Tab",
    content:
      "The Me tab reveals the albums that we've rated, and our highest rated album in a particular month, takes that month slot. Rating more albums will grant you a higher ranking so the other users in the Me tab are close to you in ranking because they've rated about the same number of albums as you.",
  },
  {
    title: "Most Rated",
    content:
      "The most rated tab reveals users at the top of the rankings who have rated the most albums, having at least one album of the month for many years.",
  },
  {
    title: "Genre Tab",
    content:
      "The genre tab reveals users of different genre communites and their top albums of the month. How do we tell which users are in which genre communities?\n\n" +
      "As users discover, listen and like song previews througout the app, they will accumulate points based on the genre tags that come with the songs. That way we know if a user listens to more rock or rap music because they interact more with that genre. There will be more genres in the final app.",
  },
  {
    title: "Trophy",
    content:
      "Click to reveal the top albums for each month, year or decade, overall rated by users on this app.\n\n" +
      "Also reveals a ranking at the top right of each album showing how far those albums are from the number 1 spot.",
  },
  {
    title: "Add Friends",
    content: "Add friends to compare albums in different time ranges.",
  },
  {
    title: "Why add this?",
    content:
      "The average user probably wouldn't care about rating a bunch of albums just to fill this calendar or for a higher ranking.\n\n" +
      "We plan for the user to passively add to the calendar as they are listening to music while rating and comparing albums.\n\nThat is the objective for the Zone 1 Top albums tab, giving users something to work on, complete and be proud of.",
  },
];
const AVAILABLE_FRIENDS = [
  { id: "you", name: "Me", avatar: "M", color: "#E8A87C", isYouFriend: true },
  { id: "friend_alex", name: "Alex", avatar: "A", color: "#85C1E9" },
  { id: "friend_jordan", name: "Jordan", avatar: "J", color: "#C9B1FF" },
  { id: "friend_sam", name: "Sam", avatar: "S", color: "#7DD3C0" },
  { id: "friend_riley", name: "Riley", avatar: "R", color: "#F1948A" },
];
const MONTH_START_YEAR = 2025;
const MONTH_END_YEAR = 2022;
const YEAR_VIEW_END_YEAR = 1980;
const RAW_END_YEAR = 1920;
const YOU_TARGET_RANK = 3532;
const YOU_VIEW_COUNT = 25;
const GENRE_RANK_BASE = 2001;
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function hashStringToInt(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a) { return function () { let t = (a += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function rand01(seed) { const n = typeof seed === "number" ? seed : hashStringToInt(String(seed)); return mulberry32(n)(); }
function getUserAvatarSrc(userId) {
  let imageNumber = null;
  if (typeof userId === "number" && Number.isFinite(userId)) {
    imageNumber = Math.trunc(Math.abs(userId));
  } else {
    const idText = String(userId ?? "");
    const directNumberMatch = idText.match(/^(\d+)$/);
    const generatedUserMatch = idText.match(/^u_(\d+)$/);
    imageNumber = Number(directNumberMatch?.[1] ?? generatedUserMatch?.[1] ?? 0);
  }

  if (!imageNumber || imageNumber < 1) {
    imageNumber = (hashStringToInt(String(userId ?? "")) % 999) + 1;
  }

  return getAvatarSrcFromNumber(imageNumber);
}
function withDisplayRankName(user) {
  if (!user || typeof user.__rank !== "number") return user;
  if (user.isTopAlbums || user.isYou || user.isPinnedFriend) return user;
  if (/^User \d+$/.test(String(user.name ?? ""))) {
    return { ...user, name: "User" };
  }
  return user;
}
function getDisplayVolume(user, zone3Filter, showVolume, zone3VolumeMin) {
  const baseVolume = user?.__stats?.volume ?? 0;
  if (!user || user.isTopAlbums) return baseVolume;
  if (zone3Filter === "you") {
    return 700 + Math.round(rand01(`zone3-you-volume-${user.id}`) * 650);
  }
  if (showVolume) {
    const offset = Math.round((rand01(`zone3-volume-filter-${user.id}-${zone3VolumeMin}`) - 0.5) * 320);
    return clamp(zone3VolumeMin + offset, 0, 3200);
  }
  if (zone3Filter === "mostRated") {
    return Math.min(3200, 2400 + Math.round(rand01(`zone3-most-rated-volume-${user.id}`) * 800));
  }
  return baseVolume;
}
function withViewPresentation(user, zone3Filter, showVolume, zone3VolumeMin) {
  if (!user) return user;
  const namedUser = withDisplayRankName(user);
  return { ...namedUser, __displayVolume: getDisplayVolume(namedUser, zone3Filter, showVolume, zone3VolumeMin) };
}
function getVolumeRankBase(zone3VolumeMin) {
  return Math.round(((3200 - zone3VolumeMin) / 3200) * 5000) + 1;
}
function compareByVolumeDistance(a, b, zone3VolumeMin) {
  return Math.abs((a.__stats?.volume ?? 0) - zone3VolumeMin) - Math.abs((b.__stats?.volume ?? 0) - zone3VolumeMin);
}
function buildRankMap(decoratedUsers, zone3Filter, zone3Genre, zone3VolumeMin, showVolume, youUser) {
  const rankMap = new Map();
  const rankableUsers = decoratedUsers.filter((u) => !u.isTopAlbums);

  if (zone3Filter === "you") {
    const you = youUser || rankableUsers[0];
    const sorted = [...rankableUsers].sort((a, b) => b.__stats.albumsRatedCount - a.__stats.albumsRatedCount);
    let youIndex = sorted.findIndex((u) => u.isYou);
    if (youIndex === -1 && you) {
      youIndex = Math.min(sorted.length, 12);
      sorted.splice(youIndex, 0, you);
    }
    const before = [];
    const after = [];
    for (let i = 1; i <= 30; i++) {
      if (before.length < 12 && youIndex - i >= 0) before.unshift(sorted[youIndex - i]);
      if (after.length < 12 && youIndex + i < sorted.length) after.push(sorted[youIndex + i]);
      if (before.length >= 12 && after.length >= 12) break;
    }
    const selected = [...before.slice(-12), you, ...after.slice(0, 12)];
    for (const u of sorted) {
      if (selected.length >= YOU_VIEW_COUNT) break;
      if (!selected.includes(u)) selected.push(u);
    }
    const rankStart = YOU_TARGET_RANK - Math.floor(YOU_VIEW_COUNT / 2);
    selected.slice(0, YOU_VIEW_COUNT).forEach((u, idx) => {
      if (u) rankMap.set(String(u.id), rankStart + idx);
    });
    return rankMap;
  }

  if (zone3Filter === "mostRated") {
    if (showVolume) {
      const rankBase = getVolumeRankBase(zone3VolumeMin);
      [...rankableUsers]
        .sort((a, b) => compareByVolumeDistance(a, b, zone3VolumeMin))
        .forEach((u, i) => {
          rankMap.set(String(u.id), rankBase + i);
        });
      return rankMap;
    }
    [...rankableUsers]
      .sort((a, b) => b.__stats.albumsRatedCount - a.__stats.albumsRatedCount)
      .forEach((u, i) => {
        rankMap.set(String(u.id), i + 1);
      });
    return rankMap;
  }

  if (zone3Filter === "genre") {
    [...rankableUsers]
      .sort((a, b) => (b.__stats.genrePoints?.[zone3Genre] ?? 0) - (a.__stats.genrePoints?.[zone3Genre] ?? 0))
      .forEach((u, i) => {
        rankMap.set(String(u.id), GENRE_RANK_BASE + i);
      });
    return rankMap;
  }

  [...rankableUsers]
    .sort((a, b) => b.__stats.albumsRatedCount - a.__stats.albumsRatedCount)
    .forEach((u, i) => {
      rankMap.set(String(u.id), i + 1);
    });
  return rankMap;
}

function buildMonthsDescending(startYear, endYear) {
  const out = []; let idx = 0;
  for (let y = startYear; y >= endYear; y--) for (let m = 11; m >= 0; m--) {
    out.push({ key: `${y}-${m}`, year: y, month: MONTH_NAMES[m], monthIndex: idx, calendarMonth: m + 1, bucketIndices: [idx] }); idx++;
  }
  return out;
}

function buildBuckets(rawMonths, timeScale) {
  if (timeScale === "months") return rawMonths;
  if (timeScale === "years") {
    const m = new Map();
    for (const mo of rawMonths) { if (!m.has(mo.year)) m.set(mo.year, { key: `${mo.year}`, year: mo.year, month: "Year", bucketIndices: [] }); m.get(mo.year).bucketIndices.push(mo.monthIndex); }
    return Array.from(m.values());
  }
  if (timeScale === "halfDecades") {
    const m = new Map();
    for (const mo of rawMonths) {
      const decadeStart = Math.floor(mo.year / 10) * 10;
      if (decadeStart < 1920) continue;
      const key = `${decadeStart}s`;
      if (!m.has(key)) m.set(key, {
        key,
        year: decadeStart,
        month: "Decade",
        bucketIndices: [],
        decadeLabel: `${decadeStart}`,
      });
      m.get(key).bucketIndices.push(mo.monthIndex);
    }
    return Array.from(m.values());
  }
  const m = new Map();
  for (const mo of rawMonths) { const d = Math.floor(mo.year / 10) * 10; if (!m.has(d)) m.set(d, { key: `${d}s`, year: d, month: "Decade", bucketIndices: [], decadeLabel: `${d}s` }); m.get(d).bucketIndices.push(mo.monthIndex); }
  return Array.from(m.values());
}

function getDataUrl(fileName) {
  return `${import.meta.env.BASE_URL}data/${fileName}`;
}

async function loadZone3CalendarPayload() {
  const response = await fetch(getDataUrl("zone3_calendar_v4.json"), { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load zone3_calendar_v4.json: ${response.status}`);
  }
  const data = await response.json();
  return data?.data || {};
}

function getLocalZone3Calendar(payload, genres) {
  const requestedGenres = Array.isArray(genres) ? genres : [];
  return Object.fromEntries(
    requestedGenres
      .filter((genre) => payload?.[genre])
      .map((genre) => [genre, payload[genre]])
  );
}

function ensureLotsOfUsers(baseUsers, minCount = 500) {
  const existing = Array.isArray(baseUsers) ? baseUsers : [];
  const ids = new Set(existing.map((u) => String(u.id)));
  const out = existing.map((u) => ({ ...u }));
  let i = 1;
  while (out.length < minCount) { const id = `u_${i}`; if (!ids.has(id)) { ids.add(id); out.push({ id, name: `User ${i}` }); } i++; }
  return out;
}

function decorateUsers(users, selectedGenre, pinnedFriendData, shuffleSeed) {
  const decorated = users.map((u) => {
    const seed = hashStringToInt(String(u.id)) + shuffleSeed * 7919;
    const volume = typeof u.volume === "number" ? u.volume : Math.floor(rand01(seed + 1) * 3201);
    const albumsRatedCount = typeof u.albumsRatedCount === "number" ? u.albumsRatedCount : Math.floor(Math.pow(rand01(seed + 2), 0.35) * 650);
    const genrePoints = u.genrePoints && typeof u.genrePoints === "object" ? u.genrePoints
      : GENRES.reduce((acc, g, gi) => { acc[g] = Math.floor(Math.pow(rand01(seed + 30 + gi), 0.55) * 1000); return acc; }, {});
    const friendData = pinnedFriendData.get(String(u.id));
    return {
      ...u,
      name: u.isYou ? "Me" : u.name,
      __stats: { volume, albumsRatedCount, genrePoints },
      __avatarSrc: u.isYou ? getAvatarSrcFromNumber(182) : getUserAvatarSrc(u.id),
      __pinColor: friendData?.color || (u.isYou ? "#E8A87C" : null),
      __pinAvatar: friendData?.avatar || null,
    };
  });
  const maxVol = Math.max(1, ...decorated.map((u) => u.__stats.volume));
  const maxRated = Math.max(1, ...decorated.map((u) => u.__stats.albumsRatedCount));
  const maxGenre = Math.max(1, ...decorated.map((u) => (u.__stats.genrePoints?.[selectedGenre] ?? 0)));
  return decorated.map((u) => ({ ...u, __norm: { volume01: u.__stats.volume / maxVol, rated01: u.__stats.albumsRatedCount / maxRated, genre01: (u.__stats.genrePoints?.[selectedGenre] ?? 0) / maxGenre } }));
}

function InlineVolumeSlider({ value, onChange, onCommit }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const pct = (value / 3200) * 100;
  const calcVal = useCallback((clientX) => { const el = trackRef.current; if (!el) return value; const rect = el.getBoundingClientRect(); return Math.round(clamp((clientX - rect.left) / rect.width, 0, 1) * 3200); }, [value]);
  const onDown = useCallback((e) => { e.preventDefault(); e.stopPropagation(); dragging.current = true; trackRef.current?.setPointerCapture(e.pointerId); onChange(calcVal(e.clientX)); }, [calcVal, onChange]);
  const onMove = useCallback((e) => { if (!dragging.current) return; e.preventDefault(); onChange(calcVal(e.clientX)); }, [calcVal, onChange]);
  const onUp = useCallback((e) => { if (!dragging.current) return; dragging.current = false; trackRef.current?.releasePointerCapture(e.pointerId); onCommit(calcVal(e.clientX)); }, [calcVal, onCommit]);
  return (
    <div className="toolbar-volume-inline">
      <span className="toolbar-volume-label">Vol</span>
      <div ref={trackRef} className="toolbar-volume-track" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ touchAction: "none" }}>
        <div className="toolbar-volume-fill" style={{ width: `${pct}%` }} />
        <div className="toolbar-volume-handle" style={{ left: `${pct}%` }} />
      </div>
      <span className="toolbar-volume-value">{value}</span>
    </div>
  );
}

export default function TimelineGrid({ onReady }) {
  const [timeScale, setTimeScale] = useState("months");
  const [zone3Filter, setZone3Filter] = useState("you"); // mostRated | genre | you
  const [zone3VolumeMin, setZone3VolumeMin] = useState(1600);
  const [zone3Genre, setZone3Genre] = useState("Hip-Hop");
  const [zone3Calendar, setZone3Calendar] = useState({});
  const [showTopAlbums, setShowTopAlbums] = useState(false);
  const [showYou, setShowYou] = useState(true);
  const [youPinnedManually, setYouPinnedManually] = useState(false);
  const [pinnedFriends, setPinnedFriends] = useState([]);
  const [showVolume, setShowVolume] = useState(false);
  const [volumeDraft, setVolumeDraft] = useState(1600);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const volumeCommitTimeoutRef = useRef(null);
  const rawMonths = useMemo(() => buildMonthsDescending(MONTH_START_YEAR, RAW_END_YEAR), []);

  const clearPendingVolumeCommit = useCallback(() => {
    if (volumeCommitTimeoutRef.current !== null) {
      window.clearTimeout(volumeCommitTimeoutRef.current);
      volumeCommitTimeoutRef.current = null;
    }
  }, []);

  const monthBuckets = useMemo(() => {
    const f = timeScale === "months" ? rawMonths.filter((m) => m.year >= MONTH_END_YEAR) : timeScale === "years" ? rawMonths.filter((m) => m.year >= YEAR_VIEW_END_YEAR) : rawMonths;
    return buildBuckets(f, timeScale);
  }, [rawMonths, timeScale]);

  const allUsers = useMemo(() => ensureLotsOfUsers([...USERS, ...pinnedFriends], 500), [pinnedFriends]);
  const pinnedFriendData = useMemo(() => { const m = new Map(); for (const f of pinnedFriends) m.set(String(f.id), { color: f.color, avatar: f.avatar }); return m; }, [pinnedFriends]);
  const decoratedUsers = useMemo(() => decorateUsers(allUsers, zone3Genre, pinnedFriendData, shuffleSeed), [allUsers, zone3Genre, pinnedFriendData, shuffleSeed]);
  const topAlbumsUser = decoratedUsers.find((u) => u.isTopAlbums);
  const youUser = decoratedUsers.find((u) => u.isYou) || decoratedUsers[0];
  const youAvatarSrc = youUser?.__avatarSrc ?? getAvatarSrcFromNumber(182);
  const rankMap = useMemo(
    () => buildRankMap(decoratedUsers, zone3Filter, zone3Genre, zone3VolumeMin, showVolume, youUser),
    [decoratedUsers, zone3Filter, zone3Genre, zone3VolumeMin, showVolume, youUser]
  );

  const pinnedUsers = useMemo(() => {
    const map = new Map(decoratedUsers.map((u) => [String(u.id), u]));
    const list = [];
    if (showTopAlbums && topAlbumsUser) { const t = map.get(String(topAlbumsUser.id)); if (t) list.push(t); }
    if (showYou && youUser) { const y = map.get(String(youUser.id)); if (y) list.push(y); }
    for (const f of pinnedFriends) { const u = map.get(String(f.id)); if (u) list.push({ ...u, isPinnedFriend: true }); }
    const seen = new Set();
    return list
      .filter((u) => { const uid = String(u?.id); if (!uid || seen.has(uid)) return false; seen.add(uid); return true; })
      .map((u) => {
        const userRank = rankMap.get(String(u.id));
        return typeof userRank === "number" ? { ...u, __rank: userRank } : u;
      });
  }, [decoratedUsers, pinnedFriends, rankMap, showTopAlbums, topAlbumsUser, youUser, showYou]);

  const pinnedIds = useMemo(() => pinnedUsers.map((u) => String(u.id)), [pinnedUsers]);
  const removableIds = useMemo(() => {
    const ids = new Set(pinnedFriends.map((f) => String(f.id)));
    if (showTopAlbums && topAlbumsUser) ids.add(String(topAlbumsUser.id));
    if (showYou && youUser) ids.add(String(youUser.id));
    const list = Array.from(ids);
    return zone3Filter === "you" ? list.filter((id) => id !== String(youUser?.id)) : list;
  }, [pinnedFriends, showTopAlbums, topAlbumsUser, showYou, youUser, zone3Filter]);

  const rankedUsers = useMemo(() => {
    let others = decoratedUsers.filter((u) => !u.isTopAlbums && !pinnedIds.includes(String(u.id)));
    if (showVolume) {
      const byDistance = [...others].sort((a, b) => compareByVolumeDistance(a, b, zone3VolumeMin));
      others = byDistance.slice(0, Math.min(byDistance.length, 90));
    }
    return others
      .map((u) => {
        const userRank = rankMap.get(String(u.id));
        return typeof userRank === "number" ? { ...u, __rank: userRank } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.__rank - b.__rank);
  }, [decoratedUsers, pinnedIds, rankMap, zone3VolumeMin, showVolume]);

  const displayUsers = useMemo(() => {
    const maxCols = 25; const merged = [];
    for (const u of pinnedUsers) merged.push(u);
    for (const u of rankedUsers) { if (merged.length >= maxCols) break; if (!merged.some((x) => String(x.id) === String(u.id))) merged.push(u); }
    return merged.map((u) => withViewPresentation(u, zone3Filter, showVolume, zone3VolumeMin));
  }, [pinnedUsers, rankedUsers, zone3Filter, showVolume, zone3VolumeMin]);
  const youDisplayIndex = useMemo(() => displayUsers.findIndex((u) => u?.isYou), [displayUsers]);

  const onAddFriend = useCallback((friend) => {
    if (friend.isYouFriend) { setShowYou(true); setYouPinnedManually(true); return; }
    if (pinnedFriends.length >= 3) return;
    if (pinnedFriends.find((f) => f.id === friend.id)) return;
    setPinnedFriends((prev) => [...prev, friend]);
  }, [pinnedFriends]);
  const onRemoveFriend = useCallback((friendId) => { setPinnedFriends((prev) => prev.filter((f) => f.id !== friendId)); }, []);
  const addableFriends = useMemo(
    () => AVAILABLE_FRIENDS
      .filter((friend) => {
        if (friend.isYouFriend) return !showYou;
        if (pinnedFriends.length >= 3) return false;
        return !pinnedFriends.find((pinnedFriend) => pinnedFriend.id === friend.id);
      })
      .map((friend) => ({
        ...friend,
        __avatarSrc: friend.isYouFriend ? youAvatarSrc : getUserAvatarSrc(friend.id),
      })),
    [pinnedFriends, showYou, youAvatarSrc]
  );
  const onRemoveUser = useCallback((userId) => {
    if (String(userId) === String(topAlbumsUser?.id)) { setShowTopAlbums(false); return; }
    if (String(userId) === String(youUser?.id)) { setShowYou(false); setYouPinnedManually(false); return; }
    setPinnedFriends((prev) => prev.filter((f) => String(f.id) !== String(userId)));
  }, [topAlbumsUser, youUser]);
  const onBodyScroll = useCallback(() => { if (headerScrollRef.current && bodyScrollRef.current) headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft; }, []);

  const gridConfig = useMemo(
    () => ({ timeScale, zone3Filter, zone3VolumeMin, zone3Genre, zone3Calendar, shuffleSeed, showVolume, showTopAlbums }),
    [timeScale, zone3Filter, zone3VolumeMin, zone3Genre, zone3Calendar, shuffleSeed, showVolume, showTopAlbums]
  );

  const commitVolume = useCallback((val) => {
    const v = Math.round(val);
    clearPendingVolumeCommit();
    setVolumeDraft(v);
    setIsReloading(true);
    volumeCommitTimeoutRef.current = window.setTimeout(() => {
      setZone3VolumeMin(v);
      setShuffleSeed((p) => p + 1);
      setIsReloading(false);
      volumeCommitTimeoutRef.current = null;
    }, 600);
  }, [clearPendingVolumeCommit]);

  const handleFilterClick = useCallback((filterId) => {
    const shouldToggleBackToYou = filterId === zone3Filter && (filterId === "mostRated" || filterId === "genre");
    const nextFilter = shouldToggleBackToYou ? "you" : filterId;
    if (nextFilter === zone3Filter) return;
    clearPendingVolumeCommit();
    setIsReloading(false);
    setPinnedFriends([]);
    setYouPinnedManually(false);
    setShowAddMenu(false);
    setZone3Filter(nextFilter);
    if (nextFilter === "you") {
      setShowVolume(false);
      setShowYou(true);
      return;
    }
    setShowYou(false);
    if (nextFilter === "genre") { setShowVolume(false); }
  }, [clearPendingVolumeCommit, zone3Filter]);

  const handleVolumeToggle = useCallback(() => {
    if (zone3Filter !== "mostRated") return;
    setShowVolume((prev) => {
      if (prev) {
        clearPendingVolumeCommit();
        setIsReloading(false);
      }
      return !prev;
    });
  }, [clearPendingVolumeCommit, zone3Filter]);

  const youColor = "#E8A87C";
  const volumeDisabled = zone3Filter !== "mostRated";
  const isFilterActive = useCallback((filterId) => {
    return zone3Filter === filterId;
  }, [zone3Filter]);

  useEffect(() => {
    const previousScrollRestoration = "scrollRestoration" in window.history ? window.history.scrollRestoration : null;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const resetPagePosition = () => {
      window.scrollTo({ top: 0, left: 0 });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      bodyScrollRef.current?.scrollTo({ left: 0, top: 0 });
      headerScrollRef.current?.scrollTo({ left: 0, top: 0 });
    };
    resetPagePosition();
    const frameId = window.requestAnimationFrame(resetPagePosition);
    return () => {
      window.cancelAnimationFrame(frameId);
      if (previousScrollRestoration !== null) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      clearPendingVolumeCommit();
    };
  }, [clearPendingVolumeCommit]);

  useEffect(() => {
    let isMounted = true;

    loadZone3CalendarPayload()
      .then((payload) => {
        if (!isMounted) return;
        setZone3Calendar(getLocalZone3Calendar(payload, ACTIVE_GENRES));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!isMounted) return;
        setIsInitialLoading(false);
        onReady?.();
      });

    return () => {
      isMounted = false;
    };
  }, [onReady]);

  // Smoothly scroll to You column when in You view; reset when back to Most Rated
  useEffect(() => {
    const bodyEl = bodyScrollRef.current;
    const headerEl = headerScrollRef.current;
    if (!bodyEl || !headerEl) return;
    if (zone3Filter === "you") {
      const colWidth = parseFloat(
        window.getComputedStyle(document.documentElement).getPropertyValue("--user-column-width")
      ) || 140;
      const youColIndex = Math.max(0, youDisplayIndex);
      const target = Math.max(0, youColIndex * colWidth - bodyEl.clientWidth / 2 + colWidth / 2);
      bodyEl.scrollTo({ left: target, behavior: "smooth" });
      headerEl.scrollTo({ left: target, behavior: "smooth" });
    } else if (zone3Filter === "mostRated") {
      bodyEl.scrollTo({ left: 0, behavior: "smooth" });
      headerEl.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [zone3Filter, youDisplayIndex]);

  if (isInitialLoading) {
    return (
      <div className="main-content">
        <div className="zone3-layout">
          <div className="zone3-initial-loading" role="status" aria-label="Loading timeline grid">
            <div className="zone3-loading-circle" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="zone3-layout">
        <div className="zone3-toolbar">
          <div className="toolbar-scale">
            {[{ id: "months", label: "M" }, { id: "years", label: "Y" }, { id: "halfDecades", label: "D" }].map((s) => (
              <button key={s.id} type="button" onClick={() => setTimeScale(s.id)} className={`toolbar-scale-btn ${timeScale === s.id ? "is-active" : ""}`}>{s.label}</button>
            ))}
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-filters">
            {[{ id: "you", label: "Me" }, { id: "mostRated", label: "Most Rated" }, { id: "genre", label: "Genre" }].map((f) => (
              <button key={f.id} type="button" onClick={() => handleFilterClick(f.id)} className={`toolbar-filter-btn ${isFilterActive(f.id) ? "is-active" : ""}`}>{f.label}</button>
            ))}
          </div>
          {zone3Filter === "genre" && (
            <>
              <div className="toolbar-divider" />
              <div className="toolbar-genres">
                {ACTIVE_GENRES.map((g) => (<button key={g} type="button" onClick={() => setZone3Genre(g)} className={`toolbar-genre-chip ${zone3Genre === g ? "is-active" : ""}`}>{g}</button>))}
                {DISABLED_GENRES.map((g) => (<button key={g} type="button" disabled className="toolbar-genre-chip toolbar-genre-chip--disabled">{g}</button>))}
              </div>
            </>
          )}
          <div className="toolbar-divider" />
          <button type="button" className={`toolbar-icon-btn ${showTopAlbums ? "is-active" : ""}`} onClick={() => setShowTopAlbums(!showTopAlbums)} title="Top Albums"><TrophyIcon /></button>
          <button type="button" className={`toolbar-icon-btn ${showVolume ? "is-active" : ""} ${volumeDisabled ? "is-disabled" : ""}`} onClick={handleVolumeToggle} disabled={volumeDisabled} title={volumeDisabled ? "Volume only available in Most Rated" : "Volume filter"}><VolumeIcon /></button>
          <InfoIconModal
            title="Zone 3 Timeline"
            steps={ZONE3_TIMELINE_INFO_STEPS}
            modalId="zone3-timeline-info"
            showButtonText={false}
            iconSize={ZONE3_INFO_ICON_SIZE}
            iconColor="#FFA500"
            buttonClassName="zone-header-info-btn"
            buttonStyle={{ padding: 0 }}
            ariaLabel="Zone 3 timeline information"
          />
          {showVolume && <InlineVolumeSlider value={volumeDraft} onChange={setVolumeDraft} onCommit={commitVolume} />}
          <div className="toolbar-spacer" />
          <div className="toolbar-add-user">
            {showYou && (
              <UserHoverTarget
                user={{ ...youUser, avatar: youAvatarSrc }}
                style={{ display: "inline-block" }}
              >
                <div className="toolbar-avatar" style={{ background: `linear-gradient(135deg, ${youColor}, ${youColor}88)`, boxShadow: `0 0 8px ${youColor}44` }} title="Me">
                  {youAvatarSrc ? <img src={youAvatarSrc} alt="Me" className="toolbar-avatar-img" loading="lazy" referrerPolicy="no-referrer" /> : "M"}
                </div>
              </UserHoverTarget>
            )}
            {pinnedFriends.map((f) => {
              const friendAvatarSrc = getUserAvatarSrc(f.id);
              return (
                <UserHoverTarget
                  key={f.id}
                  user={{ ...f, avatar: friendAvatarSrc, __avatarSrc: friendAvatarSrc, isPinnedFriend: true }}
                  style={{ display: "inline-block" }}
                >
                  <button
                    type="button"
                    className="toolbar-avatar toolbar-avatar--removable"
                    style={{ background: `linear-gradient(135deg, ${f.color}, ${f.color}88)`, boxShadow: `0 0 8px ${f.color}44` }}
                    onClick={() => onRemoveFriend(f.id)}
                    title={`Remove ${f.name}`}
                    aria-label={`Remove ${f.name}`}
                  >
                    {friendAvatarSrc ? <img src={friendAvatarSrc} alt={f.name} className="toolbar-avatar-img" loading="lazy" referrerPolicy="no-referrer" /> : f.avatar}
                  </button>
                </UserHoverTarget>
              );
            })}
            {addableFriends.length > 0 && (
              <div className="toolbar-add-btn-wrap">
                <button type="button" className={`toolbar-add-btn ${showAddMenu ? "is-active" : ""}`} onClick={() => setShowAddMenu(!showAddMenu)}>+</button>
                {showAddMenu && (
                  <div className="toolbar-add-dropdown">
                    {addableFriends.map((f) => (
                      <button key={f.id} type="button" className="toolbar-add-option" onClick={() => { onAddFriend(f); setShowAddMenu(false); }}>
                        <UserHoverTarget
                          user={{ ...f, avatar: f.__avatarSrc || f.avatar }}
                          style={{ display: "inline-block" }}
                        >
                          <div className="toolbar-add-option-avatar" style={{ background: `linear-gradient(135deg, ${f.color}, ${f.color}88)` }}>
                            {f.__avatarSrc ? <img src={f.__avatarSrc} alt={f.name} className="toolbar-add-option-avatar-img" loading="lazy" referrerPolicy="no-referrer" /> : f.avatar}
                          </div>
                        </UserHoverTarget>
                        <span className="toolbar-add-option-name">{f.name}</span>
                      </button>
                    ))}
                    {addableFriends.length === 0 && <span className="toolbar-add-empty">All added</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="zone3-top-bar">
          <div className="zone3-header-corner" />
          <div className="zone3-header-scroll" ref={headerScrollRef}>
            <UsersHeader users={displayUsers} onRemoveUser={onRemoveUser} removableIds={removableIds} />
          </div>
        </div>
        <div className="zone3-scroll-area" ref={bodyScrollRef} onScroll={onBodyScroll}>
          {isReloading && <div className="zone3-loading-overlay"><div className="zone3-loading-bar" /></div>}
          <GridBody months={monthBuckets} users={displayUsers} config={gridConfig} timeScale={timeScale} />
        </div>
      </div>
    </div>
  );
}
