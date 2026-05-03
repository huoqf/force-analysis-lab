import React from 'react';

interface FreeBodyDiagramProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  showGrid?: boolean;
}

const FreeBodyDiagram: React.FC<FreeBodyDiagramProps> = ({ 
  children, 
  width = 1200, 
  height = 800,
  showGrid = true 
}) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-900/50 rounded-xl border border-white/10">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {showGrid && (
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
        )}
        
        {showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}
        
        {/* 坐标轴辅助线 (可选) */}
        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(255,255,255,0.1)" strokeDasharray="5,5" />
        <line x1={width/2} y1="0" x2={width/2} y2={height} stroke="rgba(255,255,255,0.1)" strokeDasharray="5,5" />

        {children}
      </svg>
    </div>
  );
};

export default FreeBodyDiagram;
