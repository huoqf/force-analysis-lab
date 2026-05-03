import React, { useState } from 'react';
import { ChevronLeft, Info } from 'lucide-react';
import FreeBodyDiagram from '../components/Scene/FreeBodyDiagram';
import ForceArrow from '../components/Scene/ForceArrow';
import ParameterSlider from '../components/Control/ParameterSlider';
import { calculateWeight, formatPhysicsValue } from '../physics/mechanics';

const HorizontalStatic: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mass, setMass] = useState(10);
  
  const weight = calculateWeight(mass);
  const normalForce = weight; // 平衡状态

  return (
    <div className="grid lg:grid-cols-[1fr_350px] h-[calc(100vh-40px)] gap-6 p-6">
      <div className="flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={20} /> 返回
          </button>
          <h2 className="text-2xl font-bold">水平面静止模型</h2>
        </header>

        <FreeBodyDiagram>
          {/* 地面 */}
          <line x1="200" y1="500" x2="1000" y2="500" stroke="white" strokeWidth="4" />
          
          {/* 物体 (矩形) */}
          <rect x="500" y="380" width="200" height="120" fill="rgba(0, 120, 212, 0.3)" stroke="rgba(0, 120, 212, 0.8)" strokeWidth="3" />
          
          {/* 重力 G */}
          <ForceArrow x={600} y={440} magnitude={weight} angle={90} color="#ff4d4d" label={`G = ${formatPhysicsValue(weight)}N`} />
          
          {/* 支持力 N */}
          <ForceArrow x={600} y={440} magnitude={normalForce} angle={270} color="#4d94ff" label={`N = ${formatPhysicsValue(normalForce)}N`} />
        </FreeBodyDiagram>

        <div className="glass-panel p-6 bg-blue-500/5 border-blue-500/20">
          <h4 className="font-bold flex items-center gap-2 mb-2">
            <Info size={16} className="text-blue-400" /> 分析结论
          </h4>
          <p className="text-sm text-white/70 leading-relaxed">
            在水平面上静止的物体，受到垂直向下的**重力 (G)** 和垂直向上的**支持力 (N)**。
            由于物体在竖直方向上处于平衡状态（加速度为 0），根据牛顿第二定律有：
            <br />
            <span className="text-win11-blue font-mono block my-2">ΣF_y = N - G = 0  =&gt;  N = G</span>
          </p>
        </div>
      </div>

      <aside className="glass-panel p-8 flex flex-col">
        <h3 className="font-bold mb-8 text-lg">实验参数</h3>
        <ParameterSlider 
          label="物体质量" symbol="m" unit="kg" 
          value={mass} min={1} max={100} 
          onChange={setMass} 
        />
        
        <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">重力大小</span>
            <span className="font-mono text-red-400">{formatPhysicsValue(weight)} N</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">支持力大小</span>
            <span className="font-mono text-blue-400">{formatPhysicsValue(normalForce)} N</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default HorizontalStatic;
