import React from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from 'd3-scale';

interface SpiralChartProps {
  data: Array<{
    category: string;
    percentage: number;
    color: string;
  }>;
  width?: number;
  height?: number;
}

export const SpiralChart: React.FC<SpiralChartProps> = ({
  data,
  width = 300,
  height = 300,
}) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 20;
  
  const colorScale = scaleLinear<string>()
    .domain([0, 100])
    .range(['#fef3c7', '#f59e0b']);

  const generateSpiralPath = () => {
    const points: string[] = [];
    const totalPoints = 200;
    const spiralTurns = 3;
    
    for (let i = 0; i <= totalPoints; i++) {
      const angle = (i / totalPoints) * spiralTurns * 2 * Math.PI;
      const radius = (i / totalPoints) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }
    
    return points.join(' ');
  };

  const generateDataPoints = () => {
    return data.map((item, index) => {
      const angle = (index / data.length) * 2 * Math.PI;
      const radius = (item.percentage / 100) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      return {
        ...item,
        x,
        y,
        radius: Math.max(4, item.percentage / 10),
      };
    });
  };

  const spiralPath = generateSpiralPath();
  const dataPoints = generateDataPoints();

  return (
    <svg width={width} height={height}>
      <Group>
        {/* Background spiral */}
        <path
          d={spiralPath}
          stroke="hsl(var(--muted))"
          strokeWidth={2}
          fill="none"
          opacity={0.3}
        />
        
        {/* Spiral with gradient based on overall performance */}
        <defs>
          <linearGradient id="spiralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        
        <path
          d={spiralPath}
          stroke="url(#spiralGradient)"
          strokeWidth={3}
          fill="none"
        />
        
        {/* Data points */}
        {dataPoints.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r={point.radius}
              fill={point.color}
              stroke="white"
              strokeWidth={2}
              opacity={0.8}
            />
            
            {/* Category labels */}
            <text
              x={point.x}
              y={point.y - point.radius - 8}
              textAnchor="middle"
              fontSize={10}
              fill="hsl(var(--foreground))"
              fontWeight="500"
            >
              {point.category.slice(0, 8)}...
            </text>
            
            {/* Percentage labels */}
            <text
              x={point.x}
              y={point.y + 3}
              textAnchor="middle"
              fontSize={8}
              fill="white"
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
          r={6}
          fill="hsl(var(--primary))"
          stroke="white"
          strokeWidth={2}
        />
      </Group>
    </svg>
  );
};