import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './MuflThreadsSidebarLayout.css';

const muffleLogo = '/assets/MuffleLogo.png';

const SUB_NAV_ITEMS = [
  { key: 'rooms', label: 'Rooms', dataContent: 'rooms' },
  { key: 'threads', label: 'Threads', dataContent: 'threads' },
  { key: 'timeline', label: 'Timeline', dataContent: 'timeline' },
];

const SIDEBAR_EXTERNAL_TARGETS = {
  rooms: { label: 'Rooms', url: 'https://mufl.app/rooms/' },
  threads: { label: 'Threads', url: 'https://mufl.app/threads/' },
  timeline: { label: 'Timeline', url: 'https://mufl.app/timeline/' },
  pitch: { label: 'Pitch Deck', url: 'https://mufl.app/?tab=pitch' },
  archives: { label: 'Archives', url: 'https://mufl.app/?tab=archives' },
};

const MuflThreadsSidebarLayout = ({ children, activeItem = 'rooms', shellClassName = '' }) => {
  const [pendingTarget, setPendingTarget] = useState(null);

  const handleNavClick = useCallback((targetKey) => {
    if (targetKey === activeItem) return;
    const target = SIDEBAR_EXTERNAL_TARGETS[targetKey];
    if (!target) return;
    setPendingTarget({ key: targetKey, ...target });
  }, [activeItem]);

  const closeModal = useCallback(() => setPendingTarget(null), []);

  const confirmOpen = useCallback(() => {
    if (typeof window !== 'undefined' && pendingTarget?.url) {
      window.open(pendingTarget.url, '_blank', 'noopener,noreferrer');
    }
    setPendingTarget(null);
  }, [pendingTarget]);

  useEffect(() => {
    if (!pendingTarget || typeof window === 'undefined') return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPendingTarget(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingTarget]);

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
          {SUB_NAV_ITEMS.map(({ key, label, dataContent }) => {
            const isActive = activeItem === key;
            return (
              <button
                key={key}
                type="button"
                className={`threads-home-sidebar__nav-sub-item ${isActive ? 'active' : ''}`}
                data-content={dataContent}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavClick(key)}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="threads-home-sidebar__nav-item"
          data-content="pitch"
          onClick={() => handleNavClick('pitch')}
        >
          Pitch Deck
        </button>

        <button
          type="button"
          className="threads-home-sidebar__nav-item"
          data-content="old-videos"
          onClick={() => handleNavClick('archives')}
        >
          Archives
        </button>
      </aside>

      <div className="mufl-sidebar-app-main">
        {children}
      </div>

      {pendingTarget && typeof document !== 'undefined' && createPortal(
        <div
          role="presentation"
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 32000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(3, 7, 18, 0.7)',
            backdropFilter: 'blur(5px)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidebar-confirm-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(92vw, 420px)',
              borderRadius: '16px',
              border: '1px solid rgba(169, 182, 252, 0.35)',
              background: 'linear-gradient(160deg, rgba(16,22,38,0.96), rgba(11,16,27,0.98))',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
              color: '#dbe6ff',
              padding: '1.2rem 1.1rem 1rem',
            }}
          >
            <h3
              id="sidebar-confirm-title"
              style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#eef2ff' }}
            >
              Open {pendingTarget.label} in new tab?
            </h3>
            <p
              style={{
                margin: '0.65rem 0 0',
                fontSize: '0.92rem',
                lineHeight: 1.55,
                color: 'rgba(219, 230, 255, 0.84)',
              }}
            >
              Do you want to open <strong>{pendingTarget.label}</strong> in a new tab?
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.65rem',
                marginTop: '1rem',
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                style={{
                  borderRadius: '10px',
                  border: '1px solid rgba(148, 163, 184, 0.38)',
                  background: 'rgba(30, 41, 59, 0.85)',
                  color: '#d4def7',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '0.5rem 0.8rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmOpen}
                style={{
                  borderRadius: '10px',
                  border: '1px solid rgba(169, 182, 252, 0.42)',
                  background: 'linear-gradient(120deg, rgba(96, 165, 250, 0.35), rgba(129, 140, 248, 0.5))',
                  color: '#f8faff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  padding: '0.5rem 0.85rem',
                  cursor: 'pointer',
                }}
              >
                Open
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MuflThreadsSidebarLayout;
