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
        if (position < 10) { // First page (10 artists)
            volumeBase = 4;
            volumeVariation = 1;
            picksBase = 14;
            picksVariation = 3;
        } else { // Second page
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
  
  const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4" fill="%23222"/><path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" fill="%23222"/></svg>';

  const getRoomArtistKey = (artist, roomIndex, index) => {
    const baseId = artist?.id || artist?.name || 'artist';
    return `${baseId}-${roomIndex}-${index}`;
  };

  const buildRoomProgressMinutes = () => Math.floor(Math.random() * 31) + 5; // 5..35

  // Generate artists for a single room
  const generateRoomArtists = (selectedArtists, relatedArtists, similarityValue, roomIndex) => {
    const similarityRange = getSimilarityRange(similarityValue);
    const { probability, maxVisible } = shouldShowSelectedArtists(similarityRange);
    
    const roomArtists = [];
    
    // For negative similarity, use random artists only
    if (similarityRange.name === 'negative') {
      // Use related artists as random artists for negative similarity
      const randomArtists = shuffleArray(relatedArtists).slice(0, 20);
      return randomArtists.map((artist, index) => {
        const stats = generateArtistStats(similarityRange, false, index);
        return {
          ...artist,
          roomArtistKey: getRoomArtistKey(artist, roomIndex, index),
          volume: stats.volume,
          count: stats.picks,
          isSeed: false,
          isSelected: false
        };
      });
    }
    
    // Determine which selected artists to show (more for 2 pages)
    const selectedToShow = [];
    if (Math.random() < probability && selectedArtists.length > 0) {
      const shuffledSelected = shuffleArray(selectedArtists);
    const numToShow = Math.min(maxVisible * 2, shuffledSelected.length); // Scale up for 2 pages
      selectedToShow.push(...shuffledSelected.slice(0, numToShow));
    }
    
    // Fill remaining slots with related artists
    const availableRelated = shuffleArray(relatedArtists);
    const totalSlots = 20; // 2 pages * 10 artists per page
    const relatedNeeded = totalSlots - selectedToShow.length;
    const relatedToShow = availableRelated.slice(0, relatedNeeded);
    
    // Combine and position artists based on similarity range for 2 pages (10 + 10)
    if (similarityRange.name === 'high') {
      // Selected artists dominate first page (10)
      const firstPageSelected = selectedToShow.slice(0, 10);
      const secondPageSelected = selectedToShow.slice(10);

      const firstPageRelated = relatedToShow.slice(0, 10 - firstPageSelected.length);
      const secondPageRelated = relatedToShow.slice(10 - firstPageSelected.length);

      roomArtists.push(...firstPageSelected, ...firstPageRelated);
      roomArtists.push(...secondPageSelected, ...secondPageRelated);
    } else if (similarityRange.name === 'medium-high') {
      // Mix selected into both pages (cap so it still feels “tuned”)
      const firstPageSelected = selectedToShow.slice(0, 4);
      const secondPageSelected = selectedToShow.slice(4, 8);

      const firstPageRelated = relatedToShow.slice(0, 10 - firstPageSelected.length);
      const secondPageRelated = relatedToShow.slice(
        10 - firstPageSelected.length,
        20 - firstPageSelected.length - secondPageSelected.length
      );

      roomArtists.push(...firstPageSelected, ...firstPageRelated);
      roomArtists.push(...secondPageSelected, ...secondPageRelated);
    } else if (similarityRange.name === 'medium') {
      // Related dominate page 1; selected show more on page 2
      const firstPageRelated = relatedToShow.slice(0, 10);
      const remainingRelated = relatedToShow.slice(10);

      roomArtists.push(...firstPageRelated);
      roomArtists.push(...selectedToShow, ...remainingRelated);
    } else { // low
      // Selected pushed toward the end (page 2)
      const firstPageRelated = relatedToShow.slice(0, 10);
      const remainingRelated = relatedToShow.slice(10);

      roomArtists.push(...firstPageRelated);
      roomArtists.push(...remainingRelated, ...selectedToShow);
    }
    
    // Generate stats for each artist and ensure image fallback
    return roomArtists.map((artist, index) => {
      const isSelected = selectedArtists.some(selected => selected.name === artist.name);
      const stats = generateArtistStats(similarityRange, isSelected, index);
      const safeImage = artist?.image || artist?.artworkUrl || artist?.picture || artist?.img || PLACEHOLDER_IMG;
      
      return {
        ...artist,
        roomArtistKey: getRoomArtistKey(artist, roomIndex, index),
        image: safeImage,
        volume: stats.volume,
        count: stats.picks,
        isSeed: isSelected,
        isSelected: isSelected
      };
    }).slice(0, 20); // Ensure exactly 20 artists (2 pages * 10 per page)
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
      
      // Generate similarity (keep ALL rooms near tuned similarity when provided)
      let roomSimilarity;
      if (targetSimilarity !== null) {
        if (i === 0) {
          roomSimilarity = targetSimilarity;
        } else {
          const similarityVariation = (Math.random() - 0.5) * 140; // ±70 variation
          roomSimilarity = Math.round(targetSimilarity + similarityVariation);
        }
      } else {
        // No target provided -> free/random in full range
        roomSimilarity = Math.round((Math.random() * 2000) - 1000); // -1000..1000
      }
      
      // Ensure similarity is within valid range (-1000..1000)
      roomSimilarity = Math.max(-1000, Math.min(1000, roomSimilarity));
      
      // Ensure volume is within valid range
      const clampedVolume = Math.max(0, Math.min(3200, roomVolume));
      
      // Generate artists for this room - in volume mode, use random distribution
      const artists = generateVolumeRoomArtists(selectedArtists, relatedArtists, i);
      
      // Create room object
      const room = {
        id: `room-vol-${volumeValue}-${roomSimilarity}-${i}`,
        name: stationNames[i % stationNames.length],
        displayNumber: `${clampedVolume}.${roomSimilarity < 0 ? '-' : ''}${Math.abs(roomSimilarity)}`,
        freqNumber: `${clampedVolume}.${roomSimilarity < 0 ? '-' : ''}${Math.abs(roomSimilarity)}`,
        volume: clampedVolume,
        similarity: roomSimilarity,
        artists: artists,
        listeners: Math.floor(Math.random() * 50) + 10,
        userCount: Math.floor(Math.random() * 50) + 10,
        minutes: buildRoomProgressMinutes(),
        totalMinutes: 40,
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
    
    // Always include some selected artists (6-12 depending on how many we have for 2 pages)
    const selectedToShow = selectedArtists.length > 0 
      ? shuffleArray(selectedArtists).slice(0, Math.min(12, selectedArtists.length))
      : [];
    
    // Fill remaining slots with related artists
    const totalSlots = 20; // 2 pages * 10 artists per page
    const relatedNeeded = totalSlots - selectedToShow.length;
    const relatedToShow = shuffleArray(relatedArtists).slice(0, relatedNeeded);
    
    // Combine and randomize
    const allArtists = shuffleArray([...selectedToShow, ...relatedToShow]);
    
    // Generate stats for each artist (random for volume mode)
    return allArtists.map((artist, index) => {
      const isSelected = selectedArtists.some(selected => selected.name === artist.name);
      const safeImage = artist?.image || artist?.artworkUrl || artist?.picture || artist?.img || PLACEHOLDER_IMG;
      
      // In volume mode, stats are more random/balanced
      const volume = Math.floor(Math.random() * 6) + 1; // 1-6
      const picks = Math.floor(Math.random() * 15) + 3; // 3-17
      
      return {
        ...artist,
        roomArtistKey: getRoomArtistKey(artist, roomIndex, index),
        image: safeImage,
        volume: volume,
        count: picks,
        isSeed: isSelected,
        isSelected: isSelected
      };
    }).slice(0, 20); // Ensure exactly 20 artists (2 pages * 10 per page)
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
      
      // Generate volume (keep ALL rooms near tuned volume when provided)
      let roomVolume;
      if (targetVolume !== null) {
        if (i === 0) {
          // First room should match the target volume exactly
          roomVolume = targetVolume;
        } else {
          // All other rooms stay near target volume (not random)
          const volumeVariation = (Math.random() - 0.5) * 260; // ±130 variation
          roomVolume = Math.round(targetVolume + volumeVariation);
        }
      } else {
        // No target provided -> free/random
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
        minutes: buildRoomProgressMinutes(),
        totalMinutes: 40,
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
