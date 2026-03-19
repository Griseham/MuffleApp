import React, { useState } from 'react';
import { TrendingUp, Music, Headphones, Disc, Search } from 'lucide-react';
import InfoIconModal from './InfoIconModal';

/**
 * FeedInfoDisplay component - Design 3: Minimal with Combined Genre Bar
 */
const FeedInfoDisplay = ({
  genres = [],
  artists = [],
  coordinates = { x: 2, y: 1 },
  onLoadGenreFeed,
  isCollapsed = false
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredGenre, setHoveredGenre] = useState(null);

  // Handle genre click
  const handleGenreClick = (genre) => {
    if (typeof onLoadGenreFeed === 'function') {
      onLoadGenreFeed(genre.name);
    }
  };

  // Default genres if none provided
  const defaultGenres = [
    { name: "Hip-Hop", percentage: 46, color: "#ff4d4f", discovered: "3/100", users: "2.4M" },
    { name: "Rock", percentage: 26, color: "#f442c2", discovered: "3/100", users: "1.8M" },
    { name: "Afrobeat", percentage: 16, color: "#7cb305", discovered: "2/80", users: "890K" },
    { name: "Pop", percentage: 12, color: "#ff66cc", discovered: "5/120", users: "3.1M" }
  ];

  // Default artists if none provided
  const defaultArtists = [
    { name: "Artist", genre: "Hip-Hop", promoted: 325 },
    { name: "Artist", genre: "Hip-Hop", promoted: 325 },
    { name: "Artist", genre: "Hip-Hop", promoted: 325 },
    { name: "Artist", genre: "Rock", promoted: 310 },
  ];

  const safeGenres = genres.length > 0 ? genres : defaultGenres;
  const safeArtists = artists.length > 0 ? artists : defaultArtists;
  const totalPercentage = safeGenres.reduce((acc, g) => acc + g.percentage, 0);

  // Get artist discover metrics
  const getArtistDiscovers = (genreName) => {
    const genre = safeGenres.find(g => g.name === genreName);
    return genre?.discovered || "3/100";
  };

  // Avatar placeholder
  const Avatar = ({ size = 28 }) => (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #2a2a40 0%, #1a1a2e 100%)',
      flexShrink: 0
    }} />
  );

  return (
    <div style={{
      width: '100%',
      background: '#08080f',
      borderRadius: 16,
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      {/* Coordinates Header */}
      <div style={{
        padding: '20px 24px 16px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 10,
            color: '#5a5a7a',
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: 6
          }}>
            Location
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 200,
            fontFamily: 'monospace',
            letterSpacing: 6,
            color: '#fff'
          }}>
            {coordinates.x} • {coordinates.y}
          </div>
        </div>
        <InfoIconModal
          title="Feed Info Display"
          iconSize={16}
          showButtonText={false}
          steps={[
            {
              icon: <TrendingUp size={18} color="#a9b6fc" />,
              title: "Your Stats",
              content: "As you use the app and discover new songs, you will gain genre completion points"
            },
            {
              icon: <Music size={18} color="#a9b6fc" />,
              title: "Earning Points",
              content: "Recommending songs in those genres will also give points"
            },
            {
              icon: <Headphones size={18} color="#a9b6fc" />,
              title: "Following Users",
              content: "Users with high genre completion likely give great song recommendations within that genre and might be worth following"
            },
            {
              icon: <Disc size={18} color="#a9b6fc" />,
              title: "Discovered Artists",
              content: "Shows how many artists you've discovered in this part of the starfield"
            },
            {
              icon: <Search size={18} color="#a9b6fc" />,
              title: "Feed Stats",
              content: "Shows the genre distribution in this part of the starfield"
            },
            {
              icon: <Music size={18} color="#a9b6fc" />,
              title: "Genre Navigation",
              content: "Click on a genre to load the feed with posts of that specific genre"
            },
            {
              icon: <TrendingUp size={18} color="#a9b6fc" />,
              title: "Top Artists",
              content: "Shows the most promoted artists in this part of the starfield and how many times one of their songs was recommended today"
            }
          ]}
        />
      </div>

      {!isCollapsed && (
        <>
          {/* Combined Genre Bar */}
          <div style={{ padding: '16px 24px' }}>
            <div style={{
              display: 'flex',
              height: 10,
              borderRadius: 5,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.03)'
            }}>
              {safeGenres.map((genre, i) => (
                <div
                  key={i}
                  style={{
                    width: `${(genre.percentage / totalPercentage) * 100}%`,
                    height: '100%',
                    background: genre.color,
                    transition: 'transform 0.2s, filter 0.2s',
                    transform: hoveredItem === `genre-${i}` ? 'scaleY(1.4)' : 'scaleY(1)',
                    filter: hoveredItem === `genre-${i}` ? 'brightness(1.2)' : 'brightness(1)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredItem(`genre-${i}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                />
              ))}
            </div>
            
            {/* Genre Pills */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 14,
              justifyContent: 'center'
            }}>
              {safeGenres.map((genre, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    background: hoveredItem === `genre-${i}` 
                      ? `${genre.color}20` 
                      : 'rgba(255,255,255,0.03)',
                    borderRadius: 16,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: `1px solid ${hoveredItem === `genre-${i}` ? `${genre.color}40` : 'transparent'}`
                  }}
                  onMouseEnter={() => setHoveredItem(`genre-${i}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: genre.color
                  }} />
                  <span style={{ fontWeight: 500 }}>{genre.name}</span>
                  <span style={{ color: '#5a5a7a' }}>{genre.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Your Stats & Discovered Artists Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            background: 'rgba(255,255,255,0.04)'
          }}>
            {/* Your Stats */}
            <div style={{ background: '#08080f', padding: 16 }}>
              <div style={{
                fontSize: 10,
                color: '#5a5a7a',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Your Stats
              </div>
              
              {safeGenres.slice(0, 3).map((genre, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 0',
                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 4,
                      height: 18,
                      borderRadius: 2,
                      background: genre.color
                    }} />
                    <span style={{ fontSize: 13 }}>{genre.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>
                      {getArtistDiscovers(genre.name)}
                    </div>
                    <div style={{ fontSize: 9, color: '#5a5a7a' }}>discovered</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Discovered Artists */}
            <div style={{ background: '#08080f', padding: 16 }}>
              <div style={{
                fontSize: 10,
                color: '#5a5a7a',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 12
              }}>
                Discovered Artists
              </div>
              {safeArtists.slice(0, 3).map((artist, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar size={28} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{artist.name}</div>
                      <div style={{ fontSize: 10, color: '#5a5a7a' }}>{artist.genre}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* App-Wide Users & Top Promoted Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            background: 'rgba(255,255,255,0.04)'
          }}>
            {/* App-Wide Users */}
            <div style={{ background: '#08080f', padding: 16 }}>
              <div style={{
                fontSize: 10,
                color: '#5a5a7a',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                App-Wide Users
              </div>
              
              {safeGenres.slice(0, 3).map((genre, i) => (
                <div 
                  key={i} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '9px 0',
                    borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={() => setHoveredGenre(genre.name)}
                  onMouseLeave={() => setHoveredGenre(null)}
                  onClick={() => handleGenreClick(genre)}
                >
                  <span style={{ 
                    fontSize: 13,
                    color: hoveredGenre === genre.name ? genre.color : '#fff',
                    transition: 'color 0.2s ease'
                  }}>
                    {hoveredGenre === genre.name ? `Go to ${genre.name}` : genre.name}
                  </span>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#60a5fa'
                  }}>
                    {genre.users}
                  </div>
                </div>
              ))}
            </div>

            {/* Top Promoted Today */}
            <div style={{ background: '#08080f', padding: 16 }}>
              <div style={{
                fontSize: 10,
                color: '#5a5a7a',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 12
              }}>
                Top Promoted Today
              </div>
              {safeArtists.slice(0, 3).map((artist, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 0',
                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar size={28} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{artist.name}</div>
                      <div style={{ fontSize: 10, color: '#5a5a7a' }}>{artist.genre}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#60a5fa'
                  }}>
                    ≈ {artist.promoted}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FeedInfoDisplay;