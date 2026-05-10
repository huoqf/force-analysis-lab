import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle, Info, Send } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import PulleySymbol from '../components/Scene/PulleySymbol';
import AddForcePanel, { ForceOption } from '../components/Control/AddForcePanel';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext, JudgeRule, MagnitudeRelation } from '../data/types';
import p04Data from '../data/problems/p04.json';

// ─── 力类型配置 ────────────────────────────────────────────────────────────────
// Normal（支持力）不列入，因为 p04 judgeRules 含 FORCE_ABSENT: Normal
// FakeForce 保留，让学生可以主动选择假力以触发 NO_FAKE_FORCE 判别反馈
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
    label: '运动力 / 惯性力（假力）',
    symbol: '运动力',
    color: '#c084fc',
    uniquePerStage: true,
    isFake: true,
    directions: [{ label: '竖直向上（效果力，非真实力）', angle: 90 }],
  },
];

// ─── magnitudeValue 映射 ────────────────────────────────────────────────────────
// Gravity 归一化为基准 10，Tension 由大小关系选择器决定
// 引擎 MAGNITUDE_RELATION 用相对大小比较，符号化数值即可
function getMagnitudeValue(type: 'Gravity' | 'Tension', relation: MagnitudeRelation | null): number {
  if (type === 'Gravity') return 10;
  if (type === 'Tension') {
    if (relation === '=') return 10;    // T = G
    if (relation === '>') return 15;    // T > G（加速上升超重）
    if (relation === '<') return 5;     // T < G（失重，本题不涉及但保留）
  }
  return 10;
}

const STAGES = ['匀速阶段受力图', '加速阶段受力图'] as const;
type Stage = typeof STAGES[number];

// SVG 布局常量（与 Atwood 单侧隔离视图保持一致）
const W = 80, H = 70;
const ISO_CX = 450, ISO_CY = 370;
const PULLEY_CX = 450, PULLEY_CY = 80;
const PULLEY_R = 28;

