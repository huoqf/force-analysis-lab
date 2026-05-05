import React, { useState, useRef } from 'react';
import { ChevronLeft, Info, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import PulleySymbol from '../components/Scene/PulleySymbol';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateMovingPulley } from '../physics/pulley';
import { formatPhysicsValue } from '../physics/mechanics';

type ViewMode = 'system' | 'object' | 'pulley';

const MovingPulley: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [m, setM] = useState(10);
  const [h, setH] = useState(0); // 位移偏移（对应 Atwood 的 offset 动画逻辑）
  const [viewMode, setViewMode] = useState<ViewMode>('system');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { weight, ropeForce, tension } = calculateMovingPulley(m);

  // ── 全屏切换 ──────────────────────────────────────────────
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

  React.useEffect(() => {
    const handler = () =>
      setIsFullscreen(
        !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      );
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── SVG 布局常量（严格参考 Atwood 比例） ────────────────────
  // viewBox: 0 0 900 700
  const CEILING_Y = 120;
  const PULLEY_CX = 450;
  const PULLEY_R  = 40;
  
  // 动态位置（参考 Atwood 的 offset 逻辑，使用 h 滑块驱动）
  const BASE_PULLEY_CY = 450;
  const PULLEY_CY = BASE_PULLEY_CY - h; 
  
  const ROPE_LEFT_X = PULLEY_CX - PULLEY_R;
  const ROPE_RIGHT_X = PULLEY_CX + PULLEY_R;
  const FIXED_X = ROPE_LEFT_X; 
  
  const HAND_X = ROPE_RIGHT_X;
  const BASE_HAND_Y = 220;
  const HAND_Y = BASE_HAND_Y - 2 * h; // 绳端位移是滑轮位移的2倍

  const OBJ_W = 90, OBJ_H = 80;
  const OBJ_CX = PULLEY_CX;
  const OBJ_CY = PULLEY_CY + PULLEY_R + 60;

  // 隔离图中心
  const ISO_CX = 450;
  const ISO_CY = 380;

  // 力箭头缩放（参考 Atwood 的 MAX_LEN=130, SCALE=1.6 但根据画布高度微调）
  const MAX_LEN = 120;
  const SCALE   = 1.2;
  const clip = (v: number) => Math.min(Math.abs(v) * SCALE, MAX_LEN);

  // ── 状态横幅（结构完全参考 Atwood） ────────────────────────
  const statusBanner = () => (
    <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-3 rounded-lg flex items-center gap-3 text-sm">
      <Info size={18} className="text-emerald-400 shrink-0" />
      <p>
        <strong>平衡状态</strong>：忽略摩擦与自重，绳子张力满足 <InlineMath math="T = G/2" />。调整右侧“高度调节”滑块观察位移关系。
      </p>
    </div>
  );

  // ── 系统全览 SVG ──────────────────────────────────────────
  const renderSystem = () => (
    <>
      {/* 天花板（参考 Atwood 风格） */}
      <line x1={FIXED_X - 100} y1={CEILING_Y} x2={FIXED_X + 200} y2={CEILING_Y} stroke="white" strokeWidth={4} />
      {Array.from({ length: 15 }).map((_, i) => (
        <line 
          key={i} 
          x1={FIXED_X - 100 + i * 20} y1={CEILING_Y} 
          x2={FIXED_X - 110 + i * 20} y2={CEILING_Y - 10} 
          stroke="rgba(255,255,255,0.3)" strokeWidth={1} 
        />
      ))}

      {/* 绳子（包含切点和包络弧） */}
      <line x1={FIXED_X} y1={CEILING_Y} x2={ROPE_LEFT_X} y2={PULLEY_CY} stroke="#cbd5e1" strokeWidth={3} />
      <path
        d={`M ${ROPE_LEFT_X} ${PULLEY_CY} A ${PULLEY_R} ${PULLEY_R} 0 0 0 ${ROPE_RIGHT_X} ${PULLEY_CY}`}
        fill="none" stroke="#cbd5e1" strokeWidth={3}
      />
      <line x1={ROPE_RIGHT_X} y1={PULLEY_CY} x2={HAND_X} y2={HAND_Y} stroke="#cbd5e1" strokeWidth={3} />
      
      <PulleySymbol cx={PULLEY_CX} cy={PULLEY_CY} radius={PULLEY_R} type="moving" />

      {/* 物体 */}
      <g transform={`translate(${OBJ_CX}, ${OBJ_CY})`}>
        <rect x={-OBJ_W / 2} y={-OBJ_H / 2} width={OBJ_W} height={OBJ_H}
          fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.9)" strokeWidth={2.5} rx={5} />
        <text x={0} y={5} fill="white" textAnchor="middle" fontSize={18} fontWeight="bold">m</text>
        <ForceArrow x={0} y={OBJ_H/2 - 5} magnitude={clip(weight)} angle={90} color="#ff4d4d" label="G" />
      </g>

      <ForceArrow x={HAND_X} y={HAND_Y} magnitude={clip(ropeForce)} angle={270} color="#3b82f6" label="F" />
      <line x1={PULLEY_CX} y1={PULLEY_CY + PULLEY_R} x2={OBJ_CX} y2={OBJ_CY - OBJ_H/2} stroke="#cbd5e1" strokeWidth={2} />
    </>
  );

  // ── 物体隔离图 ──────────────────────────────────────────
  const renderObjectIsolation = () => (
    <>
      <rect x={ISO_CX - 140} y={ISO_CY - 160} width={280} height={320}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="6,4" rx={12} />
      <g transform={`translate(${ISO_CX}, ${ISO_CY})`}>
        <rect x={-OBJ_W / 2} y={-OBJ_H / 2} width={OBJ_W} height={OBJ_H}
          fill="rgba(59,130,246,0.22)" stroke="rgba(59,130,246,0.9)" strokeWidth={3} rx={5} />
        <text x={0} y={5} fill="white" textAnchor="middle" fontSize={20} fontWeight="bold">m</text>
        <ForceArrow x={-15} y={0} magnitude={clip(weight)} angle={90} color="#ff4d4d" label={`G=${formatPhysicsValue(weight)}N`} />
        <ForceArrow x={15} y={0} magnitude={clip(weight)} angle={270} color="#3b82f6" label={`F拉=${formatPhysicsValue(weight)}N`} />
      </g>
    </>
  );

  // ── 动滑轮隔离图 ──────────────────────────────────────────
  const renderPulleyIsolation = () => (
    <>
      <rect x={ISO_CX - 140} y={ISO_CY - 160} width={280} height={320}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="6,4" rx={12} />
      <g transform={`translate(${ISO_CX}, ${ISO_CY})`}>
        <PulleySymbol cx={0} cy={0} radius={PULLEY_R + 10} type="moving" highlight />
        <ForceArrow x={-(PULLEY_R + 10)} y={0} magnitude={clip(tension)} angle={270} color="#ec4899" label={`T=${formatPhysicsValue(tension)}N`} />
        <ForceArrow x={PULLEY_R + 10} y={0} magnitude={clip(tension)} angle={270} color="#ec4899" label={`T=${formatPhysicsValue(tension)}N`} />
        <ForceArrow x={0} y={PULLEY_R + 10} magnitude={clip(weight)} angle={90} color="#3b82f6" label={`F物=${formatPhysicsValue(weight)}N`} />
      </g>
    </>
  );

  // ── 主渲染（严格遵循 Atwood 的结构和样式） ──────────────────
  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#020617',
      }}
      className="text-white"
    >
      {/* ════ 左侧：画布区 ════ */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '0.75rem', minHeight: 0 }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-xl font-bold">动滑轮模型</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm border border-white/10 transition-colors">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        <div className="flex gap-2 flex-wrap">
          {([
            { id: 'system', label: '系统全览', color: 'bg-blue-600' },
            { id: 'object', label: '物体隔离', color: 'bg-emerald-600' },
            { id: 'pulley', label: '滑轮分析', color: 'bg-pink-600' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                viewMode === tab.id ? tab.color + ' text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {statusBanner()}

        <div className="flex-1 min-h-0">
          <FreeBodyDiagram width={900} height={700}>
            {viewMode === 'system' && renderSystem()}
            {viewMode === 'object' && renderObjectIsolation()}
            {viewMode === 'pulley' && renderPulleyIsolation()}
          </FreeBodyDiagram>
        </div>
      </div>

      {/* ════ 右侧：参数面板（参考 Atwood） ════ */}
      <aside
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          backgroundColor: 'rgba(15,23,42,0.6)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ padding: '1.5rem' }}>
          <h3 className="font-bold mb-6 text-lg">实验参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ParameterSlider label="物体质量" symbol="m" unit="kg" value={m} min={1} max={20} onChange={setM} />
            <ParameterSlider label="高度调节" symbol="h" unit="px" value={h} min={-50} max={100} onChange={setH} />
          </div>
          <div className="mt-4 text-xs text-white/30 flex gap-2">
            <span>g = 9.8 m/s²</span>
            <span>·</span>
            <span>轻绳·理想滑轮</span>
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(59,130,246,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-3 text-blue-400 text-sm">
            <Info size={15} /> 物理要点
          </h4>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p><strong>1. 省力原理：</strong>动滑轮由两段绳子共同承担重力，故理想状态下 <InlineMath math="F = G/2" />。</p>
            <p><strong>2. 位移关系：</strong>物体上升 <InlineMath math="h" />，绳端需拉动 <InlineMath math="2h" />，体现省力费距离。</p>
            <p className="text-yellow-300"><strong>3. 功的原理：</strong>省力不省功，忽略摩擦时动力功等于阻力功。</p>
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <h4 style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            实时计算
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { label: '重力 G = mg', value: `${formatPhysicsValue(weight)} N`, color: '#ff4d4d' },
              { label: '绳子张力 T', value: `${formatPhysicsValue(tension)} N`, color: '#ec4899' },
              { label: '拉力 F = T', value: `${formatPhysicsValue(ropeForce)} N`, color: '#3b82f6' },
              { label: '绳端位移 s = 2h', value: `${h * 2} px`, color: '#facc15' },
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

export default MovingPulley;
