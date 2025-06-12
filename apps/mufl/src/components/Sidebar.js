import React from 'react';

const Sidebar = ({ currentScreen, onNavigate }) => {
  // Navigation items with icons and labels
  const navItems = [
    { 
      id: 'home', 
      label: 'Home',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor" />
        </svg>
      ) 
    },
    { 
      id: 'explore', 
      label: 'Explore',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.5 3.75C14.4705 3.75 17.6957 6.9765 17.6957 10.9485C17.6957 12.7965 17.0199 14.4885 15.9118 15.7658L20.0419 19.8975C20.3231 20.1788 20.3231 20.6295 20.0419 20.9108C19.7606 21.192 19.3099 21.192 19.0286 20.9108L14.8985 16.7807C13.6199 17.889 11.9266 18.5649 10.0785 18.5649C6.1065 18.5649 2.88 15.339 2.88 11.3685C2.88 7.3965 6.1065 4.1715 10.0785 4.1715C10.2199 4.1715 10.361 4.17825 10.5 4.1805V3.75ZM10.0785 5.478C6.8288 5.478 4.1865 8.1203 4.1865 11.37C4.1865 14.6197 6.8288 17.262 10.0785 17.262C13.3282 17.262 15.9705 14.6197 15.9705 11.37C15.9705 8.1203 13.3282 5.478 10.0785 5.478Z" fill="currentColor"/>
        </svg>
      )
    },
    { 
      id: 'radio', 
      label: 'Radio',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 16H4V18H8V16Z" fill="currentColor"/>
          <path d="M12 16H14V18H12V16Z" fill="currentColor"/>
          <path d="M18 16H20V18H18V16Z" fill="currentColor"/>
          <path d="M20 2H8.050C7.800 2 7.570 2.100 7.410 2.270C7.260 2.440 7.160 2.670 7.170 2.910L7.380 9.170C7.500 9.970 8.170 10.130 8.520 10.140V14.000H12V10.140C12.330 10.140 13.000 9.980 13.130 9.170L13.330 2.910C13.340 2.670 13.250 2.440 13.090 2.270C12.930 2.100 12.700 2.000 12.460 2.000H12.000L20 2ZM14.470 8.330C14.470 8.330 14.470 8.360 14.460 8.370C14.410 8.570 14.270 8.600 12.080 8.600H8.450C6.870 8.600 6.080 8.600 6.040 8.370C6.040 8.360 6.030 8.330 6.030 8.330L5.850 3.160L12.650 3.160L12.450 8.330H14.470Z" fill="currentColor"/>
          <path d="M22 6H21V20H3V6H2C1.45 6 1 6.45 1 7V21C1 21.55 1.45 22 2 22H22C22.55 22 23 21.55 23 21V7C23 6.45 22.55 6 22 6Z" fill="currentColor"/>
        </svg>
      )
    },
    { 
      id: 'playlists', 
      label: 'Playlists',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 10H16V12H4V10ZM4 6H16V8H4V6ZM4 14H12V16H4V14ZM14 14H16V16H14V14ZM14 18H16V20H14V18ZM4 18H12V20H4V18ZM14 22H16V24H14V22ZM4 22H12V24H4V22Z" fill="currentColor" />
        </svg>
      ) 
    },
    { 
      id: 'profile', 
      label: 'Profile',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
        </svg>
      ) 
    },
  ];

  return (
    <div className="app-sidebar">
      {/* Logo circle at top */}
      <div className="sidebar-logo">
        <div className="logo-circle">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="#1DB954"/>
            <path d="M16 8C19.3137 8 22 10.6863 22 14C22 17.3137 19.3137 20 16 20C12.6863 20 10 17.3137 10 14C10 10.6863 12.6863 8 16 8ZM16 10C13.7909 10 12 11.7909 12 14C12 16.2091 13.7909 18 16 18C18.2091 18 20 16.2091 20 14C20 11.7909 18.2091 10 16 10ZM16 12C17.1046 12 18 12.8954 18 14C18 15.1046 17.1046 16 16 16C14.8954 16 14 15.1046 14 14C14 12.8954 14.8954 12 16 12Z" fill="white"/>
          </svg>
        </div>
      </div>
      
      {/* Navigation items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentScreen === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
          >
            <div className="nav-icon">{item.icon}</div>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;