// Custom hook for audio playback and rating management
import { useState, useRef, useCallback, useEffect } from 'react';
import { getAverageRating, getRandomRatingCount } from './threadHelpers';

export const useAudioRating = (snippetRecs, setSnippetRecs, getSnippetId) => {
  // Audio state
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const [activeSnippet, setActiveSnippet] = useState({
    snippetId: null,
    isPlaying: false,
    elapsedSeconds: 0,
    userRating: null,
    didRate: false,
  });

  // Clean up audio resources
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setActiveSnippet(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // Handle user rating
  const handleUserRate = useCallback((snippetObj, ratingVal) => {
    const realId = getSnippetId(snippetObj);
    if (!realId) return;
  
    const randomAvg = getAverageRating(realId);
    const totalRatingsCount = getRandomRatingCount(realId);
    
    setSnippetRecs(prev => {
      const updatedRecs = prev.map(s => {
        const sId = getSnippetId(s);
        if (sId === realId) {
          return {
            ...s,
            userRating: ratingVal,
            avgRating: randomAvg,
            totalRatings: totalRatingsCount,
            didRate: true
          };
        }
        return s;
      });
      
      return updatedRecs;
    });
    
    setActiveSnippet(prev => ({
      ...prev,
      userRating: ratingVal,
      avgRating: randomAvg,
      totalRatings: totalRatingsCount,
      didRate: true
    }));
  }, [setSnippetRecs, getSnippetId]);

  // Play a snippet
  const playSnippet = useCallback(async (snippetId, previewUrl) => {
    if (activeSnippet.snippetId === snippetId && activeSnippet.isPlaying) {
      stopAudio();
      return;
    }

    stopAudio();
    
    if (!audioRef.current || !previewUrl) {
      return;
    }
    
    audioRef.current.src = previewUrl;
    audioRef.current.load();

    const existingSnippet = snippetRecs.find(s => 
      getSnippetId(s) === snippetId
    );
    
    setActiveSnippet({
      snippetId,
      isPlaying: true,
      elapsedSeconds: 0,
      userRating: existingSnippet?.userRating ?? null,
      didRate: existingSnippet?.didRate ?? false,
    });

    try {
      await audioRef.current.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      stopAudio();
      return;
    }

    intervalRef.current = setInterval(() => {
      setActiveSnippet((prev) => {
        if (prev.elapsedSeconds >= 30) {
          stopAudio();
          return { ...prev, isPlaying: false };
        } 
        
        return { 
          ...prev, 
          elapsedSeconds: prev.elapsedSeconds + 1 
        };
      });
    }, 1000);
  }, [activeSnippet, snippetRecs, stopAudio, getSnippetId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    audioRef,
    activeSnippet,
    playSnippet,
    handleUserRate,
    stopAudio
  };
};