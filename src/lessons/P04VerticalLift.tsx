import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle, Info, Send } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import PulleySymbol from '../components/Scene/PulleySymbol';
import AddForcePanel, { ForceOption } from '../components/Control/AddForcePanel';
import StudentForceLayer from '../components/Scene/StudentForceLayer';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext, JudgeRule, MagnitudeRelation } from '../data/types';
import p04Data from '../data/problems/p04.json';

// ─── 力类型配置 ─────────────────────────────────────────────
const AVAILABLE_FORCES: ForceOption[] = [
  {
    type: 'Gravity',
    label: '重力 G',
    symbol: 'G',
    color: '#ef4444',
    uniquePerStage: true,
    directions: [{ label: '竖直向下', angle: 270 }],
  },
  {
    type: 'Tension',
    label: '绳子拉力 T',
    symbol: 'T',
    color: '#4ade80',
    uniquePerStage: true,
    directions: [{ label: '竖直向上', angle: 90 }],
  },
  {
    type: 'FakeForce',
    label: '向上的运动力',
    symbol: '运动力',
    color: '#c084fc',
    uniquePerStage: true,
    isFake: true,
    directions: [{ label: '竖直向上（效果力）', angle: 90 }],
  },
];

// magnitudeValue 映射
function getMagnitudeValue(type: 'Gravity' | 'Tension', relation: MagnitudeRelation | null): number {
  if (type === 'Gravity') return 10;
  if (type === 'Tension') {
    if (relation === '=') return 10;
    if (relation === '>') return 15;
    if (relation === '<') return 5;
  }
  return 10;
}

// 引擎角 → SVG 角
function engineToSVG(a: number) { return (360 - a) % 360; }

const STAGES = ['匀速阶段受力图', '加速阶段受力图'] as const;
type Stage = typeof STAGES[number];

// SVG 布局（与 Atwood 隔离视图保持一致）
const W = 80, H = 70;
const ISO_CX = 450, ISO_CY = 370;
const PULLEY_CX = 450, PULLEY_CY = 80;
const PULLEY_R = 28;

