import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle, Info, Send, RotateCcw } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import StudentForceLayer from '../components/Scene/StudentForceLayer';
import AddForcePanel, { ForceOption } from '../components/Control/AddForcePanel';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext, JudgeRule } from '../data/types';
import p05Data from '../data/problems/p05.json';

const AVAILABLE_FORCES: ForceOption[] = [
  { id: 'Gravity', type: 'Gravity', label: '重力 G', symbol: 'G', color: '#ef4444', directions: [{ label: '竖直向下', angle: 270 }] },
  { id: 'Normal', type: 'Normal', label: '支持力 N', symbol: 'N', color: '#60a5fa', directions: [{ label: '竖直向上', angle: 90 }] },
  { id: 'Friction', type: 'Friction', label: '摩擦力 f', symbol: 'f', color: '#f87171', directions: [{ label: '水平向左', angle: 180 }] },
  { id: 'ExternalPush', type: 'Applied', label: '外部推力 F', symbol: 'F', color: '#fbbf24', directions: [{ label: '水平向右', angle: 0 }] },
  { id: 'PushAB', type: 'Applied', sourceObject: 'A', label: 'A对B的推力', symbol: 'F_{AB}', color: '#ec4899', directions: [{ label: '水平向右', angle: 0 }] },
  { id: 'PushBC', type: 'Applied', sourceObject: 'B', label: 'B对C的推力', symbol: 'F_{BC}', color: '#ec4899', directions: [{ label: '水平向右', angle: 0 }] },
  { id: 'PushCB', type: 'FakeForce', label: 'C对B的反作用力', symbol: 'F_{CB}', color: '#c084fc', isFake: true, directions: [{ label: '水平向左', angle: 180 }] },
  { id: 'Resultant', type: 'FakeForce', label: '合力 / 惯性力', symbol: 'F_{假}', color: '#c084fc', isFake: true, directions: [{ label: '水平向右', angle: 0 }, { label: '水平向左', angle: 180 }] }
];

const COLOR_MAP = {
  Gravity: '#ef4444',
  Normal: '#60a5fa',
  Friction: '#f87171',
  Applied: '#fbbf24',
  FakeForce: '#c084fc',
};

type Stage = '整体受力图' | '物块C受力图' | 'B+C部分整体受力图';

