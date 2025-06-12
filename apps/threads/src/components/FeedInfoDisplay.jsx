import React, { useState } from 'react';
import { TrendingUp, Music, Headphones, Disc, Search } from 'lucide-react';
import InfoIconModal from './InfoIconModal';
/**
 * FeedInfoDisplay component - Takes full width of its container
 * Match the exact design shown in the screenshot
 */
const FeedInfoDisplay = ({ genres = [], artists = [], coordinates = { x: 2, y: 1 }, onLoadGenreFeed }) => {
  const [hoveredGenre, setHoveredGenre] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Handle genre click
  const handleGenreClick = (genre) => {
    if (typeof onLoadGenreFeed === 'function') {
      // Set the selected genre so we can track the state
      setSelectedGenre(genre.name);
      
      // Call the parent's onLoadGenreFeed function to update the wheel
      onLoadGenreFeed(genre.name);
    }
  };

  // Default genres if none provided
  const defaultGenres = [
    { name: "Pop", percentage: 38, color: "#FF9F1C" },
    { name: "R&B", percentage: 23, color: "#8338EC" },
    { name: "Lo-Fi", percentage: 13, color: "#FF6B35" },
    { name: "Indie Rock", percentage: 5, color: "#E17A9F" }
  ];

  // Use provided genres or fallback to defaults
  const safeGenres = genres.length > 0 ? genres : defaultGenres;

  // Generate placeholder artists if needed
  const safeArtists = artists.length > 0 ? artists : [
    { id: 1, name: "Artist", genre: "Pop" },
    { id: 2, name: "Artist", genre: "Pop" },
    { id: 3, name: "Artist", genre: "R&B" }
  ];

  // Get artist discover metrics for YOUR STATS
  const getArtistDiscovers = (genreName) => {
    const discoverMap = {
      "Pop": "3/100",
      "R&B": "8/156",
      "Lo-Fi": "3/100",
      "Indie Rock": "5/112"
    };
    return discoverMap[genreName] || "3/100";
  };

  // Fixed promotion values for top artists (matching screenshot)
  const getTopPromotion = (index) => {
    const values = [400, 375, 350];
    return values[index] || 325;
  };

  // Fixed discovery values for discovered artists (matching screenshot)
  const getDiscoveryValue = (index) => {
    const values = [42, 37, 32];
    return values[index] || 30;
  };

  // Grey avatar placeholder SVG
  const AvatarPlaceholder = () => (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#444" />
    </svg>
  );

  // Discovery icon for YOUR STATS - using circles like in screenshot
  const DiscoveryIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="8" fill="#5E43EC" opacity="0.2" />
      <circle cx="8" cy="8" r="4" fill="#5E43EC" />
    </svg>
  );

  return (
    <div style={{
      width: '100%',
      backgroundColor: '#0c0d16',
      borderRadius: '8px',
      overflow: 'hidden',
      color: 'white',
      fontFamily: 'sans-serif',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.06)'
    }}>
      {/* YOUR STATS SECTION */}
      <div>
        {/* YOUR STATS Header */}
<div style={{
  backgroundColor: '#131429',
  padding: '12px 20px',
  fontWeight: 'bold',
  fontSize: '16px',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
  <span>YOUR STATS</span>
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
        content: "Click on a genre to load the feed with posts of that specific genre. (Doesn't Currently Work)"
      },
      {
        icon: <TrendingUp size={18} color="#a9b6fc" />,
        title: "Top Artists",
        content: "Shows the most promoted artists in this part of the starfield and how many times one of their songs was recommended today"
      }
    ]}
  />
