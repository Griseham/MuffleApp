import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, Headphones, Volume2, Music, 
  Mic, Users, Lock
} from 'lucide-react';
import InfoIconModal from '../InfoIconModal';
import { 
  getRandomNumber, 
  hashString, 
  generateUsername, 
  formatCompactNumber,
  getAvatarSrc
} from './postCardUtils';

const ExpandedPostContent = ({ post, themeColor, genres, getRgbaFromHex }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumeGain, setVolumeGain] = useState(0);
  
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
  
  return (
    <div style={{
      padding: '20px',
      borderTop: `1px solid ${getRgbaFromHex(themeColor, 0.3)}`,
      background: `linear-gradient(to bottom, ${getRgbaFromHex(themeColor, 0.05)}, rgba(30, 39, 50, 0.8))`,
    }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ width: '240px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
          }}>
            <Headphones size={18} color={themeColor} style={{ marginRight: '8px' }} />
            <span style={{ fontWeight: '700', fontSize: '16px', color: 'white' }}>
              Top Song Recommendation
            </span>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(30, 45, 60, 0.6)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: `1px solid ${getRgbaFromHex(themeColor, 0.3)}`,
            height: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              height: '140px',
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
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isPlaying ? (
                  <Pause size={32} color="white" />
                ) : (
                  <Play size={32} color="white" />
                )}
              </div>
            </div>
            
            <div style={{ 
              padding: '16px',
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '4px'
                }}>
                  {songData.song}
                </div>
                <div style={{
                  fontSize: '14px',
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
        
        <div style={{ flex: '1' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative'
            }}>
              <Users size={18} color={themeColor} style={{ marginRight: '8px' }} />
              <span style={{ fontWeight: '700', fontSize: '16px', color: 'white' }}>
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
              fontSize: '14px',
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
            padding: '16px',
            height: '300px',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px 12px',
            }}>
              {artistsList.discovered.map((artist, index) => (
                <div key={artist.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    position: 'relative',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#2a3744',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${artist.color}`
                  }}>
                    <Mic size={18} color={artist.color} />
                    
                    <div style={{
                      position: 'absolute',
                      bottom: '-5px',
                      right: '-5px',
                      backgroundColor: artist.color,
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '11px',
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
                    fontSize: '12px',
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
              
              {artistsList.undiscovered.map((artist, index) => (
                <div key={artist.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: 0.6
                }}>
                  <div style={{
                    position: 'relative',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#2a3744',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid #4a5568`
                  }}>
                    <Lock size={18} color="#4a5568" />
                    
                    <div style={{
                      position: 'absolute',
                      bottom: '-5px',
                      right: '-5px',
                      backgroundColor: '#4a5568',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '11px',
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
                    fontSize: '12px',
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