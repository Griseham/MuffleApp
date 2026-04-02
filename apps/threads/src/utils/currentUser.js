const CURRENT_USER_NAME = "Me";

export const CURRENT_USER_DISPLAY_NAME = CURRENT_USER_NAME;
export const CURRENT_USER_USERNAME = CURRENT_USER_NAME;
export const CURRENT_USER_AVATAR = "/assets/image182.png";

function normalizeIdentity(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function isCurrentUserToken(value) {
  const normalized = normalizeIdentity(value);
  if (!normalized) return false;
  if (normalized === "me") return true;
  return /^you\d*$/.test(normalized);
}

export function isCurrentUserAuthor(value) {
  if (value && typeof value === "object") {
    return (
      isCurrentUserToken(value.author) ||
      isCurrentUserToken(value.displayName) ||
      isCurrentUserToken(value.name) ||
      isCurrentUserToken(value.username)
    );
  }
  return isCurrentUserToken(value);
}

export function getCurrentUserIdentity(overrides = {}) {
  return {
    author: CURRENT_USER_DISPLAY_NAME,
    displayName: CURRENT_USER_DISPLAY_NAME,
    name: CURRENT_USER_DISPLAY_NAME,
    username: CURRENT_USER_USERNAME,
    avatar: CURRENT_USER_AVATAR,
    ...overrides,
  };
}
