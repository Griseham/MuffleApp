// Updated InfoIconModal.jsx with customizable content props
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Info, X, ArrowLeft, ArrowRight } from 'lucide-react';

const InfoIconModal = ({ 
  title = "Information",
  steps = [], 
  iconSize = 18,
  iconColor = "#a9b6fc",
  buttonText = "Info",
  showButtonText = true
}) => {
  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState(null);
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // If no custom steps are provided, use a default single step
  const modalSteps = steps.length > 0 ? steps : [
    {
      icon: <Info size={20} color={iconColor} />,
      title: title,
      color: 'rgba(156, 39, 176, 0.1)',
      iconBg: 'rgba(156, 39, 176, 0.2)',
      content: 'No content provided. Please pass content through the steps prop.'
    }
  ];
  
  // Portal setup for modal
  useEffect(() => {
    // Create portal container when component mounts
    const container = document.createElement('div');
    container.id = 'info-modal-portal';
    document.body.appendChild(container);
    setPortalContainer(container);
    
    // Cleanup when component unmounts
    return () => {
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, []);

  // Event handlers
  const openModal = () => {
    setIsModalOpen(true);
    setHasBeenClicked(true);
  };
  
  const closeModal = () => setIsModalOpen(false);
  
  const nextStep = () => {
    setCurrentStep(prev => (prev < modalSteps.length - 1) ? prev + 1 : prev);
  };
  
  const prevStep = () => {
    setCurrentStep(prev => (prev > 0) ? prev - 1 : prev);
  };
  
  // Add key event listener to close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      } else if (e.key === 'ArrowRight' && isModalOpen) {
        nextStep();
      } else if (e.key === 'ArrowLeft' && isModalOpen) {
        prevStep();
      }
    };
    
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, currentStep]);

  return (
    <>
      {/* Info Button with optional text label */}
      <button
        onClick={openModal}
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
          transition: 'all 0.2s ease',
          boxShadow: hasBeenClicked ? 'none' : '0 0 8px rgba(169, 182, 252, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
        }}
      >
        <Info size={iconSize} color={iconColor} />
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

      {/* Modal Portal with Minimalist Slide-Up Design */}
      {portalContainer && isModalOpen && ReactDOM.createPortal(
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
          onClick={closeModal}
        >
          <div className="modal-content"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '90%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(156, 39, 176, 0.3)',
              position: 'relative',
              color: 'white',
              animation: 'modalFadeIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              borderBottom: '1px solid rgba(156, 39, 176, 0.2)',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(30, 41, 59, 0.3)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                margin: 0
              }}>
                <Info size={18} style={{ marginRight: '10px' }} />
                About {title}
              </h3>
              <button
                onClick={closeModal}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <X size={18} color="white" />
              </button>
            </div>
            
            {/* Content Area */}
            <div style={{ 
              position: 'relative',
              overflow: 'hidden',
              minHeight: '200px',
              padding: '24px'
            }}>
              {/* Content slider */}
              <div style={{
                display: 'flex',
                transform: `translateX(-${currentStep * (100 / modalSteps.length)}%)`,
                transition: 'transform 0.3s ease-in-out',
                width: `${modalSteps.length * 100}%`
              }}>
                {modalSteps.map((step, index) => (
                  <div 
                    key={index} 
                    style={{
                      width: `${100 / modalSteps.length}%`,
                      padding: '0 12px'
                    }}
                  >
                    <div style={{
                      backgroundColor: step.color || 'rgba(156, 39, 176, 0.1)',
                      borderRadius: '12px',
                      padding: '24px',
                      height: '100%'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{
                          backgroundColor: step.iconBg || 'rgba(156, 39, 176, 0.2)',
                          padding: '12px',
                          borderRadius: '50%',
                          marginRight: '16px',
                          display: 'flex',
                          flexShrink: 0
                        }}>
                          {step.icon || <Info size={20} color={iconColor} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: iconColor,
                            marginTop: 0,
                            marginBottom: '12px'
                          }}>
                            {step.title}
                          </h4>
                          <p style={{ 
                            margin: 0,
                            fontSize: '1.30rem',
                            lineHeight: '1.6',
                            color: 'rgba(255, 255, 255, 0.9)'
                          }}>
                            {step.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Navigation Arrows - Only show if multiple steps */}
              {modalSteps.length > 1 && (
                <>
                  {/* Left Arrow */}
                  <button
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '12px',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: currentStep > 0 ? 'pointer' : 'default',
                      opacity: currentStep > 0 ? 1 : 0,
                      pointerEvents: currentStep > 0 ? 'auto' : 'none',
                      transition: 'all 0.2s'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      prevStep();
                    }}
                    disabled={currentStep === 0}
                    aria-label="Previous"
                  >
                    <ArrowLeft size={20} color="white" />
                  </button>
                  
                  {/* Right Arrow */}
                  <button
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: currentStep < modalSteps.length - 1 ? 'pointer' : 'default',
                      opacity: currentStep < modalSteps.length - 1 ? 1 : 0,
                      pointerEvents: currentStep < modalSteps.length - 1 ? 'auto' : 'none',
                      transition: 'all 0.2s'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      nextStep();
                    }}
                    disabled={currentStep === modalSteps.length - 1}
                    aria-label="Next"
                  >
                    <ArrowRight size={20} color="white" />
                  </button>
                </>
              )}
            </div>
            
            {/* Pagination Dots - Only show if multiple steps */}
            {modalSteps.length > 1 && (
              <div style={{ 
                padding: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                borderTop: '1px solid rgba(156, 39, 176, 0.2)',
                backgroundColor: 'rgba(30, 41, 59, 0.3)'
              }}>
                {modalSteps.map((_, index) => (
                  <button 
                    key={index}
                    style={{
                      width: currentStep === index ? '20px' : '8px',
                      height: '8px',
                      borderRadius: '8px',
                      backgroundColor: currentStep === index ? iconColor : 'rgba(255, 255, 255, 0.3)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setCurrentStep(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>,
        portalContainer
      )}

      {/* Keyframes for animations */}
      <style jsx>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default InfoIconModal;