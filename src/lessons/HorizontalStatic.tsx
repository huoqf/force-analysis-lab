import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Info, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateWeight, formatPhysicsValue } from '../physics/mechanics';

const HorizontalStatic: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mass, setMass] = useState(10);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const weight = calculateWeight(mass);
  const normalForce = weight; // 平衡状态

  const toggleFullscreen = () => {
    const element = containerRef.current as any;
    if (!element) return;

    const isFS = document.fullscreenElement || 
                 (document as any).webkitFullscreenElement || 
                 (document as any).mozFullScreenElement || 
                 (document as any).msFullscreenElement;

    if (!isFS) {
      const requestMethod = element.requestFullscreen || 
                           element.webkitRequestFullscreen || 
                           element.mozRequestFullScreen || 
                           element.msRequestFullscreen;
      if (requestMethod) {
        requestMethod.call(element).catch((err: any) => {
          console.error(`Error: ${err.message}`);
        });
      }
    } else {
      const exitMethod = document.exitFullscreen || 
                        (document as any).webkitExitFullscreen || 
                        (document as any).mozCancelFullScreen || 
                        (document as any).msExitFullscreen;
      if (exitMethod) {
        exitMethod.call(document);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: isFullscreen || window.innerWidth > 1024 ? '2fr 1fr' : '1fr',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#020617'
      }}
      className="bg-slate-950 text-white"
    >
      {/* 左侧主显示区 (2/3) */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          gap: '1rem',
          minHeight: 0,
          width: '100%'
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-2xl font-bold">水平面静止模型</h2>
          </div>
          
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        <div style={{ flex: 1, minHeight: 0 }}>
          <FreeBodyDiagram>
            {/* 地面 */}
            <line x1="200" y1="650" x2="1000" y2="650" stroke="white" strokeWidth="4" />
            
            {/* 物体 (矩形) */}
            <rect x="500" y="530" width="200" height="120" fill="rgba(0, 120, 212, 0.3)" stroke="rgba(0, 120, 212, 0.8)" strokeWidth="3" />
            
            {/* 力的作用点定在物体的重心 (600, 590) */}
            <g transform="translate(600, 590)">
              {/* 重力 G */}
              <ForceArrow x={0} y={0} magnitude={weight} angle={90} color="#ff4d4d" label={`G`} />
              
              {/* 支持力 N */}
              <ForceArrow x={0} y={0} magnitude={normalForce} angle={270} color="#4d94ff" label={`N`} />
            </g>
          </FreeBodyDiagram>
        </div>
      </div>

      {/* 右侧控制面板 (1/3) */}
      <aside 
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-8 text-lg">实验参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ParameterSlider 
              label="物体质量" symbol="m" unit="kg" 
              value={mass} min={1} max={100} 
              onChange={setMass} 
            />
          </div>
        </div>

        <div style={{ padding: '2rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-4">
            <Info size={16} className="text-blue-400" /> 分析结论
          </h4>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p>在水平面上静止的物体，受到垂直向下的**重力** <InlineMath math="G" /> 和垂直向上的**支持力** <InlineMath math="N" />。</p>
            <p>由于物体在竖直方向上处于平衡状态（加速度为 0），根据牛顿第二定律有：</p>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
              <InlineMath math="\Sigma F_y = N - G = 0 \implies N = G" />
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: 'auto', padding: '2rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>实时计算数据</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>重力大小 G</span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#f87171' }}>{formatPhysicsValue(weight)} N</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>支持力大小 N</span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#60a5fa' }}>{formatPhysicsValue(normalForce)} N</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default HorizontalStatic;
