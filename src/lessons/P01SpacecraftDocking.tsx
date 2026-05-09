import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Info, CheckCircle2, XCircle, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext } from '../data/types';
import p01Data from '../data/problems/p01.json';

type SelectionState = {
  gravity: boolean;
  normal: boolean;
  appliedForceF: boolean; // 外部推力 F
  interactionForce: boolean; // 相互作用力 (飞船与空间站之间)
};

const P01SpacecraftDocking: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'整体受力图' | '空间站受力图'>('整体受力图');
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

  // 两个阶段独立的选择状态
  const [selections, setSelections] = useState<Record<string, SelectionState>>({
    '整体受力图': { gravity: false, normal: false, appliedForceF: false, interactionForce: false },
    '空间站受力图': { gravity: false, normal: false, appliedForceF: false, interactionForce: false },
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
      forces.push({
        id: 'g', type: 'Gravity', label: 'G_总', stage, angle: 270 // 向下
      });
    }
    if (currentSelection.normal) {
      forces.push({
        id: 'n', type: 'Normal', label: 'N_总', stage, angle: 90 // 向上
      });
    }
    if (currentSelection.appliedForceF) {
      forces.push({
        id: 'f', type: 'Applied', label: 'F', stage, angle: 0 // 向右
      });
    }
    if (currentSelection.interactionForce) {
      // 相互作用力
      if (activeTab === '整体受力图') {
        // 在整体图中，这个力被视为内力
        forces.push({
          id: 'f_int', type: 'Applied', label: 'f_内', stage, angle: 0,
          sourceObject: '飞船', targetObject: '空间站' // 标记为系统内物体之间的力
        });
      } else {
        // 在空间站图中，这是来自飞船的外力
        forces.push({
          id: 'f_ext', type: 'Applied', label: 'F_引', stage, angle: 0,
          sourceObject: '飞船', targetObject: '空间站'
        });
      }
    }
    return forces;
  }, [activeTab, currentSelection]);

  const judgeResults = useMemo(() => {
    const context: JudgingContext = {
      expectedTarget: activeTab,
      expectedStage: activeTab,
    };

    return p01Data.judgeRules
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
  const SHIP_W = 120;
  const SHIP_H = 80;
  const STATION_W = 180;
  const STATION_H = 120;

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
            <h2 className="text-2xl font-bold">{p01Data.title}</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* 研究对象切换 */}
        <div className="flex gap-2 z-10">
          {(['整体受力图', '空间站受力图'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              {tab.replace('受力图', '')}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 relative flex justify-center items-center">
          <FreeBodyDiagram width={800} height={600} showGrid={false}>
            {/* 地面/轨道线 */}
            <line x1={50} y1={CENTER_Y + 100} x2={750} y2={CENTER_Y + 100} stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeDasharray="5 5" />
            
            {/* 飞船 (左) */}
            <g transform={`translate(${CENTER_X - SHIP_W/2 - STATION_W/2}, ${CENTER_Y + 100 - SHIP_H})`} opacity={activeTab === '整体受力图' ? 1 : 0.3}>
              <rect width={SHIP_W} height={SHIP_H} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth={2} rx={4} />
              <text x={SHIP_W/2} y={SHIP_H/2 + 5} fill="#3b82f6" textAnchor="middle" fontWeight="bold">飞船 (m)</text>
              {/* 外部推力 F 作用在飞船上 */}
              <ForceArrow x={0} y={SHIP_H/2} magnitude={60} angle={180} color="#fbbf24" label="F" dashed />
            </g>

            {/* 对接面 */}
            <line x1={CENTER_X - STATION_W/2} y1={CENTER_Y + 100 - STATION_H} x2={CENTER_X - STATION_W/2} y2={CENTER_Y + 100} stroke="#94a3b8" strokeWidth={4} strokeDasharray="2 2" />

            {/* 空间站 (右) */}
            <g transform={`translate(${CENTER_X - STATION_W/2}, ${CENTER_Y + 100 - STATION_H})`}>
              <rect width={STATION_W} height={STATION_H} fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth={2} rx={4} />
              <text x={STATION_W/2} y={STATION_H/2 + 5} fill="#a855f7" textAnchor="middle" fontWeight="bold">空间站 (M)</text>
            </g>

            {/* 受力箭头绘制 */}
            <g transform={`translate(${activeTab === '整体受力图' ? CENTER_X - STATION_W/2 : CENTER_X}, ${CENTER_Y + 100 - STATION_H/2})`}>
              {currentSelection.gravity && (
                <ForceArrow x={0} y={0} magnitude={100} angle={90} color="#ef4444" label="G" />
              )}
              {currentSelection.normal && (
                <ForceArrow x={0} y={0} magnitude={100} angle={270} color="#60a5fa" label="N" />
              )}
              {currentSelection.appliedForceF && (
                <ForceArrow x={activeTab === '整体受力图' ? -SHIP_W : -STATION_W/2} y={0} magnitude={120} angle={0} color="#fbbf24" label="F" />
              )}
              {currentSelection.interactionForce && (
                <ForceArrow x={activeTab === '整体受力图' ? 0 : -STATION_W/2} y={0} magnitude={80} angle={0} color="#ec4899" label={activeTab === '整体受力图' ? 'f_内' : 'F_引'} dashed={activeTab === '整体受力图'} />
              )}
            </g>
          </FreeBodyDiagram>
        </div>
      </div>

      {/* 右侧：交互区 */}
      <aside style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(15,23,42,0.8)', borderLeft: '1px solid rgba(255,255,255,0.08)' }} className="lg:col-span-1 h-full overflow-y-auto">
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-6 text-xl text-blue-300 border-b border-white/10 pb-2">研究对象：{activeTab.replace('受力图', '')}</h3>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-950/30 border border-blue-500/20 rounded-xl space-y-2">
              <h4 className="text-blue-300 text-sm font-bold flex items-center gap-2">
                <Info size={16} /> 提示
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeTab === '整体受力图' 
                  ? '将飞船与空间站视为整体时，它们之间的相互作用力属于系统内力。' 
                  : '仅以空间站为研究对象时，飞船对它的推力是改变其运动状态的外力。'}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-slate-400 text-sm font-semibold">请勾选应画出的力：</h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'gravity', label: '重力 G', symbol: 'G' },
                  { id: 'normal', label: '支持力 N', symbol: 'N' },
                  { id: 'appliedForceF', label: '恒定推力 F', symbol: 'F' },
                  { id: 'interactionForce', label: activeTab === '整体受力图' ? '内部相互作用力' : '飞船对空间站推力', symbol: 'F_{引}' },
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
                <CheckCircle2 size={24} /> {activeTab.replace('受力图', '')}分析正确！
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default P01SpacecraftDocking;
