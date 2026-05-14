import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle, Info, Send, RotateCcw } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import AddForcePanel, { ForceOption } from '../components/Control/AddForcePanel';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext, JudgeRule } from '../data/types';
import p03Data from '../data/problems/p03.json';

// ─── 力类型配置 ────────────────────────────────────────────────────────────────
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
    type: 'FakeForce',
    label: '向心力',
    symbol: 'F_{向}',
    color: '#c084fc',
    uniquePerStage: true,
    isFake: true,
    directions: [{ label: '竖直向下', angle: 270 }],
  },
];

const P03VerticalCircleTop: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [studentForces, setStudentForces] = useState<StudentForce[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const clearSubmitted = useCallback(() => {
    setIsSubmitted(false);
  }, []);

  const handleAddForce = useCallback((partial: Omit<StudentForce, 'id' | 'targetObject' | 'stage'>) => {
    clearSubmitted();
    setStudentForces(prev => [
      ...prev,
      {
        ...partial,
        id: `${partial.type}_${Date.now()}`,
        targetObject: '最高点受力图',
        stage: '最高点受力图',
      },
    ]);
  }, [clearSubmitted]);

  const handleRemoveForce = useCallback((id: string) => {
    clearSubmitted();
    setStudentForces(prev => prev.filter(f => f.id !== id));
  }, [clearSubmitted]);

  const handleRedo = useCallback(() => {
    setStudentForces([]);
    setIsSubmitted(false);
  }, []);

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
  const judgeResults = useMemo(() => {
    const ctx: JudgingContext = { expectedTarget: '最高点受力图', expectedStage: '最高点受力图' };
    return p03Data.judgeRules.map(rule => ({
      rule,
      result: evaluateRule(rule, studentForces, ctx),
    }));
  }, [studentForces]);

  const allPassed = judgeResults.length > 0 && judgeResults.every(r => r.result.passed);

  // ─── SVG 画布常量 ────────────────────────────────────────────────────────────
  const CENTER_X = 400;
  const CENTER_Y = 300;
  const RADIUS = 180;
  const BALL_X = CENTER_X;
  const BALL_Y = CENTER_Y - RADIUS;

  // ─── SVG 视觉辅助 ────────────────────────────────────────────────────────────
  const gravityForce = studentForces.find(f => f.type === 'Gravity');
  const fakeForce    = studentForces.find(f => f.type === 'FakeForce');

  // ─── 已添加力的显示标签与颜色 ────────────────────────────────────────────────
  function forceDisplayLabel(f: StudentForce): string {
    if (f.type === 'Gravity') return '重力 G（竖直向下）';
    return '向心力 F_向';
  }

  function forceColor(f: StudentForce): string {
    if (f.type === 'Gravity') return '#ef4444';
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
            <h2 className="text-xl font-bold">{p03Data.title}</h2>
          </div>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm border border-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* SVG 画布 */}
        <div className="flex-1 min-h-0 relative flex justify-center items-center">
          <FreeBodyDiagram width={800} height={600} showGrid={false}>
            {/* 轨道 */}
            <path 
              d={`M ${CENTER_X - RADIUS - 50} ${CENTER_Y} L ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER_X + RADIUS} ${CENTER_Y} L ${CENTER_X + RADIUS + 50} ${CENTER_Y}`} 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.2)" 
              strokeWidth="10" 
            />
            <path 
              d={`M ${CENTER_X - RADIUS - 50} ${CENTER_Y} L ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER_X + RADIUS} ${CENTER_Y} L ${CENTER_X + RADIUS + 50} ${CENTER_Y}`} 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              opacity="0.3"
            />
            
            {/* 临界提示 */}
            <g transform={`translate(${CENTER_X - 100}, ${CENTER_Y})`}>
              <text fill="rgba(255,255,255,0.4)" fontSize={14}>水平轨道</text>
            </g>

            {/* 物体在最高点 C */}
            <circle cx={BALL_X} cy={BALL_Y} r={20} fill="#f43f5e" stroke="#fb7185" strokeWidth={2} />
            <text x={BALL_X - 6} y={BALL_Y - 30} fill="white" fontSize={18} fontWeight="bold">C</text>

            {/* ── 学生添加的力箭头 ── */}
            <g transform={`translate(${BALL_X}, ${BALL_Y})`}>
              {/* 重力：从重心向下，引擎角 270° → SVG angle 传 90 */}
              {gravityForce && (
                <ForceArrow x={0} y={0} magnitude={100} angle={90} color="#ef4444" label="G" />
              )}
              {/* 假力向心力：偏移显示，虚线 */}
              {fakeForce && (
                <ForceArrow x={30} y={0} magnitude={100} angle={90} color="#c084fc" label="F_{向}" dashed />
              )}
            </g>
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
              {p03Data.scenario}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {p03Data.studentTasks.map((t, i) => (
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
            color: '#60a5fa', padding: '8px 12px',
            background: 'rgba(96,165,250,0.08)',
            borderRadius: '8px', border: '1px solid rgba(96,165,250,0.2)',
          }}>
            当前：最高点受力分析
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-200/90 leading-relaxed">
              <strong>提示：</strong>物体“恰好”能通过最高点 C，此时为临界状态。
            </p>
          </div>

          {/* 添加力面板 */}
          <AddForcePanel
            availableForces={AVAILABLE_FORCES}
            existingForces={studentForces}
            onConfirm={handleAddForce}
            excludeForceTypes={['Normal']}
          />

          {/* 已添加力列表 */}
          {studentForces.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', paddingLeft: '2px' }}>
                已添加的力
              </div>
              {studentForces.map(f => (
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

          {/* 提交判别按钮 */}
          <button
            onClick={() => setIsSubmitted(true)}
            disabled={studentForces.length === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
              background: studentForces.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.8)',
              color: studentForces.length === 0 ? 'rgba(255,255,255,0.25)' : 'white',
              border: 'none', cursor: studentForces.length === 0 ? 'not-allowed' : 'pointer',
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                  <Info size={14} />
                  判别结果
                </div>
                {!allPassed && (
                  <button
                    onClick={handleRedo}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 8px', borderRadius: '6px',
                      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#fca5a5', fontSize: '11px', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <RotateCcw size={12} /> 重做
                  </button>
                )}
              </div>

              {judgeResults.map((res, idx) => (
                <div key={idx} style={{
                  padding: '10px 12px', borderRadius: '8px',
                  background: res.result.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${res.result.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    {res.result.passed
                      ? <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />
                      : <XCircle     size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />}
                    <span style={{ fontSize: '13px', color: res.result.passed ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                      {res.rule.expect}
                    </span>
                  </div>
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

export default P03VerticalCircleTop;
