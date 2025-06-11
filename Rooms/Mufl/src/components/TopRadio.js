import React, { useState, useEffect } from 'react';
import RadioTuner from './RadioTuner';
import './RadioTuner.css';
import './TopRadio.css';

// A complete standalone radio component for TopComponent
const TopRadio = ({ onFrequencyLanded, initialVolume = 1326, initialSimilarity = 46 }) => {
  // State management
  const [activeSection, setActiveSection] = useState('volume');
  const [pendingStation, setPendingStation] = useState(null);   // ← new

  const [volume, setVolume] = useState(initialVolume);
  const [similarity, setSimilarity] = useState(initialSimilarity);



  // Keep track of last landed frequency to prevent multiple notifications
  
  // Handler for RadioTuner changes
  const handleTunerChange = (payload) => {
    // Update state
    if (payload.volume !== undefined) setVolume(payload.volume);
    if (payload.similarity !== undefined) setSimilarity(payload.similarity);
    if (payload.activeSection) setActiveSection(payload.activeSection);
  
    // Store the latest station, but *don’t* open the modal yet
    if (payload.hasPoint && payload.landedFreq !== null) {
      // Decide which number is “volume” and which is “similarity”
      let volumePart, similarityPart;
    
      if (payload.activeSection === 'volume') {
        // We were turning the volume dial
        volumePart      = payload.volume;          // the big green number
        similarityPart  = payload.landedFreq;      // little cyan/red number
      } else {
        // We were turning the similarity dial
        volumePart      = payload.landedFreq;      // big yellow/green number
        similarityPart  = payload.similarity;      // cyan value in the header
      }
    
      setPendingStation({
        freq          : `${volumePart}.${similarityPart}`, // purely cosmetic
        volume        : Number(volumePart),
        similarity    : Number(similarityPart),
        activeSection : payload.activeSection,
        bandIndex     : payload.bandIndex,
        bandFreqs     : payload.bandFreqs
      });
    }
    
  };

  const handleKnobToggle = (armed) => {
    if (!armed && pendingStation) {
      onFrequencyLanded(pendingStation);   // tell TopComponent
      setPendingStation(null);             // reset for next spin
    }
  };
  
  
  return (
    <div className="radio-container w-full">
      <RadioTuner 
  initialVolume={volume}
  initialSimilarity={similarity}
  onChange={handleTunerChange}
  onKnobToggle={handleKnobToggle}     /* NEW */
 />

    </div>
  );
};

export default TopRadio;