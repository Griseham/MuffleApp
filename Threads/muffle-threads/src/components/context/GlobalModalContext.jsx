// GlobalModalContext.jsx - Global modal state management for the entire app
import React, { createContext, useContext, useState, useCallback } from 'react';

// Create context
const GlobalModalContext = createContext({
  openModalId: null,
  setOpenModalId: () => {},
  openModal: () => {},
  closeModal: () => {},
  isModalOpen: () => false
});

// Provider component
export const GlobalModalProvider = ({ children }) => {
  const [openModalId, setOpenModalId] = useState(null);

  // Modal management functions
  const openModal = useCallback((modalId) => {
    setOpenModalId(modalId);
  }, []);

  const closeModal = useCallback(() => {
    setOpenModalId(null);
  }, []);

  const isModalOpen = useCallback((modalId) => {
    return openModalId === modalId;
  }, [openModalId]);

  const contextValue = {
    openModalId,
    setOpenModalId,
    openModal,
    closeModal,
    isModalOpen
  };

  return (
    <GlobalModalContext.Provider value={contextValue}>
      {children}
    </GlobalModalContext.Provider>
  );
};

// Custom hook to use the global modal context
export const useGlobalModal = () => {
  const context = useContext(GlobalModalContext);
  if (!context) {
    throw new Error('useGlobalModal must be used within a GlobalModalProvider');
  }
  return context;
};

export default GlobalModalContext;