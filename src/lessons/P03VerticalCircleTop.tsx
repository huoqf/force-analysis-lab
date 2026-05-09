import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Info, CheckCircle2, XCircle, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext } from '../data/types';
import p03Data from '../data/problems/p03.json';

type SelectionState = {
  gravity: boolean;
  normal: boolean;
  centripetal: boolean;
};

const P03VerticalCircleTop: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab] = useState<'最高点受力图'>('最高点受力图');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    centripetal: false,
  });

  const updateSelection = (updates: Partial<SelectionState>) => {
    setSelection(prev => ({ ...prev, ...updates }));
  };

  const studentForces = useMemo<StudentForce[]>(() => {
    const forces: StudentForce[] = [];
    const stage = '最高点受力图';

    if (selection.gravity) {
      forces.push({
        id: 'g', type: 'Gravity', label: 'G', stage, angle: 270 // 竖直向下 (引擎约定)
      });
    }
    if (selection.normal) {
      forces.push({
        id: 'n', type: 'Normal', label: 'N', stage, angle: 270 // 也是向下
      });
    }
    if (selection.centripetal) {
      forces.push({
        id: 'fc', type: 'FakeForce', label: '向心力', stage, angle: 270
      });
    }
    return forces;
  }, [selection]);

  const judgeResults = useMemo(() => {
    const context: JudgingContext = {
      expectedTarget: '最高点受力图',
      expectedStage: '最高点受力图',
    };

    return p03Data.judgeRules.map(rule => {
      const result = evaluateRule(rule, studentForces, context);
      return { rule, result };
    });
  }, [studentForces]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // SVG Drawing Constants
  const CENTER_X = 400;
  const CENTER_Y = 300;
  const RADIUS = 180;
  
  const BALL_X = CENTER_X;
  const BALL_Y = CENTER_Y - RADIUS;

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
            <h2 className="text-2xl font-bold">{p03Data.title}</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

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
            
            {/* 物体在最高点 C */}
            <circle cx={BALL_X} cy={BALL_Y} r={20} fill="#f43f5e" stroke="#fb7185" strokeWidth={2} />
            <text x={BALL_X - 6} y={BALL_Y - 30} fill="white" fontSize={18} fontWeight="bold">C</text>

            {/* 受力箭头绘制 (在物点中心) */}
            <g transform={`translate(${BALL_X}, ${BALL_Y})`}>
              {selection.gravity && (
                <ForceArrow x={0} y={0} magnitude={100} angle={90} color="#ef4444" label="G" />
              )}
              {selection.normal && (
                <ForceArrow x={0} y={0} magnitude={60} angle={90} color="#4ade80" label="N" />
              )}
              {selection.centripetal && (
                <ForceArrow x={0} y={0} magnitude={120} angle={90} color="#a855f7" label="F_向" dashed />
              )}
            </g>

            {/* 临界提示 */}
            <g transform={`translate(${CENTER_X - 100}, ${CENTER_Y})`}>
              <text fill="rgba(255,255,255,0.4)" fontSize={14}>水平轨道</text>
            </g>
          </FreeBodyDiagram>
        </div>
      </div>

      {/* 右侧：交互区 */}
      <aside style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(15,23,42,0.8)', borderLeft: '1px solid rgba(255,255,255,0.08)' }} className="lg:col-span-1 h-full overflow-y-auto">
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-6 text-xl text-blue-300 border-b border-white/10 pb-2">受力选择 (临界态)</h3>
          
          <div className="space-y-6">
            <div className="p-4 bg-amber-950/30 border border-amber-500/20 rounded-xl">
              <p className="text-sm text-amber-200 leading-relaxed">
                <strong>题目条件：</strong>物体“恰好”能通过最高点 C。
                <br />
                在此临界状态下，轨道对物体的弹力处于消失的边缘。
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-slate-400 text-sm font-semibold">勾选你认为存在的力：</h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'gravity', label: '重力 G', symbol: 'G' },
                  { id: 'normal', label: '轨道支持力 N', symbol: 'N' },
                  { id: 'centripetal', label: '向心力 F_向', symbol: 'F_{向}' },
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
                <CheckCircle2 size={24} /> 临界态受力分析正确！
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default P03VerticalCircleTop;
