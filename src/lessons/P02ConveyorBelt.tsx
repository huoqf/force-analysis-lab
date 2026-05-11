import React, { useState, useMemo, useRef, useEffect, useCallback, useId } from 'react';
import {
  ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle,
  Info, Plus, ChevronRight, RotateCcw, Send,
} from 'lucide-react';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, ForceType, JudgingContext, JudgeRule } from '../data/types';
import p02Data from '../data/problems/p02.json';

// ─── 阶段定义 ────────────────────────────────────────────────────────────────
const STAGES = ['物体受力图 (加速阶段)', '物体受力图 (平衡阶段)'] as const;
type Stage = typeof STAGES[number];

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
  directions: DirectionOption[];
  isDistractor?: boolean;
}

// ─── 力候选配置 ──────────────────────────────────────────────────────────────
const FORCE_CONFIGS: ForceConfig[] = [
  {
    key: 'gravity', type: 'Gravity', label: '重力 G', symbol: 'G', color: '#ef4444',
    directions: [{ label: '竖直向下', angle: 270 }],
  },
  {
    key: 'normal', type: 'Normal', label: '支持力 N', symbol: 'N', color: '#60a5fa',
    directions: [{ label: '竖直向上', angle: 90 }],
  },
  {
    key: 'friction', type: 'Friction', label: '摩擦力 f', symbol: 'f', color: '#f87171',
    directions: [
      { label: '水平向右（随传送带运动）', angle: 0, directionSense: 1 },
      { label: '水平向左（阻碍运动）', angle: 180, directionSense: -1 },
    ],
  },
  {
    key: 'applied-fake', type: 'Applied', label: '外部推力 F', symbol: 'F',
    color: '#fbbf24', isDistractor: true,
    directions: [
      { label: '水平向右', angle: 0 },
      { label: '水平向左', angle: 180 },
    ],
  },
];

// ─── SVG 常量 ────────────────────────────────────────────────────────────────
const CANVAS_W = 900;
const CANVAS_H = 620;
const CENTER_X = 450;
const CENTER_Y = 310;
const BELT_Y = CENTER_Y + 100;    // 410
const OBJ_X = CENTER_X - 40;     // 410
const OBJ_Y = BELT_Y - 30 - 60;  // 320
const OBJ_W = 80;
const OBJ_H = 60;
const OBJ_CX = OBJ_X + OBJ_W / 2; // 450，物体中心 x
const OBJ_CY = OBJ_Y + OBJ_H / 2; // 350，物体中心 y

// 引擎角（数学坐标系：0右/90上/180左/270下）
// → SVG ForceArrow angle（屏幕坐标系：0右/90下/180左/270上）
function engineToSvg(engineAngle: number): number {
  return (360 - engineAngle) % 360;
}

// 力的去重 key：同一 type 只允许出现一次（不论方向）
// 摩擦力、Applied 选了一个方向后整个 type 都禁用，防止重复添加
function forceTypeKey(type: string): string {
  return 'type:' + type;
}

// ─── 唯一 id 生成（避免模板字符串变量被过滤） ─────────────────────────────
let _counter = 0;
function genId(type: string): string {
  _counter += 1;
  return 'force-' + type + '-' + String(_counter) + '-' + String(Date.now());
}

