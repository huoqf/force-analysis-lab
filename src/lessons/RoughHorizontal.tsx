import React, { useState, useRef } from 'react';
import { ChevronLeft, Info, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateHorizontalPhysics, formatPhysicsValue } from '../physics/mechanics';

const RoughHorizontal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mass, setMass] = useState(10);
  const [mu, setMu] = useState(0.5);
  const [appliedForce, setAppliedForce] = useState(30);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { normalForce, frictionForce, maxFriction, accel, weight } = calculateHorizontalPhysics(mass, mu, appliedForce);

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
            <h2 className="text-2xl font-bold">粗糙水平面模型</h2>
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
            {/* 水平面 */}
            <path 
              d={`M 200 650 L 1000 650`} 
              fill="none" 
              stroke="white" 
              strokeWidth="3" 
            />
            {/* 粗糙地面示意 */}
            <path
              d="M 220 650 L 210 660 M 240 650 L 230 660 M 260 650 L 250 660 M 280 650 L 270 660 M 300 650 L 290 660 M 320 650 L 310 660 M 340 650 L 330 660 M 360 650 L 350 660 M 380 650 L 370 660 M 400 650 L 390 660 M 420 650 L 410 660 M 440 650 L 430 660 M 460 650 L 450 660 M 480 650 L 470 660 M 500 650 L 490 660 M 520 650 L 510 660 M 540 650 L 530 660 M 560 650 L 550 660 M 580 650 L 570 660 M 600 650 L 590 660 M 620 650 L 610 660 M 640 650 L 630 660 M 660 650 L 650 660 M 680 650 L 670 660 M 700 650 L 690 660 M 720 650 L 710 660 M 740 650 L 730 660 M 760 650 L 750 660 M 780 650 L 770 660 M 800 650 L 790 660 M 820 650 L 810 660 M 840 650 L 830 660 M 860 650 L 850 660 M 880 650 L 870 660 M 900 650 L 890 660 M 920 650 L 910 660 M 940 650 L 930 660 M 960 650 L 950 660 M 980 650 L 970 660"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="2"
            />
            
            {/* 物体放置在中心 (X=600) */}
            <g transform={`translate(600, 610)`}>
              <rect 
                x="-60" y="-40" width="120" height="80" 
                fill={Math.abs(accel) > 0 ? "rgba(52, 211, 153, 0.2)" : "rgba(0, 120, 212, 0.3)"} 
                stroke={Math.abs(accel) > 0 ? "rgba(52, 211, 153, 0.8)" : "rgba(0, 120, 212, 0.8)"} 
                strokeWidth="3" 
              />
            </g>

            {/* 运动虚影/特效 */}
            {Math.abs(accel) > 0 && (
              <g transform={`translate(600, 610)`}>
                {accel > 0 ? (
                  // 向右运动，虚影在左侧
                  <>
                    <line x1="-75" y1="-30" x2="-95" y2="-30" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="4 2" />
                    <line x1="-70" y1="-10" x2="-100" y2="-10" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="6 3" />
                    <line x1="-75" y1="10" x2="-90" y2="10" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="3 2" />
                  </>
                ) : (
                  // 向左运动，虚影在右侧
                  <>
                    <line x1="75" y1="-30" x2="95" y2="-30" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="4 2" />
                    <line x1="70" y1="-10" x2="100" y2="-10" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="6 3" />
                    <line x1="75" y1="10" x2="90" y2="10" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="3 2" />
                  </>
                )}
                {/* 顶部加速度箭头 a */}
                <ForceArrow x={0} y={-70} magnitude={Math.min(Math.abs(accel) * 15, 100)} angle={accel > 0 ? 0 : 180} color="#34d399" label="a" dashed />
              </g>
            )}

            {/* 全局坐标系下的受力图 */}
            <g transform={`translate(600, 610)`}>
              {/* 真实力：重力 G (向下 90度) */}
              <ForceArrow x={0} y={0} magnitude={weight} angle={90} color="#ff4d4d" label={`G`} />
              
              {/* 真实力：支持力 N (竖直向上 270度) */}
              <ForceArrow x={0} y={0} magnitude={normalForce} angle={270} color="#4d94ff" label={`N`} />

              {/* 外力 F */}
              {Math.abs(appliedForce) > 0 && (
                <ForceArrow x={0} y={0} magnitude={Math.abs(appliedForce)} angle={appliedForce > 0 ? 0 : 180} color="#10b981" label={`F`} />
              )}
              
              {/* 摩擦力 f */}
              {Math.abs(frictionForce) > 0 && (
                <ForceArrow x={0} y={0} magnitude={Math.abs(frictionForce)} angle={frictionForce > 0 ? 0 : 180} color="#f59e0b" label={Math.abs(appliedForce) <= maxFriction ? `f(静)` : `f(滑)`} />
              )}
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
              label="动摩擦因数" symbol="μ" unit="" 
              value={mu} min={0} max={1.0} step={0.05}
              onChange={setMu} 
            />
            <ParameterSlider 
              label="水平外力" symbol="F" unit="N" 
              value={appliedForce} min={-200} max={200} 
              onChange={setAppliedForce} 
            />
          </div>
        </div>

        <div style={{ padding: '2rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-4">
            <Info size={16} className="text-emerald-400" /> 物理要点
          </h4>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p>1. **竖直方向平衡**：在没有竖直方向外力时，物体不离开水平面。支持力与重力抵消：<InlineMath math="N = mg" />。</p>
            <p>2. **最大静摩擦力**：为简化，我们设最大静摩擦力等于滑动摩擦力 <InlineMath math="f_{max} = \mu N" />。当外力 <InlineMath math="|F| \le f_{max}" /> 时，物体静止，摩擦力大小等于外力大小。</p>
            <p>3. **牛顿第二定律**：当外力 <InlineMath math="|F| > f_{max}" /> 时，物体加速：<InlineMath math="F_{net} = F + f = ma" />。</p>
          </div>
        </div>
        
        <div style={{ marginTop: 'auto', padding: '2rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>实时计算数据</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>状态</span>
              <span style={{ fontFamily: 'sans-serif', fontSize: '1rem', color: Math.abs(appliedForce) <= maxFriction ? '#f59e0b' : '#34d399', fontWeight: 'bold' }}>
                {Math.abs(appliedForce) <= maxFriction ? '静止' : '滑动'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ 
                color: Math.abs(Math.abs(appliedForce) - maxFriction) < 0.01 ? '#ef4444' : 'rgba(255, 255, 255, 0.5)', 
                fontSize: '0.875rem',
                fontWeight: Math.abs(Math.abs(appliedForce) - maxFriction) < 0.01 ? 'bold' : 'normal',
                transition: 'color 0.3s'
              }}>
                最大静摩擦力
              </span>
              <span style={{ 
                fontFamily: 'monospace', 
                fontSize: '1.25rem', 
                color: Math.abs(Math.abs(appliedForce) - maxFriction) < 0.01 ? '#ef4444' : '#f59e0b',
                transition: 'color 0.3s'
              }}>
                {formatPhysicsValue(maxFriction)} N
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} title="静摩擦力不是固定值，它会随外力变化而变化以保持平衡；当物体滑动后，转变为滑动摩擦力。">
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', borderBottom: '1px dashed rgba(255,255,255,0.3)', cursor: 'help' }}>
                {Math.abs(appliedForce) <= maxFriction ? '静摩擦力 f' : '滑动摩擦力 f'}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#f59e0b' }}>{formatPhysicsValue(Math.abs(frictionForce))} N</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>加速度 a</span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#34d399' }}>{formatPhysicsValue(accel)} m/s²</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default RoughHorizontal;
