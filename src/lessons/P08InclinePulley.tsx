import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Maximize, Minimize, Trash2, CheckCircle2, XCircle, Info, Send, RotateCcw } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import StudentForceLayer from '../components/Scene/StudentForceLayer';
import AddForcePanel, { ForceOption } from '../components/Control/AddForcePanel';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext } from '../data/types';
import p08Data from '../data/problems/p08.json';

const THETA = 30;
const STAGE_NAME = '物块A和B的受力图';

const AVAILABLE_FORCES: ForceOption[] = [
  { id: 'Gravity', type: 'Gravity', label: '重力 G', symbol: 'G', color: '#ef4444', directions: [{ label: '竖直向下', angle: 270 }] },
  { id: 'Normal', type: 'Normal', label: '支持力 N', symbol: 'N', color: '#60a5fa', directions: [
    { label: '垂直斜面向外', angle: 90 + THETA, isPerpendicular: true },
    { label: '竖直向上', angle: 90 }
  ] },
  { id: 'Tension', type: 'Tension', label: '绳子拉力 T', symbol: 'T', color: '#ec4899', directions: [
    { label: '沿绳指向滑轮 (A)', angle: THETA },
    { label: '竖直向上 (B)', angle: 90 },
    { label: '沿斜面向下', angle: 180 + THETA }
  ] },
  { id: 'Friction', type: 'Friction', label: '摩擦力 f', symbol: 'f', color: '#f59e0b', directions: [
    { label: '沿斜面向下', angle: 180 + THETA, isAlongSurface: true, directionSense: -1 },
    { label: '沿斜面向上', angle: THETA, isAlongSurface: true, directionSense: 1 }
  ] },
  { id: 'FakeForce', type: 'FakeForce', label: '惯性力 / 合力', symbol: 'F_{假}', color: '#c084fc', isFake: true, directions: [
    { label: '沿斜面向上', angle: THETA },
    { label: '沿斜面向下', angle: 180 + THETA },
    { label: '竖直向上', angle: 90 },
    { label: '沿绳指向滑轮', angle: THETA }
  ] }
];

const COLOR_MAP = {
  Gravity: '#ef4444',
  Normal: '#60a5fa',
  Tension: '#ec4899',
  Friction: '#f59e0b',
  Applied: '#fbbf24',
  Electrostatic: '#10b981',
  FakeForce: '#c084fc',
};

