// Global modal state manager for InfoIconModal components
// Ensures only one modal is open at a time with smooth transitions

import { useState, useEffect } from 'react';

class ModalStateManager {
  constructor() {
    this.activeModalId = null;
    this.listeners = new Set();
    this.modalQueue = []; // For handling rapid modal switches
  }

  // Register a listener for modal state changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners of state changes
  notify() {
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(this.activeModalId);
      }
    });
  }

  // Open a modal (closes any existing modal first)
  openModal(modalId, immediate = false) {
    if (this.activeModalId === modalId) {
      return; // Modal is already open
    }

    // If there's another modal open, close it first
    if (this.activeModalId && this.activeModalId !== modalId) {
      if (immediate) {
        // Immediate switch without animation
        this.activeModalId = modalId;
        this.notify();
      } else {
        // Smooth transition: close current, then open new
        this.modalQueue.push(modalId);
        this._closeForTransition();
        
        // Open the new modal after a brief delay for smooth transition
        setTimeout(() => {
          if (this.modalQueue.length > 0) {
            const nextModalId = this.modalQueue.shift();
            this.activeModalId = nextModalId;
            this.notify();
          }
        }, 150); // 150ms delay for smooth transition
      }
    } else {
      // No modal is open, open immediately
      this.activeModalId = modalId;
      this.notify();
    }
  }

  // Internal method to close modal during transition (doesn't clear queue)
  _closeForTransition() {
    if (this.activeModalId) {
      this.activeModalId = null;
      this.notify();
    }
  }

  // Close the currently active modal
  closeModal() {
    if (this.activeModalId) {
      this.activeModalId = null;
      this.modalQueue = []; // Clear any queued modals when explicitly closing
      this.notify();
    }
  }

  // Check if a specific modal is active
  isModalActive(modalId) {
    return this.activeModalId === modalId;
  }

  // Get the currently active modal ID
  getActiveModalId() {
    return this.activeModalId;
  }

  // Check if any modal is open
  hasActiveModal() {
    return this.activeModalId !== null;
  }

  // Force close all modals (emergency cleanup)
  closeAllModals() {
    this.activeModalId = null;
    this.modalQueue = [];
    this.notify();
  }
}

// Create a singleton instance
export const modalStateManager = new ModalStateManager();

// React hook for using the modal state manager
export const useModalState = (modalId) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Initial state
    setIsActive(modalStateManager.isModalActive(modalId));

    // Subscribe to changes
    const unsubscribe = modalStateManager.subscribe((activeModalId) => {
      setIsActive(activeModalId === modalId);
    });

    return unsubscribe;
  }, [modalId]);

  const openModal = (immediate = false) => {
    modalStateManager.openModal(modalId, immediate);
  };

  const closeModal = () => {
    modalStateManager.closeModal();
  };

  return {
    isActive,
    openModal,
    closeModal,
    hasActiveModal: modalStateManager.hasActiveModal()
  };
};

export default modalStateManager;