import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

function HistoryPanel({ isOpen, onToggle, history = [] }) {
  return (
    <div className={`room-history-panel ${isOpen ? 'expanded' : 'collapsed'}`}>
      <h4>
        Room History
        <button className="toggle-btn" onClick={onToggle}>
          {isOpen ? '−' : '+'}
        </button>
      </h4>
      {isOpen && (
        <div className="history-list">
          {history.length > 0 ? (
            history.map((entry, idx) => (
              <div key={idx} className="history-item">
                <img
                  src={entry.track.artwork}
                  alt={entry.track.title}
                  className="history-artwork"
                />
                <div className="history-info">
                  <p>{entry.track.title}</p>
                  {entry.direction === 'right' ? (
                    <FaCheck className="history-check" />
                  ) : (
                    <FaTimes className="history-cross" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="no-history-message">No history yet. Swipe a song to see it here.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;
