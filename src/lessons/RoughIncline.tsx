import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Info, Maximize, Minimize } from 'lucide-react';
import { InlineMath } from 'react-katex';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateRoughInclinePhysics, formatPhysicsValue } from '../physics/mechanics';

const RoughIncline: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mass, setMass] = useState(10);
  const [angle, setAngle] = useState(30);
  const [muStatic, setMuStatic] = useState(0.6);
  const [muKinetic, setMuKinetic] = useState(0.4);
  const [hasInitialVelocity, setHasInitialVelocity] = useState(false);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 约束 muKinetic <= muStatic
  useEffect(() => {
    if (muKinetic > muStatic) {
      setMuKinetic(muStatic);
    }
  }, [muStatic, muKinetic]);
  
  const { 
    gParallel, gNormal, normalForce, 
    maxStaticFriction, kineticFriction, frictionForce, 
    isSliding, accel, weight 
  } = calculateRoughInclinePhysics(mass, angle, muStatic, muKinetic, hasInitialVelocity);

  const angleRad = (angle * Math.PI) / 180;

  const toggleFullscreen = () => {
    const element = containerRef.current as any;
    if (!element) return;

    const isFS = document.fullscreenElement || 
                 (document as any).webkitFullscreenElement || 
                 (document as any).mozFullScreenElement || 
                 (document as any).msFullscreenElement;

    if (!isFS) {
      const requestMethod = element.requestFullscreen || 
                           element.webkitRequestFullscreen || 
                           element.mozRequestFullScreen || 
                           element.msRequestFullscreen;
      if (requestMethod) {
        requestMethod.call(element).catch((err: any) => {
          console.error(`Error: ${err.message}`);
        });
      }
    } else {
      const exitMethod = document.exitFullscreen || 
                        (document as any).webkitExitFullscreen || 
                        (document as any).mozCancelFullScreen || 
                        (document as any).msExitFullscreen;
      if (exitMethod) {
        exitMethod.call(document);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: isFullscreen || window.innerWidth > 1024 ? '2fr 1fr' : '1fr',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#020617'
      }}
      className="bg-slate-950 text-white"
    >
      {/* 左侧主显示区 (2/3) */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          gap: '1rem',
          minHeight: 0,
          width: '100%'
        }}
        className="lg:col-span-2"
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft size={20} /> 返回
            </button>
            <h2 className="text-2xl font-bold">斜面摩擦模型</h2>
          </div>
          
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm border border-white/10"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? '退出全屏' : '全屏演示'}
          </button>
        </header>

        <div className="flex-1 min-h-0 relative">
          {/* 左上角图例说明 */}
          <div className="absolute top-4 left-4 p-3 bg-slate-900/80 rounded-lg border border-white/10 text-xs text-white/70">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-0.5 bg-red-500"></div> 真实力: 重力
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-0.5 bg-blue-400"></div> 真实力: 支持力
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-0.5 bg-yellow-500"></div> 真实力: 摩擦力
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 border-b border-dashed border-orange-400"></div> 辅助: 重力正交分解 (非独立真实力)
            </div>
          </div>

          <FreeBodyDiagram>
            {/* 斜面 */}
            <path 
              d={`M 200 700 L 1000 700 L 1000 ${700 - 800 * Math.tan(angleRad)} Z`} 
              fill="rgba(255, 255, 255, 0.05)" 
              stroke="white" 
              strokeWidth="3" 
            />
            {/* 斜面粗糙示意图 */}
            <g transform={`translate(600, ${700 - 400 * Math.tan(angleRad)}) rotate(${-angle})`}>
               <path d="M -400 0 L 400 0" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5 5" />
            </g>
            
            {/* 物体放置在斜面中心 (X=600) */}
            <g transform={`translate(600, ${700 - 400 * Math.tan(angleRad)}) rotate(${-angle})`}>
              <rect 
                x="-60" y="-80" width="120" height="80" 
                fill={isSliding ? "rgba(52, 211, 153, 0.2)" : "rgba(0, 120, 212, 0.3)"} 
                stroke={isSliding ? "rgba(52, 211, 153, 0.8)" : "rgba(0, 120, 212, 0.8)"} 
                strokeWidth="3" 
              />
              
              {/* 运动虚影/特效（沿斜面） */}
              {isSliding && accel !== 0 && (
                <>
                  {accel > 0 ? (
                    // 加速下滑，虚影在左（上方）
                    <>
                      <line x1="-75" y1="-40" x2="-95" y2="-40" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="4 2" />
                      <line x1="-70" y1="-20" x2="-100" y2="-20" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="6 3" />
                      <line x1="-75" y1="-60" x2="-90" y2="-60" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="3 2" />
                    </>
                  ) : (
                    // 减速下滑，虚影在左（上方），但加速度向上
                    <>
                      <line x1="-75" y1="-40" x2="-95" y2="-40" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="4 2" />
                      <line x1="-70" y1="-20" x2="-100" y2="-20" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="6 3" />
                    </>
                  )}
                  {/* 加速度箭头 a (平行于斜面，沿斜面向下为 180，沿斜面向上为 0) */}
                  <ForceArrow x={0} y={-100} magnitude={Math.min(Math.abs(accel) * 15, 100)} angle={accel > 0 ? 180 : 0} color="#34d399" label="a" dashed />
                </>
              )}
              {isSliding && accel === 0 && (
                // 匀速下滑
                <>
                  <line x1="-75" y1="-40" x2="-95" y2="-40" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="4 2" />
                  <line x1="-70" y1="-20" x2="-100" y2="-20" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="2" strokeDasharray="6 3" />
                  <ForceArrow x={0} y={-100} magnitude={30} angle={180} color="#34d399" label="v(匀速)" dashed />
                </>
              )}
            </g>

            {/* 全局坐标系下的受力图 */}
            <g transform={`translate(${600 - 40 * Math.sin(angleRad)}, ${700 - 400 * Math.tan(angleRad) - 40 * Math.cos(angleRad)})`}>
              {/* 真实力：重力 G (向下 90度) */}
              <ForceArrow x={0} y={0} magnitude={weight} angle={90} color="#ff4d4d" label={`G`} />
              
              {/* 真实力：支持力 N (垂直斜面向上 270-angle 度) */}
              <ForceArrow x={0} y={0} magnitude={normalForce} angle={270 - angle} color="#60a5fa" label={`N`} />

              {/* 真实力：摩擦力 f (沿斜面向上 -angle 度) */}
              {frictionForce > 0 && (
                <ForceArrow x={0} y={0} magnitude={frictionForce} angle={-angle} color="#eab308" label={isSliding ? 'f(滑)' : 'f(静)'} />
              )}

              {/* 辅助力：重力分解 G1 (沿斜面向下 180-angle 度) */}
              <ForceArrow x={0} y={0} magnitude={gParallel} angle={180 - angle} color="#fb923c" label={`G_1(分力)`} scale={1.0} dashed opacity={0.6} />
              
              {/* 辅助力：重力分解 G2 (垂直斜面向下 90-angle 度) */}
              <ForceArrow x={0} y={0} magnitude={gNormal} angle={90 - angle} color="#fb923c" label={`G_2(分力)`} scale={1.0} dashed opacity={0.6} />
            </g>
          </FreeBodyDiagram>
        </div>
      </div>

      {/* 右侧控制面板 (1/3) */}
      <aside 
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        className="lg:col-span-1"
      >
        <div style={{ padding: '1.5rem' }}>
          <h3 className="font-bold mb-6 text-lg">实验参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ParameterSlider 
              label="物体质量" symbol="m" unit="kg" 
              value={mass} min={1} max={100} 
              onChange={setMass} 
            />
            <ParameterSlider 
              label="斜面倾角" symbol="θ" unit="°" 
              value={angle} min={0} max={89} 
              onChange={setAngle} 
            />
            <ParameterSlider 
              label="静摩擦因数" symbol="μ_s" unit="" 
              value={muStatic} min={0} max={1.0} step={0.05}
              onChange={setMuStatic} 
            />
            <ParameterSlider 
              label="动摩擦因数" symbol="μ_k" unit="" 
              value={muKinetic} min={0} max={1.0} step={0.05}
              onChange={(val) => setMuKinetic(Math.min(val, muStatic))} 
            />
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 mt-2">
              <input 
                type="checkbox" 
                id="init-vel"
                checked={hasInitialVelocity}
                onChange={(e) => setHasInitialVelocity(e.target.checked)}
                className="w-4 h-4 rounded text-win11-blue bg-slate-800 border-white/20 focus:ring-win11-blue focus:ring-offset-slate-900"
              />
              <label htmlFor="init-vel" className="text-sm cursor-pointer select-none">
                赋予沿斜面向下的初速度
              </label>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h4 className="font-bold flex items-center gap-2 mb-4">
            <Info size={16} className="text-emerald-400" /> 物理要点
          </h4>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p>1. **辅助分解**：将重力分解为下滑分力 <InlineMath math="G_1 = mg\sin\theta" /> 和压紧分力 <InlineMath math="G_2 = mg\cos\theta" />。注意它们不是真实存在的力。</p>
            <p>2. **静止判断 (启动临界角)**：当 <InlineMath math="G_1 \le \mu_s G_2" /> 即 <InlineMath math="\tan\theta \le \mu_s" /> 时，若无初速度则保持静止。</p>
            <p>3. **匀速下滑临界角**：若有初速度或曾启动，摩擦力转为滑动摩擦力 <InlineMath math="f_k = \mu_k G_2" />。当 <InlineMath math="\tan\theta = \mu_k" /> 时，<InlineMath math="a=0" /> 匀速下滑；若 <InlineMath math="\tan\theta < \mu_k" />，则减速直到停止。</p>
          </div>
        </div>
        
        <div style={{ marginTop: 'auto', padding: '1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>实时计算数据</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>运动状态</span>
              <span style={{ fontFamily: 'sans-serif', fontSize: '1rem', color: isSliding ? (accel === 0 ? '#60a5fa' : '#34d399') : '#f59e0b', fontWeight: 'bold' }}>
                {!isSliding ? '静止' : (Math.abs(accel) < 0.01 ? '匀速下滑' : (accel > 0 ? '加速下滑' : '减速下滑'))}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>下滑分力 G₁</span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.125rem', color: '#fb923c' }}>{formatPhysicsValue(gParallel)} N</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>最大静摩擦力</span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.125rem', color: !isSliding && Math.abs(gParallel - maxStaticFriction) < 0.01 ? '#ef4444' : '#eab308' }}>
                {formatPhysicsValue(maxStaticFriction)} N
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} title="实际受到的摩擦力">
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', borderBottom: '1px dashed rgba(255,255,255,0.3)', cursor: 'help' }}>
                {!isSliding ? '静摩擦力 f' : '滑动摩擦力 f_k'}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.125rem', color: '#eab308' }}>{formatPhysicsValue(frictionForce)} N</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>加速度 a</span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.125rem', color: '#34d399' }}>{formatPhysicsValue(accel)} m/s²</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default RoughIncline;
