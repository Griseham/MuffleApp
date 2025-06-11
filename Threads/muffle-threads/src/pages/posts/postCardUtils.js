// Helper functions for PostCard components
export const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const getRandomPercentage = () => (Math.random() * 0.02).toFixed(4);

// Genre data with colors
export const GENRE_COLORS = {
  'R&B': '#634F9C',
  'Hip-Hop': '#BB4F63',
  'Rock': '#E71D36',
  'Jazz': '#2EC4B6',
  'Country': '#BF9D7A',
  'Trap': '#BA6AA0',
  'Pop': '#D28A47',
  'Electronic': '#7B52AB',
  'Reggae': '#4AA96C'
};

// Function to get genres for a post
export function getPostGenres(postId, count = null) {
  const genreCount = count || getRandomNumber(2, 5);
  const allGenres = Object.entries(GENRE_COLORS).map(([name, color]) => ({
    name,
    color,
    percentage: getRandomPercentage()
  }));
  
  // Use postId for deterministic selection
  const hash = typeof postId === 'string' 
    ? postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : Math.abs(postId);
  
  const selected = [];
  const usedIndices = new Set();
  
  for (let i = 0; i < genreCount; i++) {
    let index = (hash + i * 17) % allGenres.length;
    
    // Avoid duplicates
    while (usedIndices.has(index)) {
      index = (index + 1) % allGenres.length;
    }
    
    usedIndices.add(index);
    selected.push(allGenres[index]);
  }
  
  return selected;
}

// Function to get artists for a post
export function getPostArtists(postId) {
  const artistNames = [
    "Ariana", "Bad", "Drake", "Post", "Dua",
    "SZA", "Frank", "Beyoncé", "Taylor", "Kendrick"
  ];
  
  const hash = typeof postId === 'string' 
    ? postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : Math.abs(postId);
  
  // Select 5 artists deterministically based on postId
  const selected = [];
  const usedIndices = new Set();
  
  for (let i = 0; i < 5; i++) {
    let index = (hash + i * 13) % artistNames.length;
    
    // Avoid duplicates
    while (usedIndices.has(index)) {
      index = (index + 1) % artistNames.length;
    }
    
    usedIndices.add(index);
    selected.push({ name: artistNames[index] });
  }
  
  return selected;
}

// Hash string to number
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Get avatar source based on post
export function getAvatarSrc(post) {
  if (post.author === 'You') return '/assets/user.png';
  
  // Handle cases where post.id might be undefined
  const idStr = post.id ? post.id.toString() : post.author || 'default';
  const num = hashString(idStr);
  return `/assets/image${(num % 1000) + 1}.png`;
}
// Generate username based on author
export function generateUsername(author) {
  if (!author) return `user${getRandomNumber(1000, 9999)}`;
  // Strip any spaces from the author name
  return `${author?.replace(/\s+/g, '')}${getRandomNumber(10, 999)}`;
}

// Format relative time
export function getTimeAgo(timestamp) {
  if (!timestamp) return '2d';
  
  const now = new Date();
  const postTime = new Date(timestamp * 1000);
  const diffDays = Math.floor((now - postTime) / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) return `${diffDays}d`;
  
  const diffHours = Math.floor((now - postTime) / (1000 * 60 * 60));
  if (diffHours > 0) return `${diffHours}h`;
  
  const diffMinutes = Math.floor((now - postTime) / (1000 * 60));
  if (diffMinutes > 0) return `${diffMinutes}m`;
  
  return 'now';
}

// Format number with K/M suffix
export function formatCompactNumber(number) {
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(0)}K`;
  return number.toString();
}