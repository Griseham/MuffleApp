import { CURRENT_USER_AVATAR, isCurrentUserAuthor } from "../../utils/currentUser";

export function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }
  
  export function authorToAvatar(author) {
    if (!author) return "/assets/default-avatar.png";
    if (isCurrentUserAuthor(author)) return CURRENT_USER_AVATAR;
    let hash = 0;
    for (let i = 0; i < author.length; i++) {
      hash = author.charCodeAt(i) + ((hash << 5) - hash);
    }
    const mod = Math.abs(hash) % 1000;
    return `/assets/image${mod + 1}.png`;
  }
  
export function removeLinks(text) {
  if (!text) return "";
  let cleaned = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi, "$1");
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, "");
  return cleaned;
}
  

export function getAvatarSrc(post) {
    if (isCurrentUserAuthor(post)) return CURRENT_USER_AVATAR;
    const idStr = post?.id?.toString?.() || post?.author || "default";
    const num = hashString(idStr);
    return `/assets/image${(num % 1000) + 1}.png`;
  }
  
  