const P04VerticalLift: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Stage>('匀速阶段受力图');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 每阶段：已添加力 / 大小关系 / 是否已提交
  const [forcesMap, setForcesMap] = useState<Record<Stage, StudentForce[]>>({
    '匀速阶段受力图': [],
    '加速阶段受力图': [],
  });
  const [relationMap, setRelationMap] = useState<Record<Stage, MagnitudeRelation | null>>({
    '匀速阶段受力图': null,
    '加速阶段受力图': null,
  });
  const [submittedMap, setSubmittedMap] = useState<Record<Stage, boolean>>({
    '匀速阶段受力图': false,
    '加速阶段受力图': false,
  });

  const currentForces = forcesMap[activeTab];
  const currentRelation = relationMap[activeTab];
  const isSubmitted = submittedMap[activeTab];

  // 任何修改都清除当前阶段的提交状态
  const clearSubmitted = useCallback(() => {
    setSubmittedMap(prev => ({ ...prev, [activeTab]: false }));
  }, [activeTab]);

  // 添加力
  const handleAddForce = useCallback((partial: Omit<StudentForce, 'id' | 'targetObject' | 'stage'>) => {
    clearSubmitted();
    setForcesMap(prev => ({
      ...prev,
      [activeTab]: [
        ...prev[activeTab],
        {
          ...partial,
          id: `${partial.type}_${Date.now()}`,
          targetObject: '重物',
          stage: activeTab,
        },
      ],
    }));
  }, [activeTab, clearSubmitted]);

  // 删除力
  const handleRemoveForce = useCallback((id: string) => {
    clearSubmitted();
    setForcesMap(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(f => f.id !== id),
    }));
  }, [activeTab, clearSubmitted]);

  // 大小关系
  const handleRelation = useCallback((rel: MagnitudeRelation) => {
    clearSubmitted();
    setRelationMap(prev => ({ ...prev, [activeTab]: rel }));
  }, [activeTab, clearSubmitted]);

  // 全屏
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
    const h = () => setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // 构造传给引擎的力数组（含 magnitudeValue）
  const studentForcesForEngine = useMemo<StudentForce[]>(() => {
    return currentForces.map(f => {
      if (f.type === 'Gravity') return { ...f, magnitudeValue: getMagnitudeValue('Gravity', currentRelation) };
      if (f.type === 'Tension') return { ...f, magnitudeValue: getMagnitudeValue('Tension', currentRelation) };
      return f;
    });
  }, [currentForces, currentRelation]);

  // 判别
  const currentRules = useMemo(() =>
    (p04Data.judgeRules as JudgeRule[]).filter(r => r.appliesTo === activeTab),
    [activeTab]
  );

  const judgeResults = useMemo(() => {
    const ctx: JudgingContext = { expectedTarget: '重物', expectedStage: activeTab };
    return currentRules.map(rule => ({ rule, result: evaluateRule(rule, studentForcesForEngine, ctx) }));
  }, [currentRules, studentForcesForEngine, activeTab]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // 是否显示大小关系选择器：两个真实力都已添加
  const hasGravity = currentForces.some(f => f.type === 'Gravity');
  const hasTension = currentForces.some(f => f.type === 'Tension');
  const showRelationPicker = hasGravity && hasTension;

  // ── SVG 场景渲染（复用 Atwood 单侧隔离图）─────────────────
  const isAccel = activeTab === '加速阶段受力图';

  // 力从重心开始画，符合物理习惯
  const GRAVITY_OX = ISO_CX;
  const TENSION_OX = ISO_CX;

  // 学生力中的重力/张力用于视觉显示大小差异
  const gravityForce = currentForces.find(f => f.type === 'Gravity');
  const tensionForce = currentForces.find(f => f.type === 'Tension');
  const fakeForce = currentForces.find(f => f.type === 'FakeForce');

  const gravityLen = 80;
  const tensionLen = currentRelation === '>' ? 120 : currentRelation === '<' ? 50 : 80;

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
      {/* ════ 左侧：场景画布 ════ */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '0.75rem', minHeight: 0 }}>
        {/* 页眉 */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-xl font-bold">{p04Data.title}</h2>
          </div>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm border border-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* Tab 切换 */}
        <div className="flex gap-2">
          {STAGES.map((stage) => {
            const isActive = activeTab === stage;
            const color = stage === '匀速阶段受力图' ? 'bg-blue-600 shadow-blue-500/50' : 'bg-orange-600 shadow-orange-500/50';
            return (
              <button
                key={stage}
                onClick={() => setActiveTab(stage)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isActive ? `${color} text-white shadow-lg` : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
              >
                {stage === '匀速阶段受力图' ? '阶段一：匀速上升' : '阶段二：加速上升'}
              </button>
            );
          })}
        </div>

        {/* SVG 画布 */}
        <div className="flex-1 min-h-0">
          <FreeBodyDiagram width={900} height={620} showGrid={false}>
            {/* 定滑轮 */}
            <PulleySymbol cx={PULLEY_CX} cy={PULLEY_CY} radius={PULLEY_R} type="fixed" />
            <text x={PULLEY_CX} y={PULLEY_CY + PULLEY_R + 18} fill="rgba(255,255,255,0.3)" fontSize={12} textAnchor="middle">（定滑轮）</text>

            {/* 绳子（从滑轮底到物体顶）*/}
            <line
              x1={PULLEY_CX} y1={PULLEY_CY + PULLEY_R}
              x2={ISO_CX} y2={ISO_CY - H / 2}
              stroke="#cbd5e1" strokeWidth={2.5} strokeDasharray="6,4" strokeOpacity={0.4}
            />

            {/* 虚线范围框 */}
            <rect x={ISO_CX - 150} y={ISO_CY - 130} width={300} height={280}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} strokeDasharray="6,4" rx={12} />
            <text x={ISO_CX - 140} y={ISO_CY - 115} fill="rgba(255,255,255,0.2)" fontSize={11}>隔离对象：重物</text>

            {/* 物体 */}
            <rect x={ISO_CX - W / 2} y={ISO_CY - H / 2} width={W} height={H}
              fill="rgba(59,130,246,0.18)" stroke="#3b82f6" strokeWidth={2.5} rx={5} />
            <text x={ISO_CX} y={ISO_CY - 16} fill="white" textAnchor="middle" fontSize={18} fontWeight="bold">重物</text>

            {/* 运动参考箭头 */}
            <ForceArrow
              x={ISO_CX + W / 2 + 18} y={ISO_CY}
              magnitude={35} angle={270}
              color="#34d399" label="v" dashed
            />
            {isAccel && (
              <ForceArrow
                x={ISO_CX + W / 2 + 60} y={ISO_CY}
                magnitude={25} angle={270}
                color="#f59e0b" label="a" dashed
              />
            )}

            {/* ── 学生添加的力箭头 ── */}
            {gravityForce && (
              <ForceArrow
                x={GRAVITY_OX} y={ISO_CY}
                magnitude={gravityLen / 2} angle={90}
                color="#ef4444" label="G"
              />
            )}
            {tensionForce && (
              <ForceArrow
                x={TENSION_OX} y={ISO_CY}
                magnitude={tensionLen / 2} angle={270}
                color="#4ade80" label="T"
              />
            )}
            {fakeForce && (
              <ForceArrow
                x={ISO_CX - 25} y={ISO_CY}
                magnitude={40} angle={270}
                color="#c084fc" label="运动力" dashed
              />
            )}

            {/* 受力方程文字提示 */}
            {isAccel ? (
              <text x={ISO_CX} y={ISO_CY + H / 2 + 48} fill="rgba(255,255,255,0.35)" fontSize={13} textAnchor="middle">
                加速上升：T − G = ma（合力向上）
              </text>
            ) : (
              <text x={ISO_CX} y={ISO_CY + H / 2 + 48} fill="rgba(255,255,255,0.35)" fontSize={13} textAnchor="middle">
                匀速上升：T − G = 0（合力为零）
              </text>
            )}
          </FreeBodyDiagram>
        </div>
      </div>

      {/* ════ 右侧：交互面板 ════ */}
      <aside
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(15,23,42,0.6)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* 题目情境 */}
          <details open style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', userSelect: 'none' }}>
              📋 题目情境
            </summary>
            <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
              {p04Data.scenario}
            </p>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {p04Data.studentTasks.map((t, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                  {i + 1}. {t.label}
                </div>
              ))}
            </div>
          </details>

          {/* 当前阶段标签 */}
          <div style={{
            padding: '0.5rem 0.75rem',
            borderRadius: 8,
            background: activeTab === '匀速阶段受力图' ? 'rgba(59,130,246,0.15)' : 'rgba(234,88,12,0.15)',
            border: `1px solid ${activeTab === '匀速阶段受力图' ? 'rgba(59,130,246,0.3)' : 'rgba(234,88,12,0.3)'}`,
            fontSize: '0.82rem',
            color: activeTab === '匀速阶段受力图' ? '#93c5fd' : '#fdba74',
            fontWeight: 600,
          }}>
            当前：{activeTab === '匀速阶段受力图' ? '阶段一 — 匀速上升' : '阶段二 — 加速上升'}
          </div>

          {/* 添加力面板 */}
          <AddForcePanel
            availableForces={AVAILABLE_FORCES}
            existingForces={currentForces}
            onConfirm={handleAddForce}
          />

          {/* 已添加力列表 */}
          {currentForces.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                已添加的力
              </div>
              {currentForces.map(f => (
                <div key={f.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.45rem 0.7rem',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: f.type === 'Gravity' ? '#ef4444' : f.type === 'Tension' ? '#4ade80' : '#c084fc',
                  }} />
                  <span style={{ flex: 1, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>
                    {f.type === 'Gravity' ? '重力 G（竖直向下）' : f.type === 'Tension' ? '绳子拉力 T（竖直向上）' : '运动力（效果力）'}
                  </span>
                  <button
                    onClick={() => handleRemoveForce(f.id)}
                    style={{ color: 'rgba(239,68,68,0.6)', cursor: 'pointer', lineHeight: 1 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 大小关系选择器 */}
          {showRelationPicker && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                大小关系 T 与 G
              </div>
              {([['=', 'T = G（相等）', 'T = G'], ['>', 'T > G（拉力更大）', 'T > G'], ['<', 'T < G（拉力更小）', 'T < G']] as const).map(([rel, desc, math]) => (
                <button
                  key={rel}
                  onClick={() => handleRelation(rel)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0.55rem 0.8rem',
                    borderRadius: 8,
                    border: `1px solid ${currentRelation === rel ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`,
                    background: currentRelation === rel ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', width: '100%',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentRelation === rel ? '#818cf8' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>{desc}</span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    <InlineMath math={math} />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={() => setSubmittedMap(prev => ({ ...prev, [activeTab]: true }))}
            disabled={currentForces.length === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '0.7rem',
              borderRadius: 10,
              border: '1px solid rgba(99,102,241,0.4)',
              background: currentForces.length === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.25)',
              cursor: currentForces.length === 0 ? 'not-allowed' : 'pointer',
              color: currentForces.length === 0 ? 'rgba(255,255,255,0.3)' : '#a5b4fc',
              fontWeight: 700, fontSize: '0.9rem',
              transition: 'all 0.15s',
            }}
          >
            <Send size={16} />
            提交判别
          </button>

          {/* 判别结果（提交后显示） */}
          {isSubmitted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                <Info size={14} />
                判别结果
              </div>
              {judgeResults.map((res, idx) => (
                <div key={idx} style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: 10,
                  border: `1px solid ${res.result.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  background: res.result.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {res.result.passed
                      ? <CheckCircle2 size={16} color="#10b981" />
                      : <XCircle size={16} color="#ef4444" />}
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: res.result.passed ? '#6ee7b7' : '#fca5a5' }}>
                      {res.rule.expect}
                    </span>
                  </div>
                  {!res.result.passed && res.result.hint && (
                    <div style={{ marginLeft: 24, fontSize: '0.75rem', color: 'rgba(252,165,165,0.8)', background: 'rgba(239,68,68,0.1)', padding: '0.4rem 0.6rem', borderRadius: 6 }}>
                      💡 {res.result.hint}
                    </div>
                  )}
                </div>
              ))}

              {allPassed && (
                <div style={{ padding: '0.8rem', borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', textAlign: 'center' }}>
                  <p style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <CheckCircle2 size={18} /> 阶段受力分析正确！
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default P04VerticalLift;
