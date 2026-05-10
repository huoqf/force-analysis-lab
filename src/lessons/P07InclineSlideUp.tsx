import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle, Info, Send, ChevronRight, RotateCcw } from 'lucide-react';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import StudentForceLayer from '../components/Scene/StudentForceLayer';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext, JudgeRule } from '../data/types';
import p07Data from '../data/problems/p07.json';

// ─── 物理参数 ────────────────────────────────────────────────────────────────
const ANGLE = 30;
const ANGLE_RAD = (ANGLE * Math.PI) / 180;
const STAGE_NAME = '斜面物块受力图与坐标系';

// ─── 力的类型定义 ─────────────────────────────────────────────────────────────
interface DirectionOption {
  label: string;
  angle: number;
  isPerpendicular?: boolean;
  isAlongSurface?: boolean;
  directionSense?: 1 | -1;
  isCorrect?: boolean; // 仅用于 UI 提示色，不影响引擎
}

interface ForceConfig {
  type: string;
  label: string;
  color: string;
  directions: DirectionOption[];
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
      { label: '垂直斜面向外', angle: 90 + ANGLE, isPerpendicular: true, isCorrect: true },
      { label: '竖直向上', angle: 90, isCorrect: false },
    ],
  },
  {
    type: 'Applied',
    label: '外力 F',
    color: '#fbbf24',
    directions: [
      { label: '沿斜面向上', angle: ANGLE, isAlongSurface: true, directionSense: 1 },
    ],
  },
  {
    type: 'Friction',
    label: '摩擦力 f',
    color: '#f87171',
    directions: [
      { label: '沿斜面向下', angle: 180 + ANGLE, isAlongSurface: true, directionSense: -1, isCorrect: true },
      { label: '沿斜面向上', angle: ANGLE, isAlongSurface: true, directionSense: 1, isCorrect: false },
    ],
  },
];

// ─── SVG 常量 ─────────────────────────────────────────────────────────────────
const CENTER_X = 400;
const BLOCK_W = 100;
const BLOCK_H = 70;
const SURFACE_Y = 500 - (CENTER_X - 100) * Math.tan(ANGLE_RAD);
const CM_X = CENTER_X - (BLOCK_H / 2) * Math.sin(ANGLE_RAD);
const CM_Y = SURFACE_Y - (BLOCK_H / 2) * Math.cos(ANGLE_RAD);

// 重力分量辅助线端点（用于坐标系分解可视化）
const G_LEN = 80; // 重力箭头视觉长度
const G_ALONG = G_LEN * Math.sin(ANGLE_RAD);   // mgsinθ 分量长度
const G_PERP  = G_LEN * Math.cos(ANGLE_RAD);   // mgcosθ 分量长度

// ─── 组件 ─────────────────────────────────────────────────────────────────────
const P07InclineSlideUp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [forces, setForces] = useState<StudentForce[]>([]);
  const [coordSystem, setCoordSystem] = useState<'InclineNormal' | 'HorizontalVertical' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 两步添加力的状态
  const [pendingType, setPendingType] = useState<string | null>(null);

  const clearSubmitted = useCallback(() => setIsSubmitted(false), []);

  // 第一步：选力类型
  const handleSelectType = useCallback((type: string) => {
    const config = FORCE_CONFIGS.find(c => c.type === type);
    if (!config) return;
    // 方向唯一时直接添加，无需第二步
    if (config.directions.length === 1) {
      const dir = config.directions[0];
      clearSubmitted();
      setForces(prev => [...prev, {
        id: `_`,
        type,
        label: config.label,
        color: config.color,
        angle: dir.angle,
        isPerpendicular: dir.isPerpendicular,
        isAlongSurface: dir.isAlongSurface,
        directionSense: dir.directionSense,
        targetObject: '物块',
        stage: STAGE_NAME,
      }]);
    } else {
      setPendingType(type);
    }
  }, [clearSubmitted]);

  // 第二步：选方向
  const handleSelectDirection = useCallback((dir: DirectionOption) => {
    if (!pendingType) return;
    const config = FORCE_CONFIGS.find(c => c.type === pendingType)!;
    clearSubmitted();
    setForces(prev => [...prev, {
      id: `_`,
      type: pendingType,
      label: config.label,
      color: config.color,
      angle: dir.angle,
      isPerpendicular: dir.isPerpendicular,
      isAlongSurface: dir.isAlongSurface,
      directionSense: dir.directionSense,
      targetObject: '物块',
      stage: STAGE_NAME,
    }]);
    setPendingType(null);
  }, [pendingType, clearSubmitted]);

  const handleRemoveForce = useCallback((id: string) => {
    clearSubmitted();
    setForces(prev => prev.filter(f => f.id !== id));
  }, [clearSubmitted]);

  const handleCoordSystem = useCallback((sys: 'InclineNormal' | 'HorizontalVertical') => {
    clearSubmitted();
    setCoordSystem(prev => prev === sys ? null : sys); // 再次点击可取消
  }, [clearSubmitted]);

  const handleReset = useCallback(() => {
    setForces([]);
    setCoordSystem(null);
    setIsSubmitted(false);
    setPendingType(null);
  }, []);

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
  const studentCoords = useMemo(() => {
    if (coordSystem === 'InclineNormal')      return { xAxisAngle: ANGLE, yAxisAngle: ANGLE + 90 };
    if (coordSystem === 'HorizontalVertical') return { xAxisAngle: 0, yAxisAngle: 90 };
    return undefined;
  }, [coordSystem]);

  const judgeResults = useMemo(() => {
    const ctx: JudgingContext = {
      expectedTarget: '物块',
      expectedStage: STAGE_NAME,
      studentCoords,
    };
    return p07Data.judgeRules.map(rule => ({
      rule,
      result: evaluateRule(rule as JudgeRule, forces, ctx),
    }));
  }, [forces, studentCoords]);

  const allPassed = judgeResults.length > 0 && judgeResults.every(r => r.result.passed);

  // ─── 辅助：已添加的力类型集合（用于置灰） ────────────────────────────────
  const addedTypes = new Set(forces.map(f => f.type));

  // ─── 已添加力的方向描述 ──────────────────────────────────────────────────
  function dirLabel(f: StudentForce): string {
    const config = FORCE_CONFIGS.find(c => c.type === f.type);
    if (!config) return '';
    const dir = config.directions.find(d => d.angle === f.angle);
    return dir?.label ?? '';
  }

  // ─── 重力分解辅助线（仅沿斜面坐标系 + 已添加重力时显示） ───
  const hasGravity = forces.some(f => f.type === 'Gravity');
  const showDecompose = hasGravity && coordSystem === 'InclineNormal';

  // 重力 G 作为矩形的对角线，分量为邻边。
