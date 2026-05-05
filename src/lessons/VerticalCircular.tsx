import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Info, Maximize, Minimize, Play, Pause, RotateCcw } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { VerticalCircularState, initVerticalCircularState, stepVerticalCircular } from '../physics/circular';
import { formatPhysicsValue, G_ACCEL } from '../physics/mechanics';

const VerticalCircular: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mass, setMass] = useState(2);
  const [v0, setV0] = useState(5); // 最低点初速度
  const [radius, setRadius] = useState(2);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [state, setState] = useState<VerticalCircularState>(() => initVerticalCircularState(v0, radius));
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 记录上一帧时间
  const lastTimeRef = useRef<number>(0);
  const reqRef = useRef<number>(0);

  // 初始化或重置状态
  const resetSimulation = useCallback(() => {
    setIsPlaying(false);
    setState(initVerticalCircularState(v0, radius));
    lastTimeRef.current = 0;
  }, [v0, radius]);

  // 当初始参数改变时重置
  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  // 动画循环
  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== 0) {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05); // 防止切后台时 dt 过大
      setState(prevState => stepVerticalCircular(prevState, dt, mass, radius));
    }
    lastTimeRef.current = time;
    reqRef.current = requestAnimationFrame(animate);
  }, [mass, radius]);

  useEffect(() => {
    if (isPlaying) {
      reqRef.current = requestAnimationFrame(animate);
    } else {
      lastTimeRef.current = 0;
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    }
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying, animate]);

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
  const CENTER_Y = 400;
  const PIXEL_PER_METER = 100; // 1m = 100px
  
  const rPx = radius * PIXEL_PER_METER;
  
  // Object position
  const objX = CENTER_X + state.x * PIXEL_PER_METER;
  const objY = CENTER_Y + state.y * PIXEL_PER_METER;
  
  // 实时力计算
  const weight = mass * G_ACCEL;
  
  // 角度计算 (在圆周上)
  // angle=0 在底部(y正方向)。SVG中向上是y负方向
  // 坐标：x = R sinθ, y = R cosθ (因为0指向底部，所以直接这样映射)
  // SVG 中的物理坐标系：CENTER_Y 是原点，向下为正，向右为正。
  
  // N 力的角度 (指向圆心)
  const nAngle = Math.atan2(CENTER_Y - objY, CENTER_X - objX) * 180 / Math.PI;
  // 向心力角度 (指向圆心)
  const centripetalAngle = nAngle;
  // 切向速度角度
  const velAngle = Math.atan2(state.vy, state.vx) * 180 / Math.PI;

  const clip = (v: number) => Math.min(Math.abs(v) * 2, 160);
  const W = 40 + mass * 5;

  // 状态判定文字
  let statusMode = '摆动 (v0 较小)';
  const vMinFullCircle = Math.sqrt(5 * G_ACCEL * radius);
  const vMinTop = Math.sqrt(2 * G_ACCEL * radius); // 到达圆心高度
  if (v0 >= vMinFullCircle - 1e-3) {
    statusMode = '完整圆周 (顺利通过最高点)';
  } else if (v0 > vMinTop) {
    statusMode = '脱轨抛体 (过圆心高度后脱离)';
  }

  // 当前向心力计算 F向 = mv²/R
  const currentSpeed = Math.sqrt(state.vx*state.vx + state.vy*state.vy);
  const currentCentripetal = state.isDetached ? 0 : mass * currentSpeed * currentSpeed / radius;

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
            <h2 className="text-2xl font-bold">竖直圆周运动 (动态模拟)</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* 播放控制与模式横幅 */}
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors font-bold ${isPlaying ? 'bg-amber-500 hover:bg-amber-400 text-amber-950' : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950'}`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? '暂停' : '播放'}
            </button>
            <button 
              onClick={resetSimulation} 
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
            >
              <RotateCcw size={18} /> 重置
            </button>
          </div>
          
          <div className={`flex-1 p-2 rounded-lg flex items-center gap-2 text-sm border ${state.isDetached ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'}`}>
            <Info size={18} className="shrink-0" />
            <p>
              <strong>预计模式：{statusMode}</strong>。 
              {state.isDetached && ' ⚠️ 当前已脱离轨道，做抛体运动！'}
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <div className="absolute top-4 left-4 p-3 bg-slate-900/80 rounded-lg border border-white/10 text-xs text-white/70 z-10">
            <div className="flex items-center gap-2 mb-1"><div className="w-4 h-0.5 bg-red-500"></div> 真实力: 重力 G</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-4 h-0.5 bg-green-400"></div> 真实力: 轨道支持力 N</div>
            <div className="flex items-center gap-2"><div className="w-4 border-b border-dashed border-purple-500"></div> 辅助: 向心力 F_向 (仅在圆周阶段)</div>
          </div>

          <FreeBodyDiagram width={1200} height={800} showGrid={false}>
            {/* Center peg */}
            <circle cx={CENTER_X} cy={CENTER_Y} r={6} fill="#94a3b8" />
            <line x1={CENTER_X - rPx - 50} y1={CENTER_Y} x2={CENTER_X + rPx + 50} y2={CENTER_Y} stroke="rgba(255,255,255,0.1)" strokeDasharray="5,5" />
            
            {/* Circular Track (Inner surface) */}
            <circle cx={CENTER_X} cy={CENTER_Y} r={rPx + W/2} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="15" />
            <circle cx={CENTER_X} cy={CENTER_Y} r={rPx + W/2 - 7.5} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <circle cx={CENTER_X} cy={CENTER_Y} r={rPx} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" strokeDasharray="5,5" />

            {/* Trail */}
            {state.trail.length > 0 && (
              <polyline 
                points={state.trail.map(p => `${CENTER_X + p.x * PIXEL_PER_METER},${CENTER_Y + p.y * PIXEL_PER_METER}`).join(' ')} 
                fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeDasharray="4,4"
              />
            )}

            {/* Object */}
            <circle cx={objX} cy={objY} r={W/2} fill={!state.isDetached ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"} stroke={!state.isDetached ? "#10b981" : "#ef4444"} strokeWidth="2" />
            
            {/* Velocity Vector */}
            {currentSpeed > 0 && (
              <ForceArrow 
                x={objX} y={objY} 
                magnitude={currentSpeed * 10} angle={velAngle} 
                color="#34d399" label="v" dashed 
              />
            )}

            {/* Normal Force N */}
            {!state.isDetached && state.normalForce > 0 && (
              <ForceArrow 
                x={objX} y={objY} 
                magnitude={clip(state.normalForce)} angle={nAngle} 
                color="#4ade80" label="N" 
              />
            )}

            {/* Gravity G */}
            <ForceArrow 
              x={objX} y={objY} 
              magnitude={clip(weight)} angle={90} 
              color="#ef4444" label="G" 
            />

            {/* Centripetal Force Indicator (purple dashed) */}
            {!state.isDetached && currentCentripetal > 0 && (
              <ForceArrow 
                x={objX} y={objY} 
                magnitude={clip(currentCentripetal)} angle={centripetalAngle} 
                color="#a855f7" label="F_向" dashed scale={1.2}
              />
            )}

          </FreeBodyDiagram>
        </div>
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: 'rgba(15,23,42,0.6)', borderLeft: '1px solid rgba(255,255,255,0.08)' }} className="lg:col-span-1">
        <div style={{ padding: '1.5rem' }}>
          <h3 className="font-bold mb-6 text-lg">实验参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ParameterSlider label="小球质量" symbol="m" unit="kg" value={mass} min={0.5} max={10} step={0.5} onChange={(val) => {setMass(val); resetSimulation();}} />
            <ParameterSlider label="轨道半径" symbol="r" unit="m" value={radius} min={1} max={5} step={0.5} onChange={(val) => {setRadius(val); resetSimulation();}} />
            <ParameterSlider label="最低点初速度" symbol="v_0" unit="m/s" value={v0} min={1} max={15} step={0.1} onChange={(val) => {setV0(val); resetSimulation();}} />
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(59,130,246,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-3 text-blue-400 text-sm">
            <Info size={15} /> 物理要点：一般点受力分析
          </h4>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p><strong>切向：</strong>重力的切向分力 <InlineMath math="mg\sin\theta" /> 产生切向加速度，导致速度大小改变。</p>
            <p><strong>径向：</strong>轨道支持力 <InlineMath math="N" /> 与重力的径向分力 <InlineMath math="mg\cos\theta" /> 的合力提供向心力：<br/><InlineMath math="N - mg\cos\theta = m \frac{v^2}{R}" /></p>
            <p className="text-yellow-300"><strong>脱轨条件：</strong>当越过圆心水平线后 (<InlineMath math="\cos\theta < 0" />)，若速度不足，导致计算出的 <InlineMath math="N \le 0" />，物体将脱离轨道，沿切线方向做平抛/斜抛运动。</p>
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <h4 style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>实时计算</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { label: '重力 G', value: `${formatPhysicsValue(weight)} N`, color: '#ef4444' },
              { label: '支持力 N', value: `${formatPhysicsValue(state.normalForce)} N`, color: '#4ade80' },
              { label: '向心力 F_向', value: `${formatPhysicsValue(currentCentripetal)} N`, color: '#a855f7' },
              { label: '当前速度 v', value: `${formatPhysicsValue(currentSpeed)} m/s`, color: '#34d399' },
              { label: '角度 (底=0, 顶=π)', value: `${formatPhysicsValue(Math.abs((state.angle % (2*Math.PI))) / Math.PI)} π`, color: '#cbd5e1' },
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

export default VerticalCircular;
