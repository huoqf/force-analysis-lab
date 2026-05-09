import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Info, CheckCircle2, XCircle, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext, JudgeRule } from '../data/types';
import p07Data from '../data/problems/p07.json';

type SelectionState = {
  gravity: boolean;
  normal: boolean;
  applied: boolean;
  friction: boolean;
  coordSystem: 'HorizontalVertical' | 'InclineNormal' | null;
};

const P07InclineSlideUp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab] = useState<'斜面物块受力图与坐标系'>('斜面物块受力图与坐标系');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [angle] = useState(30); // 固定斜面倾角为 30 度

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
    const handler = () =>
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const [selection, setSelection] = useState<SelectionState>({
    gravity: false,
    normal: false,
    applied: false,
    friction: false,
    coordSystem: null,
  });

  const updateSelection = (updates: Partial<SelectionState>) => {
    setSelection(prev => ({ ...prev, ...updates }));
  };

  // 物理参数：0-右, 90-上, 180-左, 270-下 (引擎约定)
  // SVG 绘图映射：SVG_Angle = (270 - Engine_Angle) % 360
  // 例如：Engine 270 (下) -> SVG 0? 不对。
  // 简单映射：Engine 270 -> SVG 90 (下); Engine 90 -> SVG 270 (上); Engine 0 -> SVG 0 (右); Engine 180 -> SVG 180 (左)
  const toSVGAngle = (engineAngle: number) => {
    if (engineAngle === 270) return 90; // 下
    if (engineAngle === 90) return 270;  // 上
    return engineAngle;
  };

  const studentForces = useMemo<StudentForce[]>(() => {
    const forces: StudentForce[] = [];
    const stage = '斜面物块受力图与坐标系';

    if (selection.gravity) {
      forces.push({
        id: 'g', type: 'Gravity', label: 'G', stage, angle: 270 // 竖直向下
      });
    }
    if (selection.normal) {
      // 垂直斜面向外。斜面 30度，法线是 90 + 30 = 120 度 (相对于向上 90)
      // 这里的 logic 需要与引擎 relativeTo: 'Surface' 配合
      // 我们在 StudentForce 中打上标记
      forces.push({
        id: 'n', type: 'Normal', label: 'N', stage, 
        relativeTo: 'Surface', isPerpendicular: true 
      });
    }
    if (selection.applied) {
      // 沿斜面向上
      forces.push({
        id: 'f_app', type: 'Applied', label: 'F', stage,
        relativeTo: 'Surface', isAlongSurface: true, directionSense: 1
      });
    }
    if (selection.friction) {
      // 沿斜面向下
      forces.push({
        id: 'f_fric', type: 'Friction', label: 'f', stage,
        relativeTo: 'Surface', isAlongSurface: true, directionSense: -1
      });
    }
    return forces;
  }, [selection]);

  const studentCoords = useMemo(() => {
    if (selection.coordSystem === 'InclineNormal') {
      return { xAxisAngle: 30, yAxisAngle: 120 }; // 沿斜面和法线
    }
    if (selection.coordSystem === 'HorizontalVertical') {
      return { xAxisAngle: 0, yAxisAngle: 90 }; // 水平竖直
    }
    return undefined;
  }, [selection.coordSystem]);

  const judgeResults = useMemo(() => {
    const context: JudgingContext = {
      expectedTarget: '斜面物块受力图与坐标系',
      expectedStage: '斜面物块受力图与坐标系',
      studentCoords
    };

    return p07Data.judgeRules.map(rule => {
      const result = evaluateRule(rule, studentForces, context);
      return { rule, result };
    });
  }, [studentForces, studentCoords]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // SVG Constants
  const CENTER_X = 400;
  const CENTER_Y = 350;
  const angleRad = (angle * Math.PI) / 180;

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
      className="bg-slate-950 text-white"
    >
      {/* 左侧：场景区 */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', minHeight: 0 }} className="lg:col-span-2 relative">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-2xl font-bold">{p07Data.title}</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        <div className="flex-1 min-h-0 relative flex justify-center items-center">
          <FreeBodyDiagram width={800} height={600} showGrid={false}>
            {/* 斜面 */}
            <path 
              d={`M 100 500 L 700 500 L 700 ${500 - 600 * Math.tan(angleRad)} Z`} 
              fill="rgba(255, 255, 255, 0.05)" 
              stroke="white" 
              strokeWidth="2" 
            />
            
            {/* 物块 */}
            <g transform={`translate(${CENTER_X}, ${500 - (700-CENTER_X) * Math.tan(angleRad)}) rotate(${-angle})`}>
              <rect x="-40" y="-60" width="80" height="60" fill="#3b82f6" rx={8} />
              
              {/* 运动指示：v 沿斜面向上 */}
              <ForceArrow x={60} y={-30} magnitude={40} angle={0} color="#34d399" label="v" dashed />

              {/* 坐标系可视化 */}
              {selection.coordSystem === 'InclineNormal' && (
                <g opacity={0.6}>
                  <line x1={0} y1={-30} x2={100} y2={-30} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 2" markerEnd="url(#arrowhead)" />
                  <text x={110} y={-25} fill="#94a3b8" fontSize="14">x</text>
                  <line x1={0} y1={-30} x2={0} y2={-130} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 2" markerEnd="url(#arrowhead)" />
                  <text x={5} y={-140} fill="#94a3b8" fontSize="14">y</text>
                </g>
              )}
            </g>

            {/* 受力箭头绘制 (在物块中心) */}
            <g transform={`translate(${CENTER_X}, ${500 - (700-CENTER_X) * Math.tan(angleRad) - 30 * Math.cos(angleRad)})`}>
              {selection.gravity && (
                <ForceArrow x={0} y={0} magnitude={80} angle={90} color="#ef4444" label="G" />
              )}
              {selection.normal && (
                <ForceArrow x={0} y={0} magnitude={70} angle={270 - angle} color="#60a5fa" label="N" />
              )}
              {selection.applied && (
                <ForceArrow x={0} y={0} magnitude={100} angle={-angle} color="#fbbf24" label="F" />
              )}
              {selection.friction && (
                <ForceArrow x={0} y={0} magnitude={50} angle={180 - angle} color="#f87171" label="f" />
              )}
            </g>

            {selection.coordSystem === 'HorizontalVertical' && (
              <g transform={`translate(${CENTER_X - 150}, ${CENTER_Y + 100})`} opacity={0.6}>
                <line x1={0} y1={0} x2={60} y2={0} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 2" markerEnd="url(#arrowhead)" />
                <text x={70} y={5} fill="#94a3b8" fontSize="14">x</text>
                <line x1={0} y1={0} x2={0} y2={-60} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 2" markerEnd="url(#arrowhead)" />
                <text x={-5} y={-70} fill="#94a3b8" fontSize="14">y</text>
              </g>
            )}
          </FreeBodyDiagram>
        </div>
      </div>

      {/* 右侧：交互区 */}
      <aside style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(15,23,42,0.8)', borderLeft: '1px solid rgba(255,255,255,0.08)' }} className="lg:col-span-1 h-full overflow-y-auto">
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-6 text-xl text-blue-300 border-b border-white/10 pb-2">受力选择与建系</h3>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-slate-400 text-sm font-semibold">1. 勾选存在的力</h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'gravity', label: '重力 G', symbol: 'G' },
                  { id: 'normal', label: '支持力 N', symbol: 'N' },
                  { id: 'applied', label: '外力 F', symbol: 'F' },
                  { id: 'friction', label: '摩擦力 f', symbol: 'f' },
                ].map(item => (
                  <label key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={(selection as any)[item.id]} 
                      onChange={(e) => updateSelection({ [item.id]: e.target.checked })} 
                      className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/50"
                    />
                    <span className="text-lg">{item.label} <InlineMath math={item.symbol} /></span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-slate-400 text-sm font-semibold">2. 建立坐标系</h4>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => updateSelection({ coordSystem: 'InclineNormal' })}
                  className={`p-3 rounded-lg border transition-all text-left ${selection.coordSystem === 'InclineNormal' ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/50' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                  沿斜面建立坐标系 (推荐)
                </button>
                <button 
                  onClick={() => updateSelection({ coordSystem: 'HorizontalVertical' })}
                  className={`p-3 rounded-lg border transition-all text-left ${selection.coordSystem === 'HorizontalVertical' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                  水平竖直坐标系
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 判别反馈 */}
        <div style={{ marginTop: 'auto', padding: '2rem', backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 className="font-bold mb-4 text-lg flex items-center gap-2">
            <Info size={18} className="text-blue-400" /> 引擎实时判别
          </h4>
          
          <div className="space-y-3">
            {judgeResults.map((res, idx) => (
              <div key={idx} className={`p-3 rounded-xl flex flex-col gap-2 border shadow-sm transition-colors ${res.result.passed ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-red-950/40 border-red-500/30'}`}>
                <div className="flex items-center gap-3">
                  {res.result.passed ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                      <XCircle size={18} className="text-red-500" />
                    </div>
                  )}
                  <p className={`font-semibold text-base ${res.result.passed ? 'text-emerald-300' : 'text-red-300'}`}>
                    {res.rule.expect}
                  </p>
                </div>
                {!res.result.passed && res.result.hint && (
                  <div className="ml-10 text-sm text-red-200/90 bg-red-950/60 p-2.5 rounded-lg border border-red-900/50">
                    💡 提示：{res.result.hint}
                  </div>
                )}
              </div>
            ))}
          </div>

          {allPassed && (
            <div className="mt-6 p-5 bg-emerald-600/20 border border-emerald-500/50 rounded-xl text-center shadow-lg shadow-emerald-900/20">
              <p className="text-emerald-400 font-bold text-xl flex items-center justify-center gap-2">
                <CheckCircle2 size={24} /> 分析与建系完全正确！
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default P07InclineSlideUp;
