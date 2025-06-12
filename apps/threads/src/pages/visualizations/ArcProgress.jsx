export default function ArcProgress({ percent, size = 80, color = "#1db954" }) {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
  
    // For 75% engagement, we “eat away” 75% of the circumference
    const offset = circumference - percent * circumference;
  
    return (
      // Rotate -90 so the arc starts at top and moves clockwise
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Background circle (gray) */}
        <circle
          stroke="#333"
          fill="none"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        {/* Progress arc */}
        <circle
          stroke={color}
          fill="none"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round" // gives the arc a round end
        />
      </svg>
    );
  }
  
