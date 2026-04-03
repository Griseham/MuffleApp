const TOTAL_USER_AVATARS = 1000;
const AVATAR_BASE_URL = `${import.meta.env.BASE_URL}assets/avatars`;

function normalizeAvatarNumber(number) {
  const raw = Math.trunc(Math.abs(Number(number) || 1));
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return ((raw - 1) % TOTAL_USER_AVATARS) + 1;
}

function buildAvatarSrc(number) {
  return `${AVATAR_BASE_URL}/image${normalizeAvatarNumber(number)}.png`;
}

const USER_AVATAR_SOURCES = Array.from(
  { length: TOTAL_USER_AVATARS },
  (_, index) => buildAvatarSrc(index + 1)
);
const DEFAULT_AVATAR_SRC = buildAvatarSrc(1);

function getAvatarSrcFromNumber(number) {
  return buildAvatarSrc(number);
}

export {
  DEFAULT_AVATAR_SRC,
  USER_AVATAR_SOURCES,
  getAvatarSrcFromNumber,
};
