import React from 'react';
import './MuflThreadsSidebarLayout.css';

const muffleLogo = '/assets/MuffleLogo.png';

const SUB_NAV_ITEMS = [
  {
    key: 'rooms',
    label: 'Rooms',
    dataContent: 'rooms',
  },
  {
    key: 'threads',
    label: 'Threads',
    dataContent: 'threads',
  },
  {
    key: 'timeline',
    label: 'Timeline',
    dataContent: 'timeline',
  },
];

const MuflThreadsSidebarLayout = ({ children, activeItem = 'rooms', shellClassName = '' }) => {
  const handlePlaceholderNav = () => {
    // Sidebar mirrors the Threads shell and is intentionally non-routing for now.
  };

  const shellClasses = ['mufl-sidebar-app-shell', shellClassName].filter(Boolean).join(' ');

  return (
    <div className={shellClasses}>
      <aside className="threads-home-sidebar" aria-label="Mufl navigation">
        <div className="threads-home-sidebar__logo">
          <div className="threads-home-sidebar__logo-wrapper">
            <div
              className="threads-home-sidebar__logo-circle"
              style={{ backgroundImage: `url(${muffleLogo})` }}
            />
          </div>
        </div>

        <div className="threads-home-sidebar__nav-section">
          <div className="threads-home-sidebar__nav-header">Mufl</div>
          {SUB_NAV_ITEMS.map(({ key, label, dataContent }) => (
            <button
              key={key}
              type="button"
              className={`threads-home-sidebar__nav-sub-item ${activeItem === key ? 'active' : ''}`}
              data-content={dataContent}
              onClick={handlePlaceholderNav}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="threads-home-sidebar__nav-item"
          data-content="pitch"
          onClick={handlePlaceholderNav}
        >
          Pitch Deck
        </button>

        <button
          type="button"
          className="threads-home-sidebar__nav-item"
          data-content="old-videos"
          onClick={handlePlaceholderNav}
        >
          Archives
        </button>
      </aside>

      <div className="mufl-sidebar-app-main">
        {children}
      </div>
    </div>
  );
};

export default MuflThreadsSidebarLayout;
