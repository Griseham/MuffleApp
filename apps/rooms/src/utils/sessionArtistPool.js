const MAX_SESSION_ARTIST_POOL_SIZE = 600;

const artistPoolByKey = new Map();

const normalizeArtist = (artist = {}, index = 0) => {
  const name = String(artist?.name || "").trim();
  if (!name) return null;

  const idValue = artist?.id || artist?.roomArtistKey || "";
  const image =
    artist?.image || artist?.imageUrl || artist?.artworkUrl || artist?.picture || artist?.img || "";
  const key = String(idValue || `${name.toLowerCase()}|${image || index}`);

  return {
    ...artist,
    id: idValue || key,
    name,
    image,
    _sessionPoolKey: key,
  };
};

const enforcePoolLimit = () => {
  while (artistPoolByKey.size > MAX_SESSION_ARTIST_POOL_SIZE) {
    const oldestKey = artistPoolByKey.keys().next().value;
    artistPoolByKey.delete(oldestKey);
  }
};

export const addArtistsToSessionPool = (artists = []) => {
  if (!Array.isArray(artists) || artists.length === 0) {
    return Array.from(artistPoolByKey.values());
  }

  artists.forEach((artist, index) => {
    const normalized = normalizeArtist(artist, index);
    if (!normalized?._sessionPoolKey) return;

    if (artistPoolByKey.has(normalized._sessionPoolKey)) {
      artistPoolByKey.delete(normalized._sessionPoolKey);
    }

    artistPoolByKey.set(normalized._sessionPoolKey, normalized);
  });

  enforcePoolLimit();
  return Array.from(artistPoolByKey.values());
};

export const addRoomsArtistsToSessionPool = (rooms = []) => {
  if (!Array.isArray(rooms) || rooms.length === 0) {
    return Array.from(artistPoolByKey.values());
  }

  const roomArtists = rooms.flatMap((room) =>
    Array.isArray(room?.artists) ? room.artists : []
  );
  return addArtistsToSessionPool(roomArtists);
};

export const getSessionArtistPool = () => Array.from(artistPoolByKey.values());

export const clearSessionArtistPool = () => {
  artistPoolByKey.clear();
};

