import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle, Info, Send } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import AddForcePanel, { ForceOption } from '../components/Control/AddForcePanel';
import StudentForceLayer from '../components/Scene/StudentForceLayer';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext, JudgeRule } from '../data/types';
import p07Data from '../data/problems/p07.json';

// ─── 物理参数 ────────────────────────────────────────────────
const ANGLE = 30; // 斜面倾角
const ANGLE_RAD = (ANGLE * Math.PI) / 180;

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
    type: 'Normal',
    label: '支持力 N',
    symbol: 'N',
    color: '#60a5fa',
    uniquePerStage: true,
    directions: [{ label: '垂直斜面向外', angle: 90 + ANGLE, isPerpendicular: true }],
  },
  {
    type: 'Applied',
    label: '外力 F',
    symbol: 'F',
    color: '#fbbf24',
    uniquePerStage: true,
    directions: [{ label: '沿斜面向上', angle: ANGLE, isAlongSurface: true, directionSense: 1 }],
  },
  {
    type: 'Friction',
    label: '摩擦力 f',
    symbol: 'f',
    color: '#f87171',
    uniquePerStage: true,
    directions: [{ label: '沿斜面向下', angle: 180 + ANGLE, isAlongSurface: true, directionSense: -1 }],
  },
];

const STAGE_NAME = '斜面物块受力图与坐标系';

