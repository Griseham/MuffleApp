import React from 'react';
import './QueueLine.css';

function QueueLine({ queueOrder, onClose }) {
  return (
    <div className="queue-line-modal">
      <button className="close-modal-btn" onClick={onClose}>
        X
      </button>
      <div 
        className="queue-line-content" 
        style={{ display: 'flex', alignItems: 'center' }}
      >
        {queueOrder.map((user, index) => {
          const spacing = Math.max(30 - index * 5, 5); // adjust values as needed
          return (
            <div 
              key={user.id} 
              className="queue-item" 
              style={{ marginRight: `${spacing}px`, display: 'flex', alignItems: 'center' }}
            >
              <div className="queue-avatar-container">
                <img
                  src={user.profileImage || 'https://via.placeholder.com/50'}
                  alt={user.username}
                  className="queue-avatar"
                />
              </div>
              {user.marker && (
                <span 
                  className={`zone-label ${user.marker.startsWith('+') ? 'positive' : 'negative'}`}
                >
                  {user.marker}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QueueLine;
