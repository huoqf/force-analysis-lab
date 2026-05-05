import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Info, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateConicalPendulum } from '../physics/circular';
import { formatPhysicsValue } from '../physics/mechanics';

const ConicalPendulum: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mass, setMass] = useState(2);
  const [ropeLength, setRopeLength] = useState(2);
  const [halfAngleDeg, setHalfAngleDeg] = useState(30);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Animation state
  const [phaseAngle, setPhaseAngle] = useState(0);

  const {
    weight,
    tension,
    centripetalForce,
    radius,
    speed,
    period,
    angularVelocity,
    centripetalAccel,
  } = calculateConicalPendulum(mass, ropeLength, halfAngleDeg);

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

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const deltaTime = (time - lastTime) / 1000; // seconds
      lastTime = time;
      
      setPhaseAngle(prevAngle => {
        let newAngle = prevAngle + angularVelocity * deltaTime;
        if (newAngle >= 2 * Math.PI) {
          newAngle -= 2 * Math.PI;
        }
        return newAngle;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [angularVelocity]);

  // SVG Drawing Constants
  const CENTER_X = 600;
  const PIVOT_Y = 150;
  const PIXEL_PER_METER = 120; // 1m = 120px
  
  // 3D perspective effect
  const scaleY = 0.25; // flatten the circle
  
  const height = ropeLength * Math.cos((halfAngleDeg * Math.PI) / 180);
  const ORBIT_Y = PIVOT_Y + height * PIXEL_PER_METER;
  
  const objDisplayX = CENTER_X + radius * PIXEL_PER_METER * Math.cos(phaseAngle);
  const objDisplayY = ORBIT_Y + radius * PIXEL_PER_METER * Math.sin(phaseAngle) * scaleY;
  
  // Calculate force arrow angles in 2D display space
  const toCenterX = CENTER_X - objDisplayX;
  const toCenterY = ORBIT_Y - objDisplayY;
  const centripetalAngle = Math.atan2(toCenterY, toCenterX) * 180 / Math.PI;
  
  const toPivotX = CENTER_X - objDisplayX;
  const toPivotY = PIVOT_Y - objDisplayY;
  const tensionAngle = Math.atan2(toPivotY, toPivotX) * 180 / Math.PI;

  const clip = (v: number) => Math.min(Math.abs(v) * 2, 140);
  const W = 40 + mass * 5;

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
            <h2 className="text-2xl font-bold">圆锥摆模型</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        <div className="flex-1 min-h-0 relative">
          <div className="absolute top-4 left-4 p-3 bg-slate-900/80 rounded-lg border border-white/10 text-xs text-white/70 z-10">
            <div className="flex items-center gap-2 mb-1"><div className="w-4 h-0.5 bg-blue-400"></div> 真实力: 绳拉力 T</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-4 h-0.5 bg-red-500"></div> 真实力: 重力 G</div>
            <div className="flex items-center gap-2"><div className="w-4 border-b border-dashed border-purple-500"></div> 辅助: 向心力 F_向 (T的水平分力)</div>
          </div>

          <FreeBodyDiagram width={1200} height={800} showGrid={false}>
            {/* Ceiling */}
            <rect x={CENTER_X - 100} y={PIVOT_Y - 20} width={200} height={20} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" />
            
            {/* Pivot */}
            <circle cx={CENTER_X} cy={PIVOT_Y} r={6} fill="#94a3b8" />
            
            {/* Center Axis (dashed) */}
            <line 
              x1={CENTER_X} y1={PIVOT_Y} 
              x2={CENTER_X} y2={ORBIT_Y} 
              stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="5,5" 
            />
            
            {/* Orbit path */}
            <ellipse 
              cx={CENTER_X} cy={ORBIT_Y} 
              rx={radius * PIXEL_PER_METER} ry={radius * PIXEL_PER_METER * scaleY} 
              fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="5,5" 
            />

            {/* Rope */}
            <line 
              x1={CENTER_X} y1={PIVOT_Y} 
              x2={objDisplayX} y2={objDisplayY} 
              stroke="#cbd5e1" strokeWidth="3" 
            />

            {/* Object */}
            <circle cx={objDisplayX} cy={objDisplayY} r={W/2} fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="2" />
            
            {/* Tension */}
            <ForceArrow 
              x={objDisplayX} y={objDisplayY} 
              magnitude={clip(tension)} angle={tensionAngle} 
              color="#60a5fa" label="T" 
            />

            {/* Centripetal Force Indicator (purple dashed) */}
            <ForceArrow 
              x={objDisplayX} y={objDisplayY} 
              magnitude={clip(centripetalForce)} angle={centripetalAngle} 
              color="#a855f7" label="F_向" dashed scale={2}
            />

            {/* Gravity (down) */}
            <ForceArrow 
              x={objDisplayX} y={objDisplayY} 
              magnitude={clip(weight)} angle={90} 
              color="#ef4444" label="G" 
            />

            {/* Dynamic Formula Display next to the object */}
            <g transform={`translate(${CENTER_X - 110}, ${ORBIT_Y + 80})`}>
              <rect x="0" y="0" width="220" height="40" fill="rgba(0,0,0,0.5)" rx="4" />
              <text x="10" y="25" fill="#a855f7" fontSize="16" fontFamily="monospace">
                F_向 = T·sinθ = {formatPhysicsValue(centripetalForce)} N
              </text>
            </g>

          </FreeBodyDiagram>
        </div>
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: 'rgba(15,23,42,0.6)', borderLeft: '1px solid rgba(255,255,255,0.08)' }} className="lg:col-span-1">
        <div style={{ padding: '1.5rem' }}>
          <h3 className="font-bold mb-6 text-lg">实验参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ParameterSlider label="小球质量" symbol="m" unit="kg" value={mass} min={0.5} max={10} step={0.5} onChange={setMass} />
            <ParameterSlider label="悬绳长度" symbol="L" unit="m" value={ropeLength} min={1} max={5} step={0.1} onChange={setRopeLength} />
            <ParameterSlider label="摆角 (半锥角)" symbol="θ" unit="°" value={halfAngleDeg} min={5} max={85} step={1} onChange={setHalfAngleDeg} />
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(59,130,246,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-3 text-blue-400 text-sm">
            <Info size={15} /> 物理要点：圆锥摆受力分析
          </h4>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p className="text-yellow-300"><strong>易错提醒：</strong>小球只受重力和绳子拉力，**不要生造出一个向心力**！</p>
            <p><strong>竖直方向：</strong>小球在竖直方向没有加速度，所以绳子张力的竖直分量平衡重力：<br/><InlineMath math="T\cos\theta = mg" /></p>
            <p><strong>水平方向：</strong>绳子张力的水平分量指向圆心，提供向心力：<br/><InlineMath math="F_{向} = T\sin\theta = m \frac{v^2}{r} = m\omega^2r" /></p>
            <p><strong>运动周期：</strong>与质量无关，仅取决于绳长与角度：<br/><InlineMath math="T_p = 2\pi\sqrt{\frac{L\cos\theta}{g}}" /></p>
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <h4 style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>实时计算</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { label: '重力 G', value: `${formatPhysicsValue(weight)} N`, color: '#ef4444' },
              { label: '绳子拉力 T', value: `${formatPhysicsValue(tension)} N`, color: '#60a5fa' },
              { label: '向心力 F_向', value: `${formatPhysicsValue(centripetalForce)} N`, color: '#a855f7' },
              { label: '旋转半径 r', value: `${formatPhysicsValue(radius)} m`, color: '#38bdf8' },
              { label: '线速度 v', value: `${formatPhysicsValue(speed)} m/s`, color: '#34d399' },
              { label: '运动周期 T_p', value: `${formatPhysicsValue(period)} s`, color: '#94a3b8' },
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

export default ConicalPendulum;
