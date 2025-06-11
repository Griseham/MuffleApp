import React from 'react';
import { 
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, 
  Tooltip, Cell, ResponsiveContainer, ZAxis 
} from 'recharts';
import { BarChart3, GitBranch } from 'lucide-react';
import InfoIconModal from '../InfoIconModal';

export const VerticalRatingsGraph = ({ graphRatings, onOpenModal }) => (
  <div style={{ 
    height: '220px', 
    marginBottom: '40px',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    cursor: 'pointer',
  }}
  onClick={onOpenModal}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={graphRatings}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        barGap={5}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
        <XAxis 
          type="number" 
          domain={[0, 100]} 
          tickCount={6}
          tick={{ fill: '#8899a6', fontSize: 12 }}
          stroke="rgba(255, 255, 255, 0.05)"
        />
        <YAxis 
          type="category" 
          dataKey="snippetId" 
          tick={(props) => {
            const { x, y, payload } = props;
            const item = graphRatings.find(d => d.snippetId === payload.value);
            if (!item) return null;
            
            return (
              <g transform={`translate(${x - 40},${y})`}>
                <image 
                  href={item.userAvatar} 
                  x={0} 
                  y={-12} 
                  height={24} 
                  width={24} 
                  clipPath="inset(0% round 50%)" 
                />
              </g>
            );
          }}
          width={50}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          content={(props) => {
            const { active, payload, label } = props;
            if (active && payload && payload.length) {
              const item = graphRatings.find(d => d.snippetId === label);
              return (
                <div style={{
                  backgroundColor: '#0f172a',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#fff' }}>
                    {item ? item.snippetId : label}
                  </div>
                  {payload.map((entry, index) => (
                    <div key={`tooltip-${index}`} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      color: entry.name === 'Your Rating' ? '#a78bfa' : '#3b82f6',
                      margin: '4px 0'
                    }}>
                      <div style={{ 
                        width: '10px', 
                        height: '10px', 
                        backgroundColor: entry.name === 'Your Rating' ? '#a78bfa' : '#3b82f6', 
                        marginRight: '8px',
                        borderRadius: '2px'
                      }} />
                      <span>{entry.name}: {entry.value}%</span>
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          }}
        />
        <Bar 
          dataKey="avgRating" 
          name="Average" 
          barSize={16}
        >
          {graphRatings.map((entry, index) => (
            <Cell key={`avg-cell-${index}`} 
              fill="url(#linearGradientBlue)" 
              radius={[0, 4, 4, 0]} 
            />
          ))}
        </Bar>
        <Bar 
          dataKey="userRating" 
          name="Your Rating" 
          barSize={16}
        >
          {graphRatings.map((entry, index) => (
            <Cell key={`user-cell-${index}`} 
              fill="url(#linearGradientPurple)" 
              radius={[0, 4, 4, 0]} 
            />
          ))}
        </Bar>
        <defs>
          <linearGradient id="linearGradientPurple" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <linearGradient id="linearGradientBlue" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const ScatterRatingsGraph = ({ scatterData, onOpenModal }) => (
  <div style={{ 
    height: '320px',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    cursor: 'pointer',
  }}
  onClick={onOpenModal}>
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart
        margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
        <XAxis 
          type="number" 
          dataKey="ratingCount" 
          name="Ratings"
          domain={['auto', 'auto']}
          tick={{ fill: '#8899a6', fontSize: 12 }}
          stroke="rgba(255, 255, 255, 0.05)"
          label={{ 
            value: 'Number of Ratings', 
            position: 'insideBottom', 
            fill: '#8899a6',
            dy: 20
          }}
        />
        <YAxis 
          type="number" 
          dataKey="average" 
          name="Average" 
          domain={[0, 100]}
          tick={{ fill: '#8899a6', fontSize: 12 }}
          stroke="rgba(255, 255, 255, 0.05)"
          label={{ 
            value: 'Rating Value', 
            angle: -90, 
            position: 'insideLeft',
            fill: '#8899a6',
            dx: -10
          }}
        />
        <ZAxis range={[80, 80]} />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3', stroke: 'rgba(167, 139, 250, 0.4)', strokeWidth: 2 }}
          content={(props) => {
            const { active, payload } = props;
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div style={{
                  backgroundColor: '#0f172a',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      backgroundColor: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {data.username ? data.username.charAt(0) : "?"}
                    </div>
                    <p style={{ color: '#fff', margin: '0', fontWeight: 'bold' }}>
                      {data.username || "User"}
                    </p>
                  </div>
                  <div style={{ display: 'flex', marginTop: '8px', gap: '16px' }}>
                    <div>
                      <p style={{ color: '#64748b', margin: '0 0 4px 0', fontSize: '12px' }}>Ratings</p>
                      <p style={{ color: '#a78bfa', margin: '0', fontWeight: 'bold' }}>{data.ratingCount}</p>
                    </div>
                    <div>
                      <p style={{ color: '#64748b', margin: '0 0 4px 0', fontSize: '12px' }}>Average</p>
                      <p style={{ color: '#3b82f6', margin: '0', fontWeight: 'bold' }}>{data.average}%</p>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Scatter 
          name="Rating Activity" 
          data={scatterData} 
          fill="#3b82f6"
          shape={(props) => {
            const { cx, cy, payload } = props;
            if (!payload || !payload.userAvatar) return null;
            
            return (
              <g>
                <circle
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill="url(#normalGradient)"
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth={2}
                />
                <image
                  href={payload.userAvatar}
                  x={cx - 10}
                  y={cy - 10}
                  width={20}
                  height={20}
                  clipPath="inset(0% round 50%)"
                />
              </g>
            );
          }}
        />
        <defs>
          <radialGradient id="normalGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
          </radialGradient>
        </defs>
      </ScatterChart>
    </ResponsiveContainer>
  </div>
);

export const GraphSection = ({ 
  graphRatings, 
  scatterData, 
  openVerticalGraphModal, 
  openScatterGraphModal 
}) => (
  <div style={{
    width: "calc(100% - 32px)",
    margin: "16px auto",
    backgroundImage: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 70%)',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '24px', margin: 0, fontWeight: '700' }}>Graph 1</h2>
          <InfoIconModal
            title="Vertical Rating Graph"
            iconSize={16}
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
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '8px 16px',
          borderRadius: '24px',
          fontWeight: '500',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              background: 'linear-gradient(45deg, #a78bfa, #8b5cf6)',
              borderRadius: '3px' 
            }}></div>
            <span>You</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
              borderRadius: '3px' 
            }}></div>
            <span>Average</span>
          </div>
        </div>
      </div>
      
      <VerticalRatingsGraph 
        graphRatings={graphRatings} 
        onOpenModal={openVerticalGraphModal} 
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '24px', margin: 0, fontWeight: '700' }}>Graph 2</h2>
          <InfoIconModal
            title="Scatter Plot Graph"
            iconSize={16}
            showButtonText={false}
            steps={[{
              icon: <GitBranch size={18} color="#a9b6fc" />,
              title: "User Rating Distribution",
              content: "This graph uses average rating scores on snippets to plot each user."
            }]}
          />
        </div>
      </div>
      
      <ScatterRatingsGraph 
        scatterData={scatterData} 
        onOpenModal={openScatterGraphModal} 
      />
    </div>
  </div>
);