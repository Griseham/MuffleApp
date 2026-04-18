import React, { useCallback, useEffect, useState } from 'react';

// Import components
import SelectionScreen from './components/SelectionScreen';
import RoomsScreen from './components/RoomsScreen';
import PlayingScreen from './components/PlayingScreen';
import { clearSessionArtistPool } from './utils/sessionArtistPool';

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
  const INFO_MODAL_EVENT = 'info-modal-change';
  const [step, setStep] = useState('selection');
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [activeStation, setActiveStation] = useState(null);
  const [hasEnteredRooms, setHasEnteredRooms] = useState(false);
  const [selectionResetKey, setSelectionResetKey] = useState(0);

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

  const closeAllInfoModals = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(INFO_MODAL_EVENT, { detail: null }));
  }, []);

  const handleContinue = (artists) => {
    blurActiveElement();
    closeAllInfoModals();
    setHasEnteredRooms(true);
    setSelectedArtists(artists.length > 0 ? artists : mockSelectedArtists);
    setStep('rooms');
  };

  const handleJoinRoom = (station) => {
    blurActiveElement();
    closeAllInfoModals();
    const stationWithSession = {
      ...station,
      _sessionKey: `${station?.id || 'station'}-${Date.now()}`
    };

    setActiveStation(stationWithSession);
    setStep('playing');
  };

  const handleBackToSelection = () => {
    blurActiveElement();
    closeAllInfoModals();
    clearSessionArtistPool();
    setSelectedArtists([]);
    setActiveStation(null);
    setHasEnteredRooms(false);
    setSelectionResetKey((prev) => prev + 1);
    setStep('selection');
  };

  const handleBackToRooms = () => {
    blurActiveElement();
    closeAllInfoModals();
    setStep('rooms');
  };

  const handleResetToSelection = () => {
    handleBackToSelection();
  };

  useEffect(() => {
    // Safety close: ensure no stale side-panel survives screen switches.
    closeAllInfoModals();
  }, [step, closeAllInfoModals]);

  return (
    <div className="app-container">
      <ScreenSlot active={step === 'selection'}>
        <SelectionScreen key={selectionResetKey} onContinue={handleContinue} />
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
          onResetToSelection={handleResetToSelection}
        />
      </ScreenSlot>
    </div>
  );
}

export default App;
