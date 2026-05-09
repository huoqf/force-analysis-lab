import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Info, CheckCircle2, XCircle, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext, JudgeRule } from '../data/types';
import p04Data from '../data/problems/p04.json';

type SelectionState = {
  gravity: boolean;
  tension: boolean;
  fakeForce: boolean;
  relation: '=' | '>' | '<' | null;
};

const P04VerticalLift: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'匀速阶段受力图' | '加速阶段受力图'>('匀速阶段受力图');
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

  const [selections, setSelections] = useState<Record<string, SelectionState>>({
    '匀速阶段受力图': { gravity: false, tension: false, fakeForce: false, relation: null },
    '加速阶段受力图': { gravity: false, tension: false, fakeForce: false, relation: null },
  });

  const currentSelection = selections[activeTab];

  const updateSelection = (updates: Partial<SelectionState>) => {
    setSelections(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...updates }
    }));
  };

  // 根据当前勾选状态，构造传给引擎的 StudentForce 数组
  const studentForces = useMemo<StudentForce[]>(() => {
    const forces: StudentForce[] = [];
    if (currentSelection.gravity) {
      forces.push({
        id: 'f_gravity',
        type: 'Gravity',
        label: 'G',
        stage: activeTab,
        targetObject: '物块受力图', // 与 expectedTarget 对应，但在引擎层中没有 targetObject 也能匹配
        angle: 90,
        magnitudeValue: 10
      });
    }
    if (currentSelection.tension) {
      let mag = 10; // 默认与重力相等（如果没选 relation，默认为 = 会方便一些，或者设为一样大）
      if (currentSelection.relation === '>') mag = 15;
      if (currentSelection.relation === '<') mag = 5;
      
      forces.push({
        id: 'f_tension',
        type: 'Tension',
        label: 'T',
        stage: activeTab,
        targetObject: '物块受力图',
        angle: 270,
        magnitudeValue: mag
      });
    }
    if (currentSelection.fakeForce) {
      forces.push({
        id: 'f_fake',
        type: 'FakeForce',
        label: '运动力', // 必须与 p04.json 中的 fakeNames 严格一致
        stage: activeTab,
        targetObject: '物块受力图',
        angle: 270
      });
    }
    return forces;
  }, [currentSelection, activeTab]);

  // 调用引擎判别
  const currentRules = useMemo(() => {
    return p04Data.judgeRules.filter((r: any) => r.appliesTo === activeTab) as JudgeRule[];
  }, [activeTab]);

  const judgeResults = useMemo(() => {
    const context: JudgingContext = {
      expectedTarget: '物块受力图',
      expectedStage: activeTab
    };

    return currentRules.map(rule => {
      const result = evaluateRule(rule, studentForces, context);
      return { rule, result };
    });
  }, [currentRules, studentForces, activeTab]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // SVG 绘制坐标
  const CENTER_X = 400;
  const CENTER_Y = 300;
  const BOX_SIZE = 60;

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
            <h2 className="text-2xl font-bold">{p04Data.title}</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* 顶部 Tab 切换 */}
        <div className="flex gap-4 justify-center mt-4 z-10">
          <button
            onClick={() => setActiveTab('匀速阶段受力图')}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
              activeTab === '匀速阶段受力图' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            阶段一：匀速上升
          </button>
          <button
            onClick={() => setActiveTab('加速阶段受力图')}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
              activeTab === '加速阶段受力图' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            阶段二：加速上升
          </button>
        </div>

        <div className="flex-1 min-h-0 relative flex justify-center items-center">
          <FreeBodyDiagram width={800} height={600} showGrid={false}>
            {/* 绳索 */}
            <line x1={CENTER_X} y1={0} x2={CENTER_X} y2={CENTER_Y - BOX_SIZE/2} stroke="#94a3b8" strokeWidth={4} />
            
            {/* 重物 */}
            <rect 
              x={CENTER_X - BOX_SIZE/2} 
              y={CENTER_Y - BOX_SIZE/2} 
              width={BOX_SIZE} 
              height={BOX_SIZE} 
              fill="#3b82f6" 
              rx={8} 
            />

            {/* 运动状态指示：速度与加速度箭头 */}
            <ForceArrow 
              x={CENTER_X + BOX_SIZE} 
              y={CENTER_Y} 
              magnitude={60} 
              angle={270} 
              color="#34d399" 
              label="v" 
              dashed 
            />
            {activeTab === '加速阶段受力图' && (
              <ForceArrow 
                x={CENTER_X + BOX_SIZE + 40} 
                y={CENTER_Y} 
                magnitude={40} 
                angle={270} 
                color="#f59e0b" 
                label="a" 
                dashed 
              />
            )}
            
            {/* 动态绘制学生的受力选择 */}
            {currentSelection.gravity && (
              <ForceArrow 
                x={CENTER_X} 
                y={CENTER_Y} 
                magnitude={100} 
                angle={90} 
                color="#ef4444" 
                label="G" 
              />
            )}
            {currentSelection.tension && (
              <ForceArrow 
                x={CENTER_X} 
                y={CENTER_Y - BOX_SIZE/2} 
                magnitude={currentSelection.relation === '>' ? 150 : (currentSelection.relation === '<' ? 50 : 100)} 
                angle={270} 
                color="#4ade80" 
                label="T" 
              />
            )}
            {currentSelection.fakeForce && (
              <ForceArrow 
                x={CENTER_X - 20} 
                y={CENTER_Y} 
                magnitude={80} 
                angle={270} 
                color="#a855f7" 
                label="运动力" 
                dashed
              />
            )}
          </FreeBodyDiagram>
        </div>
      </div>

      {/* 右侧：交互区与反馈区 */}
      <aside style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(15,23,42,0.8)', borderLeft: '1px solid rgba(255,255,255,0.08)' }} className="lg:col-span-1 h-full overflow-y-auto">
        
        {/* 选择控制区 */}
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-6 text-xl text-blue-300 border-b border-white/10 pb-2">受力选择 ({activeTab.replace('受力图', '')})</h3>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-slate-400 text-sm font-semibold">1. 勾选存在的力</h4>
              
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={currentSelection.gravity} 
                  onChange={(e) => updateSelection({ gravity: e.target.checked })} 
                  className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/50"
                />
                <span className="text-lg">重力 <InlineMath math="G" /></span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={currentSelection.tension} 
                  onChange={(e) => updateSelection({ tension: e.target.checked })} 
                  className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/50"
                />
                <span className="text-lg">绳子拉力 <InlineMath math="T" /></span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={currentSelection.fakeForce} 
                  onChange={(e) => updateSelection({ fakeForce: e.target.checked })} 
                  className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-purple-500 focus:ring-purple-500/50"
                />
                <span className="text-lg text-purple-200">向上的运动力</span>
              </label>
            </div>

            {/* 大小关系选择，仅当两个真实力都被勾选时显式要求选择 */}
            <div className={`space-y-3 transition-opacity duration-300 ${currentSelection.gravity && currentSelection.tension ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <h4 className="text-slate-400 text-sm font-semibold">2. 选择大小关系</h4>
              
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer">
                  <input type="radio" name="relation" checked={currentSelection.relation === '='} onChange={() => updateSelection({ relation: '=' })} className="w-4 h-4 text-blue-500" />
                  <span>拉力等于重力 (<InlineMath math="T = G" />)</span>
                </label>
                <label className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer">
                  <input type="radio" name="relation" checked={currentSelection.relation === '>'} onChange={() => updateSelection({ relation: '>' })} className="w-4 h-4 text-blue-500" />
                  <span>拉力大于重力 (<InlineMath math="T > G" />)</span>
                </label>
                <label className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer">
                  <input type="radio" name="relation" checked={currentSelection.relation === '<'} onChange={() => updateSelection({ relation: '<' })} className="w-4 h-4 text-blue-500" />
                  <span>拉力小于重力 (<InlineMath math="T < G" />)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 反馈与结果区 */}
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

export default P04VerticalLift;
