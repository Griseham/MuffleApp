// UPDATED generateRooms.js with fixes for issues B4, R1
// Consolidate this file to be the single source of truth (fix B5)

// Format numbers precisely to avoid floating point issues
const formatNumber = (number) => Math.round(number);

// Generate artists for a station
export const generateStationArtists = (selectedArtists, similarArtists, weight) => {
  const pickRandom = (array, count) => {
    if (array.length <= count) return [...array];
    return [...array].sort(() => 0.5 - Math.random()).slice(0, count);
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const COLORS = [
    '#FF36AB', // Pink
    '#FFB636', // Orange
    '#36EBFF', // Cyan
    '#8436FF', // Purple
    '#FF5036', // Red
    '#36FF64', // Green
    '#3661FF', // Blue
    '#FFDE36'  // Yellow
  ];

  const generateRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  const selectedSubsetSize = Math.max(
    Math.floor(weight * selectedArtists.length),
    1
  );
  
  const selectedSubset = pickRandom(selectedArtists, selectedSubsetSize);
  const similarSubset = pickRandom(similarArtists, 5 - selectedSubset.length);
  
  // Combine and filter for uniqueness and valid images
  return shuffleArray([
    ...selectedSubset,
    ...similarSubset.filter((artist) => artist.image),
  ])
    .filter((artist, index, self) => 
      self.findIndex((a) => a.name === artist.name) === index)
    .slice(0, 5)
    .map(artist => ({
      ...artist,
      color: generateRandomColor(),
      xValue: Math.floor(Math.random() * 7) + 3,
      volume: Math.floor(Math.random() * 7),   // 0-6 arcs
    }));
};

// Generate genres for a station
export const generateStationGenres = (genreOptions) => {
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const COLORS = [
    '#FF36AB', // Pink
    '#FFB636', // Orange
    '#36EBFF', // Cyan
    '#8436FF', // Purple
    '#FF5036', // Red
    '#36FF64', // Green
    '#3661FF', // Blue
    '#FFDE36'  // Yellow
  ];

  const generateRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
  
  const genreCount = Math.floor(Math.random() * 2) + 2;
  return shuffleArray(genreOptions)
    .slice(0, genreCount)
    .map(name => ({
      name,
      points: parseFloat((Math.random() * 1.5 + 0.3).toFixed(1)),
      color: generateRandomColor()
    }));
};

// Generate rooms data with center value and range
export const generateRooms = (selectedArtists, similarArtists, options = {}) => {
  const {
    roomCount = 20,
    centerValue = null,
    range = 100, 
    activeSection = 'volume'
  } = options;
  
  const rooms = [];
  const roomMap = new Map(); // Track rooms by display number to avoid duplicates
  const stationNames = ['KBLX', 'KKSF', 'KITS', 'KMEL', 'KIOI', 'KBAY', 'KFOG', 'KSAN', 'KQED', 'KCBS', 'KMVQ', 'KYLD'];
  
  const genreOptions = [
    'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Alternative', 'Electronic',
    'Country', 'Indie', 'Latin', 'Jazz', 'K-Pop', 'Folk', 'Dance'
  ];
  
  // Determine center values for volume and similarity
  let centerVolume = 1500;  // Default middle of range
  let centerSimilarity = -500; // Default middle of range
  
  if (centerValue) {
    // FIXED B4, R1: Parse the center value reliably
    const parts = centerValue.split('.');
    centerVolume = parseInt(parts[0], 10);
    
    // Handle negative similarity values correctly
    let simPart = parts[1] || '0';
    const isNegative = simPart.includes('-');
    simPart = simPart.replace('-', '');
    centerSimilarity = parseInt(simPart, 10);
    if (isNegative) centerSimilarity *= -1;
  }
  
  for (let i = 0; i < roomCount; i++) {
    const weight = 1 - i / roomCount;
    const enhancedArtists = generateStationArtists(selectedArtists, similarArtists, weight);
    const genres = generateStationGenres(genreOptions);
    
    // Generate room details
    const userCount = Math.floor(Math.random() * 50) + 10;
    const recommendations = Math.floor(Math.random() * 40) + 10;
    const minutes = Math.floor(Math.random() * 70) + 30;
    
    // Generate volume and similarity values around center
    let volume, similarity;
    
    // Scale how far from center based on index (closer to beginning = closer to center)
    const distanceFactor = i / roomCount;
    const maxOffset = range * distanceFactor * 2;
    
    // Generate values around center
    const volumeOffset = Math.floor(Math.random() * maxOffset) - (maxOffset / 2);
    volume = Math.max(0, Math.min(9999, centerVolume + volumeOffset));
    
    // For similarity, respect the -1000 to 100 range
    const similarityOffset = Math.floor(Math.random() * maxOffset) - (maxOffset / 2);
    similarity = Math.max(-1000, Math.min(100, centerSimilarity + similarityOffset));
    
    // Round to nearest 5 units for better snapping
    volume = Math.round(volume / 5) * 5;
    similarity = Math.round(similarity / 5) * 5;
    
    // FIXED B4, R1: Format number to preserve sign and handle precision
    // Format as number with similarity that preserves sign
    let displayNumber = `${formatNumber(volume)}.${similarity < 0 ? '-' : ''}${formatNumber(Math.abs(similarity))}`;
    
    // Avoid duplicate display numbers with tiny offsets
    while (roomMap.has(displayNumber)) {
      // Add a small offset to volume or similarity
      if (Math.random() < 0.5) {
        // Adjust volume by 5
        volume += 5;
      } else {
        // Adjust similarity by 5
        similarity += similarity >= 0 ? 5 : -5;
      }
      displayNumber = `${formatNumber(volume)}.${similarity < 0 ? '-' : ''}${formatNumber(Math.abs(similarity))}`;
    }
    
    // Add to tracking map
    roomMap.set(displayNumber, true);
    
    rooms.push({
      id: `station-${i+1}`,
      name: stationNames[i % stationNames.length],
      displayNumber,
      userCount,
      recommendations,
      minutes,
      artists: enhancedArtists,
      genres,
      volume,
      similarity
    });
  }
  
  return rooms;
};