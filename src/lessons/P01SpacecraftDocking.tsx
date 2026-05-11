import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle,
  Info, Send, ChevronRight, RotateCcw, Plus,
} from 'lucide-react';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import StudentForceLayer from '../components/Scene/StudentForceLayer';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, ForceType, JudgingContext, JudgeRule } from '../data/types';
import p01Data from '../data/problems/p01.json';

// ─── 阶段定义 ────────────────────────────────────────────────────────────────
const STAGES = ['整体受力图', '空间站受力图'] as const;
type Stage = typeof STAGES[number];

// ─── 力的方向 / 力类型配置 ───────────────────────────────────────────────────
interface DirectionOption {
  label: string;
  angle: number;
  isAlongSurface?: boolean;
  isPerpendicular?: boolean;
  directionSense?: 1 | -1;
}

interface ForceConfig {
  key: string;
  type: ForceType;
  label: string;
  symbol: string;
  color: string;
  sourceObject?: string;
  targetObject?: string;
  directions: DirectionOption[];
  isDistractor?: boolean;
}

/** 整体受力图阶段的力候选 */
const FORCES_WHOLE: ForceConfig[] = [
  {
    key: 'applied-F',
    type: 'Applied',
    label: '外部恒定推力 F',
    symbol: 'F',
    color: '#fbbf24',
    directions: [
      { label: '水平向右（沿轨道前进方向）', angle: 0 },
      { label: '水平向左', angle: 180 },
      { label: '竖直向上', angle: 90 },
    ],
  },
  {
    key: 'gravity-fake',
    type: 'Gravity',
    label: '重力 G',
    symbol: 'G',
    color: '#ef4444',
    isDistractor: true,
    directions: [{ label: '竖直向下', angle: 270 }],
  },
  {
    key: 'normal-fake',
    type: 'Normal',
    label: '支持力 N',
    symbol: 'N',
    color: '#60a5fa',
    isDistractor: true,
    directions: [{ label: '竖直向上', angle: 90 }],
  },
  {
    key: 'friction-fake',
    type: 'Friction',
    label: '摩擦力 / 空气阻力 f',
    symbol: 'f',
    color: '#f87171',
    isDistractor: true,
    directions: [{ label: '水平向左', angle: 180 }],
  },
  {
    key: 'fake-centripetal',
    type: 'FakeForce',
    label: '向心力 F 向心 ⚠ 效果力',
    symbol: '向心力',
    color: '#a78bfa',
    isDistractor: true,
    directions: [{ label: '指向轨道圆心', angle: 270 }],
  },
];

/** 空间站受力图阶段的力候选 */
const FORCES_STATION: ForceConfig[] = [
  {
    key: 'applied-fromship',
    type: 'Applied',
    label: '飞船对空间站的作用力 F′',
    symbol: "F'",
    color: '#ec4899',
    sourceObject: '飞船',
    targetObject: '空间站',
    directions: [
      { label: '水平向右（推动空间站前进）', angle: 0 },
      { label: '水平向左（拉回飞船）', angle: 180 },
    ],
  },
  {
    key: 'applied-external-F',
    type: 'Applied',
    label: '外部恒定推力 F（直接作用在空间站）',
    symbol: 'F',
    color: '#fbbf24',
    sourceObject: '外部',
    targetObject: '空间站',
    isDistractor: true,
    directions: [{ label: '水平向右', angle: 0 }],
  },
  {
    key: 'gravity-fake',
    type: 'Gravity',
    label: '重力 G',
    symbol: 'G',
    color: '#ef4444',
    isDistractor: true,
    directions: [{ label: '竖直向下', angle: 270 }],
  },
  {
    key: 'normal-fake',
    type: 'Normal',
    label: '支持力 N',
    symbol: 'N',
    color: '#60a5fa',
    isDistractor: true,
    directions: [{ label: '竖直向上', angle: 90 }],
  },
  {
    key: 'friction-fake',
    type: 'Friction',
    label: '摩擦力 / 空气阻力 f',
    symbol: 'f',
    color: '#f87171',
    isDistractor: true,
    directions: [{ label: '水平向左', angle: 180 }],
  },
  {
    key: 'fake-centripetal',
    type: 'FakeForce',
    label: '向心力 F 向心 ⚠ 效果力',
    symbol: '向心力',
    color: '#a78bfa',
    isDistractor: true,
    directions: [{ label: '指向轨道圆心', angle: 270 }],
  },
];

