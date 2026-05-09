import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Info, CheckCircle2, XCircle, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext } from '../data/types';
import p02Data from '../data/problems/p02.json';

type SelectionState = {
  gravity: boolean;
  normal: boolean;
  friction: boolean;
};

const P02ConveyorBelt: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'物体受力图(加速阶段)' | '物体受力图(平衡阶段)'>('物体受力图(加速阶段)');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 传送带动画偏置
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setOffset(prev => (prev + 2) % 40);
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

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

  const [selections, setSelections] = useState<Record<string, SelectionState>>({
    '物体受力图(加速阶段)': { gravity: false, normal: false, friction: false },
    '物体受力图(平衡阶段)': { gravity: false, normal: false, friction: false },
  });

  const currentSelection = selections[activeTab];

  const updateSelection = (updates: Partial<SelectionState>) => {
    setSelections(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...updates }
    }));
  };

  const studentForces = useMemo<StudentForce[]>(() => {
    const forces: StudentForce[] = [];
    const stage = activeTab;

    if (currentSelection.gravity) {
      forces.push({ id: 'g', type: 'Gravity', label: 'G', stage, angle: 270 });
    }
    if (currentSelection.normal) {
      forces.push({ id: 'n', type: 'Normal', label: 'N', stage, angle: 90 });
    }
    if (currentSelection.friction) {
      forces.push({ id: 'f', type: 'Friction', label: 'f', stage, angle: 0 }); // 摩擦力向前 (加速时)
    }
    return forces;
  }, [activeTab, currentSelection]);

  const judgeResults = useMemo(() => {
    const context: JudgingContext = {
      expectedTarget: activeTab,
      expectedStage: activeTab,
    };

    return p02Data.judgeRules
      .filter(rule => rule.appliesTo === activeTab)
      .map(rule => {
        const result = evaluateRule(rule, studentForces, context);
        return { rule, result };
      });
  }, [activeTab, studentForces]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // SVG Constants
  const CENTER_X = 400;
  const CENTER_Y = 300;
  const BELT_Y = CENTER_Y + 100;

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
            <h2 className="text-2xl font-bold">{p02Data.title}</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* 阶段切换 */}
        <div className="flex gap-2 z-10">
          {(['物体受力图(加速阶段)', '物体受力图(平衡阶段)'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              {tab.includes('加速') ? '1. 刚放上去 (加速)' : '2. 共同匀速 (平衡)'}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 relative flex justify-center items-center">
          <FreeBodyDiagram width={800} height={600} showGrid={false}>
            {/* 传送带轮子 */}
            <circle cx={150} cy={BELT_Y} r={30} fill="none" stroke="white" strokeWidth={2} opacity={0.3} />
            <circle cx={650} cy={BELT_Y} r={30} fill="none" stroke="white" strokeWidth={2} opacity={0.3} />
            
            {/* 传送带带面 */}
            <rect x={150} y={BELT_Y - 30} width={500} height={60} fill="none" stroke="white" strokeWidth={4} rx={30} />
            
            {/* 传送带上的纹路 (动画) */}
            <g clipPath="inset(0 0 0 0)">
               {Array.from({ length: 15 }).map((_, i) => (
                 <line 
                   key={i} 
                   x1={150 + i * 40 + offset} y1={BELT_Y - 30} 
                   x2={140 + i * 40 + offset} y2={BELT_Y - 20} 
                   stroke="rgba(255,255,255,0.4)" strokeWidth={2} 
                 />
               ))}
            </g>

            {/* 物体 */}
            <g transform={`translate(${CENTER_X - 40}, ${BELT_Y - 30 - 60})`}>
              <rect width={80} height={60} fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" strokeWidth={3} rx={4} />
              <text x={40} y={35} fill="#f97316" textAnchor="middle" fontWeight="bold">物体</text>
              
              {/* 受力点 */}
              <g transform="translate(40, 30)">
                {currentSelection.gravity && <ForceArrow x={0} y={0} magnitude={100} angle={90} color="#ef4444" label="G" />}
                {currentSelection.normal && <ForceArrow x={0} y={0} magnitude={100} angle={270} color="#60a5fa" label="N" />}
                {currentSelection.friction && <ForceArrow x={0} y={0} magnitude={80} angle={0} color="#f59e0b" label="f" />}
              </g>

              {/* 运动学特效 */}
              {activeTab === '物体受力图(加速阶段)' && (
                <>
                  <ForceArrow x={40} y={-40} magnitude={50} angle={0} color="#34d399" label="a" dashed />
                  <path d="M-10,10 Q-30,30 -10,50 M-20,20 Q-40,30 -20,40" stroke="rgba(255,255,255,0.2)" fill="none" strokeWidth={2} />
                </>
              )}
            </g>

            <text x={CENTER_X} y={BELT_Y + 70} fill="rgba(255,255,255,0.4)" textAnchor="middle" fontSize={14}>传送带匀速向右运动 v</text>
          </FreeBodyDiagram>
        </div>
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(15,23,42,0.8)', borderLeft: '1px solid rgba(255,255,255,0.08)' }} className="lg:col-span-1 h-full overflow-y-auto">
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-6 text-xl text-blue-300 border-b border-white/10 pb-2">当前阶段受力</h3>
          
          <div className="space-y-6">
            <div className="p-4 bg-orange-950/30 border border-orange-500/20 rounded-xl space-y-2">
              <h4 className="text-orange-300 text-sm font-bold flex items-center gap-2">
                <Info size={16} /> 物理分析
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeTab === '物体受力图(加速阶段)' 
                  ? '物体刚放上去时，速度为零，传送带速度向右。物体相对传送带向左滑动，受到的滑动摩擦力应向右。' 
                  : '当物体速度增加到与传送带相等时，二者保持相对静止，且没有相对运动趋势，此时摩擦力消失。'}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-slate-400 text-sm font-semibold">请勾选应画出的力：</h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'gravity', label: '重力 G', symbol: 'G' },
                  { id: 'normal', label: '支持力 N', symbol: 'N' },
                  { id: 'friction', label: '摩擦力 f', symbol: 'f' },
                ].map(item => (
                  <label key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={(currentSelection as any)[item.id]} 
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
                <CheckCircle2 size={24} /> 阶段受力分析正确！
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default P02ConveyorBelt;