// ─── 组件 ────────────────────────────────────────────────────────────────────
const P02ConveyorBelt: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const uid = useId();
  const safeUid = uid.replace(/:/g, '');

  const [activeTab, setActiveTab] = useState<Stage>('物体受力图 (加速阶段)');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── 传送带动画 ──────────────────────────────────────────────────────────────
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let rafId: number;
    const tick = () => { setOffset(prev => (prev + 2) % 40); rafId = requestAnimationFrame(tick); };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── 全屏 ────────────────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    const el = containerRef.current as any;
    if (!el) return;
    const isFS = document.fullscreenElement || el.webkitFullscreenElement;
    if (!isFS) (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el).catch(console.error);
    else (document.exitFullscreen || (document as any).webkitExitFullscreen)?.call(document);
  };
  useEffect(() => {
    const h = () => setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // ── 受力 & 提交状态（按阶段独立） ──────────────────────────────────────────
  const [forcesMap, setForcesMap] = useState<Record<Stage, StudentForce[]>>({
    '物体受力图 (加速阶段)': [],
    '物体受力图 (平衡阶段)': [],
  });
  const [submittedMap, setSubmittedMap] = useState<Record<Stage, boolean>>({
    '物体受力图 (加速阶段)': false,
    '物体受力图 (平衡阶段)': false,
  });
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const currentForces = forcesMap[activeTab];
  const isSubmitted   = submittedMap[activeTab]; // ← 正确读取当前阶段提交状态

  // 切换阶段时关闭方向选择器
  useEffect(() => { setPendingKey(null); }, [activeTab]);

  // ── 添加力前先清除提交状态 ──────────────────────────────────────────────────
  const clearSubmitted = useCallback(() => {
    setSubmittedMap(prev => ({ ...prev, [activeTab]: false }));
  }, [activeTab]);

  const addForceWithDirection = useCallback((config: ForceConfig, dir: DirectionOption) => {
    clearSubmitted();
    const newForce: StudentForce = {
      id: genId(config.type),   // 真实唯一 id
      type: config.type,
      label: config.symbol,
      stage: activeTab,
      angle: dir.angle,
      isAlongSurface: dir.isAlongSurface,
      isPerpendicular: dir.isPerpendicular,
      directionSense: dir.directionSense,
    };
    setForcesMap(prev => ({ ...prev, [activeTab]: [...prev[activeTab], newForce] }));
  }, [activeTab, clearSubmitted]);

  const handleSelectType = useCallback((key: string) => {
    const config = FORCE_CONFIGS.find(c => c.key === key);
    if (!config) return;
    // 单方向直接添加，多方向进入第二步
    if (config.directions.length === 1) {
      addForceWithDirection(config, config.directions[0]);
    } else {
      setPendingKey(key);
    }
  }, [addForceWithDirection]);

  const handleSelectDirection = useCallback((dir: DirectionOption) => {
    if (!pendingKey) return;
    const config = FORCE_CONFIGS.find(c => c.key === pendingKey);
    if (!config) return;
    addForceWithDirection(config, dir);
    setPendingKey(null);
  }, [pendingKey, addForceWithDirection]);

  const handleRemoveForce = useCallback((id: string) => {
    clearSubmitted();
    setForcesMap(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(f => f.id !== id) }));
  }, [activeTab, clearSubmitted]);

  // 重做：清空当前阶段 + 收起判别结果
  const handleRedo = useCallback(() => {
    setForcesMap(prev => ({ ...prev, [activeTab]: [] }));
    setSubmittedMap(prev => ({ ...prev, [activeTab]: false }));
    setPendingKey(null);
  }, [activeTab]);

  // ── 判别引擎 ────────────────────────────────────────────────────────────────
  const judgeResults = useMemo(() => {
    const rules = (p02Data.judgeRules as JudgeRule[]).filter(r => r.appliesTo === activeTab);
    const ctx: JudgingContext = { expectedTarget: activeTab, expectedStage: activeTab };
    return rules.map(rule => ({ rule, result: evaluateRule(rule, currentForces, ctx) }));
  }, [activeTab, currentForces]);

  const allPassed = judgeResults.length > 0 && judgeResults.every(r => r.result.passed);
  // 有任意一条未通过 → 显示重做按钮
  const hasFailed  = isSubmitted && judgeResults.some(r => !r.result.passed);

  // ── 去重判断：同一 type 只允许添加一次 ─────────────────────────────────────
  // 用 type 本身作 key，不区分方向——摩擦力选了向右就不能再选向左
  const addedTypes = useMemo(
    () => new Set(currentForces.map(f => f.type as string)),
    [currentForces]
  );
  const isConfigAdded = (config: ForceConfig): boolean => addedTypes.has(config.type);

  // ── 力方向标签 ──────────────────────────────────────────────────────────────
  const dirLabel = (f: StudentForce): string => {
    const config = FORCE_CONFIGS.find(c => c.type === f.type);
    if (!config) return String(f.angle) + '°';
    const dir = config.directions.find(d => d.angle === f.angle);
    return dir ? dir.label : String(f.angle) + '°';
  };

  // ── 颜色映射 ────────────────────────────────────────────────────────────────
  const colorMap: Record<string, string> = {
    Gravity: '#ef4444', Normal: '#60a5fa',
    Applied: '#fbbf24', Friction: '#f87171', FakeForce: '#a78bfa',
  };

  // ── SVG 力箭头（按 type 查找当前阶段已添加的力） ───────────────────────────
  const gravityForce  = currentForces.find(f => f.type === 'Gravity');
  const normalForce   = currentForces.find(f => f.type === 'Normal');
  const frictionForce = currentForces.find(f => f.type === 'Friction');
  const appliedForce  = currentForces.find(f => f.type === 'Applied');

  const isAccel = activeTab === '物体受力图 (加速阶段)';

  // SVG id（字符串拼接，不用模板字符串，防止变量被过滤）
  const beltClipId   = 'belt-clip-'   + safeUid;
  const arrowGreenId = 'arrow-green-' + safeUid;

  // ── 渲染 ────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', width: '100%', height: '100vh', background: '#0f172a', overflow: 'hidden' }}
      className="text-white"
    >

      {/* ════ 左侧：场景画布 ════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px' }}>

        {/* 页眉 */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onBack}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: 'rgba(255,255,255,0.5)', background: 'none',
                border: 'none', cursor: 'pointer', fontSize: '14px',
              }}
            >
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
              {p02Data.title}
            </h2>
          </div>
          <button
            onClick={toggleFullscreen}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', cursor: 'pointer',
            }}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* 阶段 Tab */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {STAGES.map((stage, idx) => {
            const isActive = activeTab === stage;
            return (
              <button
                key={stage}
                onClick={() => setActiveTab(stage)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontWeight: 700,
                  fontSize: '13px', cursor: 'pointer', border: 'none',
                  background: isActive ? (idx === 0 ? '#2563eb' : '#ea580c') : 'rgba(255,255,255,0.05)',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.15s',
                }}
              >
                {idx === 0 ? '1. 刚放上去（加速阶段）' : '2. 共同匀速（平衡阶段）'}
              </button>
            );
          })}
        </div>

        {/* SVG 画布 */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <FreeBodyDiagram width={CANVAS_W} height={CANVAS_H} showGrid={false}>
            <defs>
              <marker id={arrowGreenId} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#34d399" />
              </marker>
            </defs>

            {/* 传送带带面（包裹轮子） */}
            <rect x={150} y={BELT_Y - 30} width={600} height={60}
              fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.3)" strokeWidth={3} rx={30} />

            {/* 传送带轮子（位于内部） */}
            <circle cx={150} cy={BELT_Y} r={26} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <circle cx={750} cy={BELT_Y} r={26} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            {/* 轮毂中心点 */}
            <circle cx={150} cy={BELT_Y} r={3} fill="rgba(255,255,255,0.3)" />
            <circle cx={750} cy={BELT_Y} r={3} fill="rgba(255,255,255,0.3)" />

            {/* 传送带纹路动画 */}
            <clipPath id={beltClipId}>
              <rect x={150} y={BELT_Y - 30} width={600} height={60} rx={30} />
            </clipPath>
            <g clipPath={'url(#' + beltClipId + ')'}>
              {Array.from({ length: 25 }).map((_, i) => (
                <line key={i}
                  x1={130 + i * 40 + offset} y1={BELT_Y - 28}
                  x2={110 + i * 40 + offset} y2={BELT_Y + 28}
                  stroke="rgba(255,255,255,0.15)" strokeWidth={2} />
              ))}
            </g>

            {/* 速度标注 */}
            <text x={CENTER_X} y={BELT_Y + 58}
              fill="rgba(255,255,255,0.4)" textAnchor="middle" fontSize={13}>
              传送带匀速向右运动 v →
            </text>

            {/* 隔离框 */}
            <rect x={OBJ_CX - 130} y={OBJ_CY - 120} width={260} height={240}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1}
              strokeDasharray="6,4" rx={12} />
            <text x={OBJ_CX - 120} y={OBJ_CY - 106}
              fill="rgba(255,255,255,0.2)" fontSize={11}>隔离对象：物体</text>

            {/* 物体 */}
            <rect x={OBJ_X} y={OBJ_Y} width={OBJ_W} height={OBJ_H}
              fill="rgba(249,115,22,0.2)" stroke="#f97316" strokeWidth={3} rx={6} />
            <text x={OBJ_CX} y={OBJ_CY + 5}
              fill="#f97316" textAnchor="middle" fontWeight="bold" fontSize={14}>物体</text>

            {/* 加速度箭头（仅加速阶段） */}
            {isAccel && (
              <>
                <line x1={OBJ_CX} y1={OBJ_Y - 20} x2={OBJ_CX + 50} y2={OBJ_Y - 20}
                  stroke="#34d399" strokeWidth={3}
                  markerEnd={'url(#' + arrowGreenId + ')'} />
                <text x={OBJ_CX + 56} y={OBJ_Y - 15}
                  fill="#34d399" fontSize={14} fontWeight="bold">a</text>
              </>
            )}

            {/* 学生添加的力箭头 */}
            {gravityForce && (
              <ForceArrow x={OBJ_CX} y={OBJ_CY} magnitude={45}
                angle={engineToSvg(270)} color={colorMap.Gravity} label="G" />
            )}
            {normalForce && (
              <ForceArrow x={OBJ_CX} y={OBJ_CY} magnitude={45}
                angle={engineToSvg(90)} color={colorMap.Normal} label="N" />
            )}
            {frictionForce && (
              <ForceArrow x={OBJ_CX} y={OBJ_CY} magnitude={40}
                angle={engineToSvg(frictionForce.angle)}
                color={colorMap.Friction} label="f" />
            )}
            {/* Applied 是干扰项，偏移显示 + 虚线 */}
            {appliedForce && (
              <ForceArrow x={OBJ_CX + 20} y={OBJ_CY} magnitude={40}
                angle={engineToSvg(appliedForce.angle)}
                color={colorMap.Applied} label="F" dashed />
            )}

            {/* 场景提示文字 */}
            {isAccel ? (
              <text x={CENTER_X} y={OBJ_Y - 52}
                fill="rgba(255,255,255,0.3)" fontSize={13} textAnchor="middle">
                加速阶段：物体速度 &lt; 传送带速度
              </text>
            ) : (
              <text x={CENTER_X} y={OBJ_Y - 52}
                fill="rgba(255,255,255,0.3)" fontSize={13} textAnchor="middle">
                平衡阶段：物体与传送带同速，无相对运动
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

        {/* ── 上半：可滚动交互区 ── */}
        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          {/* 题目情境 */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
            padding: '12px', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
              marginBottom: '6px',
            }}>
              📋 题目情境
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, margin: 0 }}>
              {p02Data.scenario}
            </p>
          </div>

          {/* 当前阶段标签 */}
          <div style={{
            fontSize: '13px', fontWeight: 700,
            color: isAccel ? '#60a5fa' : '#fb923c',
            paddingLeft: '2px',
          }}>
            当前：{isAccel ? '阶段一 — 加速阶段' : '阶段二 — 平衡阶段'}
          </div>

          {/* 物理分析提示 */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
            padding: '12px', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 600,
              color: 'rgba(255,255,255,0.45)', marginBottom: '8px',
            }}>
              <Info size={13} /> 物理分析
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>
              {isAccel
                ? '物体刚放上传送带时速度为零，传送带向右运动。物体相对传送带向左滑动，受到向右的滑动摩擦力，从而加速。'
                : '当物体速度增大到与传送带相同时，二者无相对运动也无相对运动趋势，摩擦力消失，物体匀速运动。'}
            </p>
          </div>

          {/* ── 两步选择器（提交后锁定） ── */}
          {!isSubmitted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
              }}>
                <Plus size={13} />
                {pendingKey ? '② 选择摩擦力方向' : '① 选择要添加的力'}
              </div>

              {/* 第一步：选力类型 */}
              {!pendingKey ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {FORCE_CONFIGS.map(config => {
                    const added = isConfigAdded(config);
                    return (
                      <button
                        key={config.key}
                        onClick={() => !added && handleSelectType(config.key)}
                        disabled={added}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', borderRadius: '8px',
                          cursor: added ? 'not-allowed' : 'pointer',
                          background: added ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                          border: '1px solid ' + (added ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)'),
                          opacity: added ? 0.45 : 1, transition: 'all 0.15s',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                          background: config.color + '33',
                          border: '2px solid ' + config.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, color: config.color,
                        }}>
                          {config.symbol}
                        </span>
                        <span style={{ flex: 1, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                          {config.label}
                        </span>
                        {/* 多方向力显示右箭头提示进入第二步 */}
                        {config.directions.length > 1 && !added && (
                          <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                        )}
                        {added && (
                          <span style={{ fontSize: '11px', color: '#34d399', flexShrink: 0 }}>✓ 已添加</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* 第二步：选方向（仅摩擦力 / Applied 进入） */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    onClick={() => setPendingKey(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={13} /> 返回选择力类型
                  </button>
                  {(() => {
                    const config = FORCE_CONFIGS.find(c => c.key === pendingKey)!;
                    return config.directions.map((dir, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectDirection(dir)}
                        style={{
                          padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
                          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
                          color: 'white', cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                      >
                        {dir.label}
                      </button>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ── 已添加的力列表 ── */}
          {currentForces.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                已添加的力（{currentForces.length}）
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {currentForces.map(force => {
                  const cfg = FORCE_CONFIGS.find(c => c.type === force.type);
                  return (
                    <div key={force.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 12px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                        background: cfg ? cfg.color : '#888',
                      }} />
                      <span style={{
                        fontSize: '12px', fontWeight: 700,
                        color: cfg ? cfg.color : 'white', flexShrink: 0,
                      }}>
                        {force.label}
                      </span>
                      <span style={{ flex: 1, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        {dirLabel(force)}
                      </span>
                      {/* 提交后锁定，不允许单独删除 */}
                      {!isSubmitted && (
                        <button
                          onClick={() => handleRemoveForce(force.id)}
                          style={{
                            color: 'rgba(255,255,255,0.3)', background: 'none',
                            border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0,
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 提交按钮（未提交时显示） ── */}
          {!isSubmitted && (
            <button
              onClick={() => setSubmittedMap(prev => ({ ...prev, [activeTab]: true }))}
              disabled={currentForces.length === 0}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '11px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                cursor: currentForces.length === 0 ? 'not-allowed' : 'pointer',
                background: currentForces.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.25)',
                border: '1px solid ' + (currentForces.length === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.5)'),
                color: currentForces.length === 0 ? 'rgba(255,255,255,0.3)' : '#a5b4fc',
                transition: 'all 0.15s',
              }}
            >
              <Send size={15} /> 提交判别
            </button>
          )}
        </div>

        {/* ── 下半：判别结果区（提交后显示，独立滚动） ── */}
        {isSubmitted && (
          <div style={{
            flexShrink: 0, maxHeight: '52%',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* 标题行 + 重做按钮 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px 8px',
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
              }}>
                <Info size={14} /> 判别结果
              </div>

              {/* 重做按钮：有任意一条未通过时显示 */}
              {hasFailed && (
                <button
                  onClick={handleRedo}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                    color: '#fca5a5', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.28)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                >
                  <RotateCcw size={12} /> 重做
                </button>
              )}
            </div>

            {/* 规则列表（可滚动） */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '0 20px 16px',
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              {judgeResults.map((res, idx) => (
                <div key={idx} style={{
                  padding: '10px 12px', borderRadius: '8px',
                  background: res.result.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: '1px solid ' + (res.result.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'),
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flexShrink: 0, marginTop: '1px' }}>
                      {res.result.passed
                        ? <CheckCircle2 size={15} color="#10b981" />
                        : <XCircle size={15} color="#ef4444" />}
                    </div>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
                      {res.rule.expect}
                    </p>
                  </div>
                  {!res.result.passed && res.result.hint && (
                    <div style={{
                      marginTop: '6px', paddingLeft: '23px',
                      fontSize: '12px', color: '#fca5a5', lineHeight: 1.5,
                    }}>
                      💡 {res.result.hint}
                    </div>
                  )}
                </div>
              ))}

              {/* 全部通过 */}
              {allPassed && (
                <div style={{
                  marginTop: '4px', padding: '12px', borderRadius: '10px', textAlign: 'center',
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                }}>
                  <p style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '14px', margin: 0,
                  }}>
                    <CheckCircle2 size={18} /> 阶段受力分析正确！
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default P02ConveyorBelt;
