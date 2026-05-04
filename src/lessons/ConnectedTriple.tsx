import React, { useState, useRef } from 'react';
import { ChevronLeft, Info, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateConnectedTriple } from '../physics/connected';
import { formatPhysicsValue } from '../physics/mechanics';

type ViewMode = 'system' | 'a' | 'b' | 'c';

const ConnectedTriple: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mA, setMA] = useState(2);
  const [mB, setMB] = useState(3);
  const [mC, setMC] = useState(5);
  const [mu, setMu] = useState(0.2);
  const [F, setF] = useState(100);
  const [viewMode, setViewMode] = useState<ViewMode>('system');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const result = calculateConnectedTriple(mA, mB, mC, mu, F);
  const { weightA, weightB, weightC, fMaxTotal, fA, fB, fC, accel, T1, T2, status } = result;

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
    const handler = () => setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // SVG coordinate constants — layout: A(240) —T2— B(480) —T1— C(720)  F→
  const Y = 550; // object center Y (sits on ground line at Y=590)
  const W = 90;  // object width
  const H = 80;  // object height

  const objAx = 240, objBx = 480, objCx = 720;

  const arrowScale = 1.8;
  const maxArrowLen = 110;
  const clip = (v: number) => Math.min(v * arrowScale, maxArrowLen);

  const statusBanner = () => {
    if (status === 'static') return (
      <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 p-3 rounded-lg flex items-center gap-2 text-sm">
        <Info size={18} className="text-amber-400 shrink-0" />
        <p><strong>系统静止</strong>：外力 F ({formatPhysicsValue(F)} N) ≤ 最大静摩擦力总和 ({formatPhysicsValue(fMaxTotal)} N)。受力图中摩擦力按质量比例分配，为教学示意，物理解不唯一。</p>
      </div>
    );
    if (status === 'critical') return (
      <div className="bg-orange-500/20 border border-orange-500/50 text-orange-200 p-3 rounded-lg flex items-center gap-2 text-sm">
        <Info size={18} className="text-orange-400 shrink-0" />
        <p><strong>临界状态</strong>：外力 F 刚好等于最大静摩擦力总和，系统即将滑动。</p>
      </div>
    );
    return (
      <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-3 rounded-lg flex items-center gap-2 text-sm">
        <Info size={18} className="text-emerald-400 shrink-0" />
        <p><strong>系统滑动</strong>：整体法得加速度 <InlineMath math={`a=${formatPhysicsValue(accel)}\\,\\text{m/s}^2`} />。注意 <InlineMath math="T_1 > T_2" />，两根绳子张力不同！</p>
      </div>
    );
  };

  const groundHatch = () => {
    const lines = [];
    for (let x = 120; x < 900; x += 20) {
      lines.push(`M ${x} 590 L ${x - 10} 600`);
    }
    return lines.join(' ');
  };

  return (
    <div
      ref={containerRef}
      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', height: '100vh', overflow: 'hidden', backgroundColor: '#020617' }}
      className="text-white"
    >
      {/* ── Left canvas ── */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '0.75rem', minHeight: 0 }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-xl font-bold">连接体：三物体水平模型</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm border border-white/10 transition-colors">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* View-mode tabs */}
        <div className="flex gap-2 flex-wrap">
          {([
            { id: 'system', label: '整体视角', color: 'bg-blue-600' },
            { id: 'c',      label: 'C 隔离图', color: 'bg-sky-600' },
            { id: 'b',      label: 'B 隔离图', color: 'bg-emerald-600' },
            { id: 'a',      label: 'A 隔离图', color: 'bg-purple-600' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${viewMode === tab.id ? tab.color + ' text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {statusBanner()}

        {/* SVG diagram */}
        <div className="flex-1 min-h-0">
          <FreeBodyDiagram viewBox="0 0 960 750">
            {/* Ground */}
            <line x1={100} y1={590} x2={860} y2={590} stroke="white" strokeWidth={3} />
            <path d={groundHatch()} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} fill="none" />

            {/* ── Rope T2: between A and B ── */}
            <line x1={objAx + W/2} y1={Y} x2={objBx - W/2} y2={Y} stroke="#cbd5e1" strokeWidth={3} />
            {/* T2 label */}
            <text x={(objAx + objBx) / 2} y={Y - 14} fill="#cbd5e1" fontSize={15} textAnchor="middle" fontStyle="italic">T₂</text>

            {/* ── Rope T1: between B and C ── */}
            <line x1={objBx + W/2} y1={Y} x2={objCx - W/2} y2={Y} stroke="#e2e8f0" strokeWidth={3} />
            {/* T1 label */}
            <text x={(objBx + objCx) / 2} y={Y - 14} fill="#e2e8f0" fontSize={15} textAnchor="middle" fontStyle="italic">T₁</text>

            {/* ══ Object A (leftmost, purple) ══ */}
            <g transform={`translate(${objAx}, ${Y})`}>
              <rect x={-W/2} y={-H/2} width={W} height={H}
                fill={viewMode === 'a' ? 'rgba(168,85,247,0.35)' : 'rgba(168,85,247,0.1)'}
                stroke="rgba(168,85,247,0.9)" strokeWidth={2.5} rx={4} />
              <text x={0} y={6} fill="white" textAnchor="middle" fontSize={20} fontWeight="bold">A</text>
              {/* Accel arrow */}
              {status === 'sliding' && <ForceArrow x={0} y={-H/2 - 20} magnitude={clip(accel)} angle={0} color="#a855f7" label="a" dashed />}
              {/* Forces common to all views */}
              {(viewMode === 'system' || viewMode === 'a') && <>
                <ForceArrow x={-10} y={0} magnitude={clip(weightA)} angle={90}  color="#ff4d4d" label="G_A" />
                <ForceArrow x={-10} y={0} magnitude={clip(weightA)} angle={270} color="#4d94ff" label="N_A" />
                <ForceArrow x={0}   y={0} magnitude={clip(fA)}      angle={180} color="#f59e0b" label="f_A" />
              </>}
              {/* T2 as external force only in isolation */}
              {viewMode === 'a' && <ForceArrow x={0} y={0} magnitude={clip(T2)} angle={0} color="#cbd5e1" label="T₂" />}
            </g>

            {/* ══ Object B (middle, green) ══ */}
            <g transform={`translate(${objBx}, ${Y})`}>
              <rect x={-W/2} y={-H/2} width={W} height={H}
                fill={viewMode === 'b' ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.1)'}
                stroke="rgba(16,185,129,0.9)" strokeWidth={2.5} rx={4} />
              <text x={0} y={6} fill="white" textAnchor="middle" fontSize={20} fontWeight="bold">B</text>
              {status === 'sliding' && <ForceArrow x={0} y={-H/2 - 20} magnitude={clip(accel)} angle={0} color="#10b981" label="a" dashed />}
              {(viewMode === 'system' || viewMode === 'b') && <>
                <ForceArrow x={-10} y={0} magnitude={clip(weightB)} angle={90}  color="#ff4d4d" label="G_B" />
                <ForceArrow x={-10} y={0} magnitude={clip(weightB)} angle={270} color="#4d94ff" label="N_B" />
                <ForceArrow x={0}   y={0} magnitude={clip(fB)}      angle={180} color="#f59e0b" label="f_B" />
              </>}
              {viewMode === 'b' && <>
                <ForceArrow x={0} y={0} magnitude={clip(T1)} angle={0}   color="#e2e8f0" label="T₁" />
                <ForceArrow x={0} y={0} magnitude={clip(T2)} angle={180} color="#cbd5e1" label="T₂" />
              </>}
            </g>

            {/* ══ Object C (rightmost, sky-blue) ══ */}
            <g transform={`translate(${objCx}, ${Y})`}>
              <rect x={-W/2} y={-H/2} width={W} height={H}
                fill={viewMode === 'c' ? 'rgba(14,165,233,0.35)' : 'rgba(14,165,233,0.1)'}
                stroke="rgba(14,165,233,0.9)" strokeWidth={2.5} rx={4} />
              <text x={0} y={6} fill="white" textAnchor="middle" fontSize={20} fontWeight="bold">C</text>
              {status === 'sliding' && <ForceArrow x={0} y={-H/2 - 20} magnitude={clip(accel)} angle={0} color="#0ea5e9" label="a" dashed />}
              {(viewMode === 'system' || viewMode === 'c') && <>
                <ForceArrow x={10}  y={0} magnitude={clip(weightC)} angle={90}  color="#ff4d4d" label="G_C" />
                <ForceArrow x={10}  y={0} magnitude={clip(weightC)} angle={270} color="#4d94ff" label="N_C" />
                <ForceArrow x={0}   y={0} magnitude={clip(fC)}      angle={180} color="#f59e0b" label="f_C" />
                <ForceArrow x={0}   y={0} magnitude={clip(F)}       angle={0}   color="#3b82f6" label="F" />
              </>}
              {viewMode === 'c' && <ForceArrow x={0} y={0} magnitude={clip(T1)} angle={180} color="#e2e8f0" label="T₁" />}
            </g>
          </FreeBodyDiagram>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <aside style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: 'rgba(15,23,42,0.6)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Parameters */}
        <div style={{ padding: '1.5rem' }}>
          <h3 className="font-bold mb-6 text-lg">实验参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ParameterSlider label="物体A质量（最左）" symbol="m_A" unit="kg" value={mA} min={1} max={30} onChange={setMA} />
            <ParameterSlider label="物体B质量（中间）" symbol="m_B" unit="kg" value={mB} min={1} max={30} onChange={setMB} />
            <ParameterSlider label="物体C质量（右端受力）" symbol="m_C" unit="kg" value={mC} min={1} max={30} onChange={setMC} />
            <ParameterSlider label="动/静摩擦因数" symbol="μ" unit="" value={mu} min={0} max={1.0} step={0.05} onChange={setMu} />
            <ParameterSlider label="水平外力" symbol="F" unit="N" value={F} min={10} max={500} onChange={setF} />
          </div>
        </div>

        {/* Physics key points */}
        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(59,130,246,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-3 text-blue-400 text-sm">
            <Info size={15} /> 物理要点：为何 T₁ ≠ T₂？
          </h4>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p>1. <strong>整体法求加速度</strong>（T₁、T₂ 均为内力不参与）：<InlineMath math="a = \frac{F - f_A - f_B - f_C}{m_A + m_B + m_C}" /></p>
            <p>2. <strong>隔离A求 T₂</strong>（T₂ 是 A 的唯一水平外力）：<InlineMath math="T_2 = m_A a + f_A" /></p>
            <p>3. <strong>隔离(A+B)求 T₁</strong>：<InlineMath math="T_1 = (m_A+m_B)a + f_A + f_B" /></p>
            <p className="text-yellow-300">核心结论：T₁ 需同时驱动 A 和 B，T₂ 只需驱动 A，所以 <InlineMath math="T_1 > T_2" />（当 B 质量不为零时）。</p>
          </div>
        </div>

        {/* Live data */}
        <div style={{ marginTop: 'auto', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <h4 style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>实时计算</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { label: '状态', value: status === 'static' ? '静止' : status === 'critical' ? '临界' : '滑动', color: status === 'sliding' ? '#34d399' : '#f59e0b' },
              { label: '最大摩擦力总和 f_max', value: `${formatPhysicsValue(fMaxTotal)} N`, color: '#ef4444' },
              { label: '系统加速度 a', value: `${formatPhysicsValue(accel)} m/s²`, color: '#34d399' },
              { label: 'C-B 绳张力 T₁', value: `${formatPhysicsValue(T1)} N`, color: '#e2e8f0' },
              { label: 'B-A 绳张力 T₂', value: `${formatPhysicsValue(T2)} N`, color: '#cbd5e1' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{row.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: row.color, fontWeight: 'bold' }}>{row.value}</span>
              </div>
            ))}
            {/* T1 vs T2 comparison bar */}
            {status === 'sliding' && T1 > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>T₁ / T₂ 对比</div>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <div style={{ flex: T1, height: 8, background: 'linear-gradient(90deg,#e2e8f0,#94a3b8)', borderRadius: 4 }} />
                  <div style={{ flex: T2, height: 8, background: 'linear-gradient(90deg,#cbd5e1,#64748b)', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                  <span>T₁={formatPhysicsValue(T1)} N</span>
                  <span>T₂={formatPhysicsValue(T2)} N</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ConnectedTriple;