const P08InclinePulley: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 物理参数
  const physicsParams = {
    mA: 5,
    mB: 8,
    theta: THETA,
    mu: 0.3
  };

  const [studentForces, setStudentForces] = useState<StudentForce[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [targetObj, setTargetObj] = useState<'A' | 'B'>('A');

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
        targetObject: targetObj,
        stage: STAGE_NAME,
      },
    ]);
  }, [targetObj, clearSubmitted]);

  const handleRemoveForce = useCallback((id: string) => {
    clearSubmitted();
    setStudentForces(prev => prev.filter(f => f.id !== id));
  }, [clearSubmitted]);

  const handleRedo = useCallback(() => {
    setStudentForces([]);
    setIsSubmitted(false);
  }, []);

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
    const context: JudgingContext = {
      expectedTarget: STAGE_NAME,
      expectedStage: STAGE_NAME,
      physicsParams: physicsParams
    };

    return p08Data.judgeRules.map(rule => {
      const result = evaluateRule(rule, studentForces, context);
      return { rule, result };
    });
  }, [studentForces]);

  const allPassed = judgeResults.length > 0 && judgeResults.every(r => r.result.passed);

  // SVG Drawing Constants
  const CENTER_X = 350;
  const CENTER_Y = 450;
  const thetaRad = (THETA * Math.PI) / 180;
  
  const INCLINE_LEN = 500;
  const PULLEY_X = CENTER_X + INCLINE_LEN * Math.cos(thetaRad);
  const PULLEY_Y = CENTER_Y - INCLINE_LEN * Math.sin(thetaRad);

  const BALL_A_X = CENTER_X + 250 * Math.cos(thetaRad);
  const BALL_A_Y = CENTER_Y - 250 * Math.sin(thetaRad);
  
  const BLOCK_A_W = 80;
  const BLOCK_A_H = 40;
  // A 的质心位置
  const CM_A_X = BALL_A_X - 20 * Math.sin(thetaRad);
  const CM_A_Y = BALL_A_Y - 20 * Math.cos(thetaRad);

  // B 的质心位置
  const CM_B_X = PULLEY_X + 35;
  const CM_B_Y = PULLEY_Y + 190;

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', width: '100%', height: '100vh', background: '#0f172a', overflow: 'hidden' }}
      className="text-white"
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '12px', minWidth: 0 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-xl font-bold">{p08Data.title}</h2>
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
          <FreeBodyDiagram width={1000} height={800} showGrid={false}>
            {/* 斜面 */}
            <path d={`M ${CENTER_X} ${CENTER_Y} L ${PULLEY_X} ${PULLEY_Y} L ${PULLEY_X} ${CENTER_Y} Z`} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
            <text x={CENTER_X + 60} y={CENTER_Y - 10} fill="rgba(255,255,255,0.4)" fontSize={13}>θ={THETA}°</text>

            {/* 滑轮 */}
            <circle cx={PULLEY_X + 15} cy={PULLEY_Y - 15} r={20} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={3} />
            <circle cx={PULLEY_X + 15} cy={PULLEY_Y - 15} r={5} fill="rgba(255,255,255,0.4)" />

            {/* 绳子 */}
            <line x1={BALL_A_X} y1={BALL_A_Y - 20} x2={PULLEY_X + 15} y2={PULLEY_Y - 35} stroke="#94a3b8" strokeWidth={2} />
            <line x1={PULLEY_X + 35} y1={PULLEY_Y - 15} x2={PULLEY_X + 35} y2={PULLEY_Y + 150} stroke="#94a3b8" strokeWidth={2} />

            {/* 物体 A */}
            <g transform={`translate(${BALL_A_X}, ${BALL_A_Y}) rotate(${-THETA})`} opacity={targetObj === 'A' ? 1 : 0.3}>
              <rect x={-BLOCK_A_W/2} y={-BLOCK_A_H} width={BLOCK_A_W} height={BLOCK_A_H} fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth={2.5} rx={6} />
              <text x={0} y={-BLOCK_A_H/2 + 6} fill="white" textAnchor="middle" transform={`rotate(${THETA})`} fontWeight="bold">A</text>
            </g>

            {/* 物体 B */}
            <g transform={`translate(${PULLEY_X + 35}, ${PULLEY_Y + 190})`} opacity={targetObj === 'B' ? 1 : 0.3}>
              <rect x={-30} y={-40} width={60} height={80} fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" strokeWidth={2.5} rx={6} />
              <text x={0} y={5} fill="white" textAnchor="middle" fontWeight="bold">B</text>
            </g>

            {/* 学生受力图渲染 */}
            <StudentForceLayer
              studentForces={studentForces.filter(f => f.targetObject === 'A')}
              originX={CM_A_X}
              originY={CM_A_Y}
              scale={1.2}
              colorMap={COLOR_MAP}
            />
            
            <StudentForceLayer
              studentForces={studentForces.filter(f => f.targetObject === 'B')}
              originX={CM_B_X}
              originY={CM_B_Y}
              scale={1.2}
              colorMap={COLOR_MAP}
            />

          </FreeBodyDiagram>
        </div>
      </div>

      <aside style={{
        width: '360px', flexShrink: 0, background: 'rgba(15,23,42,0.95)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <details open style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
              📋 题目情境
            </summary>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              {p08Data.scenario}
            </p>
          </details>

          {/* 物理参数展示 */}
          <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl space-y-2 text-xs">
            <h4 className="text-blue-300 font-bold flex items-center gap-2 mb-2"><Info size={14}/> 场景参数</h4>
            <div className="grid grid-cols-2 gap-2 text-blue-200/80">
              <p>A质量 <InlineMath math="m_A" />: {physicsParams.mA} kg</p>
              <p>B质量 <InlineMath math="m_B" />: {physicsParams.mB} kg</p>
              <p>斜面倾角 <InlineMath math="\theta" />: {physicsParams.theta}°</p>
              <p>摩擦因数 <InlineMath math="\mu" />: {physicsParams.mu}</p>
            </div>
            <p className="text-amber-200/80 mt-2 border-t border-blue-500/10 pt-2">提示：根据参数判断 A 的运动趋势，决定摩擦力方向</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {(['A', 'B'] as const).map(obj => (
              <button
                key={obj}
                onClick={() => setTargetObj(obj)}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                  background: targetObj === obj ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${targetObj === obj ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: targetObj === obj ? '#c7d2fe' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.15s'
                }}
              >
                选取物块 {obj}
              </button>
            ))}
          </div>

          {/* 添加力面板 */}
          <AddForcePanel
            availableForces={AVAILABLE_FORCES}
            existingForces={studentForces.filter(f => f.targetObject === targetObj)}
            onConfirm={handleAddForce}
          />

          {/* 已添加力列表 */}
          {studentForces.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 600 }}>
                已添加的力
              </div>
              {studentForces.map(f => {
                const opt = AVAILABLE_FORCES.find(o => o.type === f.type);
                const dirOpt = opt?.directions.find(d => d.angle === f.angle);
                return (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: opt?.color || '#fff', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', flex: 1 }}>
                      <span className="font-bold mr-1">({f.targetObject})</span>
                      {opt?.label || f.label}
                      <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: '6px' }}>
                        {dirOpt?.label}
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
                );
              })}
            </div>
          )}

          <button
            onClick={() => setIsSubmitted(true)}
            disabled={studentForces.length === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', borderRadius: '10px', border: 'none', cursor: studentForces.length === 0 ? 'not-allowed' : 'pointer',
              background: studentForces.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.8)',
              color: studentForces.length === 0 ? 'rgba(255,255,255,0.3)' : 'white',
              fontSize: '14px', fontWeight: 600, transition: 'background 0.15s',
            }}
          >
            <Send size={16} />
            提交判别
          </button>

          {/* 判别结果 */}
          {isSubmitted && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                  <Info size={14} /> 判别结果
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
              {allPassed && (
                <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(16,185,129,0.12)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#34d399', fontWeight: 600, fontSize: '13px', margin: 0 }}>
                    <CheckCircle2 size={16} /> 受力分析全部正确！
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

export default P08InclinePulley;
