import { clamp01, hashString, mulberry32 } from "./seed";

export const getBaselineRating = (artist) => clamp01(artist?.ratings?.forYou ?? 0.5);

export const getActiveRating = (artist, { volumeActive, genreActive, volumeStepBucket, genre }) => {
  const baseline = getBaselineRating(artist);

  if (!volumeActive && !genreActive) return baseline;

  // Use hashString on the id string to avoid NaN from string * number
  const idHash = hashString(String(artist.id ?? "0"));

  let volumeRating = baseline;
  let genreRating = baseline;

  if (volumeActive) {
    const seed = (idHash % 100000) + volumeStepBucket * 97 + 1337;
    const rnd = mulberry32(seed)();
    volumeRating = clamp01(0.15 + rnd * 0.75);
  }

  if (genreActive) {
    const gHash = hashString(genre || "Genre");
    const seed = (idHash % 100000) + (gHash % 100000) + 7331;
    const rnd = mulberry32(seed)();
    genreRating = clamp01(0.15 + rnd * 0.75);
  }

  if (volumeActive && genreActive) {
    return clamp01((volumeRating + genreRating) / 2);
  }
  if (volumeActive) return volumeRating;
  if (genreActive) return genreRating;

  return baseline;
};

export const getXPosition = (releaseMonth, releaseDay, monthWidth, artistSize) => {
  const dayOffset = (releaseDay / 28) * (monthWidth - artistSize - 4);
  return releaseMonth * monthWidth + dayOffset + 2;
};

export const getYPosition = (ratingLevel, timelineHeight, artistSize) => {
  const minY = 20;
  const maxY = timelineHeight - artistSize - 16;
  return maxY - ratingLevel * (maxY - minY);
};

export const getViewLabel = (volumeActive, genreActive, volumeValue, genreValue) => {
  if (!volumeActive && !genreActive) return "your ratings";
  const parts = [];
  if (volumeActive) parts.push(`vol ${volumeValue}`);
  if (genreActive) parts.push(genreValue || "genre");
  return parts.join(" + ");
};