// ─── 组件 ──────────────────────────────────────────────────────────────────────
const P04VerticalLift: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Stage>('匀速阶段受力图');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const clearSubmitted = useCallback(() => {
    setSubmittedMap(prev => ({ ...prev, [activeTab]: false }));
  }, [activeTab]);

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

  const handleRemoveForce = useCallback((id: string) => {
    clearSubmitted();
    setForcesMap(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(f => f.id !== id),
    }));
  }, [activeTab, clearSubmitted]);

  const handleRelation = useCallback((rel: MagnitudeRelation) => {
    clearSubmitted();
    setRelationMap(prev => ({ ...prev, [activeTab]: rel }));
  }, [activeTab, clearSubmitted]);

  // ─── 全屏 ───────────────────────────────────────────────────────────────────
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

  // ─── 引擎判别 ────────────────────────────────────────────────────────────────
  // 注入 magnitudeValue 后再送入引擎
  const studentForcesForEngine = useMemo<StudentForce[]>(() => {
    return currentForces.map(f => {
      if (f.type === 'Gravity') return { ...f, magnitudeValue: getMagnitudeValue('Gravity', currentRelation) };
      if (f.type === 'Tension') return { ...f, magnitudeValue: getMagnitudeValue('Tension', currentRelation) };
      return f;
    });
  }, [currentForces, currentRelation]);

  const currentRules = useMemo(() =>
    (p04Data.judgeRules as JudgeRule[]).filter(r => r.appliesTo === activeTab),
    [activeTab]
  );

  const judgeResults = useMemo(() => {
    const ctx: JudgingContext = { expectedTarget: '重物', expectedStage: activeTab };
    return currentRules.map(rule => ({
      rule,
      result: evaluateRule(rule, studentForcesForEngine, ctx),
    }));
  }, [currentRules, studentForcesForEngine, activeTab]);

  const allPassed = judgeResults.length > 0 && judgeResults.every(r => r.result.passed);

  // ─── 大小关系选择器显示条件 ─────────────────────────────────────────────────
  const hasGravity = currentForces.some(f => f.type === 'Gravity');
  const hasTension = currentForces.some(f => f.type === 'Tension');
  const showRelationPicker = hasGravity && hasTension;

  // ─── SVG 视觉辅助：力的长度随大小关系变化 ──────────────────────────────────
  const isAccel = activeTab === '加速阶段受力图';
  const gravityForce = currentForces.find(f => f.type === 'Gravity');
  const tensionForce = currentForces.find(f => f.type === 'Tension');
  const fakeForce    = currentForces.find(f => f.type === 'FakeForce');

  const gravityLen = 80;
  const tensionLen = currentRelation === '>' ? 120 : currentRelation === '<' ? 50 : 80;

  // ─── 已添加力的显示标签 ─────────────────────────────────────────────────────
  function forceDisplayLabel(f: StudentForce): string {
    if (f.type === 'Gravity') return '重力 G（竖直向下）';
    if (f.type === 'Tension') return '绳子拉力 T（竖直向上）';
    return '运动力 / 惯性力（假力，非真实力）';
  }

  // ─── 力的颜色 ────────────────────────────────────────────────────────────────
  function forceColor(f: StudentForce): string {
    if (f.type === 'Gravity') return '#ef4444';
    if (f.type === 'Tension') return '#4ade80';
    return '#c084fc';
  }

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', width: '100%', height: '100vh', background: '#0f172a', overflow: 'hidden' }}
      className="text-white"
    >
      {/* ════ 左侧：场景画布 ════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px', minWidth: 0 }}>

        {/* 页眉 */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            const activeColor = stage === '匀速阶段受力图'
              ? 'bg-blue-600 shadow-blue-500/50'
              : 'bg-orange-600 shadow-orange-500/50';
            return (
              <button
                key={stage}
                onClick={() => setActiveTab(stage)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors text-white shadow-lg ${
                  isActive ? activeColor : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
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
            <text x={PULLEY_CX} y={PULLEY_CY + PULLEY_R + 18}
              fill="rgba(255,255,255,0.3)" fontSize={12} textAnchor="middle">（定滑轮）</text>

            {/* 绳子（从滑轮底到物体顶）*/}
            <line
              x1={PULLEY_CX} y1={PULLEY_CY + PULLEY_R}
              x2={ISO_CX}    y2={ISO_CY - H / 2}
              stroke="#cbd5e1" strokeWidth={2.5} strokeDasharray="6,4" strokeOpacity={0.4}
            />

            {/* 隔离框 */}
            <rect x={ISO_CX - 150} y={ISO_CY - 130} width={300} height={280}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1}
              strokeDasharray="6,4" rx={12} />
            <text x={ISO_CX - 140} y={ISO_CY - 115}
              fill="rgba(255,255,255,0.2)" fontSize={11}>隔离对象：重物</text>

            {/* 物体 */}
            <rect x={ISO_CX - W / 2} y={ISO_CY - H / 2} width={W} height={H}
              fill="rgba(59,130,246,0.18)" stroke="#3b82f6" strokeWidth={2.5} rx={5} />
            <text x={ISO_CX} y={ISO_CY + 6}
              fill="white" textAnchor="middle" fontSize={18} fontWeight="bold">重物</text>

            {/* 运动参考箭头（场景提示，非学生力） */}
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
            {/* 重力：从重心向下，引擎角 270° → SVG angle 传 90（engineToSVG 转换） */}
            {gravityForce && (
              <ForceArrow
                x={ISO_CX} y={ISO_CY}
                magnitude={gravityLen / 2} angle={90}
                color="#ef4444" label="G"
              />
            )}
            {/* 拉力：从重心向上，引擎角 90° → SVG angle 传 270 */}
            {tensionForce && (
              <ForceArrow
                x={ISO_CX} y={ISO_CY}
                magnitude={tensionLen / 2} angle={270}
                color="#4ade80" label="T"
              />
            )}
            {/* 假力：偏移显示，虚线 */}
            {fakeForce && (
              <ForceArrow
                x={ISO_CX - 30} y={ISO_CY}
                magnitude={40} angle={270}
                color="#c084fc" label="运动力" dashed
              />
            )}

            {/* 受力方程文字提示 */}
            {isAccel ? (
              <text x={ISO_CX} y={ISO_CY + H / 2 + 48}
                fill="rgba(255,255,255,0.35)" fontSize={13} textAnchor="middle">
                加速上升：T − G = ma（合力向上，T &gt; G）
              </text>
            ) : (
              <text x={ISO_CX} y={ISO_CY + H / 2 + 48}
                fill="rgba(255,255,255,0.35)" fontSize={13} textAnchor="middle">
                匀速上升：T − G = 0（合力为零，T = G）
              </text>
            )}

          </FreeBodyDiagram>
        </div>
      </div>

      {/* ════ 右侧：交互面板 ════ */}
      <aside style={{
        width: '360px', flexShrink: 0,
        background: 'rgba(255,255,255,0.03)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 题目情境 */}
          <details open style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px' }}>
            <summary style={{ fontWeight: 700, fontSize: '13px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', marginBottom: '8px' }}>
              📋 题目情境
            </summary>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '10px' }}>
              {p04Data.scenario}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {p04Data.studentTasks.map((t, i) => (
                <div key={i} style={{
                  fontSize: '12px', color: 'rgba(255,255,255,0.45)',
                  padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px',
                }}>
                  {i + 1}. {t.label}
                </div>
              ))}
            </div>
          </details>

          {/* 当前阶段标签 */}
          <div style={{
            fontSize: '12px', fontWeight: 600,
            color: activeTab === '匀速阶段受力图' ? '#60a5fa' : '#fb923c',
            padding: '8px 12px',
            background: activeTab === '匀速阶段受力图' ? 'rgba(96,165,250,0.08)' : 'rgba(251,146,60,0.08)',
            borderRadius: '8px', border: `1px solid ${activeTab === '匀速阶段受力图' ? 'rgba(96,165,250,0.2)' : 'rgba(251,146,60,0.2)'}`,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', paddingLeft: '2px' }}>
                已添加的力
              </div>
              {currentForces.map(f => (
                <div key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: forceColor(f), flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                    {forceDisplayLabel(f)}
                  </span>
                  <button
                    onClick={() => handleRemoveForce(f.id)}
                    style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer', background: 'none', border: 'none', padding: '2px' }}
                    className="hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 大小关系选择器（两个真实力都已添加后显示） */}
          {showRelationPicker && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', paddingLeft: '2px' }}>
                大小关系：T 与 G
              </div>
              {([
                ['=', 'T = G（相等）',    'T = G'],
                ['>', 'T > G（拉力更大）', 'T > G'],
                ['<', 'T < G（拉力更小）', 'T < G'],
              ] as const).map(([rel, desc, math]) => (
                <button
                  key={rel}
                  onClick={() => handleRelation(rel)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                    background: currentRelation === rel ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${currentRelation === rel ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: currentRelation === rel ? '#818cf8' : 'rgba(255,255,255,0.2)',
                  }} />
                  <span style={{ flex: 1, fontSize: '13px', color: 'rgba(255,255,255,0.75)', textAlign: 'left' }}>{desc}</span>
                  <span style={{ fontSize: '13px', color: '#a5b4fc', fontFamily: 'serif' }}>
                    <InlineMath math={math} />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 提交判别按钮 */}
          <button
            onClick={() => setSubmittedMap(prev => ({ ...prev, [activeTab]: true }))}
            disabled={currentForces.length === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
              background: currentForces.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.8)',
              color: currentForces.length === 0 ? 'rgba(255,255,255,0.25)' : 'white',
              border: 'none', cursor: currentForces.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <Send size={16} />
            提交判别
          </button>

          {/* 判别结果（提交后显示） */}
          {isSubmitted && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '8px',
              padding: '14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                <Info size={14} />
                判别结果
              </div>

              {judgeResults.map((res, idx) => (
                <div key={idx} style={{
                  padding: '10px 12px', borderRadius: '8px',
                  background: res.result.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${res.result.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  {/* 通过：显示 expect 文案 + 绿色勾；失败：显示 expect 文案 + 红色叉 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    {res.result.passed
                      ? <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />
                      : <XCircle     size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />}
                    <span style={{ fontSize: '13px', color: res.result.passed ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                      {res.rule.expect}
                    </span>
                  </div>
                  {/* 失败时额外显示 hint */}
                  {!res.result.passed && res.result.hint && (
                    <div style={{
                      marginTop: '6px', paddingLeft: '24px',
                      fontSize: '12px', color: '#fca5a5', lineHeight: 1.5,
                    }}>
                      💡 {res.result.hint}
                    </div>
                  )}
                </div>
              ))}

              {/* 全部通过时的全局成功提示 */}
              {allPassed && (
                <div style={{
                  marginTop: '4px', padding: '12px',
                  borderRadius: '10px', textAlign: 'center',
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.3)',
                }}>
                  <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '14px', margin: 0 }}>
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
