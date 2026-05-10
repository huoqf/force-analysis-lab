import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle, Info, Send } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import AddForcePanel, { ForceOption } from '../components/Control/AddForcePanel';
import StudentForceLayer from '../components/Scene/StudentForceLayer';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext, JudgeRule } from '../data/types';
import p01Data from '../data/problems/p01.json';

// ─── 力类型配置 ─────────────────────────────────────────────
const AVAILABLE_FORCES: ForceOption[] = [
  {
    type: 'Gravity',
    label: '总重力 G',
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
    directions: [{ label: '竖直向上', angle: 90 }],
  },
  {
    type: 'Applied',
    label: '外部恒定推力 F',
    symbol: 'F',
    color: '#fbbf24',
    uniquePerStage: true,
    directions: [{ label: '水平向右', angle: 0 }],
  },
  {
    type: 'Applied',
    label: '飞船对空间站的作用力',
    symbol: 'F_引',
    color: '#ec4899',
    uniquePerStage: true,
    directions: [{ label: '水平向右', angle: 0 }],
  },
];

const COLOR_MAP = {
  Gravity: '#ef4444',
  Normal: '#60a5fa',
  Applied: '#fbbf24',
};

const STAGES = ['整体受力图', '空间站受力图'] as const;
type Stage = typeof STAGES[number];

const P01SpacecraftDocking: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Stage>('整体受力图');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 每阶段独立状态
  const [forcesMap, setForcesMap] = useState<Record<Stage, StudentForce[]>>({
    '整体受力图': [],
    '空间站受力图': [],
  });
  const [submittedMap, setSubmittedMap] = useState<Record<Stage, boolean>>({
    '整体受力图': false,
    '空间站受力图': false,
  });

  const currentForces = forcesMap[activeTab];
  const isSubmitted = submittedMap[activeTab];

  const clearSubmitted = useCallback(() => {
    setSubmittedMap(prev => ({ ...prev, [activeTab]: false }));
  }, [activeTab]);

  // 添加力
  const handleAddForce = useCallback((partial: Omit<StudentForce, 'id' | 'targetObject' | 'stage'>) => {
    clearSubmitted();
    
    // 特殊逻辑：如果是作用力 F_引，手动设置 sourceObject 和 targetObject
    let sourceObject = undefined;
    let targetObject = activeTab === '整体受力图' ? '整体' : '空间站';
    
    if (partial.label === 'F_引') {
      sourceObject = '飞船';
      targetObject = '空间站';
    }

    setForcesMap(prev => ({
      ...prev,
      [activeTab]: [
        ...prev[activeTab],
        {
          ...partial,
          id: `${partial.type}_${Date.now()}`,
          targetObject,
          sourceObject,
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

  // 判别逻辑
  const judgeResults = useMemo(() => {
    const rules = (p01Data.judgeRules as JudgeRule[]).filter(r => r.appliesTo === activeTab);
    const ctx: JudgingContext = { expectedTarget: activeTab, expectedStage: activeTab };
    return rules.map(rule => ({
      rule,
      result: evaluateRule(rule, currentForces, ctx)
    }));
  }, [activeTab, currentForces]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // SVG 常量
  const CENTER_X = 400;
  const CENTER_Y = 300;
  const SHIP_W = 120;
  const SHIP_H = 80;
  const STATION_W = 180;
  const STATION_H = 120;

  // 力箭头原点：整体图在对接面中心，隔离图在空间站中心
  const originX = activeTab === '整体受力图' ? CENTER_X - STATION_W/2 : CENTER_X;
  const originY = CENTER_Y + 100 - STATION_H/2;

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
      <div style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '0.75rem', minHeight: 0 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-xl font-bold">{p01Data.title}</h2>
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
        <div className="flex gap-2 z-10">
          {STAGES.map((stage) => {
            const isActive = activeTab === stage;
            return (
              <button
                key={stage}
                onClick={() => setActiveTab(stage)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
              >
                {stage.replace('受力图', '')}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-h-0 relative flex justify-center items-center">
          <FreeBodyDiagram width={800} height={600} showGrid={false}>
            {/* 地面/轨道线 */}
            <line x1={50} y1={CENTER_Y + 100} x2={750} y2={CENTER_Y + 100} stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeDasharray="5 5" />
            
            {/* 飞船 (左) */}
            <g transform={`translate(${CENTER_X - SHIP_W/2 - STATION_W/2}, ${CENTER_Y + 100 - SHIP_H})`} opacity={activeTab === '整体受力图' ? 1 : 0.2}>
              <rect width={SHIP_W} height={SHIP_H} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth={2} rx={4} />
              <text x={SHIP_W/2} y={SHIP_H/2 + 5} fill="#3b82f6" textAnchor="middle" fontWeight="bold">飞船 (m)</text>
            </g>

            {/* 对接面 */}
            <line x1={CENTER_X - STATION_W/2} y1={CENTER_Y + 100 - STATION_H} x2={CENTER_X - STATION_W/2} y2={CENTER_Y + 100} stroke="#94a3b8" strokeWidth={4} strokeDasharray="2 2" opacity={activeTab === '整体受力图' ? 1 : 0.3} />

            {/* 空间站 (右) */}
            <g transform={`translate(${CENTER_X - STATION_W/2}, ${CENTER_Y + 100 - STATION_H})`}>
              <rect width={STATION_W} height={STATION_H} fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth={2} rx={4} />
              <text x={STATION_W/2} y={STATION_H/2 + 5} fill="#a855f7" textAnchor="middle" fontWeight="bold">空间站 (M)</text>
            </g>

            {/* 学生力层 */}
            <StudentForceLayer 
              studentForces={currentForces} 
              originX={originX} 
              originY={originY} 
              scale={1.5}
              colorMap={{
                ...COLOR_MAP,
                Applied: (f: any) => f.label === 'F_引' ? '#ec4899' : '#fbbf24'
              } as any}
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
              {p01Data.scenario}
            </p>
          </details>

          <div style={{
            padding: '0.5rem 0.75rem',
            borderRadius: 8,
            background: activeTab === '整体受力图' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)',
            border: `1px solid ${activeTab === '整体受力图' ? 'rgba(59,130,246,0.3)' : 'rgba(168,85,247,0.3)'}`,
            fontSize: '0.82rem',
            color: activeTab === '整体受力图' ? '#93c5fd' : '#d8b4fe',
            fontWeight: 600,
          }}>
            研究对象：{activeTab.replace('受力图', '')}
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl space-y-1">
            <h4 className="text-blue-300 text-xs font-bold flex items-center gap-2">
              <Info size={14} /> 提示
            </h4>
            <p className="text-[0.7rem] text-slate-400 leading-relaxed">
              {activeTab === '整体受力图' 
                ? '整体法中系统内部相互作用力不作为外力列入。' 
                : '仅以空间站为研究对象时，飞船对它的推力是改变其运动状态的外力。'}
            </p>
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
                    background: f.label === 'F_引' ? '#ec4899' : (AVAILABLE_FORCES.find(opt => opt.symbol === f.label)?.color || '#fff'),
                  }} />
                  <span style={{ flex: 1, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>
                    {AVAILABLE_FORCES.find(opt => opt.symbol === f.label)?.label}
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
                    <CheckCircle2 size={18} /> {activeTab.replace('受力图', '')}分析正确！
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

export default P01SpacecraftDocking;

