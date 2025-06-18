import React, { useState, useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// Import components
import SelectionScreen from './components/SelectionScreen';
import RoomsScreen from './components/RoomsScreen';
import PlayingScreen from './components/PlayingScreen2';

// Global unified styles
import './styles.css';
import './components/Sidebar.css'; // Import Sidebar styles

function App() {
  const [step, setStep] = useState('selection');
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [activeStation, setActiveStation] = useState(null);

  // Refs for CSSTransition components to avoid findDOMNode deprecation warnings
  const selectionRef = useRef(null);
  const roomsRef = useRef(null);
  const playingRef = useRef(null);

  // For demo purposes, let's create some mock selected artists if needed
  const mockSelectedArtists = [
    {
      name: 'Taylor Swift',
      image: '/api/placeholder/200/200',
      id: 'artist-1'
    },
    {
      name: 'Drake',
      image: '/api/placeholder/200/200',
      id: 'artist-2'
    },
    {
      name: 'Billie Eilish',
      image: '/api/placeholder/200/200',
      id: 'artist-3'
    }
  ];

  const handleContinue = (artists) => {
    setSelectedArtists(artists.length > 0 ? artists : mockSelectedArtists);
    setStep('rooms');
  };

  const handleJoinRoom = (station) => {

    setActiveStation(station);   // keep the artists!
    setStep('playing');
  };

  const handleBackToSelection = () => {
    setStep('selection');
  };

  const handleBackToRooms = () => {
    setStep('rooms');
  };

  return (
    <div className="app-container">
      {/* Sidebar - fixed position, won't affect screen layouts */}
   
      
      {/* TransitionGroup manages screen transitions */}
      <TransitionGroup component={null}>
        {step === 'selection' && (
          <CSSTransition
            nodeRef={selectionRef}
            key="selection"
            timeout={300}
            classNames="slide"
            unmountOnExit
          >
            <div ref={selectionRef} style={{ width: '100%' }}>
              <SelectionScreen onContinue={handleContinue} />
            </div>
          </CSSTransition>
        )}

        {step === 'rooms' && (
          <CSSTransition
            nodeRef={roomsRef}
            key="rooms"
            timeout={300}
            classNames="slide"
            unmountOnExit
          >
            <div ref={roomsRef} style={{ width: '100%' }}>
              <RoomsScreen
                selectedArtists={selectedArtists}
                onJoinRoom={handleJoinRoom}
                onBack={handleBackToSelection}
              />
            </div>
          </CSSTransition>
        )}

        {step === 'playing' && (
          <CSSTransition
            nodeRef={playingRef}
            key="playing"
            timeout={300}
            classNames="slide"
            unmountOnExit
          >
            <div ref={playingRef} style={{ width: '100%' }}>
              <PlayingScreen
                station={activeStation}        // <— important
                onBack={handleBackToRooms}
              />
            </div>
          </CSSTransition>
        )}
      </TransitionGroup>
    </div>
  );
}

export default App;