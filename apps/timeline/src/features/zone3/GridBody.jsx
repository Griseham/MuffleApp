import AlbumCell from "./AlbumCell";
import { getGradient } from "./gridHelpers";

const ACTIVE_GENRES = ["Hip-Hop", "Pop", "R&B"];

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function seededShuffle(arr, seed) {
  const out = [...arr]; let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

function rand01FromSeed(seed) {
  let t = ((seed >>> 0) + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const HALF_DECADE_GREYS = [
  "linear-gradient(135deg, #2e2e2e 0%, #1c1c1c 100%)",
  "linear-gradient(135deg, #353535 0%, #212121 100%)",
  "linear-gradient(135deg, #2c3033 0%, #1a1d1f 100%)",
  "linear-gradient(135deg, #3a3936 0%, #242320 100%)",
  "linear-gradient(135deg, #2f3436 0%, #1d2022 100%)",
  "linear-gradient(135deg, #323232 0%, #1e1e1e 100%)",
];

function getHalfDecadeGradient(seed) {
  const idx = Math.abs(seed) % HALF_DECADE_GREYS.length;
  return HALF_DECADE_GREYS[idx];
}

export default function GridBody({ months, users, config, timeScale }) {
  const shuffleSeed = config.shuffleSeed ?? 0;
  const calendar = config.zone3Calendar ?? {};
  const activeGenre = config.zone3Genre;
  const showRankings = !!config.showTopAlbums;
  const isMostRated = config.zone3Filter === "mostRated";
  const isYouView = config.zone3Filter === "you";
  const isGenreView = config.zone3Filter === "genre";
  const useAllGenres = isMostRated || isYouView || !activeGenre;
  const isHalfDecade = timeScale === "halfDecades";
  const usePlaceholders = timeScale !== "months";

  // Volume-based sparsity: lower slider values produce fewer visible albums.
  const volumeDensity = config.showVolume
    ? 0.08 + (config.zone3VolumeMin / 3200) * 0.92
    : (isMostRated ? 1.0 : 0.45);
  const genreDensity = isGenreView ? 0.78 : volumeDensity;
  const youDensity = 0.45; // a little less than half

  // Track used albums across rows (no album in more than one row)
  const usedAlbumKeys = new Set();
  const gradientForCell = (userId, bucketKey) => {
    const seed = hashStr(`${userId}-${bucketKey}-${shuffleSeed}`);
    return usePlaceholders ? getHalfDecadeGradient(seed) : getGradient(userId, bucketKey);
  };

  return (
    <div className="body-grid">
      {months.map((monthItem, rowIndex) => {
        const prevItem = months[rowIndex - 1];
        const isNewYear = rowIndex === 0 || prevItem?.year !== monthItem.year;
        const isMonths = timeScale === "months";
        const calMonth = monthItem.calendarMonth ?? 1;
        const monthKey = `${monthItem.year}-${calMonth}`;
        const rankingContext = `${config.zone3Filter}-${activeGenre ?? "all"}-${config.showVolume ? config.zone3VolumeMin : "base"}-${timeScale}`;
        const albumKeyFor = (album) => String(album?.albumId ?? `${album?.artistName ?? ""}|${album?.albumName ?? ""}`);

        // Gather calendar assignments for this row
        let calendarRow = null;
        let rowAssignments = [];
        let rowTop = null;

        if (usePlaceholders) {
          const label = isHalfDecade
            ? (monthItem.halfDecadeLabel ?? monthItem.decadeLabel ?? `${monthItem.year}-${monthItem.year - 4}`)
            : `${monthItem.year}`;
          const seed = hashStr(label) + shuffleSeed;
          const placeholderCount = 14;
          rowAssignments = Array.from({ length: placeholderCount }, (_, i) => ({
            albumId: `ph-${label}-${i}`,
            artistName: "Artist",
            albumName: isHalfDecade ? `Half ${label} Album ${i + 1}` : `Year ${label} Album ${i + 1}`,
            artworkUrl: null,
            artistImageUrl: null,
            __seed: seed + i,
          }));
          rowTop = { albumId: `ph-top-${label}`, artistName: "Artist", albumName: isHalfDecade ? `Half ${label} Picks` : `Year ${label} Picks`, artworkUrl: null, artistImageUrl: null };
        } else {
          if (useAllGenres) {
            const all = [];
            let top = null;
            for (const g of ACTIVE_GENRES) {
              const row = calendar[g]?.[monthKey];
              if (!row) continue;
              if (!top) top = row.topAlbum;
              all.push(...(row.userAssignments || []));
            }
            rowTop = top;
            // Shuffle and dedup across rows
            const shuffled = seededShuffle(all, hashStr(monthKey) + shuffleSeed);
            rowAssignments = shuffled.filter((a) => {
              const key = `${a.artistName}|${a.albumName}`;
              return !usedAlbumKeys.has(key);
            });
            for (const a of rowAssignments) usedAlbumKeys.add(`${a.artistName}|${a.albumName}`);
          } else {
            calendarRow = calendar[activeGenre]?.[monthKey] ?? null;
            if (calendarRow?.userAssignments) {
              const shuffled = seededShuffle(calendarRow.userAssignments, hashStr(monthKey) + shuffleSeed);
              rowAssignments = shuffled.filter((a) => {
                const key = `${a.artistName}|${a.albumName}`;
                return !usedAlbumKeys.has(key);
              });
              for (const a of rowAssignments) usedAlbumKeys.add(`${a.artistName}|${a.albumName}`);
            }
            rowTop = calendarRow?.topAlbum ?? null;
          }
        }

        // For shared albums within a row: pick from a SMALL pool (3-5 albums max)
        // so multiple users naturally share the same album
        const poolSize = Math.min(rowAssignments.length, Math.max(3, Math.floor(rowAssignments.length * 0.25)));
        const rowPool = rowAssignments.slice(0, poolSize);
        const rowRankings = new Map();
        const availableRanks = seededShuffle(
          Array.from({ length: 433 - 15 + 1 }, (_, idx) => idx + 15),
          hashStr(`${monthKey}-${rankingContext}-${shuffleSeed}-row-ranks`)
        );
        let nextRankIndex = 0;

        if (rowTop) {
          rowRankings.set(albumKeyFor(rowTop), 1);
        }
        for (const album of rowPool) {
          const albumKey = albumKeyFor(album);
          if (rowRankings.has(albumKey)) continue;
          rowRankings.set(albumKey, availableRanks[nextRankIndex] ?? 15);
          nextRankIndex += 1;
        }

        return (
          <div key={monthItem.key ?? `${monthItem.month}-${monthItem.year}-${rowIndex}`}
            className={`grid-row ${isNewYear ? "grid-row-new-year" : ""}`}>
            <div className="grid-month-cell">
              {isNewYear ? (
                <div className="year-block">
                  <span className="year-number">{isHalfDecade ? (monthItem.halfDecadeLabel ?? monthItem.decadeLabel ?? "2025-2021") : monthItem.year}</span>
                  {isMonths && <span className="month-name-small">{monthItem.month}</span>}
                </div>
              ) : (<span className="month-name">{monthItem.month}</span>)}
            </div>

            {users.map((user) => {
              const seedKey = `${user.id}-${monthItem.key ?? rowIndex}-${shuffleSeed}`;
              const userRand = rand01FromSeed(hashStr(seedKey));

              // ── Top Albums column: always show, always rank #1 ──
              if (user.isTopAlbums) {
                return (
                  <AlbumCell key={`${user.id}-${rowIndex}`} user={user}
                    showAlbum={true} ranking={1} showRankings={showRankings}
                    gradient={gradientForCell(user.id, monthItem.key ?? rowIndex)}
                    artistName={isHalfDecade ? "Artist" : (rowTop?.artistName ?? "")} albumName={isHalfDecade ? (rowTop?.albumName ?? "") : (rowTop?.albumName ?? "")}
                    artworkUrl={isHalfDecade ? null : (rowTop?.artworkUrl ?? null)} artistImageUrl={isHalfDecade ? null : (rowTop?.artistImageUrl ?? null)} />
                );
              }

              // ── You + pinned friends: unaffected by filters, ~35% fill, random albums ──
              if (user.isYou || user.isPinnedFriend) {
                const showAlbum = userRand < 0.35; // miss >50% of months
                if (!showAlbum || rowPool.length === 0) {
                  return <AlbumCell key={`${user.id}-${rowIndex}`} user={user} showAlbum={false} ranking={null} showRankings={showRankings} gradient={null} artistName={null} albumName={null} artworkUrl={null} artistImageUrl={null} />;
                }
                const pick = rowPool[hashStr(seedKey + "pin") % rowPool.length];
                return (
                  <AlbumCell key={`${user.id}-${rowIndex}`} user={user}
                    showAlbum={true} ranking={rowRankings.get(albumKeyFor(pick)) ?? 15} showRankings={showRankings}
                    gradient={gradientForCell(user.id, monthItem.key ?? rowIndex)}
                    artistName={isHalfDecade ? "Artist" : (pick?.artistName ?? "")} albumName={pick?.albumName ?? ""}
                    artworkUrl={isHalfDecade ? null : (pick?.artworkUrl ?? null)} artistImageUrl={isHalfDecade ? null : (pick?.artistImageUrl ?? null)} />
                );
              }

              // ── Regular users ──
              // Determine if this cell is filled
              let showAlbum;
              if (isMostRated) {
                showAlbum = rowPool.length > 0 && userRand < (config.showVolume ? volumeDensity : 0.95);
              } else if (isYouView) {
                showAlbum = rowPool.length > 0 && userRand < youDensity;
              } else {
                // Genre mode should feel fuller than before, but still lighter than Most Rated.
                showAlbum = rowPool.length > 0 && userRand < genreDensity;
              }

              if (!showAlbum) {
                return <AlbumCell key={`${user.id}-${rowIndex}`} user={user} showAlbum={false} ranking={null} showRankings={showRankings} gradient={null} artistName={null} albumName={null} artworkUrl={null} artistImageUrl={null} />;
              }

              // Pick from the small pool → encourages sharing
              const pick = rowPool[hashStr(seedKey) % rowPool.length];

              return (
                <AlbumCell key={`${user.id}-${rowIndex}`} user={user}
                  showAlbum={true} ranking={rowRankings.get(albumKeyFor(pick)) ?? 15} showRankings={showRankings}
                  gradient={gradientForCell(user.id, monthItem.key ?? rowIndex)}
                  artistName={isHalfDecade ? "Artist" : (pick?.artistName ?? "")} albumName={pick?.albumName ?? ""}
                  artworkUrl={isHalfDecade ? null : (pick?.artworkUrl ?? null)} artistImageUrl={isHalfDecade ? null : (pick?.artistImageUrl ?? null)} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
