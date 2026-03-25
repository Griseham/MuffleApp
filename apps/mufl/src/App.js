import React, { useState } from 'react';

// Import components
import SelectionScreen from './components/SelectionScreen';
import RoomsScreen from './components/RoomsScreen';
import PlayingScreen from './components/PlayingScreen';

// Global unified styles
import './styles.css';
import './components/Sidebar.css'; // Import Sidebar styles

const ScreenSlot = ({ active, keepMounted = true, children }) => {
  if (!keepMounted && !active) return null;

  return (
    <div
      style={{ display: active ? 'block' : 'none', width: '100%' }}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
};

function App() {
  const [step, setStep] = useState('selection');
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [activeStation, setActiveStation] = useState(null);
  const [hasEnteredRooms, setHasEnteredRooms] = useState(false);

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

  const blurActiveElement = () => {
    if (typeof document === 'undefined') return;

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  };

  const handleContinue = (artists) => {
    blurActiveElement();
    setHasEnteredRooms(true);
    setSelectedArtists(artists.length > 0 ? artists : mockSelectedArtists);
    setStep('rooms');
  };

  const handleJoinRoom = (station) => {
    blurActiveElement();
    const stationWithSession = {
      ...station,
      _sessionKey: `${station?.id || 'station'}-${Date.now()}`
    };

    setActiveStation(stationWithSession);
    setStep('playing');
  };

  const handleBackToSelection = () => {
    blurActiveElement();
    setActiveStation(null);
    setStep('selection');
  };

  const handleBackToRooms = () => {
    blurActiveElement();
    setStep('rooms');
  };

  return (
    <div className="app-container">
      <ScreenSlot active={step === 'selection'}>
        <SelectionScreen onContinue={handleContinue} />
      </ScreenSlot>

      <ScreenSlot active={step === 'rooms'} keepMounted={hasEnteredRooms}>
          <RoomsScreen
            selectedArtists={selectedArtists}
            onJoinRoom={handleJoinRoom}
            onBack={handleBackToSelection}
          />
      </ScreenSlot>

      <ScreenSlot active={step === 'playing'} keepMounted={false}>
        <PlayingScreen
          key={activeStation?._sessionKey}
          station={activeStation}        // <— important
          selectedArtists={selectedArtists}
          onBack={handleBackToRooms}
        />
      </ScreenSlot>
    </div>
  );
}

export default App;
