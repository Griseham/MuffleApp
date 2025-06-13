import React, { useState } from 'react';
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
            key="selection"
            timeout={300}
            classNames="slide"
            unmountOnExit
          >
            <SelectionScreen onContinue={handleContinue} />
          </CSSTransition>
        )}

        {step === 'rooms' && (
          <CSSTransition
            key="rooms"
            timeout={300}
            classNames="slide"
            unmountOnExit
          >
            <RoomsScreen
              selectedArtists={selectedArtists}
              onJoinRoom={handleJoinRoom}
              onBack={handleBackToSelection}
            />
          </CSSTransition>
        )}

        {step === 'playing' && (
          <CSSTransition
            key="playing"
            timeout={300}
            classNames="slide"
            unmountOnExit
          >
            <PlayingScreen
              station={activeStation}        // <— important
              onBack={handleBackToRooms}
            />
          </CSSTransition>
        )}
      </TransitionGroup>
    </div>
  );
}

export default App;