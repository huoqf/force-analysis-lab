import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle, Info, Send } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import AddForcePanel, { ForceOption } from '../components/Control/AddForcePanel';
import StudentForceLayer from '../components/Scene/StudentForceLayer';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext, JudgeRule } from '../data/types';
import p06Data from '../data/problems/p06.json';

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
    color: '#60a5fa',
    uniquePerStage: true,
    directions: [{ label: '沿绳指向悬点', angle: 120 }], // 90 + 30 = 120 (左上方)
  },
  {
    type: 'Electrostatic',
    label: '静电力 Fe',
    symbol: 'F_e',
    color: '#f59e0b',
    uniquePerStage: true,
    directions: [{ label: '水平向右', angle: 0 }],
  },
  {
    type: 'FakeForce',
    label: '向心力',
    symbol: 'F_向',
    color: '#c084fc',
    uniquePerStage: true,
    isFake: true,
    directions: [
      { label: '水平向右（指向轨迹圆心）', angle: 0 },
      { label: '水平向左', angle: 180 }
    ],
  },
];

// ─── 力类型颜色映射 ──────────────────────────────────────────
const COLOR_MAP = {
  Gravity: '#ef4444',
  Tension: '#60a5fa',
  Electrostatic: '#f59e0b',
  FakeForce: '#c084fc',
};

const STAGE = '悬挂小球受力图';

const P06ElectricDeflection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 状态管理
  const [forces, setForces] = useState<StudentForce[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 清除提交状态
  const clearSubmitted = useCallback(() => {
    setIsSubmitted(false);
  }, []);

  // 添加力
  const handleAddForce = useCallback((partial: Omit<StudentForce, 'id' | 'targetObject' | 'stage'>) => {
    clearSubmitted();
    setForces(prev => [
      ...prev,
      {
        ...partial,
        id: `${partial.type}_${Date.now()}`,
        targetObject: '悬挂小球',
        stage: STAGE,
      },
    ]);
  }, [clearSubmitted]);

  // 删除力
  const handleRemoveForce = useCallback((id: string) => {
    clearSubmitted();
    setForces(prev => prev.filter(f => f.id !== id));
  }, [clearSubmitted]);

  // 全屏切换
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

  // 判别逻辑
  const judgeResults = useMemo(() => {
    const ctx: JudgingContext = { expectedTarget: '悬挂小球', expectedStage: STAGE };
    return p06Data.judgeRules.map(rule => ({
      rule: rule as JudgeRule,
      result: evaluateRule(rule as JudgeRule, forces, ctx)
    }));
  }, [forces]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // SVG 绘图常量
  const PIVOT_X = 400;
  const PIVOT_Y = 150;
  const ROPE_LENGTH = 300;
  const angle = 30;
  const angleRad = (angle * Math.PI) / 180;
  
  const BALL_X = PIVOT_X + ROPE_LENGTH * Math.sin(angleRad);
  const BALL_Y = PIVOT_Y + ROPE_LENGTH * Math.cos(angleRad);

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
      className="text-white"
    >
      {/* ════ 左侧：场景画布 ════ */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '0.75rem', minHeight: 0 }} className="relative">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-xl font-bold">{p06Data.title}</h2>
          </div>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm border border-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        <div className="flex-1 min-h-0 relative flex justify-center items-center">
          <FreeBodyDiagram width={800} height={600} showGrid={false}>
            {/* 天花板 */}
            <rect x={PIVOT_X - 60} y={PIVOT_Y - 10} width={120} height={10} fill="rgba(255,255,255,0.1)" />
            
            {/* 固定电荷 (源) - 调整至与小球等高以符合水平排斥逻辑 */}
            <g transform={`translate(${PIVOT_X}, ${BALL_Y})`}>
              <circle r={10} fill="#f59e0b" />
              <text y={25} x={-10} fill="#f59e0b" fontSize={12} fontWeight="bold">+Q</text>
              <path d="M-20,0 L20,0 M0,-20 L0,20" stroke="#f59e0b" strokeWidth={1} opacity={0.3} />
            </g>

            {/* 绳子 */}
            <line x1={PIVOT_X} y1={PIVOT_Y} x2={BALL_X} y2={BALL_Y} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4,2" opacity={0.6} />
            
            {/* 悬挂小球 */}
            <circle cx={BALL_X} cy={BALL_Y} r={20} fill="#3b82f6" stroke="#60a5fa" strokeWidth={2} />
            <text x={BALL_X - 6} y={BALL_Y + 5} fill="white" fontSize={14} fontWeight="bold">+q</text>

            {/* 学生力层 */}
            <StudentForceLayer 
              studentForces={forces} 
              originX={BALL_X} 
              originY={BALL_Y} 
              scale={1.5}
              colorMap={COLOR_MAP}
            />

            {/* 辅助线：平衡状态提示 */}
            {allPassed && isSubmitted && (
              <g transform={`translate(${BALL_X + 100}, ${BALL_Y - 50})`} opacity={0.4}>
                <text x={0} y={0} fill="#10b981" fontSize={12} fontWeight="bold">三力平衡：ΣF = 0</text>
              </g>
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
              {p06Data.scenario}
            </p>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {p06Data.studentTasks.map((t, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                  {i + 1}. {t.label}
                </div>
              ))}
            </div>
          </details>

          <div style={{
            padding: '0.5rem 0.75rem',
            borderRadius: 8,
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            fontSize: '0.82rem',
            color: '#93c5fd',
            fontWeight: 600,
          }}>
            当前：{STAGE}
          </div>

          {/* 添加力面板 */}
          <AddForcePanel
            availableForces={AVAILABLE_FORCES}
            existingForces={forces}
            onConfirm={handleAddForce}
          />

          {/* 已添加力列表 */}
          {forces.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                已添加的力
              </div>
              {forces.map(f => (
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
                    background: AVAILABLE_FORCES.find(opt => opt.type === f.type)?.color || '#fff',
                  }} />
                  <span style={{ flex: 1, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>
                    {AVAILABLE_FORCES.find(opt => opt.type === f.type)?.label}（{f.angle === 270 ? '竖直向下' : f.angle === 0 ? '水平向右' : f.angle === 120 ? '沿绳指向悬点' : '其他'}）
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

          {/* 提交按钮 */}
          <button
            onClick={() => setIsSubmitted(true)}
            disabled={forces.length === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '0.7rem',
              borderRadius: 10,
              border: '1px solid rgba(99,102,241,0.4)',
              background: forces.length === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.25)',
              cursor: forces.length === 0 ? 'not-allowed' : 'pointer',
              color: forces.length === 0 ? 'rgba(255,255,255,0.3)' : '#a5b4fc',
              fontWeight: 700, fontSize: '0.9rem',
              transition: 'all 0.15s',
            }}
          >
            <Send size={16} />
            提交判别
          </button>

          {/* 判别结果 */}
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
                    <CheckCircle2 size={18} /> 受力分析完全正确！
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

export default P06ElectricDeflection;

