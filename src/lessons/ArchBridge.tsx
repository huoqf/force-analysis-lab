import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Info, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateArchBridge } from '../physics/circular';
import { formatPhysicsValue } from '../physics/mechanics';

const ArchBridge: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mass, setMass] = useState(1000);
  const [speed, setSpeed] = useState(15);
  const [radius, setRadius] = useState(50);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    weight,
    normalForce,
    centripetalForce,
    maxSafeSpeed,
    isFlying,
    weightRatio,
    statusText,
  } = calculateArchBridge(mass, speed, radius);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    const el = containerRef.current as any;
    if (!el) return;
    const isFS = document.fullscreenElement || el.webkitFullscreenElement;
    if (!isFS) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el).catch(console.error);
    } else {
      const exit = document.exitFullscreen || (document as any).webkitExitFullscreen;
      if (exit) exit.call(document);
    }
  };

  useEffect(() => {
    const handler = () =>
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // SVG Drawing Constants
  const CENTER_X = 600;
  const PIXEL_PER_METER = 8; // Scale down for large radius
  
  const rPx = radius * PIXEL_PER_METER;
  const bridgeCenterY = 600 + rPx; // Bridge arch top is at Y=600
  
  // Object position
  const objX = CENTER_X;
  const objY = isFlying ? 600 - (speed - maxSafeSpeed)*5 : 600; // Fly off slightly if too fast
  
  const clip = (v: number) => Math.min((v / weight) * 100, 160); // Scale arrows relative to weight
  const W = 80;
  const H = 40;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: isFullscreen || window.innerWidth > 1024 ? '2fr 1fr' : '1fr',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#020617',
      }}
      className="bg-slate-950 text-white"
    >
      <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', minHeight: 0 }} className="lg:col-span-2">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-2xl font-bold">汽车过拱桥模型</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* 状态横幅 */}
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm border ${!isFlying ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-red-500/20 border-red-500/50 text-red-200'}`}>
          <Info size={18} className="shrink-0" />
          <p>
            <strong>当前状态：{statusText}</strong>。
            (安全限速 v_max = {formatPhysicsValue(maxSafeSpeed)} m/s, 当前体感重量为正常时的 {(weightRatio*100).toFixed(0)}%)
          </p>
        </div>

        <div className="flex-1 min-h-0 relative">
          <div className="absolute top-4 left-4 p-3 bg-slate-900/80 rounded-lg border border-white/10 text-xs text-white/70 z-10">
            <div className="flex items-center gap-2 mb-1"><div className="w-4 h-0.5 bg-red-500"></div> 真实力: 重力 mg</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-4 h-0.5 bg-green-400"></div> 真实力: 桥面支持力 N</div>
            <div className="flex items-center gap-2"><div className="w-4 border-b border-dashed border-purple-500"></div> 辅助: 向心力 F_向 (合力)</div>
          </div>

          <FreeBodyDiagram width={1200} height={800} showGrid={false}>
            {/* Arch Bridge */}
            <path 
              d={`M ${CENTER_X - 400} 800 Q ${CENTER_X} ${600 - (80000/rPx)} ${CENTER_X + 400} 800`} 
              fill="none" stroke="#475569" strokeWidth="30" strokeLinecap="round"
            />
            {/* Dashed line to center of curvature */}
            <line x1={CENTER_X} y1={600} x2={CENTER_X} y2={bridgeCenterY} stroke="rgba(255,255,255,0.2)" strokeDasharray="5,5" />
            <circle cx={CENTER_X} cy={bridgeCenterY} r={6} fill="rgba(255,255,255,0.3)" />
            <text x={CENTER_X + 10} y={bridgeCenterY} fill="rgba(255,255,255,0.5)">曲率中心</text>

            {/* Car Object */}
            <rect 
              x={objX - W/2} y={objY - H} 
              width={W} height={H} rx={8}
              fill={isFlying ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"} 
              stroke={isFlying ? "#ef4444" : "#f59e0b"} strokeWidth="3" 
            />
            {/* Wheels */}
            <circle cx={objX - 25} cy={objY} r={10} fill="#333" stroke="#94a3b8" strokeWidth="2" />
            <circle cx={objX + 25} cy={objY} r={10} fill="#333" stroke="#94a3b8" strokeWidth="2" />
            
            {/* Velocity Vector */}
            <ForceArrow 
              x={objX} y={objY - H/2} 
              magnitude={Math.min(speed * 4, 150)} angle={0} 
              color="#34d399" label="v" dashed 
            />

            {/* Normal Force N */}
            {normalForce > 0 && (
              <ForceArrow 
                x={objX + 15} y={objY} 
                magnitude={clip(normalForce)} angle={270} 
                color="#4ade80" label="N" 
              />
            )}

            {/* Gravity G */}
            <ForceArrow 
              x={objX - 15} y={objY} 
              magnitude={clip(weight)} angle={90} 
              color="#ef4444" label="mg" 
            />

            {/* Centripetal Force Indicator (purple dashed) */}
            {!isFlying && (
              <ForceArrow 
                x={objX + 40} y={objY} 
                magnitude={clip(centripetalForce)} angle={90} 
                color="#a855f7" label="F_向" dashed scale={1.2}
              />
            )}

            {/* Dynamic Formula Display next to the object */}
            <g transform={`translate(${CENTER_X + 80}, ${objY - 80})`}>
              <rect x="0" y="0" width="280" height="40" fill="rgba(0,0,0,0.6)" rx="4" />
              <text x="10" y="25" fill="#a855f7" fontSize="16" fontFamily="monospace">
                F_向 = mg - N = {formatPhysicsValue(centripetalForce)} N
              </text>
            </g>

          </FreeBodyDiagram>
        </div>
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: 'rgba(15,23,42,0.6)', borderLeft: '1px solid rgba(255,255,255,0.08)' }} className="lg:col-span-1">
        <div style={{ padding: '1.5rem' }}>
          <h3 className="font-bold mb-6 text-lg">实验参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ParameterSlider label="汽车质量" symbol="m" unit="kg" value={mass} min={500} max={3000} step={100} onChange={setMass} />
            <ParameterSlider label="过桥速度" symbol="v" unit="m/s" value={speed} min={5} max={40} step={1} onChange={setSpeed} />
            <ParameterSlider label="拱桥半径" symbol="r" unit="m" value={radius} min={20} max={100} step={5} onChange={setRadius} />
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(59,130,246,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-3 text-blue-400 text-sm">
            <Info size={15} /> 物理要点：拱桥失重
          </h4>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p className="text-yellow-300"><strong>易错提醒：</strong>"失重"不是重力消失了，而是支持力 N 小于重力 mg，导致体感变轻！</p>
            <p><strong>受力分析：</strong>在拱桥最高点，合力向下提供向心力。<br/><InlineMath math="mg - N = m \frac{v^2}{r}" /></p>
            <p><strong>支持力变化：</strong><br/><InlineMath math="N = mg - m \frac{v^2}{r}" /><br/>速度 <InlineMath math="v" /> 越大，所需向心力越大，支持力 <InlineMath math="N" /> 就越小。</p>
            <p><strong>安全极限：</strong>当 <InlineMath math="N=0" /> 时，<InlineMath math="v_{max} = \sqrt{gr}" />。超过此速度汽车将腾空飞离桥面。</p>
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <h4 style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>实时计算</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { label: '重力 mg', value: `${formatPhysicsValue(weight)} N`, color: '#ef4444' },
              { label: '支持力 N', value: `${formatPhysicsValue(normalForce)} N`, color: '#4ade80' },
              { label: '向心力 F_向', value: `${formatPhysicsValue(centripetalForce)} N`, color: '#a855f7' },
              { label: '安全限速 v_max', value: `${formatPhysicsValue(maxSafeSpeed)} m/s`, color: '#facc15' },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{row.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: row.color, fontWeight: 'bold' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ArchBridge;
