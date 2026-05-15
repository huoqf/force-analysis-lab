import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle, Info, Send, RotateCcw, ChevronRight } from 'lucide-react';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import StudentForceLayer from '../components/Scene/StudentForceLayer';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext, JudgeRule } from '../data/types';
import p03Data from '../data/problems/p03.json';

// ─── 物理阶段定义 ─────────────────────────────────────────────────────────────
const STAGES = [
  '最高点临界受力图',
  '最高点过顶受力图',
  '侧点受力图',
  '任意点受力图',
];

// ─── 力的类型定义 ─────────────────────────────────────────────────────────────
interface DirectionOption {
  label: string;
  angle: number;
}

interface ForceConfig {
  type: string;
  label: string;
  color: string;
  directions: DirectionOption[];
  isFake?: boolean;
}

// ─── 力配置：每个力有多个方向候选，学生必须主动选择 ─────────────────────────
const FORCE_CONFIGS: ForceConfig[] = [
  {
    type: 'Gravity',
    label: '重力 G',
    color: '#ef4444',
    directions: [
      { label: '竖直向下', angle: 270 },
    ],
  },
  {
    type: 'Normal',
    label: '支持力 N',
    color: '#60a5fa',
    directions: [
      { label: '竖直向下 (最高点)', angle: 270 },
      { label: '水平向右 (侧点)', angle: 0 },
      { label: '水平向左 (侧点)', angle: 180 },
      { label: '指向圆心 (任意点)', angle: 225 }, // 假设任意点在左上角
    ],
  },
  {
    type: 'FakeForce',
    label: '向心力/离心力',
    color: '#c084fc',
    isFake: true,
    directions: [
      { label: '竖直向下', angle: 270 },
      { label: '水平向右', angle: 0 },
      { label: '指向圆心', angle: 225 },
    ],
  },
];

// ─── SVG 常量 ─────────────────────────────────────────────────────────────────
const CENTER_X = 500;
const CENTER_Y = 320;
const RADIUS = 160;

