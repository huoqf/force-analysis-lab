import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Info, CheckCircle2, XCircle, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext } from '../data/types';
import p05Data from '../data/problems/p05.json';

type SelectionState = {
  gravity: boolean;
  normal: boolean;
  friction: boolean;
  appliedF: boolean; // 推力 F (作用于 A)
  forceAB: boolean; // A 与 B 间作用力
  forceBC: boolean; // B 与 C 间作用力
};

const P05TripleBlocks: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'整体受力图' | '物块C受力图' | 'B+C部分整体受力图'>('整体受力图');
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
    '整体受力图': { gravity: false, normal: false, friction: false, appliedF: false, forceAB: false, forceBC: false },
    '物块C受力图': { gravity: false, normal: false, friction: false, appliedF: false, forceAB: false, forceBC: false },
    'B+C部分整体受力图': { gravity: false, normal: false, friction: false, appliedF: false, forceAB: false, forceBC: false },
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
      forces.push({ id: 'f', type: 'Friction', label: 'f', stage, angle: 180 });
    }
    if (currentSelection.appliedF) {
      forces.push({ id: 'F', type: 'Applied', label: 'F', stage, angle: 0 });
    }
    if (currentSelection.forceAB) {
      // A 与 B 间的作用力
      forces.push({ id: 'fab', type: 'Applied', label: 'F_{AB}', stage, angle: 0, sourceObject: 'A', targetObject: 'B' });
    }
    if (currentSelection.forceBC) {
      // B 与 C 间的作用力
      forces.push({ id: 'fbc', type: 'Applied', label: 'F_{BC}', stage, angle: 0, sourceObject: 'B', targetObject: 'C' });
    }
    return forces;
  }, [activeTab, currentSelection]);

  const judgeResults = useMemo(() => {
    const context: JudgingContext = {
      expectedTarget: activeTab,
      expectedStage: activeTab,
    };

    return p05Data.judgeRules
      .filter(rule => rule.appliesTo === activeTab)
      .map(rule => {
        const result = evaluateRule(rule, studentForces, context);
        return { rule, result };
      });
  }, [activeTab, studentForces]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // SVG Drawing
  const CENTER_X = 400;
  const CENTER_Y = 300;
  const BOX_SIZE = 80;
  const GAP = 5;

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
      <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', minHeight: 0 }} className="lg:col-span-2 relative">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-2xl font-bold">{p05Data.title}</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        {/* 研究对象选择器 */}
        <div className="flex gap-2 z-10">
          {(['整体受力图', 'B+C部分整体受力图', '物块C受力图'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              {tab.replace('受力图', '').replace('部分整体', '')}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 relative flex justify-center items-center">
          <FreeBodyDiagram width={800} height={600} showGrid={false}>
            {/* 地面 */}
            <line x1={100} y1={CENTER_Y + 100} x2={700} y2={CENTER_Y + 100} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            
            {/* 三物块 */}
            {/* Block A */}
            <g transform={`translate(${CENTER_X - BOX_SIZE * 1.5 - GAP}, ${CENTER_Y + 100 - BOX_SIZE})`} opacity={activeTab === '整体受力图' ? 1 : 0.2}>
              <rect width={BOX_SIZE} height={BOX_SIZE} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth={2} rx={8} />
              <text x={BOX_SIZE/2} y={BOX_SIZE/2 + 6} fill="#3b82f6" textAnchor="middle" fontWeight="bold">A</text>
              {/* External Push F */}
              <ForceArrow x={0} y={BOX_SIZE/2} magnitude={60} angle={180} color="#fbbf24" label="F" dashed />
            </g>

            {/* Block B */}
            <g transform={`translate(${CENTER_X - BOX_SIZE * 0.5}, ${CENTER_Y + 100 - BOX_SIZE})`} opacity={activeTab === '物块C受力图' ? 0.2 : 1}>
              <rect width={BOX_SIZE} height={BOX_SIZE} fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth={2} rx={8} />
              <text x={BOX_SIZE/2} y={BOX_SIZE/2 + 6} fill="#a855f7" textAnchor="middle" fontWeight="bold">B</text>
            </g>

            {/* Block C */}
            <g transform={`translate(${CENTER_X + BOX_SIZE * 0.5 + GAP}, ${CENTER_Y + 100 - BOX_SIZE})`}>
              <rect width={BOX_SIZE} height={BOX_SIZE} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth={2} rx={8} />
              <text x={BOX_SIZE/2} y={BOX_SIZE/2 + 6} fill="#10b981" textAnchor="middle" fontWeight="bold">C</text>
            </g>

            {/* 受力点绘制 */}
            <g transform={`translate(${
              activeTab === '整体受力图' ? CENTER_X : 
              activeTab === 'B+C部分整体受力图' ? CENTER_X + BOX_SIZE/2 : 
              CENTER_X + BOX_SIZE + GAP
            }, ${CENTER_Y + 100 - BOX_SIZE/2})`}>
              {currentSelection.gravity && <ForceArrow x={0} y={0} magnitude={100} angle={90} color="#ef4444" label="G" />}
              {currentSelection.normal && <ForceArrow x={0} y={0} magnitude={100} angle={270} color="#60a5fa" label="N" />}
              {currentSelection.friction && <ForceArrow x={0} y={0} magnitude={60} angle={180} color="#f59e0b" label="f" />}
              {currentSelection.appliedF && <ForceArrow x={activeTab === '整体受力图' ? -BOX_SIZE * 1.5 : 0} y={0} magnitude={120} angle={0} color="#fbbf24" label="F" />}
              {currentSelection.forceAB && <ForceArrow x={activeTab === 'B+C部分整体受力图' ? -BOX_SIZE/2 : 0} y={0} magnitude={90} angle={0} color="#ec4899" label="F_{AB}" dashed={activeTab === '整体受力图'} />}
              {currentSelection.forceBC && <ForceArrow x={activeTab === '物块C受力图' ? -BOX_SIZE/2 : 0} y={0} magnitude={60} angle={0} color="#ec4899" label="F_{BC}" dashed={activeTab !== '物块C受力图'} />}
            </g>
          </FreeBodyDiagram>
        </div>
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(15,23,42,0.8)', borderLeft: '1px solid rgba(255,255,255,0.08)' }} className="lg:col-span-1 h-full overflow-y-auto">
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-6 text-xl text-blue-300 border-b border-white/10 pb-2">研究对象：{activeTab.replace('受力图', '')}</h3>
          
          <div className="space-y-6">
            <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
              <p className="text-xs text-indigo-200 leading-relaxed">
                <strong>物理技巧：</strong>
                <br />
                - 整体法适用于不关心内部作用力、求整体加速度的情况。
                <br />
                - 隔离法适用于需要求解物体间相互作用力的情况。
                <br />
                - B+C 整体是一个“部分系统”，可以简化 A 对 B 推力的求解。
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-slate-400 text-sm font-semibold">识别并勾选受力：</h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'gravity', label: '重力 G', symbol: 'G' },
                  { id: 'normal', label: '地面对其支持力 N', symbol: 'N' },
                  { id: 'friction', label: '地面对其摩擦力 f', symbol: 'f' },
                  { id: 'appliedF', label: '水平外力 F', symbol: 'F' },
                  { id: 'forceAB', label: 'A 对 B 的推力', symbol: 'F_{AB}' },
                  { id: 'forceBC', label: 'B 对 C 的推力', symbol: 'F_{BC}' },
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
                <CheckCircle2 size={24} /> 分析完全正确！
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default P05TripleBlocks;
