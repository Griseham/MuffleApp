// components/RoomLoader.js - Minimal loading component with percentage progress

import React, { useState, useEffect } from 'react';

/**
 * Loading component that displays while rooms are being generated
 * @param {boolean} isLoading - Whether the loader should be displayed
 * @param {function} onBack - Optional back button handler for full screen mode
 * @param {number} progress - Progress percentage (0-100), optional
 * @param {boolean} fullScreen - Whether to show full screen overlay or compact icon
 * @returns {React.ReactNode} - Loading overlay/icon or null
 */
const RoomLoader = ({ isLoading, onBack, progress = null, fullScreen = false }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Update progress with smooth animation
  useEffect(() => {
    if (!isLoading) {
      // reset when the overlay disappears
      setAnimatedProgress(0);
      return;
    }
  
    // Clamp to [0, 100] and make sure we never move backwards
    const next = progress != null ? Math.min(100, progress) : 10;
  
    setAnimatedProgress(prev => (next > prev ? next : prev));
  }, [isLoading, progress]);

  // Debounce visibility to avoid flicker
  useEffect(() => {
    if (isLoading) {
      setVisible(true);
    } else {
      // Keep visible for at least 300ms to avoid flicker
      setTimeout(() => setVisible(false), 300);
    }
  }, [isLoading]);
  

  if (!visible) return null;
  
  // Compact loading icon for room generation
  if (!fullScreen) {
    return (
      <div className="room-loader-icon">
        <div className="spinner"></div>
        <div className="loading-text-compact">Loading rooms...</div>
      </div>
    );
  }
  
  // Full screen loading overlay for initial screen transition
  return (
    <div className="room-loader-overlay">
      {onBack && (
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
      )}
      
      <div className="percentage-content">
        <div className="loading-text">
          {animatedProgress < 30 ? 'Finding similar artists...' :
           animatedProgress < 70 ? 'Generating rooms...' :
           animatedProgress < 95 ? 'Almost ready...' : 'Loading...'}
        </div>
        <div className="percentage-display">{Math.round(animatedProgress)}%</div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${animatedProgress}%` }}
          ></div>
        </div>
      </div>
      
      <style>{`
        .room-loader-icon {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.8);
          padding: 24px;
          border-radius: 12px;
          z-index: 1000;
          backdrop-filter: blur(8px);
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top: 2px solid #4ade80;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text-compact {
          font-size: 14px;
          color: white;
          font-weight: 400;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          opacity: 0.9;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .room-loader-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 50% 50%, #222222 0%, #111111 40%, #000000 100%);
          z-index: 100;
          width: 92%;
          max-width: 900px;
          margin: 0 auto;
          height: 100vh;
          box-sizing: border-box;
          position: relative;
        }

        .back-button {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(18, 18, 18, 0.8);
          border: none;
          font-size: 18px;
          color: white;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          transition: background-color 0.3s;
          backdrop-filter: blur(4px);
        }

        .back-button:hover {
          background-color: #333;
        }

        .percentage-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
        }

        .loading-text {
          font-size: 16px;
          color: white;
          font-weight: 400;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          opacity: 0.9;
        }

        .percentage-display {
          font-size: 24px;
          color: white;
          font-weight: 300;
          font-variant-numeric: tabular-nums;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-width: 60px;
          opacity: 0.8;
        }

        .progress-bar {
          width: 240px;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: white;
          border-radius: 2px;
          transition: width 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RoomLoader;