const P05TripleBlocks: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Stage>('整体受力图');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [forcesMap, setForcesMap] = useState<Record<Stage, StudentForce[]>>({
    '整体受力图': [],
    '物块C受力图': [],
    'B+C部分整体受力图': [],
  });
  const [submittedMap, setSubmittedMap] = useState<Record<Stage, boolean>>({
    '整体受力图': false,
    '物块C受力图': false,
    'B+C部分整体受力图': false,
  });

  const currentForces = forcesMap[activeTab];
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
          id: `${partial.id || partial.type}_${Date.now()}`,
          targetObject: activeTab,
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

  const handleRedo = useCallback(() => {
    setForcesMap(prev => ({ ...prev, [activeTab]: [] }));
    setSubmittedMap(prev => ({ ...prev, [activeTab]: false }));
  }, [activeTab]);

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
    const handler = () => setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const judgeResults = useMemo(() => {
    const context: JudgingContext = { expectedTarget: activeTab, expectedStage: activeTab };
    const rules = p05Data.judgeRules.filter(r => r.appliesTo === activeTab) as JudgeRule[];
    return rules.map(rule => ({
      rule,
      result: evaluateRule(rule, currentForces, context)
    }));
  }, [activeTab, currentForces]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // SVG Drawing Constants
  const CENTER_X = 400;
  const CENTER_Y = 300;
  const BOX_SIZE = 80;
  const GAP = 5;

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
            <h2 className="text-xl font-bold">{p05Data.title}</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm border border-white/10 transition-colors">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* 研究对象选择器 (Tabs) */}
        <div className="flex gap-2 z-10">
          {(['整体受力图', 'B+C部分整体受力图', '物块C受力图'] as Stage[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {tab.replace('受力图', '').replace('部分整体', '部分整体')}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 relative flex justify-center items-center">
          <FreeBodyDiagram width={800} height={600} showGrid={false}>
            {/* 地面 */}
            <line x1={100} y1={CENTER_Y + 100} x2={700} y2={CENTER_Y + 100} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            
            {/* 隔离框 */}
            {activeTab === '整体受力图' && (
              <rect x={CENTER_X - BOX_SIZE * 1.5 - GAP - 10} y={CENTER_Y + 100 - BOX_SIZE - 10} width={BOX_SIZE * 3 + GAP * 2 + 20} height={BOX_SIZE + 20} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2} strokeDasharray="6,4" rx={8} />
            )}
            {activeTab === 'B+C部分整体受力图' && (
              <rect x={CENTER_X - BOX_SIZE * 0.5 - 10} y={CENTER_Y + 100 - BOX_SIZE - 10} width={BOX_SIZE * 2 + GAP + 20} height={BOX_SIZE + 20} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2} strokeDasharray="6,4" rx={8} />
            )}
            {activeTab === '物块C受力图' && (
              <rect x={CENTER_X + BOX_SIZE * 0.5 + GAP - 10} y={CENTER_Y + 100 - BOX_SIZE - 10} width={BOX_SIZE + 20} height={BOX_SIZE + 20} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2} strokeDasharray="6,4" rx={8} />
            )}

            {/* Block A */}
            <g transform={`translate(${CENTER_X - BOX_SIZE * 1.5 - GAP}, ${CENTER_Y + 100 - BOX_SIZE})`} opacity={activeTab === '整体受力图' ? 1 : 0.2}>
              <rect width={BOX_SIZE} height={BOX_SIZE} fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth={2} rx={8} />
              <text x={BOX_SIZE/2} y={BOX_SIZE/2 + 6} fill="#a855f7" textAnchor="middle" fontWeight="bold">A</text>
            </g>

            {/* Block B */}
            <g transform={`translate(${CENTER_X - BOX_SIZE * 0.5}, ${CENTER_Y + 100 - BOX_SIZE})`} opacity={activeTab === '物块C受力图' ? 0.2 : 1}>
              <rect width={BOX_SIZE} height={BOX_SIZE} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth={2} rx={8} />
              <text x={BOX_SIZE/2} y={BOX_SIZE/2 + 6} fill="#10b981" textAnchor="middle" fontWeight="bold">B</text>
            </g>

            {/* Block C */}
            <g transform={`translate(${CENTER_X + BOX_SIZE * 0.5 + GAP}, ${CENTER_Y + 100 - BOX_SIZE})`}>
              <rect width={BOX_SIZE} height={BOX_SIZE} fill="rgba(14, 165, 233, 0.2)" stroke="#0ea5e9" strokeWidth={2} rx={8} />
              <text x={BOX_SIZE/2} y={BOX_SIZE/2 + 6} fill="#0ea5e9" textAnchor="middle" fontWeight="bold">C</text>
            </g>

            {/* 学生受力图渲染 */}
            <StudentForceLayer
              studentForces={currentForces}
              originX={
                activeTab === '整体受力图' ? CENTER_X : 
                activeTab === 'B+C部分整体受力图' ? CENTER_X + BOX_SIZE/2 : 
                CENTER_X + BOX_SIZE + GAP
              }
              originY={CENTER_Y + 100 - BOX_SIZE/2}
              scale={1.5}
              colorMap={COLOR_MAP}
            />

            {/* 成功状态指示 */}
            {allPassed && isSubmitted && (
              <g transform={`translate(${CENTER_X}, ${CENTER_Y + 100 - BOX_SIZE - 40})`} opacity={0.8}>
                <text x={0} y={0} fill="#10b981" fontSize={14} fontWeight="bold" textAnchor="middle">受力分析正确</text>
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
              {p05Data.scenario}
            </p>
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
            当前对象：{activeTab.replace('受力图', '')}
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
              {currentForces.map(f => {
                const opt = AVAILABLE_FORCES.find(o => f.id?.startsWith(o.id!) || o.type === f.type && o.sourceObject === f.sourceObject);
                return (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0.45rem 0.7rem', borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: opt?.color || '#fff',
                    }} />
                    <span style={{ flex: 1, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>
                      {opt?.label || f.label}（{f.angle === 270 ? '竖直向下' : f.angle === 0 ? '水平向右' : f.angle === 180 ? '水平向左' : f.angle === 90 ? '竖直向上' : '其他'}）
                    </span>
                    <button
                      onClick={() => handleRemoveForce(f.id)}
                      style={{ color: 'rgba(239,68,68,0.6)', cursor: 'pointer', lineHeight: 1 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={() => setSubmittedMap(prev => ({ ...prev, [activeTab]: true }))}
            disabled={currentForces.length === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '0.7rem', borderRadius: 10,
              border: '1px solid rgba(99,102,241,0.4)',
              background: currentForces.length === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.25)',
              cursor: currentForces.length === 0 ? 'not-allowed' : 'pointer',
              color: currentForces.length === 0 ? 'rgba(255,255,255,0.3)' : '#a5b4fc',
              fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s',
            }}
          >
            <Send size={16} /> 提交判别
          </button>

          {/* 判别结果 */}
          {isSubmitted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                  <Info size={14} /> 判别结果
                </div>
                {!allPassed && (
                  <button
                    onClick={handleRedo}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 8px', borderRadius: 6,
                      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <RotateCcw size={12} /> 重做
                  </button>
                )}
              </div>
              {judgeResults.map((res, idx) => (
                <div key={idx} style={{
                  padding: '0.6rem 0.8rem', borderRadius: 10,
                  border: `1px solid ${res.result.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  background: res.result.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      {res.result.passed ? <CheckCircle2 size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: res.result.passed ? '#6ee7b7' : '#fca5a5', lineHeight: 1.4 }}>
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
                    <CheckCircle2 size={18} /> 此阶段受力分析完全正确！
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

export default P05TripleBlocks;

