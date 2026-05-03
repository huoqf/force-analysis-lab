import React from 'react';

interface ForceArrowProps {
  x: number;
  y: number;
  magnitude: number;
  angle: number; // 角度 (0 = 向右, 90 = 向下)
  color: string;
  label: string;
  scale?: number;
}

const ForceArrow: React.FC<ForceArrowProps> = ({ 
  x, y, magnitude, angle, color, label, scale = 2 
}) => {
  const length = Math.max(magnitude * scale, 30); // 最小长度保证可见
  const angleRad = (angle * Math.PI) / 180;
  
  const endX = x + length * Math.cos(angleRad);
  const endY = y + length * Math.sin(angleRad);

  // 计算箭头尖端
  const headSize = 8;
  const h1X = endX - headSize * Math.cos(angleRad - Math.PI / 6);
  const h1Y = endY - headSize * Math.sin(angleRad - Math.PI / 6);
  const h2X = endX - headSize * Math.cos(angleRad + Math.PI / 6);
  const h2Y = endY - headSize * Math.sin(angleRad + Math.PI / 6);

  return (
    <g className="force-arrow transition-all duration-300">
      {/* 力的主线 */}
      <line 
        x1={x} y1={y} x2={endX} y2={endY} 
        stroke={color} strokeWidth="3" strokeLinecap="round" 
      />
      {/* 箭头尖端 */}
      <path 
        d={`M ${endX} ${endY} L ${h1X} ${h1Y} M ${endX} ${endY} L ${h2X} ${h2Y}`} 
        stroke={color} strokeWidth="3" strokeLinecap="round" fill="none"
      />
      {/* 标签 */}
      <text 
        x={endX + 10 * Math.cos(angleRad)} 
        y={endY + 10 * Math.sin(angleRad)} 
        fill={color} 
        fontSize="14" 
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
};

export default ForceArrow;