const P03VerticalCircleTop: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 按阶段存储学生的受力分析
  const [studentForcesMap, setStudentForcesMap] = useState<Record<string, StudentForce[]>>({
    '最高点临界受力图': [],
    '最高点过顶受力图': [],
    '侧点受力图': [],
    '任意点受力图': [],
  });
  
  const [currentStage, setCurrentStage] = useState<string>(STAGES[0]);
  const [showResultsMap, setShowResultsMap] = useState<Record<string, boolean>>({});
  
  // 两步添加力的状态
  const [pendingType, setPendingType] = useState<string | null>(null);

  const clearSubmitted = useCallback(() => {
    setShowResultsMap(prev => ({ ...prev, [currentStage]: false }));
  }, [currentStage]);

  const handleStageChange = (stage: string) => {
    setCurrentStage(stage);
    setPendingType(null);
  };

  // 第一步：选力类型
  const handleSelectType = useCallback((type: string) => {
    const config = FORCE_CONFIGS.find(c => c.type === type);
    if (!config) return;
    
    if (config.directions.length === 1) {
      const dir = config.directions[0];
      clearSubmitted();
      setStudentForcesMap(prev => ({
        ...prev,
        [currentStage]: [
          ...prev[currentStage],
          {
            id: `${type}_${Date.now()}`,
            type: type as any,
            label: config.label.split(' ')[1] || config.label,
            angle: dir.angle,
            targetObject: '小球',
            stage: currentStage,
          }
        ]
      }));
    } else {
      setPendingType(type);
    }
  }, [currentStage, clearSubmitted]);

  // 第二步：选方向
  const handleSelectDirection = useCallback((dir: DirectionOption) => {
    if (!pendingType) return;
    const config = FORCE_CONFIGS.find(c => c.type === pendingType)!;
    clearSubmitted();
    setStudentForcesMap(prev => ({
      ...prev,
      [currentStage]: [
        ...prev[currentStage],
        {
          id: `${pendingType}_${Date.now()}`,
          type: pendingType as any,
          label: config.label.split(' ')[1] || config.label,
          angle: dir.angle,
          targetObject: '小球',
          stage: currentStage,
        }
      ]
    }));
    setPendingType(null);
  }, [pendingType, currentStage, clearSubmitted]);

  const handleRemoveForce = useCallback((id: string) => {
    clearSubmitted();
    setStudentForcesMap(prev => ({
      ...prev,
      [currentStage]: prev[currentStage].filter(f => f.id !== id)
    }));
  }, [currentStage, clearSubmitted]);

  const handleReset = useCallback(() => {
    setStudentForcesMap(prev => ({ ...prev, [currentStage]: [] }));
    setShowResultsMap(prev => ({ ...prev, [currentStage]: false }));
    setPendingType(null);
  }, [currentStage]);

  // ─── 全屏 ──────────────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    const el = containerRef.current as any;
    if (!el) return;
    const isFS = document.fullscreenElement || el.webkitFullscreenElement;
    if (!isFS) {
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el).catch(console.error);
    } else {
      (document.exitFullscreen || (document as any).webkitExitFullscreen)?.call(document);
    }
  };

  useEffect(() => {
    const h = () => setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // ─── 判别 ──────────────────────────────────────────────────────────────────
  const currentForces = studentForcesMap[currentStage];
  
  const judgeResults = useMemo(() => {
    const rules = p03Data.judgeRules.filter(r => r.appliesTo === currentStage);
    const ctx: JudgingContext = {
      expectedTarget: '小球',
      expectedStage: currentStage,
    };
    return rules.map(rule => ({
      rule,
      result: evaluateRule(rule as JudgeRule, currentForces, ctx),
    }));
  }, [currentForces, currentStage]);

  const allPassed = judgeResults.length > 0 && judgeResults.every(r => r.result.passed);
  const isSubmitted = showResultsMap[currentStage];

  // ─── 辅助：已添加的力类型集合（用于置灰） ────────────────────────────────
  const addedTypes = new Set(currentForces.map(f => f.type));
  
  // 排除规则：最高点临界状态不能有弹力 N
  const excludeForceTypes = currentStage === '最高点临界受力图' ? ['Normal'] : [];

  // ─── 已添加力的方向描述 ──────────────────────────────────────────────────
  function dirLabel(f: StudentForce): string {
    const config = FORCE_CONFIGS.find(c => c.type === f.type);
    if (!config) return '';
    const dir = config.directions.find(d => d.angle === f.angle);
    return dir?.label ?? '';
  }

  // ─── 小球位置 ────────────────────────────────────────────────────────────
  let ballX = CENTER_X;
  let ballY = CENTER_Y - RADIUS; // 默认最高点 C
  let ballLabel = 'C';
  
  if (currentStage === '侧点受力图') {
    ballX = CENTER_X + RADIUS; // 右侧点 B (放右侧以避开左侧斜面)
    ballY = CENTER_Y;
    ballLabel = 'B';
  } else if (currentStage === '任意点受力图') {
    // 左上方某点 P (225度)
    ballX = CENTER_X + RADIUS * Math.cos(225 * Math.PI / 180);
    ballY = CENTER_Y + RADIUS * Math.sin(225 * Math.PI / 180);
    ballLabel = 'P';
  }

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', width: '100%', height: '100vh', background: '#0f172a', overflow: 'hidden' }}
      className="text-white"
    >
      {/* ════ 左侧：场景画布 ════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '12px', minWidth: 0 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

        <div className="flex-1 min-h-0 relative bg-slate-900/20 rounded-2xl border border-white/5 overflow-hidden flex justify-center items-center">
          <FreeBodyDiagram width={800} height={600} showGrid={false}>
            {/* 轨道：斜面 + 衔接段 + 圆环 */}
            <g opacity={0.8}>
              {/* 斜面 */}
              <line x1={50} y1={80} x2={250} y2={480} stroke="rgba(255,255,255,0.4)" strokeWidth={4} />
              {/* 水平衔接 */}
              <line x1={250} y1={480} x2={500} y2={480} stroke="rgba(255,255,255,0.4)" strokeWidth={4} />
              {/* 圆形轨道主体 */}
              <circle cx={CENTER_X} cy={CENTER_Y} r={RADIUS} fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
              {/* 轨道外缘装饰 */}
              <circle cx={CENTER_X} cy={CENTER_Y} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
              
              {/* 关键位置标注 */}
              <text x={495} y={498} fill="rgba(255,255,255,0.3)" fontSize={12}>最低点</text>
              <text x={45} y={70} fill="rgba(255,255,255,0.3)" fontSize={12}>释放点</text>
            </g>

            {/* 物体 */}
            <circle cx={ballX} cy={ballY} r={20} fill="#f43f5e" stroke="#fb7185" strokeWidth={2} />
            <text x={ballX - 6} y={ballY - 30} fill="white" fontSize={18} fontWeight="bold">{ballLabel}</text>

            {/* 学生受力层 */}
            <StudentForceLayer
              studentForces={currentForces}
              originX={ballX}
              originY={ballY}
              scale={1.2}
            />
          </FreeBodyDiagram>
        </div>
      </div>

      {/* ════ 右侧：交互面板 ════ */}
      <aside style={{
        width: '360px', flexShrink: 0, background: 'rgba(15,23,42,0.95)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* 题目情境 */}
          <details style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
              📋 题目情境
            </summary>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              {p03Data.scenario}
            </p>
            <div style={{ fontSize: '12px', color: 'rgba(59,130,246,0.8)', marginTop: '8px', padding: '6px', background: 'rgba(59,130,246,0.1)', borderRadius: '6px' }}>
              提示：用机械能守恒判断是否到达最高点，再用圆周运动方程分析关键点受力。
            </div>
          </details>

          {/* 阶段切换 Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {STAGES.map(stage => (
              <button
                key={stage}
                onClick={() => handleStageChange(stage)}
                style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  textAlign: 'left', transition: 'all 0.15s', border: '1px solid transparent',
                  background: currentStage === stage ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                  color: currentStage === stage ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                  borderColor: currentStage === stage ? 'rgba(59,130,246,0.3)' : 'transparent',
                }}
              >
                {stage}
              </button>
            ))}
          </div>

          {/* ── 添加力：两步选择器 ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', fontWeight: 600, letterSpacing: '0.05em' }}>
              {pendingType ? '② 选择方向' : '① 添加力'}
            </div>

            {/* 第一步：力类型选择 */}
            {!pendingType && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {FORCE_CONFIGS.map(config => {
                  const added = addedTypes.has(config.type);
                  const isExcluded = excludeForceTypes.includes(config.type);
                  
                  if (isExcluded) return null;
                  
                  return (
                    <button
                      key={config.type}
                      onClick={() => !added && handleSelectType(config.type)}
                      disabled={added}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: added ? 'not-allowed' : 'pointer',
                        background: added ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                        opacity: added ? 0.4 : 1, transition: 'background 0.15s',
                        width: '100%', textAlign: 'left',
                      }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: config.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: 'white', flex: 1 }}>{config.label}</span>
                      {config.directions.length > 1 && !added && (
                        <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
                      )}
                      {added && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>已添加</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 第二步：方向选择 */}
            {pendingType && (() => {
              const config = FORCE_CONFIGS.find(c => c.type === pendingType)!;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                    为 <span style={{ color: config.color, fontWeight: 600 }}>{config.label}</span> 选择方向：
                  </div>
                  {config.directions.map((dir, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectDirection(dir)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer', background: 'rgba(255,255,255,0.06)',
                        width: '100%', textAlign: 'left', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: config.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: 'white' }}>{dir.label}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setPendingType(null)}
                    style={{
                      marginTop: '2px', padding: '6px', fontSize: '12px',
                      color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    ← 返回
                  </button>
                </div>
              );
            })()}
          </div>

          {/* 已添加力列表 */}
          {currentForces.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 600 }}>
                已添加的力
              </div>
              {currentForces.map(f => (
                <div key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: FORCE_CONFIGS.find(c => c.type === f.type)?.color || '#fff', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', flex: 1 }}>
                    {FORCE_CONFIGS.find(c => c.type === f.type)?.label}
                    <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: '6px' }}>
                      {dirLabel(f)}
                    </span>
                  </span>
                  <button
                    onClick={() => handleRemoveForce(f.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '2px' }}
                    className="hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={() => setShowResultsMap(prev => ({ ...prev, [currentStage]: true }))}
            disabled={currentForces.length === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', borderRadius: '10px', border: 'none', cursor: currentForces.length === 0 ? 'not-allowed' : 'pointer',
              background: currentForces.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.8)',
              color: currentForces.length === 0 ? 'rgba(255,255,255,0.3)' : 'white',
              fontSize: '14px', fontWeight: 600, transition: 'background 0.15s',
            }}
          >
            <Send size={16} />
            提交判别
          </button>

          {/* 判别结果 */}
          {isSubmitted && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', fontWeight: 600 }}>
                <Info size={14} /> 判别结果 ({currentStage})
              </div>
              {judgeResults.map((res, idx) => (
                <div key={idx} style={{
                  marginBottom: '8px', padding: '8px',
                  background: res.result.passed ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
                  borderRadius: '6px', border: `1px solid ${res.result.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    {res.result.passed
                      ? <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />
                      : <XCircle     size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />}
                    <span style={{ fontSize: '12px', color: res.result.passed ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.6)' }}>
                      {res.rule.expect}
                    </span>
                  </div>
                  {!res.result.passed && res.result.hint && (
                    <div style={{ fontSize: '11px', color: 'rgba(251,191,36,0.8)', marginTop: '5px', paddingLeft: '23px', lineHeight: 1.5 }}>
                      💡 {res.result.hint}
                    </div>
                  )}
                </div>
              ))}
              {allPassed ? (
                <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(16,185,129,0.12)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 600, fontSize: '13px', margin: '0 0 10px 0' }}>
                    <CheckCircle2 size={16} /> 受力分析全部正确！
                  </p>
                  <button
                    onClick={handleReset}
                    className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} /> 再做一遍
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleReset}
                  className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-white/10"
                >
                  <RotateCcw size={14} /> 重做本图
                </button>
              )}
            </div>
          )}

        </div>
      </aside>
    </div>
  );
};

export default P03VerticalCircleTop;
