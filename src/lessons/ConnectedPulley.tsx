import React, { useState, useRef } from 'react';
import { ChevronLeft, Info, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateConnectedPulley } from '../physics/connected';
import { formatPhysicsValue } from '../physics/mechanics';

const ConnectedPulley: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mA, setMA] = useState(2);
  const [mB, setMB] = useState(3);
  const [mu, setMu] = useState(0.2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'system' | 'a' | 'b'>('system');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { weightA, weightB, fMaxA, fA, accel, tension, status } = calculateConnectedPulley(mA, mB, mu);

  const toggleFullscreen = () => {
    const element = containerRef.current as any;
    if (!element) return;
    const isFS = document.fullscreenElement || element.webkitFullscreenElement || element.mozFullScreenElement || element.msFullscreenElement;
    if (!isFS) {
      const req = element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen || element.msRequestFullscreen;
      if (req) req.call(element).catch((err: any) => console.error(err));
    } else {
      const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
      if (exit) exit.call(document);
    }
  };

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);
  
  return (
    <div 
      ref={containerRef}
      style={{ display: 'grid', gridTemplateColumns: isFullscreen || window.innerWidth > 1024 ? '2fr 1fr' : '1fr', height: '100vh', overflow: 'hidden', backgroundColor: '#020617' }}
      className="bg-slate-950 text-white"
    >
      <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', minHeight: 0, width: '100%' }} className="lg:col-span-2">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-2xl font-bold">连接体：桌面悬挂滑轮模型</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setViewMode('system')}
            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'system' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            全览图
          </button>
          <button 
            onClick={() => setViewMode('a')}
            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'a' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            桌面物体A隔离
          </button>
          <button 
            onClick={() => setViewMode('b')}
            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'b' ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            悬挂物体B隔离
          </button>
        </div>

        {status === 'static' && (
          <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 p-4 rounded-lg flex items-center gap-2">
            <Info size={20} className="text-amber-400 shrink-0" />
            <p><strong>系统静止</strong>：悬挂物B的重力不足以克服桌面物体A的最大静摩擦力，系统保持静止状态，加速度为0。</p>
          </div>
        )}

        <div className="flex-1 min-h-0 relative">
          <FreeBodyDiagram viewBox="0 0 1200 1200">
            {/* 桌子 */}
            <path d="M 0 650 L 700 650" fill="none" stroke="white" strokeWidth="6" />
            {/* 桌腿 */}
            <path d="M 700 650 L 700 1200" fill="none" stroke="white" strokeWidth="6" />
            
            {/* 定滑轮 */}
            <circle cx="700" cy="650" r="40" fill="none" stroke="#cbd5e1" strokeWidth="4" />
            <circle cx="700" cy="650" r="8" fill="#cbd5e1" />
            
            {/* 绳子 (A 到 滑轮顶端) */}
            <line x1="450" y1="610" x2="700" y2="610" stroke="#cbd5e1" strokeWidth="4" />
            {/* 绳子 (滑轮右侧 到 B) */}
            <line x1="740" y1="650" x2="740" y2="900" stroke="#cbd5e1" strokeWidth="4" />

            {/* 绘制物体A (桌面) */}
            <g transform={`translate(400, 650)`}>
              <rect x={-50} y={-80} width={100} height={80} 
                fill={viewMode === 'a' ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.1)"} 
                stroke="rgba(16, 185, 129, 0.8)" strokeWidth={3} />
              <text x={0} y={-35} fill="white" textAnchor="middle" fontSize="20" fontWeight="bold">A</text>
              {status === 'sliding' && (
                <ForceArrow x={0} y={-110} magnitude={Math.min(accel * 15, 80)} angle={0} color="#10b981" label="a" dashed />
              )}
              
              {/* 受力图 A */}
              {(viewMode === 'a' || viewMode === 'system') && (
                <>
                  <ForceArrow x={0} y={-40} magnitude={weightA} angle={90} color="#ff4d4d" label="G_A" />
                  <ForceArrow x={0} y={-40} magnitude={weightA} angle={270} color="#4d94ff" label="N_A" />
                  <ForceArrow x={0} y={-40} magnitude={fA} angle={180} color="#f59e0b" label="f_A" />
                </>
              )}
              {viewMode === 'a' && (
                <ForceArrow x={0} y={-40} magnitude={tension} angle={0} color="#ec4899" label="T" />
              )}
            </g>

            {/* 绘制物体B (悬挂) */}
            <g transform={`translate(740, 940)`}>
              <rect x={-40} y={-40} width={80} height={80} 
                fill={viewMode === 'b' ? "rgba(168, 85, 247, 0.3)" : "rgba(168, 85, 247, 0.1)"} 
                stroke="rgba(168, 85, 247, 0.8)" strokeWidth={3} />
              <text x={0} y={5} fill="white" textAnchor="middle" fontSize="20" fontWeight="bold">B</text>
              {status === 'sliding' && (
                <ForceArrow x={60} y={0} magnitude={Math.min(accel * 15, 80)} angle={90} color="#a855f7" label="a" dashed />
              )}
              
              {/* 受力图 B */}
              {(viewMode === 'b' || viewMode === 'system') && (
                <ForceArrow x={0} y={0} magnitude={weightB} angle={90} color="#ff4d4d" label="G_B" />
              )}
              {viewMode === 'b' && (
                <ForceArrow x={0} y={0} magnitude={tension} angle={270} color="#ec4899" label="T" />
              )}
            </g>
          </FreeBodyDiagram>
        </div>
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }} className="lg:col-span-1">
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-8 text-lg">实验参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ParameterSlider label="桌面物体A质量" symbol="m_A" unit="kg" value={mA} min={1} max={50} onChange={setMA} />
            <ParameterSlider label="悬挂物体B质量" symbol="m_B" unit="kg" value={mB} min={1} max={50} onChange={setMB} />
            <ParameterSlider label="动/静摩擦因数" symbol="μ" unit="" value={mu} min={0} max={1.0} step={0.05} onChange={setMu} />
          </div>
        </div>

        <div style={{ padding: '2rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-4 text-blue-400">
            <Info size={16} /> 物理要点：跨滑轮约束
          </h4>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p>1. **加速度大小相等**：A和B由不可伸长的轻绳连接，因此它们虽然方向不同（A向右，B向下），但加速度大小始终相等 <InlineMath math="a_A = a_B = a" />。</p>
            <p>2. **联立隔离法方程**：对A：<InlineMath math="T - f_A = m_A a" />；对B：<InlineMath math="G_B - T = m_B a" />。相加消去内力 <InlineMath math="T" /> 可得系统加速度。</p>
            <p className="text-pink-300">观察张力T：只有在完全静止时 <InlineMath math="T = G_B" />。当系统加速下落时，B处于“失重状态”，此时 <InlineMath math="T < G_B" />，这也是很多同学容易错的地方。</p>
          </div>
        </div>
        
        <div style={{ marginTop: 'auto', padding: '2rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>实时计算数据</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>状态</span>
              <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: status === 'static' ? '#f59e0b' : '#34d399', fontWeight: 'bold' }}>
                {status === 'static' ? '静止' : '加速滑动'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>悬挂物重力 <InlineMath math="G_B" /></span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#ff4d4d' }}>{formatPhysicsValue(weightB)} N</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>A最大静摩擦力 <InlineMath math="f_{maxA}" /></span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#ef4444' }}>{formatPhysicsValue(fMaxA)} N</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>系统加速度 <InlineMath math="a" /></span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#34d399' }}>{formatPhysicsValue(accel)} m/s²</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} title="注意失重效应">
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>绳子张力 <InlineMath math="T" /></span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#ec4899', fontWeight: 'bold' }}>{formatPhysicsValue(tension)} N</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ConnectedPulley;