const P07InclineSlideUp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 状态管理
  const [forces, setForces] = useState<StudentForce[]>([]);
  const [coordSystem, setCoordSystem] = useState<'InclineNormal' | 'HorizontalVertical' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 任何修改都清除提交状态
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
        targetObject: '物块',
        stage: STAGE_NAME,
      },
    ]);
  }, [clearSubmitted]);

  // 删除力
  const handleRemoveForce = useCallback((id: string) => {
    clearSubmitted();
    setForces(prev => prev.filter(f => f.id !== id));
  }, [clearSubmitted]);

  // 坐标系选择
  const handleCoordSystem = useCallback((sys: 'InclineNormal' | 'HorizontalVertical') => {
    clearSubmitted();
    setCoordSystem(sys);
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
  const studentCoords = useMemo(() => {
    if (coordSystem === 'InclineNormal') return { xAxisAngle: ANGLE, yAxisAngle: ANGLE + 90 };
    if (coordSystem === 'HorizontalVertical') return { xAxisAngle: 0, yAxisAngle: 90 };
    return undefined;
  }, [coordSystem]);

  const judgeResults = useMemo(() => {
    const ctx: JudgingContext = {
      expectedTarget: '物块',
      expectedStage: STAGE_NAME,
      studentCoords
    };
    return p07Data.judgeRules.map(rule => ({
      rule,
      result: evaluateRule(rule as JudgeRule, forces, ctx)
    }));
  }, [forces, studentCoords]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // SVG 常量
  const CENTER_X = 400; // 物块底座中心的 X
  const BLOCK_W = 100;
  const BLOCK_H = 70;
  
  // 表面 Y 坐标 (基于 x=400, incline 从 x=100 开始)
  const SURFACE_Y = 500 - (CENTER_X - 100) * Math.tan(ANGLE_RAD);
  
  // 重心 (CM) 坐标：从表面中心沿法线向上移 H/2
  const CM_X = CENTER_X - (BLOCK_H / 2) * Math.sin(ANGLE_RAD);
  const CM_Y = SURFACE_Y - (BLOCK_H / 2) * Math.cos(ANGLE_RAD);

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
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-xl font-bold">{p07Data.title}</h2>
          </div>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm border border-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        <div className="flex-1 min-h-0 relative bg-slate-900/20 rounded-2xl border border-white/5 overflow-hidden">
          <FreeBodyDiagram width={900} height={650} showGrid={false}>
            {/* 斜面 */}
            <path 
              d={`M 100 500 L 750 500 L 750 ${500 - 650 * Math.tan(ANGLE_RAD)} Z`} 
              fill="rgba(255, 255, 255, 0.03)" 
              stroke="rgba(255, 255, 255, 0.3)" 
              strokeWidth="2" 
            />
            
            {/* 物块 */}
            <g transform={`translate(${CENTER_X}, ${SURFACE_Y}) rotate(${-ANGLE})`}>
              <rect 
                x={-BLOCK_W/2} y={-BLOCK_H} width={BLOCK_W} height={BLOCK_H} 
                fill="rgba(59, 130, 246, 0.15)" 
                stroke="#3b82f6" 
                strokeWidth="2.5" 
                rx={6} 
              />
              <text x={0} y={-BLOCK_H/2 + 6} fill="white" textAnchor="middle" fontSize={16} fontWeight="bold" transform={`rotate(${ANGLE})`}>物块</text>
              
              {/* 运动指示：v 沿斜面向上 */}
              <ForceArrow x={BLOCK_W/2 + 20} y={-BLOCK_H/2} magnitude={40} angle={0} color="#34d399" label="v" dashed />
            </g>

            {/* 坐标轴可视化 */}
            {coordSystem === 'InclineNormal' && (
              <g transform={`translate(${CM_X}, ${CM_Y}) rotate(${-ANGLE})`} opacity={0.5}>
                <line x1={0} y1={0} x2={120} y2={0} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" markerEnd="url(#arrowhead)" />
                <text x={130} y={5} fill="#94a3b8" fontSize="12" transform={`rotate(${ANGLE}, 130, 5)`}>x</text>
                <line x1={0} y1={0} x2={0} y2={-120} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" markerEnd="url(#arrowhead)" />
                <text x={5} y={-130} fill="#94a3b8" fontSize="12" transform={`rotate(${ANGLE}, 5, -130)`}>y</text>
              </g>
            )}

            {coordSystem === 'HorizontalVertical' && (
              <g transform={`translate(${CM_X}, ${CM_Y})`} opacity={0.5}>
                <line x1={0} y1={0} x2={120} y2={0} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" markerEnd="url(#arrowhead)" />
                <text x={130} y={5} fill="#94a3b8" fontSize="12">x</text>
                <line x1={0} y1={0} x2={0} y2={-120} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" markerEnd="url(#arrowhead)" />
                <text x={5} y={-130} fill="#94a3b8" fontSize="12">y</text>
              </g>
            )}

            {/* 学生受力层 */}
            <StudentForceLayer 
              studentForces={forces} 
              originX={CM_X} 
              originY={CM_Y} 
              scale={1.2}
            />
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
              {p07Data.scenario}
            </p>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {p07Data.studentTasks.map((t, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                  {i + 1}. {t.label}
                </div>
              ))}
            </div>
          </details>

          {/* 阶段指示 */}
          <div style={{
            padding: '0.5rem 0.75rem',
            borderRadius: 8,
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            fontSize: '0.82rem',
            color: '#93c5fd',
            fontWeight: 600,
          }}>
            任务：受力分析与建立坐标系
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
                    {AVAILABLE_FORCES.find(opt => opt.type === f.type)?.label}
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

          {/* 坐标系选择器 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              建立坐标系
            </div>
            <button
              onClick={() => handleCoordSystem('InclineNormal')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0.6rem 0.8rem',
                borderRadius: 8,
                border: `1px solid ${coordSystem === 'InclineNormal' ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
                background: coordSystem === 'InclineNormal' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '2px', background: coordSystem === 'InclineNormal' ? '#60a5fa' : 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>沿斜面建立坐标轴 (x 轴沿斜面)</span>
            </button>
            <button
              onClick={() => handleCoordSystem('HorizontalVertical')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0.6rem 0.8rem',
                borderRadius: 8,
                border: `1px solid ${coordSystem === 'HorizontalVertical' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                background: coordSystem === 'HorizontalVertical' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '2px', background: coordSystem === 'HorizontalVertical' ? '#fff' : 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>水平竖直坐标轴</span>
            </button>
          </div>

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
              marginTop: '0.5rem',
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
                    <CheckCircle2 size={18} /> 全部分析正确！
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

export default P07InclineSlideUp;
