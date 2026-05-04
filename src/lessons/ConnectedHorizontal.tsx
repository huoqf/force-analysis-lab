import React, { useState, useRef } from 'react';
import { ChevronLeft, Info, Maximize, Minimize, MousePointerClick } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateConnectedHorizontal } from '../physics/connected';
import { formatPhysicsValue } from '../physics/mechanics';

const ConnectedHorizontal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mA, setMA] = useState(2);
  const [mB, setMB] = useState(3);
  const [muK, setMuK] = useState(0.2);
  const [appliedForce, setAppliedForce] = useState(20);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'system' | 'a' | 'b'>('system');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { weightA, weightB, fMaxTotal, fA, fB, accel, tension, status } = calculateConnectedHorizontal(mA, mB, muK, appliedForce);

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
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
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
      <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', minHeight: 0, width: '100%' }} className="lg:col-span-2">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-2xl font-bold">连接体：粗糙水平面双物体模型</h2>
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
            系统整体视角
          </button>
          <button 
            onClick={() => setViewMode('a')}
            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'a' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            物体A隔离图
          </button>
          <button 
            onClick={() => setViewMode('b')}
            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'b' ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            物体B隔离图
          </button>
        </div>

        {status === 'static' && (
          <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 p-4 rounded-lg flex items-center gap-2">
            <Info size={20} className="text-amber-400 shrink-0" />
            <p><strong>系统静止</strong>：当前外力 F ({formatPhysicsValue(appliedForce)} N) 小于最大静摩擦力总和 ({formatPhysicsValue(fMaxTotal)} N)。静摩擦力按需提供，图中的摩擦力按能力比例分配，仅作为一种可能的示意，物理解不唯一。</p>
          </div>
        )}
        {status === 'critical' && (
          <div className="bg-orange-500/20 border border-orange-500/50 text-orange-200 p-4 rounded-lg flex items-center gap-2">
            <Info size={20} className="text-orange-400 shrink-0" />
            <p><strong>临界状态</strong>：当前外力 F 刚好等于最大静摩擦力总和，系统处于即将滑动的临界点。</p>
          </div>
        )}
        {status === 'sliding' && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-4 rounded-lg flex items-center gap-2">
            <Info size={20} className="text-emerald-400 shrink-0" />
            <p><strong>系统滑动</strong>：外力 F 已克服最大静摩擦力，系统产生加速度，此时摩擦力转为动摩擦力。</p>
          </div>
        )}

        <div className="flex-1 min-h-0 relative">
          <FreeBodyDiagram>
            <path d="M 100 650 L 1100 650" fill="none" stroke="white" strokeWidth="3" />
            <path
              d="M 120 650 L 110 660 M 140 650 L 130 660 M 160 650 L 150 660 M 180 650 L 170 660 M 200 650 L 190 660 M 220 650 L 210 660 M 240 650 L 230 660 M 260 650 L 250 660 M 280 650 L 270 660 M 300 650 L 290 660 M 320 650 L 310 660 M 340 650 L 330 660 M 360 650 L 350 660 M 380 650 L 370 660 M 400 650 L 390 660 M 420 650 L 410 660 M 440 650 L 430 660 M 460 650 L 450 660 M 480 650 L 470 660 M 500 650 L 490 660 M 520 650 L 510 660 M 540 650 L 530 660 M 560 650 L 550 660 M 580 650 L 570 660 M 600 650 L 590 660 M 620 650 L 610 660 M 640 650 L 630 660 M 660 650 L 650 660 M 680 650 L 670 660 M 700 650 L 690 660 M 720 650 L 710 660 M 740 650 L 730 660 M 760 650 L 750 660 M 780 650 L 770 660 M 800 650 L 790 660 M 820 650 L 810 660 M 840 650 L 830 660 M 860 650 L 850 660 M 880 650 L 870 660 M 900 650 L 890 660 M 920 650 L 910 660 M 940 650 L 930 660 M 960 650 L 950 660 M 980 650 L 970 660 M 1000 650 L 990 660 M 1020 650 L 1010 660 M 1040 650 L 1030 660 M 1060 650 L 1050 660 M 1080 650 L 1070 660"
              stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2"
            />
            
            {/* 绘制物体B (左侧) */}
            <g transform={`translate(400, 610)`}>
              <rect x="-50" y="-40" width="100" height="80" 
                fill={viewMode === 'b' ? "rgba(168, 85, 247, 0.3)" : "rgba(168, 85, 247, 0.1)"} 
                stroke="rgba(168, 85, 247, 0.8)" strokeWidth="3" />
              <text x="0" y="5" fill="white" textAnchor="middle" fontSize="20" fontWeight="bold">B</text>
              {status === 'sliding' && (
                <ForceArrow x={0} y={-70} magnitude={Math.min(accel * 15, 80)} angle={0} color="#a855f7" label="a" dashed />
              )}
              
              {/* 受力图 B */}
              {(viewMode === 'b' || viewMode === 'system') && (
                <>
                  <ForceArrow x={0} y={0} magnitude={weightB} angle={90} color="#ff4d4d" label="G_B" />
                  <ForceArrow x={0} y={0} magnitude={weightB} angle={270} color="#4d94ff" label="N_B" />
                  <ForceArrow x={0} y={0} magnitude={fB} angle={180} color="#f59e0b" label="f_B" />
                </>
              )}
              {viewMode === 'b' && (
                <ForceArrow x={0} y={0} magnitude={tension} angle={0} color="#ec4899" label="T" />
              )}
            </g>

            {/* 绳子 */}
            <line x1="450" y1="610" x2="650" y2="610" stroke="#cbd5e1" strokeWidth="4" />
            <text x="550" y="590" fill="#cbd5e1" textAnchor="middle" fontSize="16">绳子</text>

            {/* 绘制物体A (右侧) */}
            <g transform={`translate(700, 610)`}>
              <rect x="-50" y="-40" width="100" height="80" 
                fill={viewMode === 'a' ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.1)"} 
                stroke="rgba(16, 185, 129, 0.8)" strokeWidth="3" />
              <text x="0" y="5" fill="white" textAnchor="middle" fontSize="20" fontWeight="bold">A</text>
              {status === 'sliding' && (
                <ForceArrow x={0} y={-70} magnitude={Math.min(accel * 15, 80)} angle={0} color="#10b981" label="a" dashed />
              )}
              
              {/* 受力图 A */}
              {(viewMode === 'a' || viewMode === 'system') && (
                <>
                  <ForceArrow x={0} y={0} magnitude={weightA} angle={90} color="#ff4d4d" label="G_A" />
                  <ForceArrow x={0} y={0} magnitude={weightA} angle={270} color="#4d94ff" label="N_A" />
                  <ForceArrow x={0} y={0} magnitude={fA} angle={180} color="#f59e0b" label="f_A" />
                  <ForceArrow x={0} y={0} magnitude={appliedForce} angle={0} color="#3b82f6" label="F" />
                </>
              )}
              {viewMode === 'a' && (
                <ForceArrow x={0} y={0} magnitude={tension} angle={180} color="#ec4899" label="T" />
              )}
            </g>
          </FreeBodyDiagram>
        </div>
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }} className="lg:col-span-1">
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-8 text-lg">实验参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ParameterSlider label="物体A质量" symbol="m_A" unit="kg" value={mA} min={1} max={50} onChange={setMA} />
            <ParameterSlider label="物体B质量" symbol="m_B" unit="kg" value={mB} min={1} max={50} onChange={setMB} />
            <ParameterSlider label="动/静摩擦因数" symbol="μ" unit="" value={muK} min={0} max={1.0} step={0.05} onChange={setMuK} />
            <ParameterSlider label="水平拉力" symbol="F" unit="N" value={appliedForce} min={10} max={500} onChange={setAppliedForce} />
          </div>
        </div>

        <div style={{ padding: '2rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-4 text-blue-400">
            <Info size={16} /> 物理要点：隔离与整体
          </h4>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p>1. **整体法求加速度**：将A、B看作一个整体，张力 <InlineMath math="T" /> 为内力不产生宏观加速度。<InlineMath math="a = \frac{F - f_A - f_B}{m_A + m_B}" />。</p>
            <p>2. **隔离法求内部张力**：选取后方的物体B进行隔离分析。B在水平方向受张力 <InlineMath math="T" /> 向前和摩擦力 <InlineMath math="f_B" /> 向后。<InlineMath math="T - f_B = m_B \cdot a" />。</p>
            <p className="text-purple-300">观察左侧受力图视角，体会张力何时为外力、何时为内力不画出。</p>
          </div>
        </div>
        
        <div style={{ marginTop: 'auto', padding: '2rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>实时计算数据</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>最大静摩擦力总和</span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#ef4444' }}>{formatPhysicsValue(fMaxTotal)} N</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>实际摩擦力之和 <InlineMath math="f_A + f_B" /></span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#f59e0b' }}>{formatPhysicsValue(fA + fB)} N</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>系统加速度 <InlineMath math="a" /></span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#34d399' }}>{formatPhysicsValue(accel)} m/s²</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>绳子张力 <InlineMath math="T" /></span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: '#ec4899', fontWeight: 'bold' }}>{formatPhysicsValue(tension)} N</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ConnectedHorizontal;
