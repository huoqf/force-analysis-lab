import React from 'react';
import { ChevronLeft, Info } from 'lucide-react';

const SevenSteps: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const steps = [
    { title: '确定研究对象', desc: '明确分析的是哪个物体，将其从周围环境中“隔离”出来。' },
    { title: '按顺序找力', desc: '先场力（重力）、再接触力（弹力、摩擦力）、最后外力。' },
    { title: '画受力示意图', desc: '在物体的重心画出所有的力的矢量箭头。' },
    { title: '建立坐标系', desc: '通常沿运动方向或加速度方向建立正交坐标轴。' },
    { title: '正交分解', desc: '将不在坐标轴上的力分解到 x 轴和 y 轴上。' },
    { title: '列方程', desc: '根据牛顿第二定律 $\\sum F = ma$ 列出方程组。' },
    { title: '求解并讨论', desc: '计算出未知量，并检查结果是否符合物理常识。' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors"
      >
        <ChevronLeft size={20} /> 返回目录
      </button>

      <h1 className="text-3xl font-bold mb-12 flex items-center gap-4">
        受力分析七步法
        <span className="text-xs font-normal bg-win11-blue/20 text-win11-blue px-2 py-1 rounded">理论核心</span>
      </h1>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="glass-panel p-6 flex gap-6 items-start hover:bg-white/5 transition-colors">
            <div className="bg-win11-blue text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold">
              {index + 1}
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-white/60 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 flex gap-4">
        <Info className="text-amber-500 shrink-0" />
        <div className="text-sm text-amber-200/80">
          <p className="font-bold mb-1">小贴士：</p>
          对于高中生来说，最容易漏掉的是接触力。记住：没有接触就没有弹力和摩擦力（场力除外）。
        </div>
      </div>
    </div>
  );
};

export default SevenSteps;
