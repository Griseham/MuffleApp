// GraphModal.jsx
import React, { useRef, useEffect, useState } from 'react';
import { X, Maximize2, Minimize2, Info } from 'lucide-react';
import VerticalRatingsGraph from '../visualizations/VerticalRatingsGraph';
import ScatterRatingsGraph from '../visualizations/ScatterRatingsGraph';

const GraphModal = ({ 
  isOpen, 
  onClose, 
  graphType, 
  graphData, 
  scatterData
}) => {
  const modalRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Add body scrolling lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div 
        ref={modalRef}
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          borderRadius: isFullscreen ? '0' : '16px',
          padding: '24px',
          maxWidth: isFullscreen ? '100%' : '90%',
          width: isFullscreen ? '100%' : '600px',
          maxHeight: isFullscreen ? '100vh' : '90vh',
          height: isFullscreen ? '100vh' : 'auto',
          boxShadow: isFullscreen ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.4)',
          border: isFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
          position: 'relative',
          animation: 'scaleIn 0.3s ease-out',
          transition: 'all 0.3s ease-in-out',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Top control bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 12px 16px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 
            style={{
              color: '#fff',
              margin: '0',
              fontSize: '20px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {graphType === 'vertical' ? 'Rating Comparison' : 'Rating Activity'}
            
            <div 
              style={{ 
                position: 'relative',
                display: 'inline-flex',
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info size={16} color="#8be0ff" style={{ cursor: 'pointer' }} />
              
              {showTooltip && (
                <div style={{
                  position: 'absolute',
                  left: '24px',
                  top: '0',
                  width: '200px',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  {graphType === 'vertical' 
                    ? 'This graph shows your ratings (left bar) compared to community average (right bar)' 
                    : 'This scatter plot shows rating values (Y-axis) and number of ratings (X-axis)'}
                </div>
              )}
            </div>
          </h2>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={toggleFullscreen}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        {/* Graph container with gradient border */}
        <div 
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            margin: '16px 0',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '12px',
            background: 'rgba(0, 0, 0, 0.2)',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Background gradient elements */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle at center, rgba(29, 155, 240, 0.05) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />
          
          {/* Dynamic graph based on type */}
          {graphType === 'vertical' ? (
            <div style={{ 
              width: '100%', 
              maxWidth: isFullscreen ? '700px' : '500px',
              transition: 'max-width 0.3s ease-in-out',
            }}>
              <VerticalRatingsGraph 
                ratings={graphData} 
                placeholders={8} 
                isEnlarged={true}
              />
            </div>
          ) : (
            <div style={{ 
              width: '100%', 
              maxWidth: isFullscreen ? '700px' : '500px',
              transition: 'max-width 0.3s ease-in-out',
            }}>
              <ScatterRatingsGraph 
                scatter={scatterData} 
                isEnlarged={true}
              />
            </div>
          )}
        </div>
        
        {/* Description footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 'auto',
            padding: '16px',
            color: '#aaa',
            fontSize: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ marginBottom: '8px', color: '#8be0ff' }}>
            {graphType === 'vertical' 
              ? 'Insight: Your ratings tend to be higher than community average' 
              : 'Insight: Users with more ratings tend to have more consistent scores'}
          </div>
          
          {graphType === 'vertical' 
            ? 'Each bar pair shows your rating (left) compared to community average (right)' 
            : 'Each point represents a user\'s rating activity and score patterns'}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.98); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default GraphModal;