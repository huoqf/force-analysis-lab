import React, { useState, useRef } from 'react';
import { ChevronLeft, Info, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateInclineForces, calculateInclineAccel, formatPhysicsValue } from '../physics/mechanics';

const InclineFrictionless: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mass, setMass] = useState(10);
  const [angle, setAngle] = useState(30);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { gParallel, gNormal, weight } = calculateInclineForces(mass, angle);
  const accel = calculateInclineAccel(angle);

  // 坐标转换计算
  const angleRad = (angle * Math.PI) / 180;

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

  // 监听全屏状态变化 (处理 ESC 退出)
  React.useEffect(() => {
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
        className="lg:col-span-2"
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-2xl font-bold">斜面无摩擦模型</h2>
          </div>
          
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        <div className="flex-1 min-h-0">
          <FreeBodyDiagram>
            {/* 斜面 */}
            <path 
              d={`M 200 650 L 1000 650 L 1000 ${650 - 800 * Math.tan(angleRad)} Z`} 
              fill="rgba(255, 255, 255, 0.05)" 
              stroke="white" 
              strokeWidth="3" 
            />
            
            {/* 物体放置在斜面中心 (X=600) */}
            <g transform={`translate(600, ${650 - 400 * Math.tan(angleRad)}) rotate(${-angle})`}>
              <rect x="-60" y="-80" width="120" height="80" fill="rgba(0, 120, 212, 0.3)" stroke="rgba(0, 120, 212, 0.8)" strokeWidth="3" />
            </g>

            {/* 全局坐标系下的受力图 */}
            <g transform={`translate(${600 - 40 * Math.sin(angleRad)}, ${650 - 400 * Math.tan(angleRad) - 40 * Math.cos(angleRad)})`}>
              {/* 真实力：重力 G (向下 90度) */}
              <ForceArrow x={0} y={0} magnitude={weight} angle={90} color="#ff4d4d" label={`G`} />
              
              {/* 真实力：支持力 N (垂直斜面向上 270-angle 度) */}
              <ForceArrow x={0} y={0} magnitude={gNormal} angle={270 - angle} color="#4d94ff" label={`N`} />

              {/* 重力分解：沿斜面向下分力 G1 (向左下 180-angle 度) */}
              <ForceArrow x={0} y={0} magnitude={gParallel} angle={180 - angle} color="#ff9f4d" label={`G_1(分力)`} scale={1.5} dashed />
              
              {/* 重力分解：垂直斜面向下分力 G2 (向右下 90-angle 度) */}
              <ForceArrow x={0} y={0} magnitude={gNormal} angle={90 - angle} color="#ff9f4d" label={`G_2(分力)`} scale={1.5} dashed />
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
        className="lg:col-span-1"
      >
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-8 text-lg">实验参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ParameterSlider 
              label="物体质量" symbol="m" unit="kg" 
              value={mass} min={1} max={100} 
              onChange={setMass} 
            />
            <ParameterSlider 
              label="斜面倾角" symbol="θ" unit="°" 
              value={angle} min={0} max={90} 
              onChange={setAngle} 
            />
          </div>
        </div>

        <div style={{ padding: '2rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-4">
            <Info size={16} className="text-emerald-400" /> 物理要点
          </h4>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p>1. **受力分析**：物体只受重力 <InlineMath math="G" /> 和支持力 <InlineMath math="N" />。注意没有“下滑力”，下滑效果是由重力的分力产生的。</p>
            <p>2. **正交分解**：将重力沿斜面分解为 <InlineMath math="G_1 = mg \sin\theta" />，垂直斜面分解为 <InlineMath math="G_2 = mg \cos\theta" />。</p>
            <p>3. **运动方程**：沿斜面方向 <InlineMath math="mg \sin\theta = ma" />，得加速度 <InlineMath math="a = g \sin\theta" />。</p>
          </div>
        </div>
        
        <div style={{ marginTop: 'auto', padding: '2rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>实时计算数据</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>加速度 a</span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#34d399' }}>{formatPhysicsValue(accel)} m/s²</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>垂直压力 N</span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#60a5fa' }}>{formatPhysicsValue(gNormal)} N</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default InclineFrictionless;
