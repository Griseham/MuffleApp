// Updated InfoIconModal.jsx with Design 1 (Smoky Gradient Match) and Black & White colors - No hover effects
import React, { useState, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom';
import { StarfieldContext } from './context/Context';
import GlobalModalContext from './context/GlobalModalContext';

// Custom SVG Icons to replace lucide-react
const InfoIcon = ({ size = 18, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <path d="M12 16v-4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const XIcon = ({ size = 18, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ArrowLeftIcon = ({ size = 20, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ArrowRightIcon = ({ size = 20, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const StepCard = ({ step, isOpen, onToggle, iconColor }) => {
  const [showAll, setShowAll] = useState(false);
  const longText = step.content.length > 450;

  const cardStyle = {
    marginBottom: 24,
    borderRadius: 12,
    background: "rgba(255,255,255,0.05)",
    cursor: "pointer"
  };

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "20px 24px",
          fontWeight: 600,
          fontSize: "1.25rem"
        }}
      >
        {step.icon ? step.icon : <InfoIcon size={20} color={iconColor} />}
        <span style={{ marginLeft: 12 }}>{step.title}</span>




      </div>

      {/* Body */}
      {isOpen && (
        <div style={{ padding: "0 24px 24px 24px" }}>
          <div
            style={{
              whiteSpace: 'pre-wrap',
              maxHeight: !showAll && longText ? 160 : "none",
              overflow: !showAll && longText ? "hidden" : "visible",
              lineHeight: 1.7
            }}
          >
            {step.content}
          </div>

          {longText && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAll(!showAll);
              }}
              style={{
                marginTop: 12,
                background: "none",
                border: "none",
                color: "#FFA500",
                cursor: "pointer",
                fontSize: "0.95rem"
              }}
            >
              {showAll ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};


const InfoIconModal = ({
  title = "Information",
  steps = [],
  iconSize = 18,
  iconColor = "#FFA500",
  buttonText = "Info",
  showButtonText = true,
  /** NEW — set this to true when you want the panel on the side */
  sidePanel = true,
  /** Unique identifier for this modal instance */
  modalId = null
}) => {
  // Use global modal state from GlobalModalContext (priority) or StarfieldContext (fallback)
  const globalModalContext = useContext(GlobalModalContext);
  const starfieldContext = useContext(StarfieldContext);
  
  // Priority: use GlobalModalContext if available, otherwise StarfieldContext
  const modalContext = globalModalContext || starfieldContext || {};
  const { openModal, closeModal, isModalOpen } = modalContext;

  // State management
  const [openIndex, setOpenIndex] = useState(0);    // first card open by default
  const [portalContainer, setPortalContainer] = useState(null);
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Generate unique modal ID if not provided - use useState to ensure it's stable
  const [uniqueModalId] = useState(() => 
    modalId || `modal-${title.replace(/\s/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`
  );
  
  // Local state for when context is not available
  const [localIsModalOpen, setLocalIsModalOpen] = useState(false);
  
  // Check if this modal is currently open
  const isThisModalOpen = isModalOpen ? isModalOpen(uniqueModalId) : localIsModalOpen;
  
  // If no custom steps are provided, use a default single step
  const modalSteps = steps.length > 0 ? steps : [
    {
      icon: <InfoIcon size={20} color={iconColor} />,
      title: title,
      color: 'rgba(255, 255, 255, 0.1)',
      iconBg: 'rgba(255, 255, 255, 0.2)',
      content: 'No content provided. Please pass content through the steps prop.'
    }
  ];

  /* ----------  SIDE‑PANEL STYLES ---------- */
  /* Design 1: Smoky Gradient Match - sidePanelStyles inside InfoIconModal.jsx */
  const sidePanelStyles = {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: 'clamp(280px,25%,360px)',
    background: 'radial-gradient(circle at 20% 30%, rgba(34, 34, 34, 0.95) 0%, rgba(17, 17, 17, 0.98) 50%, rgba(0, 0, 0, 0.99) 100%)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
    overflowY: 'auto',
    backdropFilter: 'blur(8px)',
    zIndex: 15000,           // ← raise above every button
    animation: 'slideInRight 0.3s ease-out',
    color: 'white'
  };

  
  // Portal setup for modal
  useEffect(() => {
    // Create portal container when component mounts
    const container = document.createElement('div');
    container.id = `info-modal-portal-${uniqueModalId}`;
    document.body.appendChild(container);
    setPortalContainer(container);
    
    // Cleanup when component unmounts
    return () => {
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, [uniqueModalId]);

  // Event handlers
  const handleOpenModal = (e) => {
    e.stopPropagation(); // Prevent event bubbling to parent elements
    if (openModal) {
      openModal(uniqueModalId);
    } else {
      setLocalIsModalOpen(true);
    }
    setHasBeenClicked(true);
  };
  
  const handleCloseModal = () => {
    if (closeModal) {
      closeModal();
    } else {
      setLocalIsModalOpen(false);
    }
  };
  
  const nextStep = () => {
    setCurrentStep(prev => (prev < modalSteps.length - 1) ? prev + 1 : prev);
  };
  
  const prevStep = () => {
    setCurrentStep(prev => (prev > 0) ? prev - 1 : prev);
  };
  
  // Add key event listener to close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isThisModalOpen) {
        handleCloseModal();
      } else if (e.key === 'ArrowRight' && isThisModalOpen) {
        nextStep();
      } else if (e.key === 'ArrowLeft' && isThisModalOpen) {
        prevStep();
      }
    };
    
    if (isThisModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isThisModalOpen, currentStep, handleCloseModal]);

  // Shared content component for both modal and side panel - Design 1: Card-based Layout
  const ModalContent = () => (
    <>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
        padding: '20px 28px 20px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(30,41,59,0.40)'
      }}>

<h3
  style={{
    fontSize: '1.5rem',          // 24 px
    fontWeight: 600,
    letterSpacing: '0.01em',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',               // 🆕 8 px gap between icon and title
    margin: 0
  }}
>
  <InfoIcon size={20} color="#FFA500" />
  {title}
</h3>

        <button
          onClick={handleCloseModal}
          aria-label="Close"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            padding: '4px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <XIcon size={18} color="white" />
        </button>
      </div>
      
      {/* Card-based Content Area */}
      <div style={{ 
        padding: '16px',
        height: 'calc(100vh - 120px)', // Full height minus header
        overflowY: 'auto'
      }}>
        {steps.map((step, index) => (
  <StepCard
    key={index}
    step={step}
    isOpen={openIndex === index}
    onToggle={() =>
      setOpenIndex(openIndex === index ? -1 : index)
    }
    iconColor={iconColor}
  />
))}

      </div>
      
      {/* Custom scrollbar styles */}
      <style>{`
        /* Custom scrollbar for card container */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.45);
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.65);
        }
      `}</style>
    </>
  );

  return (
    <>
      {/* Info Button with optional text label */}
      <button
        onClick={handleOpenModal}
        className="info-icon-button"
        aria-label="Information"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: showButtonText ? '8px 16px' : '8px',
          borderRadius: showButtonText ? '24px' : '50%',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 25000 // Ensure it's above radio and all other elements
        }}
      >
        <InfoIcon size={iconSize} color={iconColor} />
        {showButtonText && (
          <span style={{ 
            fontSize: '0.875rem',
            color: 'white',
            fontWeight: '500'
          }}>
            {buttonText}
          </span>
        )}
      </button>

      {/* Modal Portal with Design 1: Smoky Gradient Match */}
      {portalContainer && isThisModalOpen && ReactDOM.createPortal(
        sidePanel ? (
          /* --------- SIDE‑PANEL VARIANT ---------- */
          <div 
            style={sidePanelStyles} 
            onClick={e => e.stopPropagation()} /* keep clicks inside */
          >
            <ModalContent />
          </div>
        ) : (
          /* --------- ORIGINAL CENTER MODAL ---------- */
          <div className="modal-backdrop" 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 11000
            }}
            onClick={handleCloseModal}
          >
            <div className="modal-content"
              style={{
                background: 'radial-gradient(circle at 20% 30%, rgba(34, 34, 34, 0.95) 0%, rgba(17, 17, 17, 0.98) 50%, rgba(0, 0, 0, 0.99) 100%)',
                borderRadius: '16px',
                maxWidth: '600px',
                width: '90%',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                position: 'relative',
                color: 'white',
                animation: 'modalFadeIn 0.3s ease-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalContent />
            </div>
          </div>
        ),
        portalContainer
      )}

      {/* Keyframes for animations */}
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default InfoIconModal;