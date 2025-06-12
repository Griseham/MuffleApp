export function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }
  
  export function authorToAvatar(author) {
    if (!author) return "/threads/assets/default-avatar.png";
    let hash = 0;
    for (let i = 0; i < author.length; i++) {
      hash = author.charCodeAt(i) + ((hash << 5) - hash);
    }
    const mod = Math.abs(hash) % 200;
    return `/assets/image${mod + 1}.png`;
  }
  
  export function removeLinks(text) {
    if (!text) return "";
    let cleaned = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/gi, "$1");
    cleaned = cleaned.replace(/https?:\/\/\S+/gi, "");
    return cleaned;
  }
  

export function getAvatarSrc(post) {
    const idStr = post.id.toString();
    const num = hashString(idStr);
    return `/assets/image${(num % 200) + 1}.png`;
  }
  
  
  const COMMENT_LENGTH_THRESHOLD = 80;