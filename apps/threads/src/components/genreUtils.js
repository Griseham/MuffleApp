// genreUtils.js - Combined utilities for genre-related functions

/**
 * Music genres database with colors
 */
export const GENRES = {
  // Electronic
  electronic: [
    { genre: "Techno", color: "#05c9f9" },
    { genre: "House", color: "#00e5ff" },
    { genre: "Trance", color: "#18a0fb" },
    { genre: "Dubstep", color: "#0288d1" },
    { genre: "EDM", color: "#29b6f6" },
    { genre: "Drum & Bass", color: "#0277bd" },
    { genre: "Ambient", color: "#4fc3f7" },
    { genre: "IDM", color: "#039be5" },
  ],
  // Hip-Hop
  hiphop: [
    { genre: "Hip-Hop", color: "#ff4d4f" },
    { genre: "Trap", color: "#ff7875" },
    { genre: "Rap", color: "#f5222d" },
    { genre: "R&B", color: "#ff9c6e" },
    { genre: "Soul", color: "#ff7a45" },
    { genre: "Drill", color: "#d4380d" },
    { genre: "Lo-Fi", color: "#fa541c" },
  ],
  // Rock
  rock: [
    { genre: "Rock", color: "#f442c2" },
    { genre: "Metal", color: "#eb2f96" },
    { genre: "Punk", color: "#c41d7f" },
    { genre: "Alternative", color: "#ff85c0" },
    { genre: "Grunge", color: "#9e1068" },
    { genre: "Indie Rock", color: "#ffa39e" },
    { genre: "Post-Rock", color: "#cf1322" },
  ],
  // Pop
  pop: [
    { genre: "Pop", color: "#ff66cc" },
    { genre: "Synth-Pop", color: "#ff85c0" },
    { genre: "K-Pop", color: "#f759ab" },
    { genre: "Dance-Pop", color: "#eb2f96" },
    { genre: "J-Pop", color: "#c41d7f" },
    { genre: "Indie-Pop", color: "#ffa39e" },
  ],
  // Other
  world: [
    { genre: "Jazz", color: "#ffa500" },
    { genre: "Classical", color: "#faad14" },
    { genre: "Folk", color: "#52c41a" },
    { genre: "Blues", color: "#237804" },
    { genre: "Country", color: "#73d13d" },
    { genre: "Reggae", color: "#389e0d" },
    { genre: "Latin", color: "#95de64" },
    { genre: "Afrobeat", color: "#7cb305" },
  ]
};

/**
 * Get a consistent color for a given genre
 * @param {string} genreName - The name of the genre
 * @returns {string} - A hex color code
 */
export function getGenreColor(genreName) {
  // Base colors for major genre families
  const genreColors = {
    "Hip-Hop": "#ff4d4f",
    "Pop": "#ff66cc",
    "Rock": "#f442c2",
    "EDM": "#05c9f9",
    "Metal": "#eb2f96",
    "Experimental": "#ffa940",
    "Jazz": "#ffa500",
    "Synthwave": "#4fc3f7",
    "Ambient": "#4fc3f7",
    "Classical": "#faad14",
    "Blues": "#237804",
    "Reggae": "#389e0d",
    "Folk": "#52c41a",
    "Country": "#73d13d",
    "R&B": "#ff9c6e",
    "Hyperpop": "#f759ab",
    "FakeGenres": "#9e1068"
  };
  
  // Return the color if available, otherwise generate one
  if (genreColors[genreName]) {
    return genreColors[genreName];
  } else {
    // Hash the name to a consistent color
    return genreNameToColor(genreName);
  }
}

/**
 * Generate a color for a subgenre based on its parent genre
 * @param {string} parentGenre - The parent genre name
 * @param {string} subgenre - The subgenre name
 * @returns {string} - A hex color code
 */
export function getSubgenreColor(parentGenre, subgenre) {
  // If we know the parent color, derive from it
  const parentColor = getGenreColor(parentGenre);
  
  // Modify the parent color slightly to create variation
  return adjustColor(parentColor, 20);
}

/**
 * Adjust a hex color by a delta amount
 * @param {string} hexColor - The original hex color
 * @param {number} delta - The amount to adjust by
 * @returns {string} - The adjusted hex color
 */
