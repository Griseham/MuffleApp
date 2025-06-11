import React, { useEffect, useRef } from 'react';
import './UserModal.css'; // We'll define styling below

function UserModal({ user, onClose }) {
  const modalRef = useRef(null);

  // Close modal if user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!user) {
    return null; // No user selected, no modal
  }

  // Generate random data (just an example)
  const randomVolume = Math.floor(Math.random() * 5000);
  const randomFollowers = Math.floor(Math.random() * 2000);
  const randomFollowing = Math.floor(Math.random() * 10000);
  const randomYear = 2021 + Math.floor(Math.random() * 5); // e.g., 2021–2025
  const randomMonth = ['January','February','May','August','October'][Math.floor(Math.random()*5)];
  const dateJoined = `${randomMonth} ${randomYear}`;

  const userHandle = user.handle || `@${user.username.toLowerCase().replace(/[^a-z0-9]/gi,'')}88`;
  const displayName = user.displayName || user.username;
  
  function handleFollow() {
    // Could do something meaningful here
    console.log(`Followed ${displayName}`);
  }

  return (
    <div className="user-modal-overlay">
      <div className="user-modal-container" ref={modalRef}>
        {/* Close button, if desired */}
        <button className="close-modal-btn" onClick={onClose}>×</button>
        
        <div className="user-modal-header">
          <img
            src={user.profileImage}
            alt={displayName}
            className="user-modal-avatar"
          />
          <h2 className="user-modal-name">{displayName}</h2>
          <p className="user-modal-handle">{userHandle}</p>
          <p className="user-modal-date">Date Joined: {dateJoined}</p>
        </div>

        <div className="user-modal-stats">
          <div className="user-stat">
            <span className="stat-label">Volume:</span>
            <span className="stat-value">{randomVolume}</span>
          </div>
          <div className="user-stat">
            <span className="stat-label">Followers:</span>
            <span className="stat-value">{randomFollowers}</span>
          </div>
          <div className="user-stat">
            <span className="stat-label">Following:</span>
            <span className="stat-value">{randomFollowing}</span>
          </div>
        </div>

        <div className="user-modal-actions">
          <button className="follow-btn" onClick={handleFollow}>
            + Follow
          </button>
          <button className="compare-btn">Compare Timelines</button>
        </div>
      </div>
    </div>
  );
}

export default UserModal;
