/** remove markdown + naked links */
export function removeLinks(text = '') {
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/gi, '$1') // [title](link)
    .replace(/https?:\/\/\S+/gi, '')                       // bare links
    .trim();
}

/** try to extract song + artist from a comment line */
export function extractSongQuery(text) {
  const clean = removeLinks(text)
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')          // unify long dashes
    .trim();

  const candidates = [
    // “Song Name” – Artist
    /["“”']([^"”']{3,80})["“”']\s*[-–—]\s*([^-\n]{2,60})/i,
    // Song - Artist
    /^(.{3,80})\s*-\s*(.{2,60})$/,
    // Song by Artist
    /^(.{3,80})\s+by\s+(.{2,60})$/i,
  ];

  for (const rex of candidates) {
    const m = clean.match(rex);
    if (m) {
      const song   = m[1].trim();
      const artist = m[2].trim();
      // rudimentary rejection of long sentences
      if (song.split(' ').length > 12 || artist.split(' ').length > 10) continue;
      return `${song} ${artist}`;
    }
  }
  return null;
}
