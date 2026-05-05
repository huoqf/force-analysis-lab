import React, { useState, useRef } from 'react';
import { ChevronLeft, Info, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import PulleySymbol from '../components/Scene/PulleySymbol';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateAtwood } from '../physics/pulley';
import { formatPhysicsValue } from '../physics/mechanics';

type ViewMode = 'system' | 'm1' | 'm2';

const Atwood: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [m1, setM1] = useState(5);
  const [m2, setM2] = useState(3);
  const [viewMode, setViewMode] = useState<ViewMode>('system');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { weight1, weight2, accel, tension, netForce1, netForce2, status } =
    calculateAtwood(m1, m2);

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

  // ── SVG 布局常量 ──────────────────────────────────────────
  // viewBox: 0 0 900 700
  const PULLEY_CX = 450;
  const PULLEY_CY = 150;
  const PULLEY_R  = 64; // 增大半径，确保两侧物体（宽80）不重叠

  // 两侧绳子 x 坐标（沿滑轮左右切点）
  const ROPE_X1 = PULLEY_CX - PULLEY_R; // m1 侧（左）
  const ROPE_X2 = PULLEY_CX + PULLEY_R; // m2 侧（右）

  // 物体尺寸
  const W = 80, H = 70;

  // 物体位置（全览图）：根据质量差计算位移偏移，增强直觉
  const maxOffset = 120; // 最大位移偏移像素
  const massRatio = m1 === m2 ? 0 : Math.tanh((m1 - m2) / (m1 + m2) * 4);
  const m1Offset  = massRatio * maxOffset;   // m1 向下偏移（正）
  const m2Offset  = -massRatio * maxOffset;  // m2 向上偏移（负）

  const OBJ1_CX = ROPE_X1;
  const OBJ1_CY = 450 + m1Offset;
  const OBJ2_CX = ROPE_X2;
  const OBJ2_CY = 450 + m2Offset;

  // 隔离图：固定居中位置
  const ISO_CX = 450;
  const ISO_CY = 400;

  // 力箭头缩放
  const MAX_LEN = 130;
  const SCALE   = 1.6;
  const clip = (v: number) => Math.min(Math.abs(v) * SCALE, MAX_LEN);

  // ── 状态横幅 ──────────────────────────────────────────────
  const statusBanner = () => {
    if (status === 'balanced') {
      return (
        <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 p-3 rounded-lg flex items-center gap-2 text-sm">
          <Info size={18} className="text-amber-400 shrink-0" />
          <p>
            <strong>系统平衡</strong>：m₁ = m₂，合力为零，绳子张力恰好等于各物体重力{' '}
            <InlineMath math={`T = m_1g = ${formatPhysicsValue(tension)}\\,\\text{N}`} />，加速度 <InlineMath math="a = 0" />。
          </p>
        </div>
      );
    }
    const heavier = m1 > m2 ? 'm₁' : 'm₂';
    return (
      <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-3 rounded-lg flex items-center gap-2 text-sm">
        <Info size={18} className="text-emerald-400 shrink-0" />
        <p>
          <strong>系统运动</strong>：{heavier} 较重，{heavier} 向下加速，加速度{' '}
          <InlineMath math={`a = ${formatPhysicsValue(Math.abs(accel))}\\,\\text{m/s}^2`} />。
          注意张力 <InlineMath math={`T = ${formatPhysicsValue(tension)}\\,\\text{N}`} /> 满足{' '}
          <InlineMath math="m_2 g < T < m_1 g" />（两侧均有"失重"或"超重"效应）。
        </p>
      </div>
    );
  };

  // ── 系统全览 SVG ──────────────────────────────────────────
  const renderSystem = () => (
    <>
      {/* 定滑轮 */}
      <PulleySymbol cx={PULLEY_CX} cy={PULLEY_CY} radius={PULLEY_R} type="fixed" />

      {/* ── 绳子 ── */}
      {/* 顶部跨过滑轮的圆弧绳索 */}
      <path
        d={`M ${ROPE_X1} ${PULLEY_CY} A ${PULLEY_R} ${PULLEY_R} 0 0 1 ${ROPE_X2} ${PULLEY_CY}`}
        fill="none" stroke="#cbd5e1" strokeWidth={3}
      />
      {/* m1 侧绳：从滑轮左切点到物体顶端 */}
      <line
        x1={ROPE_X1} y1={PULLEY_CY}
        x2={ROPE_X1} y2={OBJ1_CY - H / 2}
        stroke="#cbd5e1" strokeWidth={3}
      />
      {/* m2 侧绳：从滑轮右切点到物体顶端 */}
      <line
        x1={ROPE_X2} y1={PULLEY_CY}
        x2={ROPE_X2} y2={OBJ2_CY - H / 2}
        stroke="#cbd5e1" strokeWidth={3}
      />

      {/* ── 物体 m1（左，绿色） ── */}
      <g transform={`translate(${OBJ1_CX}, ${OBJ1_CY})`}>
        <rect x={-W / 2} y={-H / 2} width={W} height={H}
          fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.9)" strokeWidth={2.5} rx={5} />
        <text x={0} y={4} fill="white" textAnchor="middle" fontSize={18} fontWeight="bold">m₁</text>
        <text x={0} y={22} fill="rgba(255,255,255,0.5)" textAnchor="middle" fontSize={13}>{m1} kg</text>
        {/* 加速度方向箭头 */}
        {status === 'moving' && (
          <ForceArrow
            x={W / 2 + 16} y={0}
            magnitude={clip(Math.abs(accel))}
            angle={m1 > m2 ? 90 : 270}
            color="#10b981" label="a" dashed
          />
        )}
        {/* 全览图只显示重力（整体法时 T 为内力） */}
        <ForceArrow x={0} y={H / 2 - 10} magnitude={clip(weight1)} angle={90} color="#ff4d4d" label="G₁" />
        <ForceArrow x={0} y={-H / 2 + 10} magnitude={clip(tension)} angle={270} color="#ec4899" label="T" />
      </g>

      {/* ── 物体 m2（右，紫色） ── */}
      <g transform={`translate(${OBJ2_CX}, ${OBJ2_CY})`}>
        <rect x={-W / 2} y={-H / 2} width={W} height={H}
          fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.9)" strokeWidth={2.5} rx={5} />
        <text x={0} y={4} fill="white" textAnchor="middle" fontSize={18} fontWeight="bold">m₂</text>
        <text x={0} y={22} fill="rgba(255,255,255,0.5)" textAnchor="middle" fontSize={13}>{m2} kg</text>
        {status === 'moving' && (
          <ForceArrow
            x={-(W / 2 + 16)} y={0}
            magnitude={clip(Math.abs(accel))}
            angle={m2 > m1 ? 90 : 270}
            color="#a855f7" label="a" dashed
          />
        )}
        <ForceArrow x={0} y={H / 2 - 10} magnitude={clip(weight2)} angle={90} color="#ff4d4d" label="G₂" />
        <ForceArrow x={0} y={-H / 2 + 10} magnitude={clip(tension)} angle={270} color="#ec4899" label="T" />
      </g>

      {/* 质量差提示标签 */}
      {status === 'moving' && (
        <text
          x={PULLEY_CX} y={PULLEY_CY + PULLEY_R + 28}
          fill="rgba(255,255,255,0.35)" fontSize={13} textAnchor="middle"
        >
          整体法：(m₁ − m₂)g = (m₁ + m₂)a
        </text>
      )}
    </>
  );

  // ── 隔离视图通用结构 ──────────────────────────────────────
  const renderIsolation = (
    mass: number,
    weight: number,
    net: number,
    accelDir: 90 | 270,  // 90=向下, 270=向上
    color: string,
    label: string
  ) => (
    <>
      {/* 虚线范围框 */}
      <rect x={ISO_CX - 140} y={ISO_CY - 160} width={280} height={320}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="6,4" rx={12} />
      <text x={ISO_CX - 130} y={ISO_CY - 145}
        fill="rgba(255,255,255,0.25)" fontSize={12}>隔离对象</text>

      {/* 物体 */}
      <rect x={ISO_CX - W / 2} y={ISO_CY - H / 2} width={W} height={H}
        fill={`${color}22`} stroke={color} strokeWidth={3} rx={5} />
      <text x={ISO_CX} y={ISO_CY + 5}
        fill="white" textAnchor="middle" fontSize={20} fontWeight="bold">{label}</text>

      {/* 重力（向下） */}
      <ForceArrow
        x={ISO_CX - 20} y={ISO_CY}
        magnitude={clip(weight)} angle={90}
        color="#ff4d4d" label={`G=${formatPhysicsValue(weight)}N`}
      />

      {/* 张力（向上） */}
      <ForceArrow
        x={ISO_CX + 20} y={ISO_CY}
        magnitude={clip(tension)} angle={270}
        color="#ec4899" label={`T=${formatPhysicsValue(tension)}N`}
      />

      {/* 合力/加速度 */}
      {status === 'moving' && (
        <>
          <ForceArrow
            x={ISO_CX} y={accelDir === 90 ? ISO_CY + H / 2 + 8 : ISO_CY - H / 2 - 8}
            magnitude={clip(Math.abs(net))}
            angle={accelDir}
            color="#facc15" label={`合力=${formatPhysicsValue(Math.abs(net))}N`}
            dashed
          />
          <ForceArrow
            x={ISO_CX + 70} y={ISO_CY}
            magnitude={clip(Math.abs(accel))}
            angle={accelDir}
            color="#34d399" label={`a=${formatPhysicsValue(Math.abs(accel))}m/s²`}
            dashed
          />
        </>
      )}

      {/* 受力方程 */}
      <text x={ISO_CX} y={ISO_CY + H / 2 + (accelDir === 90 ? clip(Math.abs(net)) + 50 : 50)}
        fill="rgba(255,255,255,0.5)" fontSize={13} textAnchor="middle">
        {accelDir === 90
          ? `${label}：G - T = ${label.slice(0, 2)} × a`
          : `${label}：T - G = ${label.slice(0, 2)} × a`}
      </text>
    </>
  );

  // ── 主渲染 ────────────────────────────────────────────────
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

        {/* 页眉 */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-xl font-bold">阿特伍德机</h2>
          </div>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm border border-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* 视图切换 Tab */}
        <div className="flex gap-2 flex-wrap">
          {([
            { id: 'system', label: '整体视角', color: 'bg-blue-600' },
            { id: 'm1',     label: 'm₁ 隔离图', color: 'bg-emerald-600' },
            { id: 'm2',     label: 'm₂ 隔离图', color: 'bg-purple-600' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                viewMode === tab.id
                  ? tab.color + ' text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 状态横幅 */}
        {statusBanner()}

        {/* SVG 画布 */}
        <div className="flex-1 min-h-0">
          <FreeBodyDiagram width={900} height={700}>
            {viewMode === 'system' && renderSystem()}

            {viewMode === 'm1' && (
              <>
                {/* 定滑轮 hint */}
                <PulleySymbol cx={450} cy={80} radius={28} type="fixed" />
                <text x={450} y={125} fill="rgba(255,255,255,0.3)" fontSize={12} textAnchor="middle">（定滑轮）</text>
                {/* 弧形绳索提示 */}
                <path
                  d={`M ${450 - 28} 80 A 28 28 0 0 1 ${450 + 28} 80`}
                  fill="none" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4,2" strokeOpacity={0.3}
                />
                <line x1={450 - 28} y1={80} x2={450 - 28} y2={ISO_CY - H / 2}
                  stroke="#cbd5e1" strokeWidth={2} strokeDasharray="6,4" strokeOpacity={0.3} />
                {renderIsolation(
                  m1, weight1, netForce1,
                  m1 >= m2 ? 90 : 270,
                  '#10b981', 'm₁'
                )}
              </>
            )}

            {viewMode === 'm2' && (
              <>
                <PulleySymbol cx={450} cy={80} radius={28} type="fixed" />
                <text x={450} y={125} fill="rgba(255,255,255,0.3)" fontSize={12} textAnchor="middle">（定滑轮）</text>
                {/* 弧形绳索提示 */}
                <path
                  d={`M ${450 - 28} 80 A 28 28 0 0 1 ${450 + 28} 80`}
                  fill="none" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4,2" strokeOpacity={0.3}
                />
                <line x1={450 + 28} y1={80} x2={450 + 28} y2={ISO_CY - H / 2}
                  stroke="#cbd5e1" strokeWidth={2} strokeDasharray="6,4" strokeOpacity={0.3} />
                {renderIsolation(
                  m2, weight2, netForce2,
                  m2 >= m1 ? 90 : 270,
                  '#a855f7', 'm₂'
                )}
              </>
            )}
          </FreeBodyDiagram>
        </div>
      </div>

      {/* ════ 右侧：参数面板 ════ */}
      <aside
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          backgroundColor: 'rgba(15,23,42,0.6)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* 参数滑块 */}
        <div style={{ padding: '1.5rem' }}>
          <h3 className="font-bold mb-6 text-lg">实验参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ParameterSlider label="左侧物体质量" symbol="m₁" unit="kg"
              value={m1} min={1} max={10} onChange={setM1} />
            <ParameterSlider label="右侧物体质量" symbol="m₂" unit="kg"
              value={m2} min={1} max={10} onChange={setM2} />
          </div>
          {/* 固定参数提示 */}
          <div className="mt-4 text-xs text-white/30 flex gap-2">
            <span>g = 9.8 m/s²</span>
            <span>·</span>
            <span>轻绳·理想滑轮</span>
          </div>
        </div>

        {/* 教学提示 */}
        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(59,130,246,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-3 text-blue-400 text-sm">
            <Info size={15} /> 物理要点：整体法 + 隔离法
          </h4>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p>
              <strong>前提：</strong>轻绳不可伸长，理想定滑轮（质量为零、无摩擦），因此绳两侧张力相等，两物体加速度大小相等方向相反。
            </p>
            <p>
              <strong>整体法求加速度</strong>（T 为内力）：
              <InlineMath math="a = \dfrac{(m_1 - m_2)\,g}{m_1 + m_2}" />
            </p>
            <p>
              <strong>隔离法求张力</strong>（对 m₁）：<br />
              <InlineMath math="m_1 g - T = m_1 a" />{' → '}
              <InlineMath math="T = \dfrac{2m_1 m_2 g}{m_1 + m_2}" />
            </p>
            <p className="text-yellow-300">
              关键结论：<InlineMath math="m_2 g < T < m_1 g" />。m₁ 处于失重状态，m₂ 处于超重状态。
            </p>
          </div>
        </div>

        {/* 实时计算数据 */}
        <div style={{ marginTop: 'auto', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <h4 style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            实时计算
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { label: '状态', value: status === 'balanced' ? '平衡静止' : '加速运动', color: status === 'balanced' ? '#f59e0b' : '#34d399' },
              { label: '重力 G₁ = m₁g', value: `${formatPhysicsValue(weight1)} N`, color: '#ff4d4d' },
              { label: '重力 G₂ = m₂g', value: `${formatPhysicsValue(weight2)} N`, color: '#f87171' },
              { label: '绳子张力 T', value: `${formatPhysicsValue(tension)} N`, color: '#ec4899' },
              { label: '加速度 a', value: `${formatPhysicsValue(Math.abs(accel))} m/s²`, color: '#34d399' },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{row.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: row.color, fontWeight: 'bold' }}>{row.value}</span>
              </div>
            ))}

            {/* 张力与重力对比条形图 */}
            {status === 'moving' && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.4rem' }}>
                  G₂ &lt; T &lt; G₁ 对比
                </div>
                <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
                  {/* 背景条：G₁ */}
                  <div style={{ position: 'absolute', left: 0, width: '100%', height: 8, background: 'rgba(255,77,77,0.2)', borderRadius: 4 }} />
                  {/* T 位置线 */}
                  <div style={{
                    position: 'absolute',
                    left: `${(tension / weight1) * 100}%`,
                    width: 3, height: 24, background: '#ec4899', borderRadius: 2,
                    transform: 'translateX(-50%)',
                  }} />
                  {/* G₂ 位置线 */}
                  <div style={{
                    position: 'absolute',
                    left: `${(weight2 / weight1) * 100}%`,
                    width: 2, height: 16, background: '#f87171', borderRadius: 2,
                    transform: 'translateX(-50%)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.15rem' }}>
                  <span>0</span>
                  <span style={{ color: '#f87171' }}>G₂={formatPhysicsValue(weight2)}</span>
                  <span style={{ color: '#ec4899' }}>T={formatPhysicsValue(tension)}</span>
                  <span style={{ color: '#ff4d4d' }}>G₁={formatPhysicsValue(weight1)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Atwood;
