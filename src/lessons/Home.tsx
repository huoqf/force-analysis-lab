import React from 'react';
import { BookOpen, Activity, Info, ChevronRight, Zap, RotateCw, Share2, Layers, MoveRight, Boxes, Target, Cpu, ArrowRight } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const allCards = [
    {
      id: 'seven-steps',
      title: '受力分析七步法',
      desc: '掌握通用的力学解题思路，建立规范的分析习惯。从研究对象选择到牛顿定律应用，全流程解析。',
      icon: <BookOpen className="text-purple-400" size={28} />,
      color: 'from-purple-500/20 to-purple-600/5'
    },
    {
      id: 'horizontal-static',
      title: '水平面静止模型',
      desc: '理解重力与支持力的平衡，最基础的分析入门。',
      icon: <Activity className="text-blue-400" />,
      color: 'from-blue-500/20 to-blue-600/5'
    },
    {
      id: 'incline-frictionless',
      title: '斜面无摩擦模型',
      desc: '学习重力的正交分解，理解分力与加速度的关系。',
      icon: <Activity className="text-emerald-400" />,
      color: 'from-emerald-500/20 to-emerald-600/5'
    },
    {
      id: 'rough-horizontal',
      title: '粗糙水平面模型',
      desc: '探索摩擦力与外力的动态关系，学习滑动与静止状态。',
      icon: <Activity className="text-amber-400" />,
      color: 'from-amber-500/20 to-amber-600/5'
    },
    {
      id: 'rough-incline',
      title: '斜面摩擦模型',
      desc: '进阶：重力正交分解与双摩擦系数临界角分析。',
      icon: <Activity className="text-rose-400" />,
      color: 'from-rose-500/20 to-rose-600/5'
    },
    {
      id: 'connected-horizontal',
      title: '双物体连接模型',
      desc: '掌握整体法与隔离法，理解内力与外力的区别。',
      icon: <Activity className="text-pink-400" />,
      color: 'from-pink-500/20 to-pink-600/5'
    },
    {
      id: 'connected-pulley',
      title: '桌面悬挂滑轮模型',
      desc: '理解跨滑轮系统加速度约束与失重状态下的张力。',
      icon: <Activity className="text-indigo-400" />,
      color: 'from-indigo-500/20 to-indigo-600/5'
    },
    {
      id: 'connected-triple',
      title: '三物体连接模型',
      desc: '综合：用整体法求加速度，用局部整体法分析 T₁ ≠ T₂ 的原因。',
      icon: <Activity className="text-amber-400" />,
      color: 'from-amber-500/20 to-amber-600/5'
    },
    {
      id: 'atwood',
      title: '阿特伍德机',
      desc: '经典滑轮装置：整体法求加速度，隔离法推导绳子张力，体会失重与超重。',
      icon: <Activity className="text-cyan-400" />,
      color: 'from-cyan-500/20 to-cyan-600/5'
    },
    {
      id: 'moving-pulley',
      title: '动滑轮模型',
      desc: '探索省力不省功的原理，分析绳端拉力与物体重力的平衡关系。',
      icon: <Activity className="text-rose-400" />,
      color: 'from-rose-500/20 to-rose-600/5'
    },
    {
      id: 'circular-horizontal',
      title: '水平圆周运动',
      desc: '圆周运动入门：绳子拉力充当向心力，动态显示公式推导。',
      icon: <Activity className="text-purple-400" />,
      color: 'from-purple-500/20 to-purple-600/5'
    },
    {
      id: 'conical-pendulum',
      title: '圆锥摆',
      desc: '深入受力分析：绳子拉力的水平分量提供向心力，竖直分量平衡重力。',
      icon: <Activity className="text-blue-400" />,
      color: 'from-blue-500/20 to-blue-600/5'
    },
    {
      id: 'vertical-circular',
      title: '竖直圆周运动 (轨道)',
      desc: '分析最高点与最低点的受力：向心力由径向合力提供，体验临界速度。',
      icon: <Activity className="text-pink-400" />,
      color: 'from-pink-500/20 to-pink-600/5'
    },
    {
      id: 'arch-bridge',
      title: '汽车过拱桥',
      desc: '经典应用模型：速度越快支持力越小，理解运动导致的“失重”现象。',
      icon: <Activity className="text-emerald-400" />,
      color: 'from-emerald-500/20 to-emerald-600/5'
    },
    {
      id: 'concave-bridge',
      title: '汽车过凹桥',
      desc: '经典应用模型：合力向上提供向心力，理解为什么凹桥底部会“超重”。',
      icon: <Activity className="text-amber-400" />,
      color: 'from-amber-500/20 to-amber-600/5'
    },
    {
      id: 'p04-vertical-lift',
      title: '综合题：竖直提升重物',
      desc: '结合引擎判别：匀速与加速提升阶段的受力分析。',
      icon: <BookOpen className="text-blue-400" />,
      color: 'from-blue-500/20 to-blue-600/5'
    },
    {
      id: 'p07-incline-slide-up',
      title: '综合题：斜面上滑模型',
      desc: '受力分析进阶：处理斜面上的滑动摩擦力与正交坐标系建立。',
      icon: <BookOpen className="text-emerald-400" />,
      color: 'from-emerald-500/20 to-emerald-600/5'
    },
    {
      id: 'p06-electric-deflection',
      title: '综合题：电场偏转平衡',
      desc: '复用圆锥摆几何逻辑，分析库仑力作用下的三力平衡。',
      icon: <Zap className="text-yellow-400" />,
      color: 'from-yellow-500/20 to-yellow-600/5'
    },
    {
      id: 'p03-vertical-circle-top',
      title: '综合题：圆周最高点临界',
      desc: '深入理解临界态：恰好通过最高点时支持力的消失与效果力区分。',
      icon: <RotateCw className="text-rose-400" />,
      color: 'from-rose-500/20 to-rose-600/5'
    },
    {
      id: 'p01-spacecraft-docking',
      title: '综合题：飞船对接相互作用',
      desc: '研究对象选择进阶：理解整体法与隔离法中的内力与外力。',
      icon: <Share2 className="text-indigo-400" />,
      color: 'from-indigo-500/20 to-indigo-600/5'
    },
    {
      id: 'p05-triple-blocks',
      title: '综合题：三物块整体与隔离',
      desc: '多层嵌套隔离法：分析 A, B+C, 整体等不同研究对象的受力差异。',
      icon: <Layers className="text-cyan-400" />,
      color: 'from-cyan-500/20 to-cyan-600/5'
    },
    {
      id: 'p02-conveyor-belt',
      title: '综合题：传送带状态切换',
      desc: '动态受力分析：识别加速阶段与匀速阶段摩擦力的有无与方向。',
      icon: <MoveRight className="text-orange-400" />,
      color: 'from-orange-500/20 to-orange-600/5'
    },
    {
      id: 'p08-incline-pulley',
      title: '综合题：斜面连接体模型',
      desc: '复合物理建模：结合斜面、滑轮与连接体，通过临界条件判定摩擦力方向。',
      icon: <Boxes className="text-blue-400" />,
      color: 'from-blue-500/20 to-blue-600/5'
    }
  ];

  const categories = [
    {
      id: 'linear',
      title: '直线运动与平衡模型',
      subtitle: 'Linear Motion & Equilibrium',
      icon: <Layers className="text-blue-400" size={24} />,
      items: [
        'horizontal-static', 'incline-frictionless', 'rough-horizontal', 'rough-incline',
        'connected-horizontal', 'connected-pulley', 'connected-triple', 'atwood', 'moving-pulley'
      ]
    },
    {
      id: 'circular',
      title: '圆周运动模型',
      subtitle: 'Circular Motion Models',
      icon: <RotateCw className="text-pink-400" size={24} />,
      items: [
        'circular-horizontal', 'conical-pendulum', 'vertical-circular', 'arch-bridge', 'concave-bridge'
      ]
    },
    {
      id: 'comprehensive',
      title: '综合实战题库',
      subtitle: 'Comprehensive Practice',
      icon: <Cpu className="text-emerald-400" size={24} />,
      items: [
        'p01-spacecraft-docking', 'p02-conveyor-belt', 'p03-vertical-circle-top', 'p04-vertical-lift',
        'p05-triple-blocks', 'p06-electric-deflection', 'p07-incline-slide-up', 'p08-incline-pulley'
      ]
    }
  ];

  const heroItem = allCards.find(c => c.id === 'seven-steps')!;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505]">
      {/* Background Blobs for Visual Depth */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-win11-blue/10 rounded-full blur-[120px] animate-blob pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-purple-600/5 rounded-full blur-[120px] animate-blob pointer-events-none [animation-delay:4s]" />
      <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[100px] animate-blob pointer-events-none [animation-delay:2s]" />

      <div className="max-w-6xl mx-auto py-20 px-6 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20 space-y-6">
          <div className="inline-block px-4 py-1 rounded-full bg-win11-blue/10 border border-win11-blue/20 text-win11-blue text-sm font-medium mb-4">
            Interactive Physics Learning
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tight bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
            ForceAnalysis <span className="bg-gradient-to-r from-win11-blue to-cyan-400 bg-clip-text">Lab</span>
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            基于物理引擎的交互式受力分析实验平台，助你建立直观、规范的物理思维。
          </p>
        </div>

        {/* Feature Section (Method) */}
        <section className="mb-24">
          <button
            onClick={() => onNavigate(heroItem.id)}
            className="w-full glass-panel p-8 md:p-12 text-left group flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/5 opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative z-10 flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform">
                  {heroItem.icon}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">{heroItem.title}</h2>
                  <p className="text-purple-400/80 font-medium">Core Methodology</p>
                </div>
              </div>
              <p className="text-lg text-white/60 leading-relaxed max-w-xl">
                {heroItem.desc}
              </p>
              <div className="flex items-center gap-2 text-win11-blue font-bold group-hover:gap-4 transition-all">
                立即开始学习 <ArrowRight size={20} />
              </div>
            </div>
            <div className="relative z-10 w-full md:w-1/3 flex justify-center">
              <div className="w-48 h-48 rounded-full border-4 border-dashed border-white/5 flex items-center justify-center animate-[spin_20s_linear_infinite]">
                <Target className="text-white/10" size={80} />
              </div>
              <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400/40" size={60} />
            </div>
          </button>
        </section>

        {/* Categorized Sections */}
        <div className="space-y-24">
          {categories.map((category) => (
            <section key={category.id} className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-white/80">
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white/90 tracking-tight">{category.title}</h2>
                    <p className="text-sm text-white/40 font-mono uppercase tracking-widest mt-1">{category.subtitle}</p>
                  </div>
                </div>
                <div className="text-sm text-white/30 hidden md:block">
                  {category.items.length} 个模型可用
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map(itemId => {
                  const card = allCards.find(c => c.id === itemId);
                  if (!card) return null;
                  return (
                    <button
                      key={card.id}
                      onClick={() => onNavigate(card.id)}
                      className="glass-panel p-6 text-left group hover:-translate-y-2 transition-all duration-500 relative overflow-hidden flex flex-col h-full min-h-[180px]"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-40 group-hover:opacity-70 transition-opacity duration-500`} />
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-6">
                          <div className="p-3 bg-white/5 rounded-xl w-fit group-hover:bg-white/10 transition-colors">
                            {card.icon}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                            <ChevronRight size={18} className="text-white" />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white/90 group-hover:text-white transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-white/40 text-sm leading-relaxed mt-auto group-hover:text-white/60 transition-colors">
                          {card.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Improved Footer Info */}
        <div className="mt-32 glass-panel p-8 flex flex-col md:flex-row items-center gap-6 border-win11-blue/10 bg-gradient-to-r from-win11-blue/5 to-transparent">
          <div className="bg-win11-blue/20 p-4 rounded-2xl text-win11-blue shrink-0">
            <Info size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-bold text-white mb-2">教学建议 & 指引</h4>
            <p className="text-white/50 leading-relaxed">
              建议初学者先通读“七步法”核心方法论，随后按照“直线运动”→“圆周运动”→“综合实战”的顺序逐步进阶。每个模型都支持实时受力绘制与参数调整。
            </p>
          </div>
          <div className="flex gap-4">
             <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-xs text-white/40">
               Version 1.2.0
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
