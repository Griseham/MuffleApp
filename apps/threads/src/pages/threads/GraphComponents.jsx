import React, { useMemo, useState } from 'react';
import { BarChart3, GitBranch } from 'lucide-react';
import InfoIconModal from '../../components/InfoIconModal';

function withAlpha(color, alphaHex) {
  if (typeof color === 'string' && color.startsWith('#') && color.length === 7) {
    return `${color}${alphaHex}`;
  }
  return color;
}

// Design 4: Bullet Chart Style for Vertical Ratings Graph
export const VerticalRatingsGraph = ({ graphRatings = [], onOpenModal, isMobile = false }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div 
      style={{ 
        minHeight: isMobile ? '200px' : '220px',
        marginBottom: isMobile ? '28px' : '40px',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: isMobile ? '14px' : '20px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
      }}
      onClick={onOpenModal}
    >
      {/* Bullet chart rows */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isMobile ? '10px' : '12px',
      }}>
        {graphRatings.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          
          return (
            <div 
              key={item.snippetId || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '8px' : '12px',
                padding: isMobile ? '8px 10px' : '10px 12px',
                borderRadius: '10px',
                backgroundColor: isHovered ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
                border: isHovered ? '1px solid rgba(167, 139, 250, 0.25)' : '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setHoveredIndex(idx);
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* User avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {item.userAvatar ? (
                  <img 
                    src={item.userAvatar} 
                    alt="avatar"
                    style={{ 
                      width: isMobile ? 30 : 36, 
                      height: isMobile ? 30 : 36, 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '2px solid rgba(139, 92, 246, 0.5)',
                      boxShadow: isHovered ? '0 0 12px rgba(167, 139, 250, 0.5)' : '0 2px 6px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: isMobile ? 30 : 36, 
                    height: isMobile ? 30 : 36, 
                    borderRadius: '50%', 
                    backgroundColor: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: '#94a3b8',
                    border: '2px solid rgba(139, 92, 246, 0.5)',
                  }}>
                    ?
                  </div>
                )}
              </div>
              
              {/* Bullet bar container */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ 
                  position: 'relative', 
                  height: isMobile ? '24px' : '28px', 
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: '6px',
                  overflow: 'visible',
                }}>
                  {/* Background gradient zones - subtle performance indicators */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '40%',
                    backgroundColor: 'rgba(248, 113, 113, 0.06)',
                    borderRadius: '6px 0 0 6px',
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '40%',
                    top: 0,
                    bottom: 0,
                    width: '30%',
                    backgroundColor: 'rgba(251, 191, 36, 0.06)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '70%',
                    top: 0,
                    bottom: 0,
                    width: '30%',
                    backgroundColor: 'rgba(74, 222, 128, 0.06)',
                    borderRadius: '0 6px 6px 0',
                  }} />
                  
                  {/* Your rating bar */}
                  <div style={{
                    position: 'absolute',
                    top: isMobile ? '7px' : '8px',
                    left: 0,
                    height: isMobile ? '10px' : '12px',
                    width: `${item.userRating || 0}%`,
                    background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                    borderRadius: '3px',
                    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isHovered 
                      ? '0 0 14px rgba(167, 139, 250, 0.6)' 
                      : '0 0 8px rgba(167, 139, 250, 0.3)',
                  }}>
                    {/* Shine effect */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '50%',
                      background: 'linear-gradient(rgba(255,255,255,0.35), rgba(255,255,255,0))',
                      borderRadius: '3px 3px 0 0',
                    }}/>
                  </div>
                  
                  {/* Average marker line */}
                  <div style={{
                    position: 'absolute',
                    left: `${item.avgRating || 0}%`,
                    top: isMobile ? '3px' : '4px',
                    bottom: isMobile ? '3px' : '4px',
                    width: '3px',
                    backgroundColor: '#3b82f6',
                    transform: 'translateX(-50%)',
                    boxShadow: isHovered 
                      ? '0 0 10px rgba(59, 130, 246, 0.9)' 
                      : '0 0 6px rgba(59, 130, 246, 0.6)',
                    borderRadius: '2px',
                    zIndex: 2,
                  }} />
                  
                  {/* Scale markers (subtle) */}
                  {[25, 50, 75].map((mark) => (
                    <div 
                      key={mark}
                      style={{
                        position: 'absolute',
                        left: `${mark}%`,
                        top: 0,
                        bottom: 0,
                        width: '1px',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      }}
                    />
                  ))}
                </div>
                
                {/* Tooltip on hover */}
                {!isMobile && isHovered && (
                  <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    zIndex: 20,
                    minWidth: '180px',
                    pointerEvents: 'none',
                    fontSize: '13px',
                  }}>
                    <div style={{ 
                      marginBottom: '10px', 
                      fontWeight: 'bold',
                      fontSize: '14px',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      paddingBottom: '8px',
                      color: '#a78bfa',
                    }}>
                      Rating Details
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}>
                      <span style={{ color: '#94a3b8' }}>Your Rating:</span>
                      <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{item.userRating || 0}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                    }}>
                      <span style={{ color: '#94a3b8' }}>Average:</span>
                      <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{item.avgRating || 0}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Rating stats - Your Rating and Average side by side */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: isMobile ? '8px' : '12px',
                flexShrink: 0,
              }}>
                {/* Your rating value */}
                <span style={{ 
                  color: '#a78bfa', 
                  fontSize: isMobile ? '14px' : '16px', 
                  fontWeight: 'bold',
                  minWidth: isMobile ? '26px' : '32px',
                  textAlign: 'right',
                }}>
                  {item.userRating || 0}
                </span>
                
                {/* Average value */}
                <span style={{ 
                  color: '#3b82f6', 
                  fontSize: isMobile ? '14px' : '16px', 
                  fontWeight: 'bold',
                  minWidth: isMobile ? '26px' : '32px',
                  textAlign: 'right',
                }}>
                  {item.avgRating || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple Scatter Plot with Names
export const ScatterRatingsGraph = ({ scatterData = [], onOpenModal, isMobile = false }) => {
  const [hoveredUser, setHoveredUser] = useState(null);

  const maxRatings = Math.max(...scatterData.map((d) => d.ratingCount), 100);
  const chartHeight = isMobile ? 200 : 220;
  const chartLeftInset = isMobile ? 30 : 40;
  const pointSize = isMobile ? 24 : 28;
  const pointHoverSize = isMobile ? 28 : 34;
  const axisLabelFontSize = isMobile ? '10px' : '12px';
  const minPointDeltaX = isMobile ? 6.5 : 3.2;
  const minPointDeltaY = isMobile ? 7.5 : 4.5;
  const positionedScatterData = useMemo(() => {
    const placed = [];

    return scatterData.map((user, idx) => {
      const hasPresetX = Number.isFinite(user?._plotX);
      const hasPresetY = Number.isFinite(user?._plotY);
      let x = hasPresetX ? user._plotX : 10 + (((user.ratingCount || 0) / maxRatings) * 80);
      let y = hasPresetY ? user._plotY : 88 - ((user.average || 0) * 0.76);
      let attempts = 0;

      while (
        placed.some(
          (point) =>
            Math.abs(point.x - x) < minPointDeltaX &&
            Math.abs(point.y - y) < minPointDeltaY
        ) &&
        attempts < 20
      ) {
        const ring = Math.floor(attempts / 6) + 1;
        const angleDeg = ((attempts * 59) + (idx * 23)) % 360;
        const angleRad = (angleDeg * Math.PI) / 180;
        x = x + (Math.cos(angleRad) * (1.8 * ring));
        y = y + (Math.sin(angleRad) * (2.2 * ring));
        x = Math.max(2, Math.min(98, x));
        y = Math.max(3, Math.min(97, y));
        attempts += 1;
      }

      placed.push({ x, y });
      return {
        ...user,
        _plotX: x,
        _plotY: y,
      };
    });
  }, [scatterData, maxRatings, minPointDeltaX, minPointDeltaY]);

  return (
    <div 
      style={{
        minHeight: isMobile ? '220px' : '240px',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: isMobile ? '14px' : '20px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={onOpenModal}
    >
      {/* Chart area */}
      <div style={{
        position: 'relative',
        height: `${chartHeight}px`,
        marginLeft: `${chartLeftInset}px`,
        marginBottom: isMobile ? '26px' : '30px',
      }}>
        {/* Y-axis line */}
        <div style={{
          position: 'absolute',
          left: `-${chartLeftInset}px`,
          top: 0,
          bottom: 0,
          width: '1px',
          background: 'rgba(255,255,255,0.08)',
        }} />
        
        {/* X-axis line */}
        <div style={{
          position: 'absolute',
          left: `-${chartLeftInset}px`,
          right: 0,
          bottom: 0,
          height: '1px',
          background: 'rgba(255,255,255,0.08)',
        }} />

        {/* Y-axis labels */}
        {[0, 50, 100].map(val => (
          <div key={val} style={{
            position: 'absolute',
            left: isMobile ? '-27px' : '-35px',
            top: `${100 - val}%`,
            transform: 'translateY(-50%)',
            fontSize: isMobile ? '10px' : '11px',
            color: '#64748b',
          }}>
            {val}
          </div>
        ))}

        {/* X-axis labels */}
        {[0, 50, 100].map((val) => (
          <div key={val} style={{
            position: 'absolute',
            bottom: isMobile ? '-18px' : '-20px',
            left: `${val}%`,
            transform: 'translateX(-50%)',
            fontSize: isMobile ? '10px' : '11px',
            color: '#64748b',
          }}>
            {Math.round(val * maxRatings / 100)}
          </div>
        ))}

        {/* Horizontal grid line */}
        <div style={{
          position: 'absolute',
          left: 0, 
          right: 0,
          top: '50%',
          height: '1px',
          background: 'rgba(255,255,255,0.04)',
        }} />
        
        {/* Vertical grid line */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0, 
          bottom: 0,
          width: '1px',
          background: 'rgba(255,255,255,0.04)',
        }} />

        {/* Data points with names */}
        {positionedScatterData.map((user, idx) => {
          const isHovered = hoveredUser === idx;
          const accentColor = user.color || '#a78bfa';
          
          return (
            <div
              key={idx}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setHoveredUser(idx);
              }}
              onMouseLeave={() => setHoveredUser(null)}
              style={{
                position: 'absolute',
                left: `${user._plotX}%`,
                top: `${user._plotY}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isHovered ? 10 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {user.userAvatar ? (
                <img 
                  src={user.userAvatar}
                  alt={user.username}
                  style={{
                    width: `${isHovered ? pointHoverSize : pointSize}px`,
                    height: `${isHovered ? pointHoverSize : pointSize}px`,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: isHovered 
                      ? `3px solid ${accentColor}` 
                      : `2px solid ${withAlpha(accentColor, 'CC')}`,
                    boxShadow: isHovered 
                      ? `0 0 20px ${withAlpha(accentColor, 'CC')}` 
                      : `0 0 12px ${withAlpha(accentColor, '88')}`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                />
              ) : (
                <div style={{
                  width: `${isHovered ? pointHoverSize : pointSize}px`,
                  height: `${isHovered ? pointHoverSize : pointSize}px`,
                  borderRadius: '50%',
                  backgroundColor: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#94a3b8',
                  border: isHovered 
                    ? `3px solid ${accentColor}` 
                    : `2px solid ${withAlpha(accentColor, 'CC')}`,
                  boxShadow: isHovered 
                    ? `0 0 20px ${withAlpha(accentColor, 'CC')}` 
                    : `0 0 12px ${withAlpha(accentColor, '88')}`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}>
                  {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              
              {/* Username label */}
              <span style={{
                fontSize: '10px',
                color: isHovered ? accentColor : '#64748b',
                fontWeight: isHovered ? '600' : '400',
                transition: 'all 0.2s',
                maxWidth: '50px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: isMobile ? 'none' : 'block',
              }}>
                {user.username}
              </span>

              {/* Tooltip on hover */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 4px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  zIndex: 20,
                  whiteSpace: 'nowrap',
                  fontSize: '12px',
                  pointerEvents: 'none',
                }}>
                  <span style={{ color: accentColor }}>{user.ratingCount} ratings</span>
                  <span style={{ color: '#475569', margin: '0 6px' }}>·</span>
                  <span style={{ color: '#64748b' }}>{user.average}% avg</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X-axis label */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: axisLabelFontSize,
        color: '#64748b',
      }}>
        Number of Ratings
      </div>
      
      {/* Y-axis label */}
      <div style={{
        position: 'absolute',
        left: isMobile ? '6px' : '8px',
        top: '50%',
        transform: 'translateY(-50%) rotate(-90deg)',
        fontSize: axisLabelFontSize,
        color: '#64748b',
      }}>
        Rating Value
      </div>
    </div>
  );
};

export const GraphSection = ({ 
  graphRatings, 
  scatterData, 
  openVerticalGraphModal, 
  openScatterGraphModal,
  isMobile = false,
}) => (
  <div style={{
    width: isMobile ? "calc(100% - 20px)" : "calc(100% - 32px)",
    margin: isMobile ? "12px auto" : "16px auto",
    backgroundImage: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 70%)',
    padding: isMobile ? "14px" : "24px",
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    boxSizing: 'border-box',
  }}>
    <div style={{
      position: 'absolute',
      top: '0',
      right: '0',
      width: '200px',
      height: '200px',
      background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)',
      zIndex: '0'
    }} />
    
    <div style={{
      position: 'absolute',
      bottom: '0',
      left: '0',
      width: '150px',
      height: '150px',
      background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
      zIndex: '0'
    }} />
    
    <div style={{ position: 'relative', zIndex: '1' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '10px' : 0,
        marginBottom: isMobile ? '14px' : '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', margin: 0, fontWeight: '700', lineHeight: 1 }}>Graph 1</h2>
          <InfoIconModal
            modalId="thread-graph-vertical-info"
            title="Vertical Rating Graph"
            iconSize={isMobile ? 14 : 16}
            showButtonText={false}
            steps={[{
              icon: <BarChart3 size={18} color="#a9b6fc" />,
              title: "Track Your Ratings",
              content: "Use this graph to track your ratings for each snippet in this thread, compared to the average"
            }]}
          />
        </div>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'center' : 'flex-start',
          gap: isMobile ? '12px' : '16px',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: isMobile ? '8px 10px' : '10px 18px',
          borderRadius: '24px',
          fontWeight: '500',
          fontSize: isMobile ? '11px' : '14px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          width: isMobile ? '100%' : 'auto',
          boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: isMobile ? '12px' : '16px', 
              height: '8px', 
              background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
              borderRadius: '2px' 
            }}></div>
            <span style={{ color: '#e2e8f0' }}>{isMobile ? 'You' : 'Your Rating'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '3px', 
              height: isMobile ? '12px' : '16px', 
              backgroundColor: '#3b82f6',
              borderRadius: '1px' 
            }}></div>
            <span style={{ color: '#e2e8f0' }}>{isMobile ? 'Avg' : 'Average'}</span>
          </div>
        </div>
      </div>
      
      <VerticalRatingsGraph 
        graphRatings={graphRatings} 
        onOpenModal={openVerticalGraphModal}
        isMobile={isMobile}
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '14px' : '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', margin: 0, fontWeight: '700', lineHeight: 1 }}>Graph 2</h2>
          <InfoIconModal
            modalId="thread-graph-scatter-info"
            title="Scatter Plot Graph"
            iconSize={isMobile ? 14 : 16}
            showButtonText={false}
            steps={[{
              icon: <GitBranch size={18} color="#a9b6fc" />,
              title: "User Rating Distribution",
              content: "This graph plots each user by their number of ratings (x-axis) and average rating value (y-axis)."
            }]}
          />
        </div>
      </div>
      
      <ScatterRatingsGraph 
        scatterData={scatterData} 
        onOpenModal={openScatterGraphModal}
        isMobile={isMobile}
      />
    </div>
  </div>
);
