import React, { useState } from 'react';
import { ChevronLeft, Info } from 'lucide-react';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateInclineForces, calculateInclineAccel, formatPhysicsValue } from '../physics/mechanics';

const InclineFrictionless: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mass, setMass] = useState(10);
  const [angle, setAngle] = useState(30);
  
  const { gParallel, gNormal, weight } = calculateInclineForces(mass, angle);
  const accel = calculateInclineAccel(angle);

  // 坐标转换计算
  const angleRad = (angle * Math.PI) / 180;
  
  return (
    <div className="grid lg:grid-cols-[1fr_350px] h-[calc(100vh-40px)] gap-6 p-6">
      <div className="flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={20} /> 返回
          </button>
          <h2 className="text-2xl font-bold">斜面无摩擦模型</h2>
        </header>

        <FreeBodyDiagram>
          {/* 斜面 */}
          <path 
            d={`M 200 650 L 1000 650 L 1000 ${650 - 800 * Math.tan(angleRad)} Z`} 
            fill="rgba(255, 255, 255, 0.05)" 
            stroke="white" 
            strokeWidth="3" 
          />
          
          {/* 物体放置在斜面中心 (X=600) */}
          <g transform={`translate(600, ${650 - 400 * Math.tan(angleRad)}) rotate(${-angle})`}>
            <rect x="-60" y="-80" width="120" height="80" fill="rgba(0, 120, 212, 0.3)" stroke="rgba(0, 120, 212, 0.8)" strokeWidth="3" />
          </g>

          {/* 全局坐标系下的受力图 */}
          {/* 力的作用点定在物体的重心 */}
          <g transform={`translate(600, ${650 - 400 * Math.tan(angleRad) - 40 * Math.cos(angleRad)})`}>
            {/* 真实力：重力 G (向下 90度) */}
            <ForceArrow x={0} y={0} magnitude={weight} angle={90} color="#ff4d4d" label={`G`} />
            
            {/* 真实力：支持力 N (垂直斜面向上 270+angle 度) */}
            <ForceArrow x={0} y={0} magnitude={gNormal} angle={270 + angle} color="#4d94ff" label={`N`} />

            {/* 重力分解：沿斜面向下分力 G1 (向左下 180+angle 度) */}
            <ForceArrow x={0} y={0} magnitude={gParallel} angle={180 + angle} color="#ff9f4d" label={`G1`} scale={1.5} />
            
            {/* 重力分解：垂直斜面向下分力 G2 (向右下 90+angle 度) */}
            <ForceArrow x={0} y={0} magnitude={gNormal} angle={90 + angle} color="#ff9f4d" label={`G2`} scale={1.5} />
          </g>
        </FreeBodyDiagram>

        <div className="glass-panel p-6 bg-emerald-500/5 border-emerald-500/20">
          <h4 className="font-bold flex items-center gap-2 mb-2">
            <Info size={16} className="text-emerald-400" /> 物理要点
          </h4>
          <div className="text-sm text-white/70 space-y-2">
            <p>1. **受力分析**：物体只受重力 $G$ 和支持力 $N$。注意没有“下滑力”，下滑效果是由重力的分力产生的。</p>
            <p>2. **正交分解**：将重力沿斜面分解为 $G_1 = mg \sin\theta$，垂直斜面分解为 $G_2 = mg \cos\theta$。</p>
            <p>3. **运动方程**：沿斜面方向 $mg \sin\theta = ma$，得加速度 $a = g \sin\theta$。</p>
          </div>
        </div>
      </div>

      <aside className="glass-panel p-8 flex flex-col">
        <h3 className="font-bold mb-8 text-lg">实验参数</h3>
        <ParameterSlider 
          label="物体质量" symbol="m" unit="kg" 
          value={mass} min={1} max={100} 
          onChange={setMass} 
        />
        <ParameterSlider 
          label="斜面倾角" symbol="θ" unit="°" 
          value={angle} min={0} max={90} 
          onChange={setAngle} 
        />
        
        <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">加速度 a</span>
            <span className="font-mono text-emerald-400">{formatPhysicsValue(accel)} m/s²</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">垂直压力 N</span>
            <span className="font-mono text-blue-400">{formatPhysicsValue(gNormal)} N</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default InclineFrictionless;