</div>
        {/* YOUR STATS Content - 2 columns */}
        <div style={{
          display: 'flex',
          width: '100%'
        }}>
          {/* GENRES column */}
          <div style={{
            width: '50%',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              backgroundColor: '#14142d',
              padding: '10px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              opacity: 0.7
            }}>
              GENRES
            </div>
            
            <div style={{
              height: '180px',
              overflowY: 'auto'
            }}>
              {safeGenres.map((genre, index) => (
                <div key={`genre-${index}`} style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px' }}>
                      {genre.name}
                    </span>
                    <span style={{ color: genre.color, fontSize: '14px' }}>{genre.percentage}%</span>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginBottom: '5px'
                  }}>
                    <div style={{
                      width: `${genre.percentage}%`,
                      height: '100%',
                      backgroundColor: genre.color,
                      borderRadius: '2px'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#a1a7c4'
                  }}>
                    {getArtistDiscovers(genre.name)} Artists discovered
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* DISCOVERED ARTISTS column */}
          <div style={{ width: '50%' }}>
            <div style={{
              backgroundColor: '#14142d',
              padding: '10px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              opacity: 0.7
            }}>
              DISCOVERED ARTISTS
            </div>
            
            <div style={{
              height: '180px',
              overflowY: 'auto'
            }}>
              {safeArtists.slice(0, 6).map((artist, index) => (
                <div key={`discovered-${index}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <AvatarPlaceholder />
                    <div style={{ marginLeft: '12px' }}>
                      <div style={{ fontSize: '14px' }}>Artist</div>
                      <div style={{ fontSize: '12px', color: '#a1a7c4' }}>{artist.genre}</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#5E43EC'
                  }}>
                    <DiscoveryIcon />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>
                      {getDiscoveryValue(index)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* FEED STATS SECTION */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* FEED STATS Header */}
        <div style={{
          backgroundColor: '#131b29',
          padding: '12px 20px',
          fontWeight: 'bold',
          fontSize: '16px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center'
        }}>
          FEED STATS
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#3a86ff',
            marginLeft: '10px'
          }} />
        </div>
        
        {/* FEED STATS Content - 2 columns */}
        <div style={{
          display: 'flex',
          width: '100%'
        }}>
          {/* GENRES column */}
          <div style={{
            width: '50%',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              backgroundColor: '#14142d',
              padding: '10px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              opacity: 0.7
            }}>
              GENRES
            </div>
            
            <div style={{
              height: '180px',
              overflowY: 'auto'
            }}>
              {safeGenres.map((genre, index) => (
                <div key={`feed-genre-${index}`} style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={() => setHoveredGenre(genre.name)}
                onMouseLeave={() => setHoveredGenre(null)}
                onClick={() => handleGenreClick(genre)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ 
                      fontSize: '14px',
                      color: hoveredGenre === genre.name ? genre.color : 'white',
                      transition: 'color 0.2s ease'
                    }}>
                      {hoveredGenre === genre.name ? `Go to ${genre.name}` : genre.name}
                    </span>
                    <span style={{ fontSize: '14px' }}>12.5K</span>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: hoveredGenre === genre.name ? '100%' : `${genre.percentage}%`,
                      height: '100%',
                      backgroundColor: genre.color,
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* TOP ARTISTS column */}
          <div style={{ width: '50%' }}>
            <div style={{
              backgroundColor: '#14142d',
              padding: '10px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              opacity: 0.7
            }}>
              TOP ARTISTS
            </div>
            
            <div style={{
              height: '180px',
              overflowY: 'auto'
            }}>
              {safeArtists.slice(0, 6).map((artist, index) => (
                <div key={`top-${index}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <AvatarPlaceholder />
                    <div style={{ marginLeft: '12px' }}>
                      <div style={{ fontSize: '14px' }}>Artist</div>
                      <div style={{ fontSize: '12px', color: '#a1a7c4' }}>{artist.genre}</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#4e9bff'
                  }}>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span style={{ 
                        marginRight: '4px', 
                        fontSize: '14px', 
                        color: '#4e9bff',
                        opacity: 0.8 
                      }}>≃</span> {getTopPromotion(index)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollbar styling */}
      <style jsx>{`
        /* For webkit browsers */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default FeedInfoDisplay;