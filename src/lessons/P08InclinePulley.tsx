import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Info, CheckCircle2, XCircle, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import { evaluateRule } from '../physics/judgingEngine';
import { StudentForce, JudgingContext } from '../data/types';
import p08Data from '../data/problems/p08.json';

type SelectionState = {
  // A 的力
  gA: boolean;
  nA: boolean;
  fA: boolean;
  tA: boolean;
  // B 的力
  gB: boolean;
  tB: boolean;
};

const P08InclinePulley: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab] = useState<'物块A和B的受力图'>('物块A和B的受力图');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 物理参数 (固定的，用于演示)
  const physicsParams = {
    mA: 5,
    mB: 8,
    theta: 30,
    mu: 0.3
  };

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
    gA: false, nA: false, fA: false, tA: false,
    gB: false, tB: false
  });

  const updateSelection = (updates: Partial<SelectionState>) => {
    setSelection(prev => ({ ...prev, ...updates }));
  };

  const studentForces = useMemo<StudentForce[]>(() => {
    const forces: StudentForce[] = [];
    const stage = '物块A和B的受力图';

    // A 的受力
    if (selection.gA) forces.push({ id: 'ga', type: 'Gravity', label: 'G_A', stage, targetObject: 'A', angle: 270 });
    if (selection.nA) forces.push({ id: 'na', type: 'Normal', label: 'N_A', stage, targetObject: 'A', relativeTo: 'Surface', isPerpendicular: true });
    if (selection.tA) forces.push({ id: 'ta', type: 'Tension', label: 'T_A', stage, targetObject: 'A', angle: 30 }); // 沿斜面向上 (30度)
    if (selection.fA) {
      // 摩擦力方向判定由引擎完成，这里我们假设学生画了一个力。
      // 为了让引擎能判别，我们需要填入角度或相对方向。
      // 在此场景中，mB=8, mA*sin30=2.5，明显 B 下滑带动 A 上滑，摩擦力应沿斜面向下。
      // 引擎会根据 DIRECTION_CONDITIONAL 判别。
      forces.push({ id: 'fa', type: 'Friction', label: 'f_A', stage, targetObject: 'A', angle: 210 }); // 假设学生画了向下的摩擦力
    }

    // B 的受力
    if (selection.gB) forces.push({ id: 'gb', type: 'Gravity', label: 'G_B', stage, targetObject: 'B', angle: 270 });
    if (selection.tB) forces.push({ id: 'tb', type: 'Tension', label: 'T_B', stage, targetObject: 'B', angle: 90 }); // 向上

    return forces;
  }, [selection]);

  const judgeResults = useMemo(() => {
    const context: JudgingContext = {
      expectedTarget: '物块A和B的受力图',
      expectedStage: '物块A和B的受力图',
      physicsParams: physicsParams
    };

    return p08Data.judgeRules.map(rule => {
      const result = evaluateRule(rule, studentForces, context);
      return { rule, result };
    });
  }, [studentForces]);

  const allPassed = judgeResults.every(r => r.result.passed);

  // SVG Drawing
  const CENTER_X = 350;
  const CENTER_Y = 450;
  const THETA = 30;
  const thetaRad = (THETA * Math.PI) / 180;
  
  const INCLINE_LEN = 500;
  const PULLEY_X = CENTER_X + INCLINE_LEN * Math.cos(thetaRad);
  const PULLEY_Y = CENTER_Y - INCLINE_LEN * Math.sin(thetaRad);

  const BALL_A_X = CENTER_X + 250 * Math.cos(thetaRad);
  const BALL_A_Y = CENTER_Y - 250 * Math.sin(thetaRad);

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
            <h2 className="text-2xl font-bold">{p08Data.title}</h2>
          </div>
          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        <div className="flex-1 min-h-0 relative flex justify-center items-center">
          <FreeBodyDiagram width={1000} height={800} showGrid={false}>
            {/* 斜面 */}
            <path d={`M ${CENTER_X} ${CENTER_Y} L ${PULLEY_X} ${PULLEY_Y} L ${PULLEY_X} ${CENTER_Y} Z`} fill="rgba(255,255,255,0.05)" stroke="white" strokeWidth={2} />
            
            {/* 滑轮 */}
            <circle cx={PULLEY_X + 15} cy={PULLEY_Y - 15} r={20} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={3} />
            <circle cx={PULLEY_X + 15} cy={PULLEY_Y - 15} r={5} fill="rgba(255,255,255,0.4)" />

            {/* 绳子 A-Pulley */}
            <line x1={BALL_A_X} y1={BALL_A_Y - 20} x2={PULLEY_X + 15} y2={PULLEY_Y - 35} stroke="#94a3b8" strokeWidth={2} />
            {/* 绳子 Pulley-B */}
            <line x1={PULLEY_X + 35} y1={PULLEY_Y - 15} x2={PULLEY_X + 35} y2={PULLEY_Y + 150} stroke="#94a3b8" strokeWidth={2} />

            {/* 物体 A */}
            <g transform={`translate(${BALL_A_X}, ${BALL_A_Y}) rotate(${-THETA})`}>
              <rect x={-40} y={-40} width={80} height={40} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth={2} rx={4} />
              <text x={0} y={-15} fill="white" textAnchor="middle" transform={`rotate(${THETA})`} fontWeight="bold">A</text>
              {/* 受力 */}
              <g transform="translate(0, -20) rotate(30)">
                {selection.gA && <ForceArrow x={0} y={0} magnitude={100} angle={90} color="#ef4444" label="G_A" />}
                {selection.nA && <ForceArrow x={0} y={0} magnitude={80} angle={270} color="#60a5fa" label="N_A" />}
                {selection.tA && <ForceArrow x={0} y={0} magnitude={110} angle={330} color="#ec4899" label="T" />}
                {selection.fA && <ForceArrow x={0} y={0} magnitude={50} angle={150} color="#f59e0b" label="f" />}
              </g>
            </g>

            {/* 物体 B */}
            <g transform={`translate(${PULLEY_X + 35}, ${PULLEY_Y + 190})`}>
              <rect x={-30} y={-40} width={60} height={80} fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth={2} rx={4} />
              <text x={0} y={5} fill="white" textAnchor="middle" fontWeight="bold">B</text>
              {/* 受力 */}
              <g transform="translate(0, 0)">
                {selection.gB && <ForceArrow x={0} y={0} magnitude={130} angle={90} color="#ef4444" label="G_B" />}
                {selection.tB && <ForceArrow x={0} y={0} magnitude={110} angle={270} color="#ec4899" label="T" />}
              </g>
            </g>
          </FreeBodyDiagram>
        </div>
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(15,23,42,0.8)', borderLeft: '1px solid rgba(255,255,255,0.08)' }} className="lg:col-span-1 h-full overflow-y-auto">
        <div style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-6 text-xl text-blue-300 border-b border-white/10 pb-2">复合连接体受力</h3>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-950/30 border border-blue-500/20 rounded-xl space-y-3 text-xs">
              <h4 className="text-blue-300 font-bold flex items-center gap-2 text-sm"><Info size={16}/> 场景参数</h4>
              <p className="flex justify-between"><span>A质量 <InlineMath math="m_A" />:</span> <span>{physicsParams.mA} kg</span></p>
              <p className="flex justify-between"><span>B质量 <InlineMath math="m_B" />:</span> <span>{physicsParams.mB} kg</span></p>
              <p className="flex justify-between"><span>斜面倾角 <InlineMath math="\theta" />:</span> <span>{physicsParams.theta}°</span></p>
              <p className="flex justify-between"><span>摩擦因数 <InlineMath math="\mu" />:</span> <span>{physicsParams.mu}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-slate-400 text-sm font-semibold mb-2">物块 A 受力：</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gA', label: '重力 G_A' },
                    { id: 'nA', label: '支持力 N_A' },
                    { id: 'tA', label: '绳子拉力 T' },
                    { id: 'fA', label: '摩擦力 f' },
                  ].map(item => (
                    <label key={item.id} className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/5 hover:bg-white/10 cursor-pointer">
                      <input type="checkbox" checked={(selection as any)[item.id]} onChange={(e) => updateSelection({ [item.id]: e.target.checked })} />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-slate-400 text-sm font-semibold mb-2">物块 B 受力：</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gB', label: '重力 G_B' },
                    { id: 'tB', label: '绳子拉力 T' },
                  ].map(item => (
                    <label key={item.id} className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/5 hover:bg-white/10 cursor-pointer">
                      <input type="checkbox" checked={(selection as any)[item.id]} onChange={(e) => updateSelection({ [item.id]: e.target.checked })} />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
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
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <XCircle size={18} className="text-red-500" />
                    </div>
                  )}
                  <p className={`font-semibold text-sm ${res.result.passed ? 'text-emerald-300' : 'text-red-300'}`}>
                    {res.rule.expect}
                  </p>
                </div>
                {!res.result.passed && res.result.hint && (
                  <div className="ml-10 text-xs text-red-200/90 bg-red-950/60 p-2 rounded-lg border border-red-900/50">
                    💡 提示：{res.result.hint}
                  </div>
                )}
              </div>
            ))}
          </div>

          {allPassed && (
            <div className="mt-6 p-4 bg-emerald-600/20 border border-emerald-500/50 rounded-xl text-center shadow-lg">
              <p className="text-emerald-400 font-bold text-base flex items-center justify-center gap-2">
                <CheckCircle2 size={20} /> 复合模型分析正确！
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default P08InclinePulley;
