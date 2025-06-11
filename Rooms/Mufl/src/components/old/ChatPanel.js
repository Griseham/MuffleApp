import React from 'react';

function ChatPanel({ isOpen, onToggle }) {
    return (
      <div className={`chat-panel ${isOpen ? 'expanded' : 'collapsed'}`}>
        <div className="chat-header">
          <h4>Chat</h4>
          <button className="toggle-btn" onClick={onToggle}>
            {isOpen ? '−' : '+'}
          </button>
        </div>
        {isOpen && (
          <>
            <div className="chat-messages">
              <p>User1: Hello!</p>
              <p>User2: Hello back!</p>
            </div>
            <div className="chat-input">
              <input type="text" placeholder="Type a message..." />
            </div>
          </>
        )}
      </div>
    );
  }

export default ChatPanel;
