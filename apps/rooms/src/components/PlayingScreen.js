import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlayingBottomDock from "./PlayingBottomDock";
import PlayingTopComponent from "./PlayingTopComponent";
import PlayingSnippetCard from "./PlayingSnippetCard";
import MuflThreadsSidebarLayout from "./MuflThreadsSidebarLayout";
import "./PlayingScreenNew.css";
import { buildApiUrl } from "../utils/api";
import { useEnhancedRoomFeed } from "../hooks/useEnhancedRoomFeed";
import { generateSimplifiedRooms } from "../utils/simplifiedRoomGenerator";
import { getAvatarForUser } from "../utils/avatarService";
import { addArtistsToSessionPool, getSessionArtistPool } from "../utils/sessionArtistPool";

const MAX_TUNED_ROOM_CACHE_ENTRIES = 40;
const MAX_SNIPPET_CACHE_ENTRIES = 24;
const SNIPPET_REQUEST_TIMEOUT_MS = 10000;
const SNIPPET_MAX_RETRIES = 1;
const MOBILE_VIEW_MEDIA_QUERY = "(max-width: 640px)";
const LOREM_SNIPPETS = [
  "lorem ipsum dolor sit",
  "dolor sit amet elit",
  "sed do eiusmod tempor",
  "ut labore et dolore",
  "magna aliqua lorem ipsum",
];

const hashStringToInt = (value = "") => {
  let hash = 0;
  const input = String(value);
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const buildRandomizedUserLabel = (seed = "") => {
  const digits = String(hashStringToInt(seed) % 1000).padStart(3, "0");
  return `User${digits}`;
};

const buildShortLoremComment = (seed = "") => {
  return LOREM_SNIPPETS[hashStringToInt(seed) % LOREM_SNIPPETS.length];
};

const getBoundedCacheEntry = (cache, key) => {
  if (!cache.has(key)) {
    return null;
  }

  const value = cache.get(key);
  cache.delete(key);
  cache.set(key, value);
  return value;
};

const setBoundedCacheEntry = (cache, key, value, maxEntries) => {
  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, value);

  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
};

const buildArtistSignature = (artists = [], limit = null) => {
  const normalizedArtists = Array.isArray(artists) ? artists : [];
  const slicedArtists = Number.isFinite(limit)
    ? normalizedArtists.slice(0, Math.max(0, limit))
    : normalizedArtists;

  return slicedArtists
    .map((artist) => artist?.id || artist?.name || "")
    .filter(Boolean)
    .join("|");
};

const buildArtistNameList = (artists = [], limit = 10) => {
  const uniqueNames = new Set();
  const names = [];

  for (const artist of artists) {
    const name = String(artist?.name || "").trim();
    if (!name) continue;

    const normalized = name.toLowerCase();
    if (uniqueNames.has(normalized)) continue;

    uniqueNames.add(normalized);
    names.push(name);

    if (names.length >= limit) {
      break;
    }
  }

  return names;
};

const getArtistImage = (artist) =>
  artist?.image || artist?.imageUrl || artist?.artworkUrl || artist?.picture || artist?.img || "";

const normalizePoolArtist = (artist, index, isRoomArtist = false) => ({
  ...artist,
  id: artist?.id || artist?.roomArtistKey || artist?.name || `artist-${index}`,
  image: getArtistImage(artist),
  isRoomArtist: Boolean(artist?.isRoomArtist || isRoomArtist),
});

const mapPoolArtists = (artists = [], isRoomArtist = false, indexOffset = 0) =>
  (Array.isArray(artists) ? artists : []).map((artist, index) =>
    normalizePoolArtist(artist, index + indexOffset, isRoomArtist)
  );

const normalizeRoomName = (value = "") => String(value || "").trim().toLowerCase();
const SELF_USERNAME = "Me";
const SELF_AVATAR = "/assets/image182.png";
const isSelfRecommendedSong = (song) => {
  const username = String(song?.recommendedBy?.username || "").trim().toLowerCase();
  return song?.source === "widget" || username === "you" || username === "me";
};
const getInitialMobileView = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(MOBILE_VIEW_MEDIA_QUERY).matches;
};

