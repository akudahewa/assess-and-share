import React from 'react';
import { Group } from '@visx/group';

interface RadarChartProps {
  data: Array<{
    category: string;
    percentage: number;
    color: string;
  }>;
  width?: number;
  height?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  width = 300,
  height = 300,
}) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 40;
  const levels = 5;
  const angleStep = (2 * Math.PI) / data.length;

  // Generate grid lines
  const generateGridLines = () => {
    const lines = [];
    
    // Radial grid lines
    for (let level = 1; level <= levels; level++) {
      const radius = (level / levels) * maxRadius;
      const points = data.map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
      
      lines.push(
        <polygon
          key={`grid-${level}`}
          points={points}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
    
    // Axis lines
    data.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x2 = centerX + maxRadius * Math.cos(angle);
      const y2 = centerY + maxRadius * Math.sin(angle);
      
      lines.push(
        <line
          key={`axis-${index}`}
          x1={centerX}
          y1={centerY}
          x2={x2}
          y2={y2}
          stroke="hsl(var(--border))"
          strokeWidth={1}
          opacity={0.3}
        />
      );
    });
    
    return lines;
  };

  // Generate data polygon
  const generateDataPolygon = () => {
    const points = data.map((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const radius = (item.percentage / 100) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    
    return points;
  };

  // Generate data points
  const generateDataPoints = () => {
    return data.map((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const radius = (item.percentage / 100) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // Label position (outside the chart)
      const labelRadius = maxRadius + 20;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);
      
      return {
        ...item,
        x,
        y,
        labelX,
        labelY,
        angle,
      };
    });
  };

  const dataPolygonPoints = generateDataPolygon();
  const dataPoints = generateDataPoints();

  return (
    <svg width={width} height={height}>
      <Group>
        {/* Grid lines */}
        {generateGridLines()}
        
        {/* Data area */}
        <polygon
          points={dataPolygonPoints}
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
        
        {/* Data points */}
        {dataPoints.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r={4}
              fill={point.color}
              stroke="white"
              strokeWidth={2}
            />
            
            {/* Category labels */}
            <text
              x={point.labelX}
              y={point.labelY}
              textAnchor={
                point.angle > Math.PI / 2 || point.angle < -Math.PI / 2
                  ? 'end'
                  : 'start'
              }
              fontSize={11}
              fill="hsl(var(--foreground))"
              fontWeight="500"
              dominantBaseline="central"
            >
              {point.category}
            </text>
            
            {/* Percentage near the point */}
            <text
              x={point.x}
              y={point.y - 8}
              textAnchor="middle"
              fontSize={9}
              fill="hsl(var(--foreground))"
              fontWeight="bold"
            >
              {point.percentage}%
            </text>
          </g>
        ))}
        
        {/* Center point */}
        <circle
          cx={centerX}
          cy={centerY}
          r={3}
          fill="hsl(var(--primary))"
        />
        
        {/* Level labels */}
        {Array.from({ length: levels }, (_, index) => {
          const level = index + 1;
          const radius = (level / levels) * maxRadius;
          return (
            <text
              key={`level-${level}`}
              x={centerX + 5}
              y={centerY - radius}
              fontSize={8}
              fill="hsl(var(--muted-foreground))"
              textAnchor="start"
            >
              {(level * 20)}%
            </text>
          );
        })}
      </Group>
    </svg>
  );
};