const ARROW_HEAD_OFFSET = 18;
  const G_TOTAL_LEN = G_LEN * 1.2 + ARROW_HEAD_OFFSET; //分力匹配
  
  // 重力矢量在 SVG 坐标系中：从 CM 出发，向下延伸 G_TOTAL_LEN
  const gravityEnd = {
    x: CM_X,
    y: CM_Y + G_TOTAL_LEN
  };

  // 分量长度
  const gPara = G_TOTAL_LEN * Math.sin(ANGLE_RAD);
  const gPerp = G_TOTAL_LEN * Math.cos(ANGLE_RAD);

  // 分量在 SVG 中的角度：
  // 沿斜面向下：180-ANGLE (SVG系)
  const paraAngleSVG = (180 - ANGLE) * Math.PI / 180;
  // 垂直斜面向内：90-ANGLE (SVG系)
  const perpAngleSVG = (90 - ANGLE) * Math.PI / 180;

  const paraEnd = {
    x: CM_X + gPara * Math.cos(paraAngleSVG),
    y: CM_Y + gPara * Math.sin(paraAngleSVG),
  };

  const perpEnd = {
    x: CM_X + gPerp * Math.cos(perpAngleSVG),
    y: CM_Y + gPerp * Math.sin(perpAngleSVG),
  };

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
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
            />
            {/* 倾角标注 */}
            <text x={160} y={490} fill="rgba(255,255,255,0.4)" fontSize={13}>θ=30°</text>

            {/* 物块（沿斜面旋转） */}
            <g transform={`translate(${CENTER_X}, ${SURFACE_Y}) rotate(${-ANGLE})`}>
              <rect
                x={-BLOCK_W / 2} y={-BLOCK_H} width={BLOCK_W} height={BLOCK_H}
                fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="2.5" rx={6}
              />
              <text x={0} y={-BLOCK_H / 2 + 6} fill="white" textAnchor="middle" fontSize={15} fontWeight="bold"
                transform={`rotate(${ANGLE})`}>物块</text>
              {/* 运动方向参考 */}
              <ForceArrow x={BLOCK_W / 2 + 16} y={-BLOCK_H / 2} magnitude={36} angle={0} color="#34d399" label="v" dashed />
            </g>

            {/* ── 坐标轴可视化 ── */}
            {coordSystem === 'InclineNormal' && (
              <g transform={`translate(${CM_X}, ${CM_Y}) rotate(${-ANGLE})`} opacity={0.55}>
                <defs>
                  <marker id="ax" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
                  </marker>
                </defs>
                <line x1={0} y1={0} x2={130} y2={0} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" markerEnd="url(#ax)" />
                <text x={138} y={4} fill="#94a3b8" fontSize={13} transform={`rotate(${ANGLE})`}>x</text>
                <line x1={0} y1={0} x2={0} y2={-130} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" markerEnd="url(#ax)" />
                <text x={4} y={-136} fill="#94a3b8" fontSize={13} transform={`rotate(${ANGLE})`}>y</text>
              </g>
            )}
            {coordSystem === 'HorizontalVertical' && (
              <g transform={`translate(${CM_X}, ${CM_Y})`} opacity={0.55}>
                <defs>
                  <marker id="ax2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
                  </marker>
                </defs>
                <line x1={0} y1={0} x2={130} y2={0} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" markerEnd="url(#ax2)" />
                <text x={138} y={4} fill="#94a3b8" fontSize={13}>x</text>
                <line x1={0} y1={0} x2={0} y2={-130} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" markerEnd="url(#ax2)" />
                <text x={4} y={-136} fill="#94a3b8" fontSize={13}>y</text>
              </g>
            )}

            {/* ── 重力分解辅助线（仅沿斜面坐标系 + 已添加重力时显示） ── */}
            {showDecompose && (
              <g opacity={0.6}>
                {/* 矩形分解虚线框：paraEnd -> gravityEnd -> perpEnd */}
                <path
                  d={`M ${paraEnd.x} ${paraEnd.y} L ${gravityEnd.x} ${gravityEnd.y} L ${perpEnd.x} ${perpEnd.y}`}
                  fill="none" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3"
                />
                
                {/* mgsinθ：沿斜面向下分量实线 */}
                <line
                  x1={CM_X} y1={CM_Y}
                  x2={paraEnd.x} y2={paraEnd.y}
                  stroke="#ef4444" strokeWidth={2} strokeDasharray="5 3"
                />
                <text
                  x={paraEnd.x - 12}
                  y={paraEnd.y + 16}
                  fill="#ef4444" fontSize={12} fontWeight="bold"
                >mgsinθ</text>

                {/* mgcosθ：垂直斜面向内分量实线 */}
                <line
                  x1={CM_X} y1={CM_Y}
                  x2={perpEnd.x} y2={perpEnd.y}
                  stroke="#ef4444" strokeWidth={2} strokeDasharray="5 3"
                />
                <text
                  x={perpEnd.x + 10}
                  y={perpEnd.y + 12}
                  fill="#ef4444" fontSize={12} fontWeight="bold"
                >mgcosθ</text>

                {/* 直角符号 (在 CM 处) */}
                <g transform={`translate(${CM_X}, ${CM_Y}) rotate(${-ANGLE})`}>
                  <rect x={0} y={0} width={12} height={12} fill="none" stroke="#ef4444" strokeWidth={1} />
                </g>
              </g>
            )}

            {/* ── 学生受力层 ── */}
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
      <aside style={{
        width: '360px', flexShrink: 0, background: 'rgba(15,23,42,0.95)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* 题目情境 */}
          <details open style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
              📋 题目情境
            </summary>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              {p07Data.scenario}
            </p>
          </details>

          {/* 任务标签 */}
          <div style={{
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: 600, color: '#93c5fd',
          }}>
            任务：受力分析与建立坐标系
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
          {forces.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 600 }}>
                已添加的力
              </div>
              {forces.map(f => (
                <div key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', flex: 1 }}>
                    {f.label}
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

          {/* 坐标系选择器 */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', fontWeight: 600 }}>
              建立坐标系
            </div>
            {([
              ['InclineNormal',      '沿斜面建立坐标轴（x 轴沿斜面）'],
              ['HorizontalVertical', '水平竖直坐标轴（x 轴水平）'],
            ] as const).map(([sys, label]) => {
              const active = coordSystem === sys;
              return (
                <button
                  key={sys}
                  onClick={() => handleCoordSystem(sys)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '8px', marginBottom: '6px',
                    border: active ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                    border: active ? '4px solid #818cf8' : '2px solid rgba(255,255,255,0.3)',
                    background: active ? '#818cf8' : 'transparent', transition: 'all 0.15s',
                  }} />
                  <span style={{ fontSize: '13px', color: active ? '#c7d2fe' : 'rgba(255,255,255,0.6)' }}>
                    {label}
                  </span>
                </button>
              );
            })}
            {coordSystem === 'InclineNormal' && hasGravity && (
              <div style={{ fontSize: '11px', color: 'rgba(239,68,68,0.7)', marginTop: '6px', paddingLeft: '4px' }}>
                · 已在画布显示重力的 mgsinθ / mgcosθ 分解辅助线
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <button
            onClick={() => setIsSubmitted(true)}
            disabled={forces.length === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', borderRadius: '10px', border: 'none', cursor: forces.length === 0 ? 'not-allowed' : 'pointer',
              background: forces.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.8)',
              color: forces.length === 0 ? 'rgba(255,255,255,0.3)' : 'white',
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
                <Info size={14} /> 判别结果
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
                  <RotateCcw size={14} /> 重做本题
                </button>
              )}
            </div>
          )}

        </div>
      </aside>
    </div>
  );
};

export default P07InclineSlideUp;