const PlayingScreen = ({
  onBack,
  onResetToSelection = null,
  station = null,
  selectedArtists = [],
}) => {
  const ROOM_SWITCH_OVERLAY_MS = 420;
  const [activeTopTab, setActiveTopTab] = useState("tuner");
  const [topExpanded, setTopExpanded] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState("Pool");
  const [bottomExpanded, setBottomExpanded] = useState(true);
  const [currentRoom, setCurrentRoom] = useState(() => station);
  const [roomViewKey, setRoomViewKey] = useState(() => station?._sessionKey || `room-${Date.now()}`);
  const [poolArtists, setPoolArtists] = useState(() => station?.artists || []);
  const [yourPicks, setYourPicks] = useState([]);
  const [isSnippetLoading, setIsSnippetLoading] = useState(false);
  const [snippetError, setSnippetError] = useState(null);
  const [snippetReloadToken, setSnippetReloadToken] = useState(0);
  const [isRoomSwitching, setIsRoomSwitching] = useState(false);
  const [tunerMode, setTunerMode] = useState("similarity");
  const [sessionPreviewArtists, setSessionPreviewArtists] = useState(() =>
    getSessionArtistPool()
  );

  // Snippet queue to advance after each vote
  const [snippetQueue, setSnippetQueue] = useState([]);
  const [currentSnippetId, setCurrentSnippetId] = useState(null);
  const currentSnippetIdRef = useRef(null);

  useEffect(() => {
    currentSnippetIdRef.current = currentSnippetId;
  }, [currentSnippetId]);

  // swipe lists for BottomDock tabs
  const [leftSwipeSongs, setLeftSwipeSongs] = useState([]);
  const [rightSwipeSongs, setRightSwipeSongs] = useState([]);
  const tunedRoomsCacheRef = useRef(new Map());
  const snippetCacheRef = useRef(new Map());
  const roomSwitchTimerRef = useRef(null);

  const roomArtists = useMemo(() => currentRoom?.artists || [], [currentRoom]);
  const roomName = currentRoom?.name || "Room";
  const roomVolume = currentRoom?.volume ?? 0;
  const roomSimilarity = currentRoom?.similarity ?? 0;
  const roomUsers = currentRoom?.users ?? currentRoom?.userCount ?? currentRoom?.listeners ?? 0;
  const rawRoomDuration = Number(currentRoom?.totalMinutes);
  const roomDuration =
    Number.isFinite(rawRoomDuration) && rawRoomDuration > 0
      ? Math.round(rawRoomDuration)
      : 40;
  const rawRoomMinutes = Number(currentRoom?.minutes);
  const roomMinutes = Number.isFinite(rawRoomMinutes)
    ? Math.max(0, Math.min(Math.round(rawRoomMinutes), roomDuration))
    : Math.min(30, roomDuration);
  const [tunerVolume, setTunerVolume] = useState(roomVolume);
  const [tunerSimilarity, setTunerSimilarity] = useState(roomSimilarity);
  const [isMobileView, setIsMobileView] = useState(getInitialMobileView);

  const {
    relatedArtists,
    randomArtists,
    loadingState: tunedFeedLoading,
  } = useEnhancedRoomFeed(selectedArtists);

  useEffect(() => {
    setCurrentRoom(station);
    setRoomViewKey(station?._sessionKey || `room-${Date.now()}`);
  }, [station]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_VIEW_MEDIA_QUERY);
    const handleMediaChange = (event) => setIsMobileView(event.matches);

    setIsMobileView(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleMediaChange);
      return () => mediaQuery.removeEventListener("change", handleMediaChange);
    }

    mediaQuery.addListener(handleMediaChange);
    return () => mediaQuery.removeListener(handleMediaChange);
  }, []);

  useEffect(() => () => {
    if (roomSwitchTimerRef.current) {
      window.clearTimeout(roomSwitchTimerRef.current);
      roomSwitchTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Safety guard in case concurrent UI events attempt to expand both panels at once.
    if (topExpanded && bottomExpanded) {
      setBottomExpanded(false);
    }
  }, [topExpanded, bottomExpanded]);

  useEffect(() => {
    // When the station changes, reset the tuner baseline to that room’s values.
    setTunerVolume(roomVolume);
    setTunerSimilarity(roomSimilarity);
    setTunerMode("similarity");
  }, [roomVolume, roomSimilarity]);

  const qlUsers = useMemo(() => {
    const formatUserName = (id) => `user${String(id % 1000).padStart(3, "0")}`;
    return [
      { id: 1, volume: 3200 },
      { id: 2, volume: 2800 },
      { id: 3, volume: 2400 },
      { id: 4, volume: 1800 },
      { id: 5, volume: 1200 },
      { id: 6, volume: 2950 },
      { id: 7, volume: 2700 },
      { id: 8, volume: 2500 },
      { id: 9, volume: 2200 },
      { id: 10, volume: 1900 },
      { id: 11, volume: 1600 },
      { id: 12, volume: 1400 },
      { id: 13, volume: 1100 },
      { id: 14, volume: 950 },
      { id: 15, volume: 800 },
    ].map((user) => ({
      ...user,
      name: formatUserName(user.id),
    }));
  }, []);

  const mergeUniqueArtists = useCallback((existing = [], incoming = []) => {
    const keyFor = (artist) => (
      artist?.id ? String(artist.id) : artist?.name?.toLowerCase()?.trim() || null
    );
    const seen = new Set();
    const merged = [];

    existing.forEach((artist) => {
      const key = keyFor(artist);
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(artist);
    });

    incoming.forEach((artist) => {
      const key = keyFor(artist);
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(artist);
    });

    return merged;
  }, []);

  const syncSessionArtistPool = useCallback((artists = []) => {
    const updatedPool = addArtistsToSessionPool(artists);
    setSessionPreviewArtists(updatedPool);
  }, []);

  const handlePoolUpdate = useCallback((newArtists) => {
    setPoolArtists((prev) => mergeUniqueArtists(prev, newArtists));
  }, [mergeUniqueArtists]);

  const baseRoomPoolArtists = useMemo(
    () => roomArtists.map((artist, index) => normalizePoolArtist(artist, index, true)),
    [roomArtists]
  );
  const supplementalPoolArtists = useMemo(() => {
    const sourceArtists = roomSimilarity < 0 ? randomArtists : relatedArtists;
    return sourceArtists.map((artist, index) => normalizePoolArtist(artist, index, false));
  }, [roomSimilarity, relatedArtists, randomArtists]);
  const mergedPoolArtists = useMemo(
    () => mergeUniqueArtists(baseRoomPoolArtists, supplementalPoolArtists),
    [baseRoomPoolArtists, supplementalPoolArtists, mergeUniqueArtists]
  );
  const mergedPoolArtistsSignature = useMemo(
    () => buildArtistSignature(mergedPoolArtists),
    [mergedPoolArtists]
  );

  const selectedArtistsSig = useMemo(
    () => buildArtistSignature(selectedArtists),
    [selectedArtists]
  );
  const relatedArtistsSig = useMemo(
    () => buildArtistSignature(relatedArtists),
    [relatedArtists]
  );
  const randomArtistsSig = useMemo(
    () => buildArtistSignature(randomArtists),
    [randomArtists]
  );
  const roomSnippetArtistNames = useMemo(
    () => buildArtistNameList(roomArtists, 10),
    [roomArtists]
  );
  const roomSnippetCacheKey = useMemo(
    () => roomSnippetArtistNames.slice().sort((left, right) => left.localeCompare(right)).join("|"),
    [roomSnippetArtistNames]
  );

  useEffect(() => {
    tunedRoomsCacheRef.current.clear();
  }, [selectedArtistsSig, relatedArtistsSig, randomArtistsSig]);

  useEffect(() => {
    syncSessionArtistPool(selectedArtists);
  }, [selectedArtists, syncSessionArtistPool]);

  useEffect(() => {
    syncSessionArtistPool(roomArtists);
  }, [roomArtists, syncSessionArtistPool]);

  useEffect(() => {
    syncSessionArtistPool(mergedPoolArtists);
  }, [mergedPoolArtists, syncSessionArtistPool]);

  useEffect(() => {
    syncSessionArtistPool(relatedArtists);
  }, [relatedArtists, syncSessionArtistPool]);

  useEffect(() => {
    syncSessionArtistPool(randomArtists);
  }, [randomArtists, syncSessionArtistPool]);

  const previewArtistPool = useMemo(() => {
    const withSession = mergeUniqueArtists(sessionPreviewArtists, mergedPoolArtists);
    const withRoom = mergeUniqueArtists(withSession, roomArtists);
    return mergeUniqueArtists(withRoom, selectedArtists);
  }, [
    sessionPreviewArtists,
    mergedPoolArtists,
    roomArtists,
    selectedArtists,
    mergeUniqueArtists,
  ]);

  useEffect(() => {
    setPoolArtists((prev) => {
      if (buildArtistSignature(prev) === mergedPoolArtistsSignature) {
        return prev;
      }

      return mergedPoolArtists;
    });
  }, [mergedPoolArtists, mergedPoolArtistsSignature]);

  const tunedRooms = useMemo(() => {
    const cacheKeyParts = [
      tunerMode,
      tunerVolume,
      tunerSimilarity,
      selectedArtistsSig,
      tunerMode === "volume" || tunerSimilarity >= 0 ? relatedArtistsSig : randomArtistsSig,
    ];
    const cacheKey = cacheKeyParts.join("::");

    const cachedRooms = getBoundedCacheEntry(tunedRoomsCacheRef.current, cacheKey);
    if (cachedRooms) {
      return cachedRooms;
    }

    let generatedRooms = [];

    // Fallback pools so the preview modal never shows an empty skeleton while data loads.
    // - positive/neutral similarity + volume mode should fall back to random artists, then current room artists.
    // - negative similarity should fall back to related or current room artists if random artists aren't ready yet.
    const positivePool = relatedArtists.length
      ? relatedArtists
      : randomArtists.length
      ? randomArtists
      : roomArtists;
    const negativePool = randomArtists.length
      ? randomArtists
      : relatedArtists.length
      ? relatedArtists
      : roomArtists;

    if (tunerMode === "volume") {
      if (selectedArtists.length > 0 && positivePool.length === 0) return [];
      generatedRooms = generateSimplifiedRooms(
        selectedArtists,
        positivePool,
        tunerVolume,
        8,
        tunerSimilarity,
        "volume"
      );
      setBoundedCacheEntry(
        tunedRoomsCacheRef.current,
        cacheKey,
        generatedRooms,
        MAX_TUNED_ROOM_CACHE_ENTRIES
      );
      return generatedRooms;
    }

    if (tunerSimilarity < 0) {
      if (negativePool.length === 0) return [];
      generatedRooms = generateSimplifiedRooms(
        [],
        negativePool,
        tunerSimilarity,
        8,
        tunerVolume,
        "similarity"
      );
      setBoundedCacheEntry(
        tunedRoomsCacheRef.current,
        cacheKey,
        generatedRooms,
        MAX_TUNED_ROOM_CACHE_ENTRIES
      );
      return generatedRooms;
    }
    if (selectedArtists.length > 0 && positivePool.length === 0) return [];
    generatedRooms = generateSimplifiedRooms(
      selectedArtists,
      positivePool,
      tunerSimilarity,
      8,
      tunerVolume,
      "similarity"
    );
    setBoundedCacheEntry(
      tunedRoomsCacheRef.current,
      cacheKey,
      generatedRooms,
      MAX_TUNED_ROOM_CACHE_ENTRIES
    );
    return generatedRooms;
  }, [
    tunerMode,
    selectedArtists,
    relatedArtists,
    randomArtists,
    roomArtists,
    tunerVolume,
    tunerSimilarity,
    selectedArtistsSig,
    relatedArtistsSig,
    randomArtistsSig,
  ]);

  const previewRooms = useMemo(() => {
    const currentRoomId = String(currentRoom?.id || "").trim();
    const currentRoomName = normalizeRoomName(currentRoom?.name);

    return tunedRooms.filter((room) => {
      if (!room) return false;

      const roomId = String(room?.id || "").trim();
      const roomName = normalizeRoomName(room?.name);
      const isSameRoomId = Boolean(currentRoomId && roomId && roomId === currentRoomId);
      const isSameRoomName = Boolean(currentRoomName && roomName && roomName === currentRoomName);

      return !isSameRoomId && !isSameRoomName;
    });
  }, [tunedRooms, currentRoom]);

  const buildEnteredRoomPoolArtists = useCallback((nextRoom) => {
    const enteredRoomArtists = mapPoolArtists(nextRoom?.artists, true);
    const randomPoolArtists = mapPoolArtists(randomArtists, false, enteredRoomArtists.length);
    const relatedPoolArtists = mapPoolArtists(
      relatedArtists,
      false,
      enteredRoomArtists.length + randomPoolArtists.length
    );
    const selectedPoolArtists = mapPoolArtists(
      selectedArtists,
      false,
      enteredRoomArtists.length + randomPoolArtists.length + relatedPoolArtists.length
    );

    const fallbackPool = mergeUniqueArtists(
      mergeUniqueArtists(randomPoolArtists, relatedPoolArtists),
      selectedPoolArtists
    );

    return mergeUniqueArtists(enteredRoomArtists, fallbackPool).slice(0, 18);
  }, [randomArtists, relatedArtists, selectedArtists, mergeUniqueArtists]);

  const enterRoom = useCallback((nextRoom) => {
    if (!nextRoom) return;
    const nextSessionKey = `${nextRoom?.id || "room"}-${Date.now()}`;
    const nextPoolArtists = buildEnteredRoomPoolArtists(nextRoom);
    if (roomSwitchTimerRef.current) {
      window.clearTimeout(roomSwitchTimerRef.current);
      roomSwitchTimerRef.current = null;
    }
    setIsRoomSwitching(true);
    roomSwitchTimerRef.current = window.setTimeout(() => {
      roomSwitchTimerRef.current = null;
      setCurrentRoom({
        ...nextRoom,
        _sessionKey: nextSessionKey,
      });
      setRoomViewKey(nextSessionKey);
      setActiveTopTab("tuner");
      setTopExpanded(false);
      setActiveBottomTab("Pool");
      setBottomExpanded(true);
      setPoolArtists(nextPoolArtists);
      setYourPicks([]);
      setSnippetQueue([]);
      setCurrentSnippetId(null);
      setLeftSwipeSongs([]);
      setRightSwipeSongs([]);
      setIsRoomSwitching(false);
    }, ROOM_SWITCH_OVERLAY_MS);
  }, [buildEnteredRoomPoolArtists]);

  const handleTopNextRoom = useCallback(() => {
    const nextRoom =
      previewRooms.find((room) => room?.id && room.id !== currentRoom?.id) ||
      previewRooms[0] ||
      null;

    enterRoom(nextRoom);
  }, [previewRooms, currentRoom, enterRoom]);

  const handleTunerVolumeChange = useCallback((nextVolume) => {
    setTunerMode("volume");
    setTunerVolume(nextVolume);
  }, []);

  const handleTunerSimilarityChange = useCallback((nextSimilarity) => {
    setTunerMode("similarity");
    setTunerSimilarity(nextSimilarity);
  }, []);

  const handleTopToggle = (nextExpanded) => {
    setTopExpanded(nextExpanded);
    if (nextExpanded) {
      setBottomExpanded(false);
    } else {
      setBottomExpanded(true);
    }
  };

  const handleBottomToggle = (nextExpandedOrFn) => {
    setBottomExpanded((prev) => {
      const next =
        typeof nextExpandedOrFn === "function"
          ? nextExpandedOrFn(prev)
          : typeof nextExpandedOrFn === "boolean"
            ? nextExpandedOrFn
            : !prev;

      if (next) setTopExpanded(false);
      return next;
    });
  };

  // Legacy-style swipe aggregation (stores per-song counts + your vote)
  const seedCounts = useCallback(() => ({
    1: Math.floor(Math.random() * 13) + 8,
    2: Math.floor(Math.random() * 13) + 8,
    3: Math.floor(Math.random() * 13) + 8,
  }), []);

  const handleSwipe = (song, dir, strength) => {
    const updateList = (prev, ownsSwipe) => {
      const idx = prev.findIndex((s) => s.id === song.id);

      if (idx === -1) {
        if (!ownsSwipe) return prev;

        const leftCounts = seedCounts();
        const rightCounts = seedCounts();

        if (dir === "down") leftCounts[strength] += 1;
        else rightCounts[strength] += 1;

        return [
          ...prev,
          {
            ...song,
            leftCounts,
            rightCounts,
            userVoteDirection: dir === "down" ? "left" : "right",
            userVoteStrength: strength,
          },
        ];
      }

      const next = [...prev];
      const entry = { ...next[idx] };

      if (dir === "down") entry.leftCounts[strength] += 1;
      else entry.rightCounts[strength] += 1;

      entry.userVoteDirection = dir === "down" ? "left" : "right";
      entry.userVoteStrength = strength;

      next[idx] = entry;
      return next;
    };

    if (isSelfRecommendedSong(song)) {
      setLeftSwipeSongs((prev) => prev.filter((entry) => entry.id !== song?.id));
      setRightSwipeSongs((prev) => prev.filter((entry) => entry.id !== song?.id));
    } else {
      setLeftSwipeSongs((prev) => updateList(prev, dir === "down"));
      setRightSwipeSongs((prev) => updateList(prev, dir === "up"));
    }

    setYourPicks((prev) => {
      const idx = prev.findIndex((pick) => pick.id === song.id);
      if (idx === -1) return prev;

      const next = [...prev];
      const entry = { ...next[idx] };

      entry.leftCounts = entry.leftCounts || seedCounts();
      entry.rightCounts = entry.rightCounts || seedCounts();

      if (dir === "down") {
        entry.leftCounts[strength] = (entry.leftCounts[strength] || 0) + 1;
      } else {
        entry.rightCounts[strength] = (entry.rightCounts[strength] || 0) + 1;
      }

      entry.userVoteDirection = dir === "down" ? "left" : "right";
      entry.userVoteStrength = strength;

      next[idx] = entry;
      return next;
    });
  };

  const mergeUniqueSnippets = useCallback((existing = [], incoming = []) => {
    const seen = new Set();
    const merged = [];

    [...existing, ...incoming].forEach((snippet) => {
      const key = snippet?.id;
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(snippet);
    });

    return merged;
  }, []);

  const normalizeWidgetSong = useCallback((song) => {
    const explicitId =
      typeof song?.id === "string" && song.id.trim()
        ? song.id.trim()
        : "";

    const previewUrl =
      typeof song?.previewUrl === "string" && song.previewUrl.startsWith("http")
        ? song.previewUrl
        : "";

    const artworkUrl =
      typeof song?.artworkUrl === "string" && song.artworkUrl.startsWith("http")
        ? song.artworkUrl
        : "";

    const stableId =
      (explicitId ? `w:${explicitId}` : "") ||
      (previewUrl ? `p:${previewUrl}` : "") ||
      `w:${song?.track || "track"}|a:${song?.artist || "artist"}`;

    return {
      id: stableId,
      track: song?.track || "Unknown Track",
      artist: song?.artist || "Unknown Artist",
      album: song?.album || "",
      previewUrl,
      artworkUrl,
      isPlaceholder: Boolean(song?.isPlaceholder),
      color: "#1DB954",
      source: "widget",
      recommendedBy: {
        username: SELF_USERNAME,
        avatar: SELF_AVATAR,
        timeAgo: "",
        comment: "Added from Widget",
      },
    };
  }, []);

  const handleSongFromWidget = useCallback((widgetSong) => {
    const mapped = normalizeWidgetSong(widgetSong);

    setYourPicks((prev) => {
      if (prev.some((pick) => pick.id === mapped.id)) return prev;

      const leftCounts = seedCounts();
      const rightCounts = seedCounts();

      return [
        ...prev,
        {
          ...mapped,
          leftCounts,
          rightCounts,
          userVoteDirection: null,
          userVoteStrength: null,
        },
      ];
    });

    setSnippetQueue((prev) => {
      if (prev.some((song) => song.id === mapped.id)) return prev;

      if (!prev.length) {
        return [mapped];
      }

      const currentIndex = prev.findIndex(
        (song) => song.id === currentSnippetIdRef.current
      );
      const insertAt = Math.min(
        (currentIndex >= 0 ? currentIndex : prev.length - 1) + 1,
        prev.length
      );

      return [
        ...prev.slice(0, insertAt),
        mapped,
        ...prev.slice(insertAt),
      ];
    });

    setCurrentSnippetId((prev) => prev || mapped.id);
  }, [normalizeWidgetSong, seedCounts]);

  const nowPlaying = useMemo(() => {
    if (!snippetQueue.length) return null;
    return (
      snippetQueue.find((snippet) => snippet.id === currentSnippetId) ||
      snippetQueue[0] ||
      null
    );
  }, [currentSnippetId, snippetQueue]);

  useEffect(() => {
    if (!snippetQueue.length) {
      if (currentSnippetIdRef.current !== null) {
        setCurrentSnippetId(null);
      }
      return;
    }

    const hasCurrent = snippetQueue.some(
      (snippet) => snippet.id === currentSnippetIdRef.current
    );

    if (!hasCurrent) {
      setCurrentSnippetId(snippetQueue[0].id);
    }
  }, [snippetQueue]);

  // Fetch Apple Music snippets for the room artists and build a queue
  useEffect(() => {
    const artistNames = roomSnippetArtistNames;

    if (artistNames.length === 0 || !roomSnippetCacheKey) return;

    const cachedSnippets = getBoundedCacheEntry(
      snippetCacheRef.current,
      roomSnippetCacheKey
    );

    if (cachedSnippets) {
      setSnippetQueue((prev) => {
        const widgetSnippets = prev.filter(
          (snippet) => snippet.source === "widget"
        );
        return mergeUniqueSnippets(widgetSnippets, cachedSnippets);
      });
      setIsSnippetLoading(false);
      setSnippetError(null);
      return;
    }

    let cancelled = false;
    let activeController = null;
    let activeTimeoutId = null;

    const fetchSnippets = async () => {
      for (let attempt = 0; attempt <= SNIPPET_MAX_RETRIES; attempt += 1) {
        const controller = new AbortController();
        activeController = controller;
        setSnippetError(null);
        try {
          setIsSnippetLoading(true);
          activeTimeoutId = window.setTimeout(() => controller.abort(), SNIPPET_REQUEST_TIMEOUT_MS);

          const res = await fetch(buildApiUrl("/apple-music/snippets"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ artistNames }),
            signal: controller.signal,
          });

          if (!res.ok) throw new Error("Failed to fetch snippets");
          const data = await res.json();

          const mapped = (Array.isArray(data) ? data : [])
            .map((snippet, idx) => {
              const stableId =
                (snippet.previewUrl ? `p:${snippet.previewUrl}` : "") ||
                `t:${snippet.track || "track"}|a:${
                  snippet.artist || "artist"
                }|i:${idx}`;
              const recommenderSeed = `${stableId}|${snippet.artist || ""}|${snippet.track || ""}`;
              const recommenderName = buildRandomizedUserLabel(recommenderSeed);

              return {
                id: stableId,
                track: snippet.track || "Unknown Track",
                artist: snippet.artist || "Unknown Artist",
                album: snippet.album || "",
                previewUrl: snippet.previewUrl || "",
                artworkUrl: snippet.artworkUrl || "",
                color: "#60a5fa",
                source: "room",
                recommendedBy: {
                  username: recommenderName,
                  avatar: getAvatarForUser(recommenderName),
                  timeAgo: "",
                  comment: buildShortLoremComment(recommenderSeed),
                },
              };
            })
            .filter((snippet) => snippet.track && snippet.artist);

          if (cancelled) return;

          setBoundedCacheEntry(
            snippetCacheRef.current,
            roomSnippetCacheKey,
            mapped,
            MAX_SNIPPET_CACHE_ENTRIES
          );

          setSnippetQueue((prev) => {
            const widgetSnippets = prev.filter(
              (snippet) => snippet.source === "widget"
            );
            return mergeUniqueSnippets(widgetSnippets, mapped);
          });

          setSnippetError(null);
          return;
        } catch (error) {
          if (error?.name === "AbortError") {
            if (cancelled) return;
            if (attempt === SNIPPET_MAX_RETRIES) {
              setSnippetError("Snippet request cancelled or timed out.");
            }
            continue;
          }
          if (attempt === SNIPPET_MAX_RETRIES && !cancelled) {
            setSnippetError("Snippets are unavailable right now. Retry?");
          }
        } finally {
          if (activeTimeoutId) {
            window.clearTimeout(activeTimeoutId);
            activeTimeoutId = null;
          }
          if (!cancelled) setIsSnippetLoading(false);
        }
      }
    };

    fetchSnippets();

    return () => {
      cancelled = true;
      if (activeTimeoutId) {
        window.clearTimeout(activeTimeoutId);
        activeTimeoutId = null;
      }
      activeController?.abort();
      setSnippetError(null);
    };
  }, [mergeUniqueSnippets, roomSnippetArtistNames, roomSnippetCacheKey, snippetReloadToken]);

  const handleSnippetRetry = useCallback(() => {
    setSnippetError(null);
    setSnippetQueue((prev) => prev.filter((snippet) => snippet.source === "widget"));
    setSnippetReloadToken((token) => token + 1);
  }, []);

  return (
    <MuflThreadsSidebarLayout activeItem="rooms">
      <div
        className={`playing-screen ${
          bottomExpanded ? "is-dock-expanded" : "is-dock-collapsed"
        } ${topExpanded ? "is-top-expanded" : "is-top-collapsed"} ${
          !topExpanded && !bottomExpanded ? "is-stage-centered" : ""
        } ${isMobileView ? "is-mobile-view" : "is-desktop-view"}`}
      >
        <div className="playing-screen__frame">
          <main className="playing-screen__content">
          {isRoomSwitching && (
            <div className="playing-screen__room-switch">
              <div className="playing-screen__room-switch-inner">
                <div className="playing-screen__room-switch-spinner" />
                <div className="playing-screen__room-switch-label">Switching rooms...</div>
              </div>
            </div>
          )}
          <PlayingTopComponent
            key={`top-${roomViewKey}`}
            onBack={onBack}
            onResetToSelection={onResetToSelection}
            onNextRoom={handleTopNextRoom}
            onEnterPreviewRoom={enterRoom}
            roomName={roomName}
            volume={roomVolume}
            similarity={roomSimilarity}
            roomUsers={roomUsers}
            roomMinutes={roomMinutes}
            roomDuration={roomDuration}
            activeTab={activeTopTab}
            setActiveTab={setActiveTopTab}
            isExpanded={topExpanded}
            onToggleExpand={handleTopToggle}
            roomArtists={roomArtists}
            poolArtists={poolArtists}
            previewArtistPool={previewArtistPool}
            yourPicks={yourPicks}
            previewRooms={previewRooms}
            previewRoomsLoading={
              tunedFeedLoading.initialLoad ||
              tunedFeedLoading.similarArtists ||
              tunedFeedLoading.roomGeneration
            }
            tunerVolume={tunerVolume}
            tunerSimilarity={tunerSimilarity}
            onTunerVolumeChange={handleTunerVolumeChange}
            onTunerSimilarityChange={handleTunerSimilarityChange}
            isMobileView={isMobileView}
          />

          <section className="playing-mid">
            <div className="playing-mid__wrap">
              <PlayingSnippetCard
                key={`snippet-${roomViewKey}`}
                song={nowPlaying}
                isLoading={isSnippetLoading}
                isMobileView={isMobileView}
                onVote={(song, dir, strength) => {
                  handleSwipe(song, dir, strength);
                  if (!snippetQueue.length) {
                    setCurrentSnippetId(null);
                    return;
                  }

                  const currentIndex = snippetQueue.findIndex(
                    (entry) => entry.id === (song?.id || currentSnippetIdRef.current)
                  );
                  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
                  const nextSong =
                    snippetQueue[(safeIndex + 1) % snippetQueue.length] || null;

                  setCurrentSnippetId(nextSong?.id || null);
                }}
                onToggleBookmark={() => null}
              />
              {snippetError && (
                <div className="playing-snippet-error">
                  <span>{snippetError}</span>
                  <button type="button" onClick={handleSnippetRetry} className="playing-snippet-error__retry">
                    Retry
                  </button>
                </div>
              )}
            </div>
          </section>
          </main>
        </div>

        <PlayingBottomDock
          key={`dock-${roomViewKey}`}
          activeTab={activeBottomTab}
          setActiveTab={setActiveBottomTab}
          isMobileView={isMobileView}
          isExpanded={bottomExpanded}
          onToggleExpand={handleBottomToggle}
          qlUsers={qlUsers}
          poolArtists={poolArtists}
          roomArtists={roomArtists}
          onPoolUpdate={handlePoolUpdate}
          leftSwipeSongs={leftSwipeSongs}
          rightSwipeSongs={rightSwipeSongs}
          apiBaseUrl=""
          onSongFromWidget={handleSongFromWidget}
        />
      </div>
    </MuflThreadsSidebarLayout>
  );
};

export default PlayingScreen;
