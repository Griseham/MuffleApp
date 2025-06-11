import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

function TrackPanel({ isOpen, onToggle, userStats = {}, staticUsers = [], onUserIconClick }) {
  // Filter entries where user has at least one like or dislike
  const votedUsers = Object.entries(userStats).filter(
    ([, stats]) => (stats.likes || 0) > 0 || (stats.dislikes || 0) > 0
  );

  return (
    <div className={`track-panel ${isOpen ? 'expanded' : 'collapsed'}`}>
      <h4>
        Track Votes
        <button className="toggle-btn" onClick={onToggle}>
          {isOpen ? '−' : '+'}
        </button>
      </h4>
      {isOpen && (
        <div className="track-vote-list">
          {votedUsers.length > 0 ? (
            votedUsers.map(([userId, stats]) => {
              const user = staticUsers.find((u) => u.id === userId) || {
                username: `User ${userId}`,
                profileImage: 'https://via.placeholder.com/50?text=A',
              };
              return (
                <div key={userId} className="track-vote-item">
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    className="track-user-icon"
                    onClick={() => onUserIconClick?.(user)}

                  />
                  <p className="track-user-name">{user.username}</p>
                  <div className="user-votes">
                    {[...Array(stats.likes || 0)].map((_, i) => (
                      <FaCheck key={`like-${userId}-${i}`} className="like-icon" />
                    ))}
                    {[...Array(stats.dislikes || 0)].map((_, i) => (
                      <FaTimes key={`dislike-${userId}-${i}`} className="dislike-icon" />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-users-message">No track yet...</p>
          )}
        </div>
      )}
    </div>
  );
}

export default TrackPanel;
