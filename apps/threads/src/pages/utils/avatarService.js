import { CURRENT_USER_AVATAR, isCurrentUserAuthor } from "../../utils/currentUser";

export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Return a deterministic avatar URL based on a user identifier.
export function getAvatarForUser(userOrId) {
  if (!userOrId) return "/assets/default-avatar.png";
  if (isCurrentUserAuthor(userOrId)) return CURRENT_USER_AVATAR;

  const seed =
    typeof userOrId === "object"
      ? userOrId.id ?? userOrId.name ?? userOrId.username ?? "user"
      : userOrId;

  const num = hashString(String(seed));
  return `/assets/image${(num % 1000) + 1}.png`;
}
