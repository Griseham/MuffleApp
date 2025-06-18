import React, { useState, useEffect } from "react";
import SnippetCard from "./SnippetCard";
import BottomContainer from "./BottomContainer";
import TopComponent from "./TopComponent";
import { getAvatarForUser } from "../utils/avatarService";
import axios from "axios";


/**
 * PlayingScreen Component
 * Main component that orchestrates the entire playing screen view
 * Now manages room artists, background fetching of related artists, and Apple Music song fetching
 */
const PlayingScreen = ({ 
  onBack, 
  station = null, // Prop from App.js (activeStation)
  roomData = null // Legacy prop name for compatibility
}) => {  
  // Active tab states and other component states
  const [activeBottomTab, setActiveBottomTab] = useState('Pool');
  const [leftSwipeSongs, setLeftSwipeSongs] = useState([]);
  const [rightSwipeSongs, setRightSwipeSongs] = useState([]);
  const [stationAfterSpin, setStationAfterSpin] = useState(null);
  const [activeTopTab, setActiveTopTab] = useState('radio');
  const [expandedComponent, setExpandedComponent] = useState('bottom');
  const [isChatActive, setIsChatActive] = useState(false);
  const [messages, setMessages] = useState([]);

  // NEW: Room artists management
  const [roomArtists, setRoomArtists] = useState([]);
  const [poolArtists, setPoolArtists] = useState([]);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
  const [backgroundFetchProgress, setBackgroundFetchProgress] = useState(0);

  // NEW: Song management for SnippetCard
  const [currentSongs, setCurrentSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isFetchingSongs, setIsFetchingSongs] = useState(false);
  const [songFetchProgress, setSongFetchProgress] = useState(0);
  const [currentVolume, setCurrentVolume] = useState(station?.volume ?? 1232);
  const [currentSimilarity, setCurrentSimilarity] = useState(station?.similarity ?? 34);
  const [roomFreq, setRoomFreq] = useState(station?.freqNumber ?? '');

  // NEW: Widget song queue management
  const [widgetSongQueue, setWidgetSongQueue] = useState([]);

  // NEW: Track songs that user has added from Widget (for "Your Picks" tab)
  const [yourPicks, setYourPicks] = useState([]);

  // Get API base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

  // Mock data for QL circles with avatars
  const qlUsers = [
    { id: 1, name: "music_lover", volume: 3200, avatar: getAvatarForUser(1) },
    { id: 2, name: "sound_wave", volume: 2800, avatar: getAvatarForUser(2) },
    { id: 3, name: "beat_maker", volume: 2400, avatar: getAvatarForUser(3) },
    { id: 4, name: "audio_freak", volume: 1800, avatar: getAvatarForUser(4) },
    { id: 5, name: "rhythm_guru", volume: 1200, avatar: getAvatarForUser(5) },
    { id: 6, name: "bass_hunter", volume: 2950, avatar: getAvatarForUser(6) },
    { id: 7, name: "synth_master", volume: 2700, avatar: getAvatarForUser(7) },
    { id: 8, name: "deep_grooves", volume: 2500, avatar: getAvatarForUser(8) },
    { id: 9, name: "ambient_vibes", volume: 2200, avatar: getAvatarForUser(9) },
    { id: 10, name: "chill_tones", volume: 1900, avatar: getAvatarForUser(10) },
    { id: 11, name: "drum_circle", volume: 1600, avatar: getAvatarForUser(11) },
    { id: 12, name: "melody_maker", volume: 1400, avatar: getAvatarForUser(12) },
    { id: 13, name: "vocal_artist", volume: 1100, avatar: getAvatarForUser(13) },
    { id: 14, name: "sample_king", volume: 950, avatar: getAvatarForUser(14) },
    { id: 15, name: "track_layer", volume: 800, avatar: getAvatarForUser(15) }
  ];


  // PlayingScreen2.js  – just after your state declarations
useEffect(() => {
  if (window.innerWidth < 480) {
    setExpandedComponent(null);    // both panels start collapsed
  }
}, []);

  // Helper function to generate mock voting data for songs
// In PlayingScreen2.js - Update the generateVotingData function (around line 85)

// Helper function to generate mock voting data for songs with realistic counts (8-20 range)
const generateVotingData = () => ({
  leftCounts: {
    1: Math.floor(Math.random() * 13) + 8, // 8-20
    2: Math.floor(Math.random() * 13) + 8, // 8-20
    3: Math.floor(Math.random() * 13) + 8  // 8-20
  },
  rightCounts: {
    1: Math.floor(Math.random() * 13) + 8, // 8-20
    2: Math.floor(Math.random() * 13) + 8, // 8-20
    3: Math.floor(Math.random() * 13) + 8  // 8-20
  }
});

// Also update the seedCounts helper function (around line 430)
const seedCounts = () => ({ 
  1: Math.floor(Math.random() * 13) + 8, // 8-20
  2: Math.floor(Math.random() * 13) + 8, // 8-20
  3: Math.floor(Math.random() * 13) + 8  // 8-20
});

  // NEW: Function to handle songs added from Widget
// NEW: Function to handle songs added from the Widget
const handleSongFromWidget = (song) => {

  // 1) Build the object that will go into the main queue
  const formattedSong = {
    id: `widget-${Date.now()}-${Math.random()}`,
    track: song.track,
    artist: song.artist,
    album: song.album || '',
    artworkUrl: song.artworkUrl || '',
    previewUrl: song.previewUrl || '',
    sourceArtist: { name: song.artist },
    isFromRoomArtist: false,
    isFromWidget: true,
    color: generateSongColor(song.artist)
  };

  // 2) Queue it so it can surface immediately after the current snippet
  setWidgetSongQueue(prev => [...prev, formattedSong]);

  // 3) Prepare the object that will live in “Your Picks”
  const yourPickSong = {
    ...formattedSong,
    addedAt: new Date().toISOString(),
    ...generateVotingData()      // mock vote counts
  };

  // 4) **Deduplicate** before inserting
  setYourPicks(prev => {
    const exists = prev.some(
      p => p.track === yourPickSong.track && p.artist === yourPickSong.artist
    );
    return exists ? prev : [...prev, yourPickSong];
  });

};


// NEW: Function to fetch a single song quickly from one artist
const fetchSingleSongFromArtist = async (artist) => {
  try {
    
    const res = await axios.post(
      `/apple-music/artist-songs`,
      { artist: artist.name }
    );
    if (!res.data.success) {
      throw new Error(`No song returned for ${artist.name}`);
    }
    const song = res.data.data;
    if (!song.previewUrl) return null;   // try the next artist

    
    const artworkUrl = song.artworkUrl || artist.image;
    const previewUrl = song.previewUrl || '';
    
    return {
      id: `widget-${Date.now()}-${Math.random()}`,
      track: song.trackName || song.track,
      artist: song.artistName || song.artist,
      album: song.albumName || song.album,
      artworkUrl,
      previewUrl,
      sourceArtist: artist,
      isFromRoomArtist: artist.isRoomArtist || false,
      isFromWidget: false,
      color: generateSongColor(artist.name)
    };
  } catch (error) {
  }
  return null;
};

  // NEW: Super optimized first song fetcher - highest priority
  const fetchFirstSongWithPriority = async (artists) => {
    if (!artists || artists.length === 0) return null;
    
    setIsFetchingSongs(true);
    setSongFetchProgress(10);
    
    // Try room artists first for fastest loading
    for (const artist of artists) {
      try {
        const song = await fetchSingleSongFromArtist(artist);
        if (song) {
          setCurrentSongs([song]);
          setCurrentSongIndex(0);
          setSongFetchProgress(100);
          setIsFetchingSongs(false);
          return song;
        }
      } catch (error) {
        continue; // Try next artist
      }
    }
    
    setIsFetchingSongs(false);
    return null;
  };

  // NEW: Function to fetch songs from Apple Music for selected artists (optimized for speed and quantity)
  const fetchSongsFromArtists = async (artists, count = 5, isBackground = false) => {
    if (!artists || artists.length === 0) {
      return [];
    }

    if (!isBackground) {
      setIsFetchingSongs(true);
      setSongFetchProgress(0);
    }

    try {
      
      // Shuffle artists and ensure we get different artists for each song
      const shuffledArtists = [...artists].sort(() => Math.random() - 0.5);
      const selectedArtists = shuffledArtists.slice(0, Math.min(count, artists.length));
      
      if (isBackground) {
        // For background fetching, process sequentially with delays to avoid API strain
        const songs = [];
        
        for (let i = 0; i < selectedArtists.length; i++) {
          const artist = selectedArtists[i];
          
          const song = await fetchSingleSongFromArtist(artist);
          if (song) {
            songs.push(song);
          }
          
          // Add small delay between background requests
          if (i < selectedArtists.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800)); // 800ms delay
          }
        }
        
        return songs;
        
      } else {
        // For immediate fetching, process in parallel for speed
        const songPromises = selectedArtists.map(async (artist, index) => {
          try {
            setSongFetchProgress(Math.round(((index + 1) / selectedArtists.length) * 90));
            return await fetchSingleSongFromArtist(artist);
          } catch (error) {
            return null;
          }
        });

        // Wait for all song fetches to complete
        const results = await Promise.all(songPromises);
        
        // Filter out null results and ensure we have valid songs
        const validSongs = results.filter(song => song !== null);
        
        
        return validSongs;
      }
      
    } catch (error) {
      return [];
    } finally {
      if (!isBackground) {
        setIsFetchingSongs(false);
        setSongFetchProgress(100);
      }
    }
  };

  // Helper function to generate consistent colors for songs
  const generateSongColor = (artistName) => {
    const colors = [
      "#1DB954", "#E91E63", "#FF9800", "#9C27B0", "#2196F3",
      "#F44336", "#4CAF50", "#FF5722", "#3F51B5", "#795548",
      "#607D8B", "#8BC34A", "#CDDC39", "#FFC107", "#00BCD4"
    ];
    
    // Use artist name to generate consistent color
    let hash = 0;
    for (let i = 0; i < artistName.length; i++) {
      hash = artistName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // NEW: Function to fetch more songs when current queue is low
  const fetchMoreSongs = async () => {
    if (poolArtists.length === 0) return;
    
    
    // Get artists that we haven't used yet
    const usedArtistNames = new Set(currentSongs.map(song => song.sourceArtist?.name || song.artist));
    const unusedArtists = poolArtists.filter(artist => !usedArtistNames.has(artist.name));
    
    if (unusedArtists.length === 0) {
      // If no unused artists, just use any artists
      const newSongs = await fetchSongsFromArtists(poolArtists, 3, true);
      if (newSongs.length > 0) {
        setCurrentSongs(prev => [...prev, ...newSongs]);
      }
    } else {
      const newSongs = await fetchSongsFromArtists(unusedArtists, Math.min(3, unusedArtists.length), true);
      if (newSongs.length > 0) {
        setCurrentSongs(prev => [...prev, ...newSongs]);
      }
    }
  };

  // UPDATED: Function to handle song advancement with Widget integration
  const advanceToNextSong = () => {
    setCurrentSongIndex(prev => {
      const nextIndex = prev + 1;
      
      // Check if we have Widget songs waiting to be inserted
      if (widgetSongQueue.length > 0) {
        
        // Take the first Widget song
        const widgetSong = widgetSongQueue[0];
        
        // Remove it from Widget queue
        setWidgetSongQueue(prev => prev.slice(1));
        
        setCurrentSongs(prevSongs => {
          const newSongs = [...prevSongs];
          newSongs.splice(nextIndex, 0, widgetSong);
          return newSongs;
        });
        
      }
      
      // If we're running low on songs (less than 3 remaining), fetch more
      if (currentSongs.length - nextIndex <= 2) {
        fetchMoreSongs();
      }
      
      // If we've reached the end, cycle back to the beginning
      if (nextIndex >= currentSongs.length) {
        return 0;
      }
      
      return nextIndex;
    });
  };

  // NEW: Super optimized loading - first song gets absolute priority
  const initializeSuperOptimizedQueue = async (roomArtists) => {
    if (!roomArtists || roomArtists.length === 0) return;
    
    
    // STEP 1: Get first song with absolute priority (1-2 seconds)
    const firstSong = await fetchFirstSongWithPriority(roomArtists);
    if (!firstSong) {
      return;
    }
    
    // STEP 2: Load 4 more songs from room artists (fast, 3-5 seconds)

    const usedArtistNames = new Set([firstSong.sourceArtist?.name || firstSong.artist]);
    const remainingRoomArtists = roomArtists.filter(artist => !usedArtistNames.has(artist.name));
    
    if (remainingRoomArtists.length > 0) {
      const moreSongs = await fetchSongsFromArtists(remainingRoomArtists, 4, false);
      if (moreSongs.length > 0) {
        setCurrentSongs(prev => [...prev, ...moreSongs]);
      }
    }
    
    // STEP 3: Start background tasks AFTER room songs are ready (8-15 seconds)
    setTimeout(() => {
      fetchRelatedArtistsInBackground(roomArtists);
    }, 3000); // 3 second delay
  };

  // NEW: Function to fetch related artists in background - Enhanced to get 50 total artists WITH IMAGES ONLY
  const fetchRelatedArtistsInBackground = async (seedArtists) => {
    if (!seedArtists || seedArtists.length === 0) return;

    setIsBackgroundFetching(true);
    setBackgroundFetchProgress(0);

    // Helper function to validate image URLs
    const hasValidImage = (artist) => {
      return artist.image && 
             artist.image !== 'fallback.jpg' && 
             artist.image !== '/placeholder-200.png' &&
             !artist.image.includes('placeholder') &&
             !artist.image.includes('picsum') &&
             artist.image.startsWith('http');
    };

    try {
      const allRelatedArtists = new Set();
      const TARGET_TOTAL_ARTISTS = 50; // Target 50 total artists
      const batchSize = 3; // Process 3 artists at a time to avoid API strain
      const delay = 1500; // 1.5 second delay between batches


      // Add original room artists to the pool first (only those with valid images)
      const validRoomArtists = seedArtists.filter(hasValidImage);
      validRoomArtists.forEach(artist => {
        allRelatedArtists.add(JSON.stringify({
          id: artist.id,
          name: artist.name,
          image: artist.image,
          isRoomArtist: true, // Mark as original room artist
          exponents: Math.floor(Math.random() * 6), // Random exponents 0-5
          otherUsers: Math.floor(Math.random() * 5) // Random other users 0-4
        }));
      });


      // Calculate how many related artists we need
      const targetRelatedArtists = TARGET_TOTAL_ARTISTS - validRoomArtists.length;
      

      // If we don't have enough valid room artists, first try to get more from Apple Music
      if (validRoomArtists.length < 10) {
        
        try {
          const response = await fetch(`${API_BASE_URL}/apple-music/random-genre-artists?count=20`);
          if (response.ok) {
            const data = await response.json();
            const appleArtists = data.artists || [];
            
            // Add Apple Music artists to fill the gap
            const validAppleArtists = appleArtists.filter(hasValidImage);
            
            validAppleArtists.slice(0, 15).forEach(artist => {
              allRelatedArtists.add(JSON.stringify({
                id: artist.id,
                name: artist.name,
                image: artist.image,
                isRoomArtist: false,
                exponents: Math.floor(Math.random() * 6),
                otherUsers: Math.floor(Math.random() * 5)
              }));
            });
            
          }
        } catch (appleError) {
        }
      }

      // Process room artists in batches to get related artists
      for (let i = 0; i < validRoomArtists.length; i += batchSize) {
        const batch = validRoomArtists.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(validRoomArtists.length / batchSize);
        
        setBackgroundFetchProgress(Math.round((i / validRoomArtists.length) * 90)); // 0-90% for fetching


        try {
          // Fetch similar artists for this batch using Last.fm WITH FULL URL
          const response = await fetch(`${API_BASE_URL}/lastfm/similar-artists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedArtists: batch.map(a => a.name) })
          });

          if (response.ok) {
            const data = await response.json();
            const similarArtists = data.similarArtists || [];
            

            // Get images for similar artists using Spotify WITH FULL URL
            if (similarArtists.length > 0) {
              const imageResponse = await fetch(`${API_BASE_URL}/spotify/fetch-images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artistNames: similarArtists.map(a => a.name) })
              });

              if (imageResponse.ok) {
                const imageData = await imageResponse.json();
                const artistsWithImages = imageData.artists || [];


                // Filter for artists with VALID images only
                const validArtistsWithImages = artistsWithImages.filter(hasValidImage);

                // Add to our pool - only artists with valid images
                let addedFromBatch = 0;
                
                validArtistsWithImages.forEach(artist => {
                  const artistData = JSON.stringify({
                    id: artist.id || `related-${Date.now()}-${Math.random()}`,
                    name: artist.name,
                    image: artist.image,
                    isRoomArtist: false,
                    exponents: Math.floor(Math.random() * 6),
                    otherUsers: Math.floor(Math.random() * 5)
                  });
                  
                  // Check if we haven't already added this artist
                  if (!allRelatedArtists.has(artistData)) {
                    allRelatedArtists.add(artistData);
                    addedFromBatch++;
                  }
                });
                
              }
            }
          }
        } catch (batchError) {
        }

        // Update progress
        setBackgroundFetchProgress(Math.round(((i + batchSize) / validRoomArtists.length) * 90));

        // Early exit if we've reached our target
        if (allRelatedArtists.size >= TARGET_TOTAL_ARTISTS) {
          break;
        }

        // Delay between batches to avoid API strain
        if (i + batchSize < validRoomArtists.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Convert Set back to array and shuffle
      const finalArtists = Array.from(allRelatedArtists)
        .map(str => JSON.parse(str))
        .sort(() => Math.random() - 0.5);

      // Final validation - ensure all artists have valid images
      const validFinalArtists = finalArtists.filter(hasValidImage);
      

      // If we're short on valid artists, try to get more from Apple Music
      if (validFinalArtists.length < TARGET_TOTAL_ARTISTS) {
        
        try {
          const needed = TARGET_TOTAL_ARTISTS - validFinalArtists.length;
          const response = await fetch(`${API_BASE_URL}/apple-music/random-genre-artists?count=${needed + 10}`);
          
          if (response.ok) {
            const data = await response.json();
            const appleArtists = data.artists || [];
            
            // Add Apple Music artists to fill the gap
            const validAppleArtists = appleArtists
              .filter(hasValidImage)
              .filter(artist => !validFinalArtists.some(existing => 
                existing.name.toLowerCase() === artist.name.toLowerCase()
              ))
              .slice(0, needed)
              .map(artist => ({
                id: artist.id,
                name: artist.name,
                image: artist.image,
                isRoomArtist: false,
                exponents: Math.floor(Math.random() * 6),
                otherUsers: Math.floor(Math.random() * 5)
              }));
            
            validFinalArtists.push(...validAppleArtists);
          }
        } catch (appleError) {
        }
      }

      // Final pool - limit to target and ensure all have valid images
      let finalPool = validFinalArtists.slice(0, TARGET_TOTAL_ARTISTS);
      
      // Double-check all artists have valid images
      finalPool = finalPool.filter(hasValidImage);

      setPoolArtists(finalPool);
      
      const roomArtistCount = finalPool.filter(a => a.isRoomArtist).length;
      const relatedArtistCount = finalPool.filter(a => !a.isRoomArtist).length;
      
   

      // After artist pool is ready, fetch songs from similar artists in background
      if (finalPool.length > 0) {
        const similarArtists = finalPool.filter(a => !a.isRoomArtist);
        if (similarArtists.length > 0) {
          const similarSongs = await fetchSongsFromArtists(similarArtists, 5, true);
          if (similarSongs.length > 0) {
            setCurrentSongs(prev => [...prev, ...similarSongs]);
          }
        }
      }

    } catch (error) {
    } finally {
      setIsBackgroundFetching(false);
      setBackgroundFetchProgress(100);
    }
  };

  useEffect(() => {
    if (!station) return;
    setCurrentVolume(station.volume);
    setCurrentSimilarity(station.similarity);
    setRoomFreq(station.freqNumber);   // save once – use everywhere
    setRoomArtists(station.artists);   // already existed
  }, [station]);
  
  // NEW: Effect to handle room data when joining - SUPER OPTIMIZED
  useEffect(() => {
    // Use station prop (from App.js) or roomData prop (legacy)
    const roomToJoin = station || roomData;
    
    if (roomToJoin && roomToJoin.artists) {
   
      setRoomArtists(roomToJoin.artists);
      setExpandedComponent('bottom');
      setActiveBottomTab('Pool');
      // optionally collapse/clear the top:
      setActiveTopTab(null);
      
      // Update volume/similarity from room data
      if (roomToJoin.volume) setCurrentVolume(roomToJoin.volume);
      if (roomToJoin.similarity) setCurrentSimilarity(roomToJoin.similarity);
      
      // Start SUPER OPTIMIZED loading - first song gets absolute priority
      initializeSuperOptimizedQueue(roomToJoin.artists);
    } else if (roomToJoin) {
    } else {
    }
  }, [station, roomData]);

  // Initialize chat messages (existing)
  useEffect(() => {
    const initialMessages = [
      { username: "bass_drop", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      { username: "ambient_flow", text: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
      { username: "beat_maker", text: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris." },
      { username: "synthesia", text: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum." },
      { username: "wave_form", text: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia." }
    ];
    
    setMessages(initialMessages);
  }, []);
  
  // Handle auto-chat generation (existing)
  useEffect(() => {
    let interval;
    
    if (isChatActive && activeBottomTab === 'Chat') {
      interval = setInterval(() => {
        const loremTexts = [
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
          "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
          "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.",
          "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
          "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
          "Consectetur, adipisci velit, sed quia non numquam eius modi tempora."
        ];
        
        const randomUsername = qlUsers[Math.floor(Math.random() * 5)].name;
        const randomText = loremTexts[Math.floor(Math.random() * loremTexts.length)];
        
        setMessages(prev => [...prev, { username: randomUsername, text: randomText }]);
      }, 500);
    }
    
    return () => clearInterval(interval);
  }, [isChatActive, activeBottomTab, qlUsers]);

  // Toggle chat activity (existing)
  const toggleChatActive = () => setIsChatActive(!isChatActive);

  // Handle component expansion/collapse (existing)
  const handleTopComponentToggle = (isExpanded) => {
    // Expand top when true, otherwise collapse both
    setExpandedComponent(isExpanded ? 'top' : null);
  };
  
  const handleBottomComponentToggle = (isExpanded) => {
    // Expand bottom when true, otherwise collapse both
    setExpandedComponent(isExpanded ? 'bottom' : null);
  };
  
  // Helpers for song swipe handling (existing)
  const rand = () => Math.floor(Math.random() * 4);

  // UPDATED: Main swipe handler with song advancement and Your Picks update
 // In PlayingScreen2.js - Updated handleSongFromWidget function (around line 120)

// NEW: Function to handle songs added from Widget


// UPDATED: Main swipe handler - REMOVE the Your Picks update for Widget songs
const handleSwipe = (song, type, strength) => {
  const updateList = (prev, ownsSwipe) => {
    const idx = prev.findIndex(s => s.id === song.id);

    if (idx === -1) {
      if (!ownsSwipe) return prev;

      const leftCounts = seedCounts();
      const rightCounts = seedCounts();

      if (type === 'down') {
        leftCounts[strength] += 1;
      } else {
        rightCounts[strength] += 1;
      }

      return [
        ...prev,
        {
          ...song,
          leftCounts,
          rightCounts,
          userVoteDirection: type === 'down' ? 'left' : 'right',
          userVoteStrength: strength
        }
      ];
    }

    const next = [...prev];
    const entry = { ...next[idx] };

    if (type === 'down') {
      entry.leftCounts[strength] += 1;
    } else {
      entry.rightCounts[strength] += 1;
    }

    entry.userVoteDirection = type === 'down' ? 'left' : 'right';
    entry.userVoteStrength = strength;

    next[idx] = entry;
    return next;
  };

  setLeftSwipeSongs(prev => updateList(prev, type === 'down'));
  setRightSwipeSongs(prev => updateList(prev, type === 'up'));
  

  if (song.isFromWidget) {
    setYourPicks(prev => prev.map(pick => {
      if (pick.id === song.id) {
        const updatedPick = { ...pick };
        
        if (type === 'down') {
          updatedPick.leftCounts = { ...updatedPick.leftCounts };
          updatedPick.leftCounts[strength] = (updatedPick.leftCounts[strength] || 0) + 1;
        } else {
          updatedPick.rightCounts = { ...updatedPick.rightCounts };
          updatedPick.rightCounts[strength] = (updatedPick.rightCounts[strength] || 0) + 1;
        }
        
        return updatedPick;
      }
      return pick;
    }));
  }
  
  // Advance to next song after swipe
  advanceToNextSong();
};

  // Get current song for SnippetCard
  const getCurrentSong = () => {
    if (currentSongs.length === 0) return null;
    return currentSongs[currentSongIndex] || null;
  };

  return (
    <div className="smoky-gradient relative mx-auto h-screen text-white overflow-hidden flex flex-col" style={{ maxWidth: '800px', boxSizing: 'border-box' }}>
      {/* Back button - as specified */}
<button
  className="absolute top-4 left-4 z-20 text-white bg-black/80 backdrop-blur-sm border-none text-2xl cursor-pointer px-5 py-2.5 rounded-lg transition-colors duration-300 hover:bg-gray-700 focus:outline-none"
  onClick={onBack}
>
  ← Back
</button>
      
      
      {/* Top bar with collapsible content - UPDATED to pass yourPicks */}
      <div className="mt-14">
        <TopComponent
          volume={currentVolume}
          similarity={currentSimilarity}
          activeTab={activeTopTab}
          setActiveTab={setActiveTopTab}
          roomNumber={roomFreq} 
          roomName={station?.name || '----'}  // NEW: Add the 4-letter room name
          isExpanded={expandedComponent === 'top'}
          onToggleExpand={handleTopComponentToggle}
          stationArtists={roomArtists} // Pass room artists for backwards compatibility
          poolArtists={poolArtists}    // NEW: Pass all pool artists (room + related)
          yourSelections={yourPicks}
          onStationChange={(volume, similarity) => {
            setCurrentVolume(volume);
            setCurrentSimilarity(similarity);
          }}
        />
      </div>
      
      {/* Main content area */}
      <div className={`flex-1 flex flex-col items-center justify-center ${
        expandedComponent === 'top' ? 'mb-16' : 'mb-0'
      } transition-all duration-300`}>
        <div className="relative w-full max-w-md">
          <SnippetCard 
            onSwipe={handleSwipe} 
            currentSong={getCurrentSong()}
            isLoading={isFetchingSongs}
            songsQueue={currentSongs}
            currentIndex={currentSongIndex}
          />
        </div>
      </div>
      
      {/* Bottom container */}
      <div className={`transition-all duration-300 ${
        expandedComponent === 'bottom' ? 'h-[360px]' : 'h-16'
      }`}>
        
        <BottomContainer
          activeTab={activeBottomTab}
          setActiveTab={setActiveBottomTab}
          qlUsers={qlUsers}
          messages={messages}
          isChatActive={isChatActive}
          toggleChatActive={toggleChatActive}
          isExpanded={expandedComponent === 'bottom'}
          onToggleExpand={handleBottomComponentToggle}
          leftSwipeSongs={leftSwipeSongs}      
          rightSwipeSongs={rightSwipeSongs}
          poolArtists={poolArtists}
          roomArtists={roomArtists}
          onPoolUpdate={(newArtists) => setPoolArtists(prev => [...prev, ...newArtists])}
          onSongFromWidget={handleSongFromWidget} // NEW: Pass callback for Widget songs
        />
      </div>

      {/* Background Styles */}
<style>{`
        /* Smoky Gradient background */
        .smoky-gradient {
          background: radial-gradient(circle at 50% 50%, #222222 0%, #111111 40%, #000000 100%);
          /* Ensure consistent width handling */
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        
        /* Force consistent scrollbar behavior across all containers */
        * {
          scrollbar-gutter: stable;
        }
      `}</style>
    </div>
  );
};

export default PlayingScreen;