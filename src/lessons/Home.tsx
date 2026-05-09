import React from 'react';
import { BookOpen, Activity, Info, ChevronRight, Zap, RotateCw, Share2, Layers, MoveRight, Boxes } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const cards = [
    {
      id: 'seven-steps',
      title: '受力分析七步法',
      desc: '掌握通用的力学解题思路，建立规范的分析习惯。',
      icon: <BookOpen className="text-purple-400" />,
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

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-win11-blue to-cyan-400 bg-clip-text text-transparent">
          ForceAnalysis Lab
        </h1>
        <p className="text-xl text-white/60">
          交互式高中物理受力分析实验平台
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className={`glass-panel p-8 text-left group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-50`} />
            <div className="relative z-10">
              <div className="mb-6 p-3 bg-white/5 rounded-xl w-fit group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                {card.title}
                <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                {card.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-16 glass-panel p-6 flex items-center gap-4 border-win11-blue/20">
        <div className="bg-win11-blue/10 p-3 rounded-full text-win11-blue">
          <Info size={24} />
        </div>
        <div>
          <h4 className="font-bold">教学提示</h4>
          <p className="text-sm text-white/60">点击上方卡片开始学习。建议从“七步法”开始，逐步深入到交互模型。</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