function adjustColor(hexColor, delta) {
  // Parse the hex color
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Adjust each component
  const newR = Math.max(0, Math.min(255, r + (Math.random() - 0.5) * delta));
  const newG = Math.max(0, Math.min(255, g + (Math.random() - 0.5) * delta));
  const newB = Math.max(0, Math.min(255, b + (Math.random() - 0.5) * delta));
  
  // Convert back to hex
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

/**
 * Hash a genre name to a consistent color
 * @param {string} genreName - The genre name
 * @returns {string} - A hex color code
 */
function genreNameToColor(genreName) {
  let hash = 0;
  for (let i = 0; i < genreName.length; i++) {
    hash = genreName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += value.toString(16).padStart(2, '0');
  }
  
  return color;
}

/**
 * Generate a random set of genres with fractions
 * @param {number} count Number of genres to include
 * @param {string[]} categories Categories to pick from
 * @returns {Array} Array of genre objects with fractions
 */
export function generateRandomGenreSet(count = 4, categories = Object.keys(GENRES)) {
  // Pick random categories
  const shuffledCategories = [...categories].sort(() => Math.random() - 0.5);
  const selectedCategories = shuffledCategories.slice(0, Math.min(count, categories.length));
  
  const result = [];
  let remainingFraction = 1.0;
  
  selectedCategories.forEach((category, index) => {
    // Get all genres from this category
    const genresInCategory = GENRES[category];
    // Pick a random genre from the category
    const genreObj = genresInCategory[Math.floor(Math.random() * genresInCategory.length)];
    
    // For the last item, use the remaining fraction
    let fraction;
    if (index === selectedCategories.length - 1) {
      fraction = remainingFraction;
    } else {
      // Generate a random fraction of what's left, but ensure no fraction is too small
      const minFraction = 0.15;
      const maxFraction = Math.min(0.5, remainingFraction - minFraction * (selectedCategories.length - index - 1));
      fraction = minFraction + Math.random() * (maxFraction - minFraction);
      remainingFraction -= fraction;
    }
    
    result.push({
      genre: genreObj.genre,
      fraction: fraction,
      color: genreObj.color
    });
  });
  
  return result;
}

/**
 * Generate several random genre sets
 * @param {number} count Number of different genre sets to generate
 * @returns {Array} Array of genre sets
 */
export function generateArcSets(count = 20) {
  const sets = [];
  for (let i = 0; i < count; i++) {
    // Vary the number of genres in each set between 2 and 5
    const numGenres = 2 + Math.floor(Math.random() * 4);
    sets.push(generateRandomGenreSet(numGenres));
  }
  return sets;
}

/**
 * Process the genre data from the JSON file to include user counts and colors
 * @param {Object} genresData - The raw genre data from genres.json
 * @returns {Object} - Processed genre data with user counts and colors
 */
export function processGenreData(genresData) {
  const allGenres = {};
  const userCounts = {};
  
  // Process main genres
  Object.entries(genresData).forEach(([mainGenre, data]) => {
    // Generate user counts - main genres have more users
    let userCount = 0;
    
    // Popular genres have more users
    if (["Hip-Hop", "Pop", "Rock"].includes(mainGenre)) {
      userCount = 1000000 + Math.floor(Math.random() * 9000000); // 1M-10M users
    } else if (["EDM", "R&B", "Metal", "Country"].includes(mainGenre)) {
      userCount = 500000 + Math.floor(Math.random() * 1500000); // 500K-2M users
    } else {
      userCount = 100000 + Math.floor(Math.random() * 700000); // 100K-800K users
    }
    
    // Add main genre
    allGenres[mainGenre] = {
      name: mainGenre,
      type: 'main',
      userCount: userCount,
      color: getGenreColor(mainGenre),
      subgenres: data.subgenres || [],
      adjacentGenres: data.adjacentGenres || []
    };
    
    userCounts[mainGenre] = userCount;
    
    // Process subgenres
    if (data.subgenres) {
      data.subgenres.forEach(subgenre => {
        // Subgenres have fewer users - typically 5-30% of main genre
        const percentage = 0.05 + Math.random() * 0.25;
        const subgenreUserCount = Math.floor(userCount * percentage);
        
        allGenres[subgenre] = {
          name: subgenre,
          type: 'sub',
          parentGenre: mainGenre,
          userCount: subgenreUserCount,
          color: getSubgenreColor(mainGenre, subgenre)
        };
        
        userCounts[subgenre] = subgenreUserCount;
      });
    }
  });
  
  return { allGenres, userCounts };
}

/**
 * Format a user count for display (e.g., 1.2M, 450K)
 * @param {number} count - The user count
 * @returns {string} - The formatted count
 */
export function formatUserCount(count) {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return count.toString();
}