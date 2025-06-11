// utils/simplifiedRoomGenerator.js - Simplified room generation based on similarity ranges

// Similarity range configurations
const SIMILARITY_RANGES = {
    HIGH: { min: 800, max: 1000, name: 'high' },
    MEDIUM_HIGH: { min: 500, max: 799, name: 'medium-high' },
    MEDIUM: { min: 300, max: 499, name: 'medium' },
    LOW: { min: 0, max: 299, name: 'low' },
    NEGATIVE: { min: -1000, max: -1, name: 'negative' }
  };
  
  // Get similarity range for a given similarity value
  const getSimilarityRange = (similarity) => {
    for (const range of Object.values(SIMILARITY_RANGES)) {
      if (similarity >= range.min && similarity <= range.max) {
        return range;
      }
    }
    return SIMILARITY_RANGES.NEGATIVE; // fallback
  };
  
  // Generate artist stats based on similarity range and artist type
  const generateArtistStats = (similarityRange, isSelected, position = 0) => {
    let volumeBase, volumeVariation, picksBase, picksVariation;
    
    switch (similarityRange.name) {
      case 'high':
        if (isSelected) {
          volumeBase = 5; // High volume (5-6 bars)
          volumeVariation = 1;
          picksBase = 18; // High picks (18-22)
          picksVariation = 4;
        } else {
          volumeBase = 4; // Medium-high volume (3-5 bars)
          volumeVariation = 2;
          picksBase = 12; // Medium picks (10-15)
          picksVariation = 5;
        }
        break;
        
      case 'medium-high':
        if (isSelected) {
          // Position matters - first slide vs second slide
          if (position < 3) { // First slide (3 artists in 3x2 grid)
            volumeBase = 4;
            volumeVariation = 1;
            picksBase = 14;
            picksVariation = 3;
          } else { // Second slide
            volumeBase = 3;
            volumeVariation = 1;
            picksBase = 8;
            picksVariation = 3;
          }
        } else {
          volumeBase = 4;
          volumeVariation = 2;
          picksBase = 15;
          picksVariation = 5;
        }
        break;
        
      case 'medium':
        if (isSelected) {
          volumeBase = 2; // Lower volume
          volumeVariation = 1;
          picksBase = 6; // Lower picks
          picksVariation = 3;
        } else {
          volumeBase = 4; // Related artists dominate
          volumeVariation = 2;
          picksBase = 16;
          picksVariation = 4;
        }
        break;
        
      case 'low':
        if (isSelected) {
          volumeBase = 1; // Very low volume
          volumeVariation = 1;
          picksBase = 2; // Very low picks
          picksVariation = 2;
        } else {
          volumeBase = 5; // Related artists strongly dominate
          volumeVariation = 1;
          picksBase = 18;
          picksVariation = 3;
        }
        break;
        
      default: // negative or unknown
        volumeBase = 3;
        volumeVariation = 2;
        picksBase = 10;
        picksVariation = 5;
    }
    
    // Generate final values with randomization
    const volume = Math.max(1, Math.min(6, volumeBase + Math.floor(Math.random() * volumeVariation)));
    const picks = Math.max(1, picksBase + Math.floor(Math.random() * picksVariation));
    
    return { volume, picks };
  };
  
  // Determine if selected artists should appear based on similarity range
  const shouldShowSelectedArtists = (similarityRange) => {
    switch (similarityRange.name) {
      case 'high':
        return { probability: 1.0, maxVisible: 4 }; // Always show all
      case 'medium-high':
        return { probability: 0.9, maxVisible: 3 }; // Show most, spread across slides
      case 'medium':
        return { probability: 0.5, maxVisible: 2 }; // Show 50% of the time
      case 'low':
        return { probability: 0.2, maxVisible: 1 }; // Show 20% of the time
      case 'negative':
        return { probability: 0.0, maxVisible: 0 }; // Never show
      default:
        return { probability: 0.0, maxVisible: 0 };
    }
  };
  
  // Shuffle array utility
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  // Generate artists for a single room
  const generateRoomArtists = (selectedArtists, relatedArtists, similarityValue, roomIndex) => {
    const similarityRange = getSimilarityRange(similarityValue);
    const { probability, maxVisible } = shouldShowSelectedArtists(similarityRange);
    
    const roomArtists = [];
    
    // For negative similarity, use random artists only
    if (similarityRange.name === 'negative') {
      // Use related artists as random artists for negative similarity
      const randomArtists = shuffleArray(relatedArtists).slice(0, 18);
      return randomArtists.map((artist, index) => {
        const stats = generateArtistStats(similarityRange, false, index);
        return {
          ...artist,
          volume: stats.volume,
          count: stats.picks,
          isSeed: false,
          isSelected: false
        };
      });
    }
    
    // Determine which selected artists to show (more for 3 slides)
    const selectedToShow = [];
    if (Math.random() < probability && selectedArtists.length > 0) {
      const shuffledSelected = shuffleArray(selectedArtists);
      const numToShow = Math.min(maxVisible * 3, shuffledSelected.length); // Scale up for 3 slides
      selectedToShow.push(...shuffledSelected.slice(0, numToShow));
    }
    
    // Fill remaining slots with related artists
    const availableRelated = shuffleArray(relatedArtists);
    const totalSlots = 18; // 3 slides * 6 artists per slide
    const relatedNeeded = totalSlots - selectedToShow.length;
    const relatedToShow = availableRelated.slice(0, relatedNeeded);
    
    // Combine and position artists based on similarity range for 3 slides
    if (similarityRange.name === 'high') {
      // Selected artists dominate first slide (6), then fill remaining slides
      roomArtists.push(...selectedToShow.slice(0, 6));
      roomArtists.push(...relatedToShow.slice(0, 6));
      roomArtists.push(...selectedToShow.slice(6));
      roomArtists.push(...relatedToShow.slice(6));
    } else if (similarityRange.name === 'medium-high') {
      // Mix selected and related across all three slides
      const firstSlideSelected = selectedToShow.slice(0, 2);
      const secondSlideSelected = selectedToShow.slice(2, 4);
      const thirdSlideSelected = selectedToShow.slice(4);
      
      const firstSlideRelated = relatedToShow.slice(0, 6 - firstSlideSelected.length);
      const secondSlideRelated = relatedToShow.slice(6 - firstSlideSelected.length, 12 - firstSlideSelected.length - secondSlideSelected.length);
      const thirdSlideRelated = relatedToShow.slice(12 - firstSlideSelected.length - secondSlideSelected.length);
      
      roomArtists.push(...firstSlideSelected);
      roomArtists.push(...firstSlideRelated);
      roomArtists.push(...secondSlideSelected);
      roomArtists.push(...secondSlideRelated);
      roomArtists.push(...thirdSlideSelected);
      roomArtists.push(...thirdSlideRelated);
    } else if (similarityRange.name === 'medium') {
      // Related artists dominate first two slides, selected on third
      roomArtists.push(...relatedToShow.slice(0, 12));
      roomArtists.push(...selectedToShow);
      roomArtists.push(...relatedToShow.slice(12));
    } else { // low
      // Selected artists go to end (third slide area)
      roomArtists.push(...relatedToShow.slice(0, 12));
      roomArtists.push(...selectedToShow);
      roomArtists.push(...relatedToShow.slice(12));
    }
    
    // Generate stats for each artist
    return roomArtists.map((artist, index) => {
      const isSelected = selectedArtists.some(selected => selected.name === artist.name);
      const stats = generateArtistStats(similarityRange, isSelected, index);
      
      return {
        ...artist,
        volume: stats.volume,
        count: stats.picks,
        isSeed: isSelected,
        isSelected: isSelected
      };
    }).slice(0, 18); // Ensure exactly 18 artists (3 slides * 6 per slide)
  };
  
  // Generate multiple rooms for a volume range with similarity targeting
  const generateRoomsForVolume = (selectedArtists, relatedArtists, volumeValue, roomCount = 8, targetSimilarity = null) => {
    const rooms = [];
    
    // Station names pool
    const stationNames = [
      'KBLX', 'KKSF', 'KITS', 'KMEL', 'KIOI', 'KBAY', 'KFOG', 'KSAN', 
      'KQED', 'KCBS', 'KMVQ', 'KYLD', 'KPFA', 'KALW', 'KNEW', 'KSFO'
    ];
    
    for (let i = 0; i < roomCount; i++) {
      // Generate slight variation in volume for each room
      const variation = (Math.random() - 0.5) * 200; // ±100 variation
      const roomVolume = Math.round(volumeValue + variation);
      
      // Generate similarity based on target or random
      let roomSimilarity;
      if (targetSimilarity !== null && i === 0) {
        // First room should match the target similarity exactly
        roomSimilarity = targetSimilarity;
      } else if (targetSimilarity !== null && i < 4) {
        // Next few rooms should be close to target similarity
        const similarityVariation = (Math.random() - 0.5) * 100; // ±50 variation
        roomSimilarity = Math.round(targetSimilarity + similarityVariation);
      } else {
        // Other rooms get random similarities (0-1000 range for volume mode)
        roomSimilarity = Math.round(Math.random() * 1000);
      }
      
      // Ensure similarity is within valid range (0-1000 for volume mode)
      roomSimilarity = Math.max(0, Math.min(1000, roomSimilarity));
      
      // Ensure volume is within valid range
      const clampedVolume = Math.max(0, Math.min(3200, roomVolume));
      
      // Generate artists for this room - in volume mode, use random distribution
      const artists = generateVolumeRoomArtists(selectedArtists, relatedArtists, i);
      
      // Create room object
      const room = {
        id: `room-vol-${volumeValue}-${roomSimilarity}-${i}`,
        name: stationNames[i % stationNames.length],
        displayNumber: `${clampedVolume}.${roomSimilarity}`,
        freqNumber: `${clampedVolume}.${roomSimilarity}`,
        volume: clampedVolume,
        similarity: roomSimilarity,
        artists: artists,
        listeners: Math.floor(Math.random() * 50) + 10,
        userCount: Math.floor(Math.random() * 50) + 10,
        minutes: Math.floor(Math.random() * 60) + 20,
        recommendations: Math.floor(Math.random() * 30) + 5,
        showGenreBadge: false,
        dominantGenre: 'volume-mode',
        isTargetRoom: targetSimilarity !== null && i === 0 // Mark the target room
      };
      
      rooms.push(room);
    }
    
    return rooms;
  };
  
  // Generate artists for volume mode rooms (simpler, randomized logic)
  const generateVolumeRoomArtists = (selectedArtists, relatedArtists, roomIndex) => {
    const roomArtists = [];
    
    // Always include some selected artists (6-12 depending on how many we have for 3 slides)
    const selectedToShow = selectedArtists.length > 0 
      ? shuffleArray(selectedArtists).slice(0, Math.min(12, selectedArtists.length))
      : [];
    
    // Fill remaining slots with related artists
    const totalSlots = 18; // 3 slides * 6 artists per slide
    const relatedNeeded = totalSlots - selectedToShow.length;
    const relatedToShow = shuffleArray(relatedArtists).slice(0, relatedNeeded);
    
    // Combine and randomize
    const allArtists = shuffleArray([...selectedToShow, ...relatedToShow]);
    
    // Generate stats for each artist (random for volume mode)
    return allArtists.map((artist, index) => {
      const isSelected = selectedArtists.some(selected => selected.name === artist.name);
      
      // In volume mode, stats are more random/balanced
      const volume = Math.floor(Math.random() * 6) + 1; // 1-6
      const picks = Math.floor(Math.random() * 15) + 3; // 3-17
      
      return {
        ...artist,
        volume: volume,
        count: picks,
        isSeed: isSelected,
        isSelected: isSelected
      };
    }).slice(0, 18); // Ensure exactly 18 artists (3 slides * 6 per slide)
  };
  
  // Generate multiple rooms for a similarity range with volume targeting
  const generateRoomsForSimilarity = (selectedArtists, relatedArtists, similarityValue, roomCount = 8, targetVolume = null) => {
    const rooms = [];
    const similarityRange = getSimilarityRange(similarityValue);
    
    // Station names pool
    const stationNames = [
      'KBLX', 'KKSF', 'KITS', 'KMEL', 'KIOI', 'KBAY', 'KFOG', 'KSAN', 
      'KQED', 'KCBS', 'KMVQ', 'KYLD', 'KPFA', 'KALW', 'KNEW', 'KSFO'
    ];
    
    for (let i = 0; i < roomCount; i++) {
      // Generate slight variation in similarity for each room
      const variation = (Math.random() - 0.5) * 40; // ±20 variation
      const roomSimilarity = Math.round(similarityValue + variation);
      
      // Generate volume based on target or random
      let roomVolume;
      if (targetVolume !== null && i === 0) {
        // First room should match the target volume exactly
        roomVolume = targetVolume;
      } else if (targetVolume !== null && i < 4) {
        // Next few rooms should be close to target volume
        const volumeVariation = (Math.random() - 0.5) * 200; // ±100 variation
        roomVolume = Math.round(targetVolume + volumeVariation);
      } else {
        // Other rooms get random volumes
        const baseVolume = 1000 + Math.random() * 2000;
        roomVolume = Math.round(baseVolume);
      }
      
      // Ensure volume is within valid range
      roomVolume = Math.max(0, Math.min(3200, roomVolume));
      
      // Generate artists for this room
      const artists = generateRoomArtists(selectedArtists, relatedArtists, roomSimilarity, i);
      
      // Create room object
      const room = {
        id: `room-${similarityValue}-${roomVolume}-${i}`,
        name: stationNames[i % stationNames.length],
        displayNumber: `${roomVolume}.${roomSimilarity < 0 ? '-' : ''}${Math.abs(roomSimilarity)}`,
        freqNumber: `${roomVolume}.${roomSimilarity < 0 ? '-' : ''}${Math.abs(roomSimilarity)}`,
        volume: roomVolume,
        similarity: roomSimilarity,
        artists: artists,
        listeners: Math.floor(Math.random() * 50) + 10,
        userCount: Math.floor(Math.random() * 50) + 10,
        minutes: Math.floor(Math.random() * 60) + 20,
        recommendations: Math.floor(Math.random() * 30) + 5,
        showGenreBadge: false,
        dominantGenre: similarityRange.name,
        isTargetRoom: targetVolume !== null && i === 0 // Mark the target room
      };
      
      rooms.push(room);
    }
    
    return rooms;
  };
  
  // Main function to generate rooms based on mode (volume or similarity)
  export const generateSimplifiedRooms = (selectedArtists, relatedArtists, primaryValue, roomCount = 8, targetSecondaryValue = null, mode = 'similarity') => {
    
    if (mode === 'volume') {
      // Volume mode: primaryValue = volume, targetSecondaryValue = similarity
      console.log(`Generating ${roomCount} rooms for volume ${primaryValue}${targetSecondaryValue ? ` targeting similarity ${targetSecondaryValue}` : ''}`);
      
      const rooms = generateRoomsForVolume(selectedArtists, relatedArtists, primaryValue, roomCount, targetSecondaryValue);
      
      // Sort by target room first, then by similarity descending
      rooms.sort((a, b) => {
        if (a.isTargetRoom && !b.isTargetRoom) return -1;
        if (!a.isTargetRoom && b.isTargetRoom) return 1;
        return b.similarity - a.similarity;
      });
      
      return rooms;
      
    } else {
      // Similarity mode: primaryValue = similarity, targetSecondaryValue = volume
      const similarityRange = getSimilarityRange(primaryValue);
      console.log(`Generating ${roomCount} rooms for similarity ${primaryValue} (${similarityRange.name} range)${targetSecondaryValue ? ` targeting volume ${targetSecondaryValue}` : ''}`);
      
      const rooms = generateRoomsForSimilarity(selectedArtists, relatedArtists, primaryValue, roomCount, targetSecondaryValue);
      
      // Sort by target room first, then by volume descending
      rooms.sort((a, b) => {
        if (a.isTargetRoom && !b.isTargetRoom) return -1;
        if (!a.isTargetRoom && b.isTargetRoom) return 1;
        return b.volume - a.volume;
      });
      
      return rooms;
    }
  };
  
  // Helper function to get similarity range info
  export const getSimilarityRangeInfo = (similarityValue) => {
    return getSimilarityRange(similarityValue);
  };
  
  // Export ranges for use in other components
  export { SIMILARITY_RANGES };