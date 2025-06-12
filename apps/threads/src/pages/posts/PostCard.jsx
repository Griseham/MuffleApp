import React, { useState, useMemo } from 'react';
import { 
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, 
  Headphones, Volume2, Users, Award, Music, Mic, ChevronDown
} from 'lucide-react';
import ExpandedPostContent from './ExpandedPostContent';
import InfoIconModal from '../../components/InfoIconModal';
import { 
  getRandomNumber, 
  getPostGenres, 
  getPostArtists, 
  hashString, 
  getAvatarSrc, 
  generateUsername, 
  getTimeAgo, 
  formatCompactNumber 
} from './postCardUtils';
import { ClickableUserAvatar } from './UserHoverCard';

const PostCard = ({ post, onClick, onUserClick, POST_TYPE_INDICATORS, isCached }) => {
  const [genres] = useState(() => getPostGenres(post.id));
  const [artists] = useState(() => getPostArtists(post.id));
  const [headerVolume] = useState(() => getRandomNumber(800, 4300));
  const [sideVolume] = useState(() => getRandomNumber(3, 23));
  const [liveUsers] = useState(() => getRandomNumber(1000, 20000));
  const [recommendations] = useState(() => getRandomNumber(50, 350));
  const [artistsDiscovered] = useState(() => getRandomNumber(15, 100));
  const [totalArtists] = useState(() => getRandomNumber(artistsDiscovered + 20, 300));

  const likesCount = post.ups ?? 0;
  const bookmarksCount = post.bookmarks ?? 0;

  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const username = post.username || generateUsername(post.author);
  const timeAgo = getTimeAgo(post.createdUtc);

  const getThemeColor = (postType) => {
    if (postType === 'news') return '#FF9500';
    if (postType === 'parameter') return '#00C4B4';
    return POST_TYPE_INDICATORS[postType]?.color || '#1d9bf0';
  };

  const themeColor = getThemeColor(post.postType);
  const postLabel = POST_TYPE_INDICATORS[post.postType]?.label || 'Thread';
  const isNews = post.postType === 'news';

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleUserClick = (user) => {
    if (onUserClick) {
      onUserClick(user);
    }
  };

  const getRgbaFromHex = (hex, alpha = 0.3) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const hasImage = !!post.imageUrl;

  const generateBackground = (postId) => {
    const seed = hashString(postId);
    const patternType = seed % 4;

    switch (patternType) {
      case 0:
        return `
          radial-gradient(circle at ${seed % 100}% ${(seed % 77)}%, 
          ${getRgbaFromHex(themeColor, 0.12)} 0%, 
          rgba(30, 39, 50, 0.01) 60%), 
          linear-gradient(to bottom, #1e2732 0%, #171f28 100%)
        `;
      case 1:
        return `
          linear-gradient(120deg, ${getRgbaFromHex(themeColor, 0.07)} 0%, rgba(30, 39, 50, 0.02) 100%),
          radial-gradient(circle at ${seed % 80 + 10}% ${seed % 70 + 15}%, rgba(42, 55, 68, 0.8) 0%, #1e2732 60%)
        `;
      case 2:
        return `
          linear-gradient(${seed % 360}deg, ${getRgbaFromHex(themeColor, 0.08)} 0%, rgba(30, 39, 50, 0) 70%),
          radial-gradient(ellipse at ${seed % 100}% ${seed % 100}%, rgba(42, 55, 68, 0.4) 0%, #1e2732 80%)
        `;
      default:
        return `
          linear-gradient(to bottom, #1e2732 0%, rgba(30, 39, 50, 0.95) 100%),
          radial-gradient(circle at ${(seed % 40) + 30}% ${(seed % 30) + 40}%, ${getRgbaFromHex(themeColor, 0.15)} 0%, rgba(30, 39, 50, 0) 70%)
        `;
    }
  };

  const backgroundStyle = useMemo(() => generateBackground(post.id), [post.id, themeColor]);

  return (
    <div 
      style={{
        backgroundColor: '#1e2732',
        backgroundImage: backgroundStyle,
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '16px',
        border: isNews ? `1px solid ${getRgbaFromHex(themeColor, 0.3)}` : '1px solid rgba(255, 255, 255, 0.05)',
        width: '100%',
        position: 'relative',
        boxShadow: `0 -4px 12px ${getRgbaFromHex(themeColor, 0.2)}`
      }}
    >
      {/* Post type indicator */}
      <div style={{
        position: 'relative',
        height: '4px',
        backgroundColor: themeColor,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute',
          top: '6px',
          backgroundColor: themeColor,
          borderRadius: '4px',
          padding: '2px 12px',
          fontSize: '12px',
          fontWeight: '600',
          color: isNews || post.postType === 'parameter' ? 'black' : 'white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          zIndex: 5
        }}>
          {postLabel}
        </div>
      </div>

      {/* Main content area */}
      <div 
        style={{ 
          padding: '20px', 
          cursor: post.id === 'example_post_001' ? 'default' : 'pointer' // No cursor change for example post
        }}
        onClick={post.id === 'example_post_001' ? undefined : () => onClick(post)} // Disable click for example post
      >
        {/* User info header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div 
              style={{ position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <ClickableUserAvatar 
                user={{
                  displayName: post.author,
                  username: username,
                  avatar: post.avatar || getAvatarSrc(post),
                }}
                avatarSrc={post.avatar || getAvatarSrc(post)}
                size={48}
                onUserClick={(user) => {
                  const completeUser = {
                    ...user,
                    avatar: post.avatar || getAvatarSrc(post)
                  };
                  handleUserClick(completeUser);
                }}
              />
              
              <div style={{
                position: 'absolute',
                bottom: '2px',
                left: '40px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: themeColor,
                pointerEvents: 'none'
              }}></div>
              
              {/* INFO ICON 3: User profile info - Only show for example post */}
              {post.id === 'example_post_001' && (
                <div style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px',
                  zIndex: 10
                }}
                  onClick={(e) => e.stopPropagation()} // Prevent post click when clicking icon
                >
                  <InfoIconModal
                    title="User Profile"
                    modalId={`user-profile-info-${post.id}`}
                    iconSize={16}
                    showButtonText={false}
                    steps={[
                      {
                        icon: <Users size={18} color="#a9b6fc" />,
                        title: "User Profile",
                        content: "Click on any user's profile picture to view their music taste, volume stats, and recent activity"
                      },
                      {
                        icon: <Music size={18} color="#a9b6fc" />,
                        title: "Music Discovery",
                        content: "Explore what music other users are into and discover new artists through their recommendations"
                      },
                      {
                        icon: <Headphones size={18} color="#a9b6fc" />,
                        title: "Follow Users",
                        content: "Follow users with similar music taste to get personalized recommendations in your feed"
                      }
                    ]}
                  />
                </div>
              )}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'white'
              }}>
                {username}
              </span>
              <span style={{
                fontSize: '14px',
                color: '#8899a6'
              }}>
                {timeAgo}
              </span>
            </div>
          </div>

          {/* Header stats - Live users for news, volume for regular posts */}
          {isNews ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(20, 30, 40, 0.5)',
              padding: '6px 12px',
              borderRadius: '12px',
              color: 'white'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#f44336',
                marginRight: '1px'
              }}></div>
              <Users size={16} color="#d0d7de" />
              <span style={{ fontWeight: '700' }}>{formatCompactNumber(liveUsers)} Live</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(15, 24, 35, 0.7)',
                padding: '6px 12px',
                borderRadius: '12px',
                color: 'white',
                position: 'relative'
              }}>
                <Volume2 size={22} />
                <span style={{ 
                  fontWeight: '700', 
                  fontSize: '18px',
                  color: '#10b981' 
                }}>
                  {headerVolume}
                </span>
                {/* INFO ICON 1: Main volume info - Only show for example post */}
                {post.id === 'example_post_001' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-2px', 
                    right: '-18px'
                  }}
                    onClick={(e) => e.stopPropagation()} // Prevent post click when clicking icon
                  >
                    <InfoIconModal
                      title="Post Main Volume"
                      modalId={`volume-info-${post.id}`}
                      iconSize={16}
                      showButtonText={false}
                      steps={[
                        {
                          icon: <Volume2 size={18} color="#a9b6fc" />,
                          title: "Volume Rating",
                          content: "Volume rating of this thread. Reflected by overall user ratings to the song recommendations and volumes of the users who engaged with the post"
                        }
                      ]}
                    />
                  </div>
                )}
              </div>
              <button style={{
                color: '#8899a6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                marginLeft: '4px'
              }}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Post Content Section */}
        {isNews ? (
          // News layout - more tweet-like with no right column
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              lineHeight: '1.3',
              color: 'white',
              marginBottom: '12px'
            }}>
              {post.title || post.selftext}
            </div>

            {post.imageUrl && (
              <div style={{
                marginTop: '12px',
                marginBottom: '16px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <img 
                  src={post.imageUrl} 
                  alt="News" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              padding: '16px 0 8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              marginTop: '8px'
            }}>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#ffffff'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle size={22} />
                <span style={{ marginLeft: '6px', fontSize: '15px', fontWeight: '500', color: 'white' }}>
                  {formatCompactNumber(post.num_comments ?? 0)}
                </span>
              </button>

              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                color: isBookmarked ? '#fbbf24' : '#ffffff'
              }}
                onClick={handleBookmark}
              >
                <Bookmark size={22} fill={isBookmarked ? '#fbbf24' : 'none'} />
                <span style={{ marginLeft: '6px', fontSize: '15px', fontWeight: '500', color: 'white' }}>
                  {isBookmarked ? formatCompactNumber(bookmarksCount + 1) : formatCompactNumber(bookmarksCount)}
                </span>
              </button>

              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                color: isLiked ? '#f91880' : '#ffffff'
              }}
                onClick={handleLike}
              >
                <Heart size={22} fill={isLiked ? '#f91880' : 'none'} />
                <span style={{ marginLeft: '6px', fontSize: '15px', fontWeight: '500', color: 'white' }}>
                  {isLiked ? formatCompactNumber(likesCount + 1) : formatCompactNumber(likesCount)}
                </span>
              </button>

              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                color: '#8899a6'
              }}
                onClick={(e) => e.stopPropagation()}
              >
                <Share2 size={22} />
              </button>
            </div>
          </div>
        ) : (
          // Regular post layout with right column
          <div style={{ display: 'flex' }}> 
            <div style={{
              flex: '1',
              paddingRight: '16px',
              maxWidth: 'calc(100% - 180px)'
            }}>
              <div style={{
                fontSize: '19px',
                lineHeight: '1.4',
                color: 'white',
                marginBottom: '20px',
                fontWeight: '600',
                letterSpacing: '0.01em'
              }}>
                {post.title || post.selftext}
              </div>

              {post.imageUrl && (
                <div style={{
                  marginTop: '12px',
                  marginBottom: '16px',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={post.imageUrl} 
                    alt="Post" 
                    style={{
                      width: '100%',
                      height: 'auto',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}

              <div style={{
                display: 'flex',
                paddingTop: '0',
                width: '100%',
                marginBottom: '16px',
                padding: '8px 0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  width: '100%', 
                  justifyContent: 'space-between',
                  paddingRight: '20px'
                }}>
                  <button 
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      color: isLiked ? '#f91880' : '#ffffff'
                    }}
                    onClick={handleLike}
                  >
                    <Heart size={22} fill={isLiked ? '#f91880' : 'none'} />
                    <span style={{ marginLeft: '6px', fontSize: '15px', fontWeight: '500', color: 'white' }}>
                      {isLiked ? formatCompactNumber(likesCount + 1) : formatCompactNumber(likesCount)}
                    </span>
                  </button>
                  
                  <button style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#ffffff'
                  }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageCircle size={22} />
                    <span style={{ marginLeft: '6px', fontSize: '15px', fontWeight: '500', color: 'white' }}>
                      {formatCompactNumber(post.num_comments || 512)}
                    </span>
                  </button>
                  
                  <button style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#8899a6'
                  }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Share2 size={22} />
                  </button>
                  
                  <button style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    color: isBookmarked ? '#fbbf24' : '#ffffff'
                  }}
                    onClick={handleBookmark}
                  >
                    <Bookmark size={22} fill={isBookmarked ? '#fbbf24' : 'none'} />
                    <span style={{ marginLeft: '6px', fontSize: '15px', fontWeight: '500', color: 'white' }}>
                      {isBookmarked ? formatCompactNumber(bookmarksCount + 1) : formatCompactNumber(bookmarksCount)}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Vertical separator line */}
            <div style={{
              width: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              margin: '0 8px'
            }}></div>

            {/* Right side stats column */}
            <div style={{
              width: '160px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingLeft: '4px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px',
                backgroundColor: 'rgba(15, 24, 35, 0.7)',
                borderRadius: '8px',
                marginBottom: '6px',
                marginTop: '4px',
                position: 'relative'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  <Volume2 size={14} color="white" />
                  <span>Vol</span>
                </div>
                <div style={{
                  color: '#10b981',
                  fontWeight: '700',
                  fontSize: '15px'
                }}>
                  +{sideVolume}
                </div>
                {/* INFO ICON 2: Post genres info - Only show for example post */}
                {post.id === 'example_post_001' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-2px', 
                    right: '-18px'
                  }}
                    onClick={(e) => e.stopPropagation()} // Prevent post click when clicking icon
                  >
                    <InfoIconModal
                      title="Post Genres"
                      modalId={`genres-info-${post.id}`}
                      iconSize={16}
                      showButtonText={false}
                      steps={[
                        {
                          icon: <Music size={18} color="#a9b6fc" />,
                          title: "Joining and Engaging",
                          content: "Joining and engaging in different threads will give you volume and genre points."
                        },
                        {
                          icon: <Volume2 size={18} color="#a9b6fc" />,
                          title: "Higher Volume Benefits",
                          content: "The higher your volume, the more engagement your posts might get and users earn more from engaging in your posts."
                        },
                        {
                          icon: <Users size={18} color="#a9b6fc" />,
                          title: "Community Recognition",
                          content: "Having a lot of genre stats and a high volume will show the community that you have great music taste and might be worth following."
                        },
                        {
                          icon: <Mic size={18} color="#a9b6fc" />,
                          title: "Promote Artists",
                          content: "Your song recommendations will be prioritized and you can promote your favorite underrated artists."
                        }
                      ]}
                    />
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {post.postType === 'parameter' ? (
                  <>
                    {/* Regular genres first */}
                    {genres.slice(0, 3).map((genre, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2px',
                        width: '100%'
                      }}>
                        <div style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: genre.color,
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '13px',
                          display: 'inline-block',
                          textAlign: 'center'
                        }}>
                          {genre.name}
                        </div>
                        <div style={{
                          color: '#10b981',
                          fontWeight: '700',
                          fontSize: '13px',
                          whiteSpace: 'nowrap'
                        }}>
                          +{(genre.percentage * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                    
                    {/* Parameter counts below genres */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginTop: '8px'
                    }}>
                      {(post.id.includes('parameter_thread_002') ? [
                        { name: 'Tyla', count: 9, color: '#FF6B35' },
                        { name: 'Tate McRae', count: 15, color: '#4ECDC4' },
                        { name: 'Olivia Rodrigo', count: 6, color: '#45B7D1' },
                        { name: 'Sabrina Carpenter', count: 11, color: '#96CEB4' }
                      ] : [
                        { name: 'Imagine Dragons', count: 7, color: '#FF6B35' },
                        { name: 'Green Day', count: 12, color: '#4ECDC4' },
                        { name: 'OneRepublic', count: 5, color: '#45B7D1' },
                        { name: 'Maroon 5', count: 8, color: '#96CEB4' }
                      ]).map((param, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 16px',
                          borderRadius: '8px',
                          backgroundColor: param.color,
                          color: 'white',
                          fontSize: '15px',
                          fontWeight: '600'
                        }}>
                          <span>{param.name}</span>
                          <span>{param.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  // Regular thread - show genres only
                  genres.slice(0, 3).map((genre, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '2px',
                      width: '100%'
                    }}>
                      <div style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: genre.color,
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '13px',
                        display: 'inline-block',
                        textAlign: 'center'
                      }}>
                        {genre.name}
                      </div>
                      <div style={{
                        color: '#10b981',
                        fontWeight: '700',
                        fontSize: '13px',
                        whiteSpace: 'nowrap'
                      }}>
                        +{(genre.percentage * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expand/Collapse button - Hide for parameter posts */}
      {post.postType !== 'parameter' && (
        <div 
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            cursor: 'pointer',
            background: isExpanded 
              ? `linear-gradient(to bottom, rgba(30, 39, 50, 0), ${getRgbaFromHex(themeColor, 0.1)})`
              : 'rgba(30, 39, 50, 0.3)',
            transition: 'background 0.3s ease'
          }}
          onClick={toggleExpand}
        >
          <ChevronDown 
            size={24}
            color={isExpanded ? '#fff' : '#8899a6'}
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
          />
        </div>
      )}

      {/* Expanded content section */}
      {isExpanded && (
        <ExpandedPostContent 
          post={post}
          themeColor={themeColor}
          genres={genres}
          getRgbaFromHex={getRgbaFromHex}
        />
      )}
    </div>
  );
};

export default PostCard;