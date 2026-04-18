import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, Pause, Headphones, Volume2, Music, 
  Mic, Users, Lock
} from 'lucide-react';
import InfoIconModal from '../InfoIconModal';
import { 
  getRandomNumber, 
  hashString, 
  generateUsername
} from './postCardUtils';

const ExpandedPostContent = ({ post, themeColor, _genres, getRgbaFromHex }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumeGain, setVolumeGain] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 1280 : window.innerWidth
  );

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth || 1280);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isPhone = viewportWidth <= 767;
  const isTabletPortrait = viewportWidth >= 768 && viewportWidth <= 1024;
  const isCompactPhone = viewportWidth <= 390;
  
  const songData = useMemo(() => {
    const seed = hashString(post.id);
    
    const artistNames = [
      "Ariana Grande", "Bad Bunny", "Drake", "Post Malone", "Dua Lipa",
      "SZA", "Frank Ocean", "Beyoncé", "Taylor Swift", "Kendrick Lamar",
      "Billie Eilish", "The Weeknd", "Lana Del Rey", "Travis Scott", "Tyler, The Creator"
    ];
    
    const songNames = [
      "Starlight Dreams", "Ocean Eyes", "Midnight Run", "Dreamscape",
      "Cosmic Wave", "Electric Soul", "Desert Moon", "Mountain High",
      "City Nights", "Island Breeze", "Neon Shadows", "Velvet Sky",
      "Golden Hour", "Silver Lining", "Purple Rain", "Diamond Dust"
    ];
    
    const artistIndex = (seed * 7) % artistNames.length;
    const songIndex = (seed * 13) % songNames.length;
    
    const recommenderUsername = generateUsername();
    
    return {
      id: `song-${post.id}`,
      artist: artistNames[artistIndex],
      song: songNames[songIndex],
      duration: `${2 + seed % 3}:${10 + (seed * 3) % 50}`,
      volumeBoost: getRandomNumber(4, 19),
      recommender: {
        username: recommenderUsername,
        displayName: recommenderUsername,
        timeAgo: `${getRandomNumber(1, 24)}h ago`,
        avatar: `/assets/user${getRandomNumber(1, 10)}.png`
      }
    };
  }, [post.id]);

  const artistsList = useMemo(() => {
    const seed = hashString(post.id);
    const totalArtists = 260;
    const discoveredCount = 76;
    
    const artistNames = [
      "H.E.R.", "Ariana", "Charli", "The", "Olivia", "Anderson", "Doja", "BTS", 
      "Bruno", "Steve", "Taylor", "Kid", "Drake", "Frank", "Brent", "Tame",
      "SZA", "Jack", "Mac", "FINNEAS", "Kendrick", "Lana", "Billie", "Bad"
    ];
    
    const discovered = Array.from({ length: 16 }, (_, i) => {
      const artistIndex = (seed + i * 13) % artistNames.length;
      return {
        id: `artist-${i}`,
        name: artistNames[artistIndex],
        multiplier: getRandomNumber(2, 4),
        isDiscovered: true,
        color: i % 5 === 0 ? "#4ade80" : i % 4 === 0 ? "#ec4899" : i % 3 === 0 ? "#818cf8" : i % 2 === 0 ? "#f97316" : "#22d3ee"
      };
    });
    
    const undiscovered = Array.from({ length: 12 }, (_, i) => {
      return {
        id: `undiscovered-${i}`,
        name: "???",
        multiplier: getRandomNumber(2, 4),
        isDiscovered: false,
        color: "#4a5568"
      };
    });
    
    return {
      discovered,
      undiscovered,
      discoveredCount,
      totalCount: totalArtists
    };
  }, [post.id]);
  
  const handlePlaySnippet = (e) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      const targetVolume = songData.volumeBoost;
      setVolumeGain(0);
      const animateVolume = () => {
        setVolumeGain(prev => {
          const newValue = prev + (targetVolume * 0.1);
          return newValue >= targetVolume ? targetVolume : newValue;
        });
      };
      
      const volumeInterval = setInterval(animateVolume, 200);
      setTimeout(() => clearInterval(volumeInterval), 2000);
    }
  };

  const outerPadding = isPhone ? '14px 12px' : isTabletPortrait ? '16px' : '20px';
  const layoutStyle = isPhone
    ? {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }
    : {
        display: 'grid',
        gridTemplateColumns: isTabletPortrait ? 'minmax(0, 230px) minmax(0, 1fr)' : 'minmax(0, 240px) minmax(0, 1fr)',
        gap: isTabletPortrait ? '14px' : '20px',
        alignItems: 'start',
      };
  const topSongCardHeight = isPhone ? 270 : isTabletPortrait ? 286 : 300;
  const topSongPreviewHeight = isPhone ? 126 : isTabletPortrait ? 134 : 140;
  const artistPanelHeight = isPhone ? 252 : isTabletPortrait ? 286 : 300;
  const artistGridColumns = isPhone
    ? (isCompactPhone ? 'repeat(3, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))')
    : (isTabletPortrait ? 'repeat(4, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))');
  const artistAvatarSize = isPhone ? (isCompactPhone ? 40 : 44) : 48;
  const artistBadgeSize = isPhone ? 18 : 20;
  
  return (
    <div style={{
      padding: outerPadding,
      borderTop: `1px solid ${getRgbaFromHex(themeColor, 0.3)}`,
      background: `linear-gradient(to bottom, ${getRgbaFromHex(themeColor, 0.05)}, rgba(30, 39, 50, 0.8))`,
    }}>
      <div style={layoutStyle}>
        <div style={{ width: isPhone ? '100%' : (isTabletPortrait ? '230px' : '240px') }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
          }}>
            <Headphones size={18} color={themeColor} style={{ marginRight: '8px' }} />
            <span style={{ fontWeight: '700', fontSize: isPhone ? '15px' : '16px', color: 'white' }}>
              Top Song Recommendation
            </span>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(30, 45, 60, 0.6)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: `1px solid ${getRgbaFromHex(themeColor, 0.3)}`,
            height: `${topSongCardHeight}px`,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              height: `${topSongPreviewHeight}px`,
              backgroundColor: 'rgba(20, 30, 40, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
              onClick={handlePlaySnippet}
            >
              <div style={{
                width: isPhone ? '56px' : '64px',
                height: isPhone ? '56px' : '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isPlaying ? (
                  <Pause size={isPhone ? 28 : 32} color="white" />
                ) : (
                  <Play size={isPhone ? 28 : 32} color="white" />
                )}
              </div>
            </div>
            
            <div style={{ 
              padding: '16px',
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 0,
            }}>
              <div>
                <div style={{
                  fontSize: isPhone ? '16px' : '18px',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '4px'
                }}>
                  {songData.song}
                </div>
                <div style={{
                  fontSize: isPhone ? '13px' : '14px',
                  color: '#a0aec0',
                  marginBottom: '16px'
                }}>
                  {songData.artist}
                </div>
              </div>
              
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Music size={14} color="#a0aec0" />
                    <span style={{ color: '#a0aec0', fontSize: '13px' }}>
                      {songData.duration}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'rgba(15, 24, 35, 0.7)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    color: isPlaying ? '#10b981' : '#a0aec0',
                    fontWeight: '600'
                  }}>
                    <Volume2 size={14} color={isPlaying ? '#10b981' : '#a0aec0'} />
                    <span style={{ fontSize: '13px' }}>
                      +{volumeGain.toFixed(1)}
                    </span>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '10px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#2a3744',
                    marginRight: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: themeColor,
                      opacity: 0.8
                    }}></div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'white'
                    }}>
                      {songData.recommender.displayName}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#a0aec0'
                    }}>
                      {songData.recommender.timeAgo}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ flex: '1', minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            gap: '8px',
            flexWrap: isPhone ? 'wrap' : 'nowrap',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative'
            }}>
              <Users size={18} color={themeColor} style={{ marginRight: '8px' }} />
              <span style={{ fontWeight: '700', fontSize: isPhone ? '15px' : '16px', color: 'white' }}>
                Artists
              </span>
              {/* INFO ICON 3: Post expand button info - Only show for example post */}
              {post.id === 'example_post_001' && (
                <div style={{ 
                  marginLeft: '8px' 
                }}
                  onClick={(e) => e.stopPropagation()} // Prevent any parent click events
                >
                  <InfoIconModal
                    title="Post Expand Button"
                    iconSize={14}
                    showButtonText={false}
                    steps={[
                      {
                        icon: <Users size={18} color="#a9b6fc" />,
                        title: "Discovered Artists Only",
                        content: "You can only see the artists that you've already discovered, so the more artists you discover in the app, the more you'll be able to know from each thread."
                      }
                    ]}
                  />
                </div>
              )}
            </div>
            
            <div style={{
              backgroundColor: 'rgba(30, 45, 60, 0.6)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: isPhone ? '13px' : '14px',
              fontWeight: '600',
              color: 'white'
            }}>
              76/260
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(30, 45, 60, 0.6)',
            borderRadius: '12px',
            border: `1px solid ${getRgbaFromHex(themeColor, 0.3)}`,
            padding: isPhone ? '12px' : '16px',
            height: `${artistPanelHeight}px`,
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: artistGridColumns,
              gap: isPhone ? '12px 9px' : '16px 12px',
            }}>
              {artistsList.discovered.map((artist) => (
                <div key={artist.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    position: 'relative',
                    width: `${artistAvatarSize}px`,
                    height: `${artistAvatarSize}px`,
                    borderRadius: '50%',
                    backgroundColor: '#2a3744',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${artist.color}`
                  }}>
                    <Mic size={isPhone ? 15 : 18} color={artist.color} />
                    
                    <div style={{
                      position: 'absolute',
                      bottom: '-5px',
                      right: '-5px',
                      backgroundColor: artist.color,
                      borderRadius: '50%',
                      width: `${artistBadgeSize}px`,
                      height: `${artistBadgeSize}px`,
                      fontSize: isPhone ? '10px' : '11px',
                      fontWeight: '700',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      x{artist.multiplier}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: isPhone ? '11px' : '12px',
                    fontWeight: '600',
                    color: 'white',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}>
                    {artist.name}
                  </div>
                </div>
              ))}
              
              {artistsList.undiscovered.map((artist) => (
                <div key={artist.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: 0.6
                }}>
                  <div style={{
                    position: 'relative',
                    width: `${artistAvatarSize}px`,
                    height: `${artistAvatarSize}px`,
                    borderRadius: '50%',
                    backgroundColor: '#2a3744',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid #4a5568`
                  }}>
                    <Lock size={isPhone ? 15 : 18} color="#4a5568" />
                    
                    <div style={{
                      position: 'absolute',
                      bottom: '-5px',
                      right: '-5px',
                      backgroundColor: '#4a5568',
                      borderRadius: '50%',
                      width: `${artistBadgeSize}px`,
                      height: `${artistBadgeSize}px`,
                      fontSize: isPhone ? '10px' : '11px',
                      fontWeight: '700',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      x{artist.multiplier}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: isPhone ? '11px' : '12px',
                    fontWeight: '600',
                    color: '#718096',
                    textAlign: 'center'
                  }}>
                    ???
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandedPostContent;