const FORCES_BY_STAGE: Record<Stage, ForceConfig[]> = {
  '整体受力图': FORCES_WHOLE,
  '空间站受力图': FORCES_STATION,
};

// ─── SVG 常量 ────────────────────────────────────────────────────────────────
const CANVAS_W = 800;
const CANVAS_H = 600;
const CENTER_Y = 320;
const SHIP_W = 110;
const SHIP_H = 70;
const STATION_W = 180;
const STATION_H = 110;
const SHIP_X = 240;
const STATION_X = SHIP_X + SHIP_W + 6;

// ─── 组件 ────────────────────────────────────────────────────────────────────
const P01SpacecraftDocking: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Stage>('整体受力图');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [forcesMap, setForcesMap] = useState<Record<Stage, StudentForce[]>>({
    '整体受力图': [],
    '空间站受力图': [],
  });
  const [submittedMap, setSubmittedMap] = useState<Record<Stage, boolean>>({
    '整体受力图': false,
    '空间站受力图': false,
  });

  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const currentForces = forcesMap[activeTab];
  const isSubmitted = submittedMap[activeTab];
  const forceConfigs = FORCES_BY_STAGE[activeTab];

  const clearSubmitted = useCallback(() => {
    setSubmittedMap(prev => ({ ...prev, [activeTab]: false }));
  }, [activeTab]);

  useEffect(() => {
    setPendingKey(null);
  }, [activeTab]);

  const addForceWithDirection = useCallback(
    (config: ForceConfig, dir: DirectionOption) => {
      clearSubmitted();
      const targetObject = config.targetObject ?? (activeTab === '整体受力图' ? '整体' : '空间站');
      const newForce: StudentForce = {
        id: `__`,
        type: config.type,
        label: config.symbol,
        targetObject,
        sourceObject: config.sourceObject,
        stage: activeTab,
        angle: dir.angle,
        isAlongSurface: dir.isAlongSurface,
        isPerpendicular: dir.isPerpendicular,
        directionSense: dir.directionSense,
      };
      setForcesMap(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], newForce],
      }));
    },
    [activeTab, clearSubmitted]
  );

  const handleSelectType = useCallback(
    (key: string) => {
      const config = forceConfigs.find(c => c.key === key);
      if (!config) return;
      if (config.directions.length === 1) {
        addForceWithDirection(config, config.directions[0]);
      } else {
        setPendingKey(key);
      }
    },
    [forceConfigs, addForceWithDirection]
  );

  const handleSelectDirection = useCallback(
    (dir: DirectionOption) => {
      if (!pendingKey) return;
      const config = forceConfigs.find(c => c.key === pendingKey);
      if (!config) return;
      addForceWithDirection(config, dir);
      setPendingKey(null);
    },
    [pendingKey, forceConfigs, addForceWithDirection]
  );

  const handleRemoveForce = useCallback(
    (id: string) => {
      clearSubmitted();
      setForcesMap(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(f => f.id !== id),
      }));
    },
    [activeTab, clearSubmitted]
  );

  const handleReset = useCallback(() => {
    setForcesMap(prev => ({ ...prev, [activeTab]: [] }));
    setSubmittedMap(prev => ({ ...prev, [activeTab]: false }));
    setPendingKey(null);
  }, [activeTab]);

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

  const judgeResults = useMemo(() => {
    const rules = (p01Data.judgeRules as JudgeRule[]).filter(r => r.appliesTo === activeTab);
    const ctx: JudgingContext = {
      expectedTarget: activeTab,
      expectedStage: activeTab,
    };
    return rules.map(rule => ({
      rule,
      result: evaluateRule(rule, currentForces, ctx),
    }));
  }, [activeTab, currentForces]);

  const allPassed = judgeResults.length > 0 && judgeResults.every(r => r.result.passed);

  const addedKeys = useMemo(() => {
    return new Set(currentForces.map(f => `${f.type}|${f.label}`));
  }, [currentForces]);

  const isConfigAdded = (config: ForceConfig) => addedKeys.has(`${config.type}|${config.symbol}`);

  const dirLabel = (f: StudentForce): string => {
    const config = forceConfigs.find(c => c.type === f.type && c.symbol === f.label);
    if (!config) return `${f.angle}°`;
    const dir = config.directions.find(d => d.angle === f.angle);
    return dir?.label ?? `${f.angle}°`;
  };

  const originX = activeTab === '整体受力图'
    ? (SHIP_X + STATION_X + STATION_W) / 2
    : STATION_X + STATION_W / 2;
  const originY = CENTER_Y;

  const colorMap: Record<string, string> = {
    Gravity: '#ef4444',
    Normal: '#60a5fa',
    Applied: '#fbbf24',
    Friction: '#f87171',
    FakeForce: '#a78bfa',
  };

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', height: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      className="text-white"
    >
      {/* ════ 左侧：场景画布 ════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onBack} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ChevronLeft size={16} /> 返回
            </button>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{p01Data.title}</h2>
          </div>
          <button onClick={toggleFullscreen} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />} {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </div>

        {/* Tab 切换 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {STAGES.map(stage => {
            const isActive = activeTab === stage;
            return (
              <button
                key={stage}
                onClick={() => setActiveTab(stage)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {stage.replace('受力图', '')}
              </button>
            );
          })}
        </div>

        {/* SVG 画布 */}
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden' }}>
          <FreeBodyDiagram width={CANVAS_W} height={CANVAS_H} showGrid>
            {/* 轨道虚线 */}
            <line x1={40} y1={CENTER_Y + 90} x2={CANVAS_W - 40} y2={CENTER_Y + 90} stroke="rgba(255,255,255,0.15)" strokeDasharray="6 6" />

            {/* 飞船 */}
            <rect x={SHIP_X} y={CENTER_Y - SHIP_H / 2} width={SHIP_W} height={SHIP_H} rx={10}
              fill={activeTab === '整体受力图' ? 'rgba(96,165,250,0.4)' : 'rgba(96,165,250,0.15)'}
              stroke="rgba(147,197,253,0.7)" strokeWidth={2}
              strokeDasharray={activeTab === '空间站受力图' ? '4 4' : 'none'}
            />
            <text x={SHIP_X + SHIP_W / 2} y={CENTER_Y + 5} textAnchor="middle" fill="white" fontSize={13} fontWeight={600}>飞船 m</text>

            {/* 对接面 */}
            <line x1={STATION_X - 3} y1={CENTER_Y - 35} x2={STATION_X - 3} y2={CENTER_Y + 35} stroke="#fde047" strokeWidth={2} />

            {/* 空间站 */}
            <rect x={STATION_X} y={CENTER_Y - STATION_H / 2} width={STATION_W} height={STATION_H} rx={12}
              fill="rgba(248,113,113,0.3)" stroke="rgba(252,165,165,0.8)" strokeWidth={2}
            />
            <text x={STATION_X + STATION_W / 2} y={CENTER_Y + 5} textAnchor="middle" fill="white" fontSize={13} fontWeight={600}>空间站 M</text>

            {/* "整体" 虚线框 */}
            {activeTab === '整体受力图' && (
              <rect
                x={SHIP_X - 10}
                y={CENTER_Y - STATION_H / 2 - 10}
                width={SHIP_W + STATION_W + 26}
                height={STATION_H + 20}
                rx={14}
                fill="none"
                stroke="rgba(165,180,252,0.6)"
                strokeWidth={2}
                strokeDasharray="8 6"
              />
            )}

            {/* 学生力箭头 */}
            <StudentForceLayer
              studentForces={currentForces}
              originX={originX}
              originY={originY}
              colorMap={colorMap as any}
              scale={1.0}
            />
          </FreeBodyDiagram>
        </div>
      </div>

      {/* ════ 右侧：交互面板 ════ */}
      <div style={{ width: '380px', background: 'rgba(30,41,59,0.8)', padding: '20px', overflowY: 'auto', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
        {/* 题目情境 */}
        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#93c5fd' }}>
            📋 题目情境
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.6, margin: 0, color: '#e2e8f0' }}>{p01Data.scenario}</p>
        </div>

        {/* 当前研究对象 */}
        <div style={{ marginBottom: '16px', padding: '10px 12px', background: 'rgba(59,130,246,0.15)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)' }}>
          研究对象：<span style={{ fontWeight: 600, color: '#60a5fa' }}>{activeTab.replace('受力图', '')}</span>
        </div>

        {/* 提示 */}
        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', gap: '10px' }}>
          <Info size={14} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#93c5fd' }}>提示</div>
            <div style={{ fontSize: '12px', lineHeight: 1.5, color: '#cbd5e1' }}>
              {activeTab === '整体受力图'
                ? '整体法中系统内部相互作用力不作为外力列入。'
                : '仅以空间站为研究对象时，飞船对它的推力是改变其运动状态的外力。'}
            </div>
          </div>
        </div>

        {/* ── 添加力：两步选择器 ── */}
        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} />
            {pendingKey ? '② 选择方向' : '① 添加一个力'}
          </div>

          {/* 第一步：选力类型 */}
          {!pendingKey && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {forceConfigs.map(config => {
                const added = isConfigAdded(config);
                return (
                  <button
                    key={config.key}
                    onClick={() => !added && handleSelectType(config.key)}
                    disabled={added}
                    style={{
                      padding: '12px',
                      background: added ? 'rgba(255,255,255,0.05)' : config.isDistractor ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.08)',
                      border: `1px solid ${added ? 'rgba(255,255,255,0.1)' : config.isDistractor ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.15)'}`,
                      borderRadius: '8px',
                      color: added ? '#64748b' : 'white',
                      cursor: added ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                      opacity: added ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!added) {
                        (e.currentTarget as HTMLButtonElement).style.background = config.isDistractor ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!added) {
                        (e.currentTarget as HTMLButtonElement).style.background = config.isDistractor ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.08)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{config.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {config.directions.length > 1 && !added && (
                        <ChevronRight size={14} style={{ color: '#94a3b8' }} />
                      )}
                      {added && (
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>已添加</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 第二步：选方向 */}
          {pendingKey && (() => {
            const config = forceConfigs.find(c => c.key === pendingKey)!;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>
                  为 <span style={{ fontWeight: 600, color: '#60a5fa' }}>{config.label}</span> 选择方向：
                </div>
                {config.directions.map((dir, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectDirection(dir)}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{dir.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => setPendingKey(null)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginTop: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  }}
                >
                  ← 返回上一步
                </button>
              </div>
            );
          })()}
        </div>

        {/* 已添加力 */}
        {currentForces.length > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#93c5fd' }}>
              已添加的力
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {currentForces.map(f => {
                const cfg = forceConfigs.find(c => c.type === f.type && c.symbol === f.label);
                return (
                  <div
                    key={f.id}
                    style={{
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg?.color || '#94a3b8', display: 'inline-block' }} />
                      <span style={{ color: '#e2e8f0' }}>{cfg?.label ?? f.label}</span>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>· {dirLabel(f)}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveForce(f.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.2s',
                      }}
                      className="hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          onClick={() => setSubmittedMap(prev => ({ ...prev, [activeTab]: true }))}
          disabled={currentForces.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            background: currentForces.length === 0 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: '8px',
            color: currentForces.length === 0 ? '#64748b' : 'white',
            fontWeight: 600,
            fontSize: '14px',
            cursor: currentForces.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (currentForces.length > 0) {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (currentForces.length > 0) {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }
          }}
        >
          <Send size={14} /> 提交判别
        </button>

        {/* 判别结果 */}
        {isSubmitted && (
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#93c5fd' }}>判别结果</div>
            {judgeResults.map((res, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px',
                  background: res.result.passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${res.result.passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  borderRadius: '6px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {res.result.passed
                    ? <CheckCircle2 size={14} style={{ color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
                    : <XCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />}
                  <span style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>
                    {res.rule.expect}
                  </span>
                </div>
                {!res.result.passed && res.result.hint && (
                  <div style={{ marginTop: '6px', paddingLeft: '22px', fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
                    💡 {res.result.hint}
                  </div>
                )}
              </div>
            ))}
            {allPassed ? (
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(34,197,94,0.15)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e' }}>
                  ✅ {activeTab.replace('受力图', '')}分析全部正确！
                </span>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(34,197,94,0.2)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: '4px',
                    color: '#22c55e',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.2)';
                  }}
                >
                  <RotateCcw size={12} /> 再做一遍
                </button>
              </div>
            ) : (
              <button
                onClick={handleReset}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '12px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                }}
              >
                <RotateCcw size={12} /> 重做本图
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default P01SpacecraftDocking;
