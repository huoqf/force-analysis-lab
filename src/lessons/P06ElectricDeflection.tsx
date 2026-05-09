import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Info, CheckCircle2, XCircle, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext } from '../data/types';
import p06Data from '../data/problems/p06.json';

type SelectionState = {
  gravity: boolean;
  tension: boolean;
  electrostatic: boolean;
  magnitudeCorrect: boolean; // 用于模拟三力共点平衡的几何校验
};

const P06ElectricDeflection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab] = useState<'悬挂小球受力图'>('悬挂小球受力图');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const angle = 30; // 偏转角固定为 30 度

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
    tension: false,
    electrostatic: false,
    magnitudeCorrect: true, // 默认假设大小关系正确，仅作为演示逻辑
  });

  const updateSelection = (updates: Partial<SelectionState>) => {
    setSelection(prev => ({ ...prev, ...updates }));
  };

  const studentForces = useMemo<StudentForce[]>(() => {
    const forces: StudentForce[] = [];
    const stage = '悬挂小球受力图';

    if (selection.gravity) {
      forces.push({
        id: 'g', type: 'Gravity', label: 'G', stage, angle: 270 // 引擎约定 270 为向下
      });
    }
    if (selection.tension) {
      forces.push({
        id: 't', type: 'Tension', label: 'T', stage,
        relativeTo: 'String' // 引擎会根据 relativeTo 判别方向
      });
    }
    if (selection.electrostatic) {
      forces.push({
        id: 'fe', type: 'Electrostatic', label: 'F_e', stage,
        angle: 0 // 水平向右
      });
    }
    return forces;
  }, [selection]);

  const judgeResults = useMemo(() => {
    const context: JudgingContext = {
      expectedTarget: '悬挂小球受力图',
      expectedStage: '悬挂小球受力图',
    };

    return p06Data.judgeRules.map(rule => {
      const result = evaluateRule(rule, studentForces, context);
      return { rule, result };
    });
  }, [studentForces]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // SVG Drawing Constants
  const PIVOT_X = 400;
  const PIVOT_Y = 150;
  const ROPE_LENGTH = 300;
  const angleRad = (angle * Math.PI) / 180;
  
  const BALL_X = PIVOT_X + ROPE_LENGTH * Math.sin(angleRad);
  const BALL_Y = PIVOT_Y + ROPE_LENGTH * Math.cos(angleRad);

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
            <h2 className="text-2xl font-bold">{p06Data.title}</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        <div className="flex-1 min-h-0 relative flex justify-center items-center">
          <FreeBodyDiagram width={800} height={600} showGrid={false}>
            {/* 天花板 */}
            <rect x={PIVOT_X - 60} y={PIVOT_Y - 10} width={120} height={10} fill="rgba(255,255,255,0.1)" />
            
            {/* 另一个电荷 (固定在左侧或下方) */}
            <g transform={`translate(${PIVOT_X}, ${BALL_Y + 50})`}>
              <circle r={10} fill="#f59e0b" />
              <text y={25} x={-10} fill="#f59e0b" fontSize={12} fontWeight="bold">+Q</text>
              <path d="M-20,0 L20,0 M0,-20 L0,20" stroke="#f59e0b" strokeWidth={1} opacity={0.3} />
            </g>

            {/* 绳子 */}
            <line x1={PIVOT_X} y1={PIVOT_Y} x2={BALL_X} y2={BALL_Y} stroke="#94a3b8" strokeWidth={2} />
            
            {/* 悬挂小球 */}
            <circle cx={BALL_X} cy={BALL_Y} r={20} fill="#3b82f6" stroke="#60a5fa" strokeWidth={2} />
            <text x={BALL_X - 6} y={BALL_Y + 5} fill="white" fontSize={14} fontWeight="bold">+q</text>

            {/* 受力箭头绘制 (在小球中心) */}
            <g transform={`translate(${BALL_X}, ${BALL_Y})`}>
              {selection.gravity && (
                <ForceArrow x={0} y={0} magnitude={100} angle={90} color="#ef4444" label="G" />
              )}
              {selection.tension && (
                <ForceArrow x={0} y={0} magnitude={115} angle={270 - angle} color="#60a5fa" label="T" />
              )}
              {selection.electrostatic && (
                <ForceArrow x={0} y={0} magnitude={57} angle={0} color="#f59e0b" label="F_e" />
              )}
            </g>

            {/* 辅助线：平衡三角形示意 */}
            {selection.gravity && selection.tension && selection.electrostatic && (
              <g transform={`translate(${BALL_X + 80}, ${BALL_Y - 50})`} opacity={0.4}>
                <line x1={0} y1={0} x2={0} y2={60} stroke="#ef4444" strokeWidth={2} markerEnd="url(#arrowhead)" />
                <line x1={0} y1={60} x2={35} y2={60} stroke="#f59e0b" strokeWidth={2} markerEnd="url(#arrowhead)" />
                <line x1={35} y1={60} x2={0} y2={0} stroke="#60a5fa" strokeWidth={2} markerEnd="url(#arrowhead)" />
                <text x={-20} y={80} fill="white" fontSize={12}>三力合力为零</text>
              </g>
            )}
          </FreeBodyDiagram>
        </div>
      </div>

      {/* 右侧：交互区 */}
      <aside style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(15,23,42,0.8)', borderLeft: '1px solid rgba(255,255,255,0.08)' }} className="lg:col-span-1 h-full overflow-y-auto">
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-6 text-xl text-blue-300 border-b border-white/10 pb-2">受力选择</h3>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-slate-400 text-sm font-semibold">1. 识别并勾选受力</h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'gravity', label: '重力 G', symbol: 'G' },
                  { id: 'tension', label: '绳子拉力 T', symbol: 'T' },
                  { id: 'electrostatic', label: '库仑力 F_e', symbol: 'F_e' },
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

            <div className="p-4 bg-blue-950/30 border border-blue-500/20 rounded-xl space-y-2">
              <h4 className="text-blue-300 text-sm font-bold flex items-center gap-2">
                <Info size={16} /> 物理知识点
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                悬挂小球处于平衡状态，受到的重力、绳子拉力和库仑力（静电力）三个共点力合力为零。
                <br /><br />
                由于两球带同种电荷，静电力表现为斥力，方向水平向右。
              </p>
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
                <CheckCircle2 size={24} /> 受力分析完全正确！
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default P06ElectricDeflection;
