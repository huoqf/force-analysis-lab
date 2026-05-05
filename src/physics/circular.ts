/**
 * 圆周运动物理计算模块
 * 所有函数均使用 SI 单位制 (kg, m, m/s, N)
 */

import { G_ACCEL } from './mechanics';

// ─── 水平圆周运动（绳拴小球在光滑水平面旋转）─────────────────────────────
/**
 * 水平圆周运动受力计算
 * 场景：小球在光滑水平面上做匀速圆周运动，绳子提供向心力
 *
 * @param mass 小球质量 (kg)
 * @param speed 线速度 (m/s)
 * @param radius 旋转半径 (m)
 * @returns 各力大小及向心加速度
 */
export const calculateHorizontalCircular = (
  mass: number,
  speed: number,
  radius: number
) => {
  const weight = mass * G_ACCEL;             // 重力 G = mg (N)
  const normalForce = weight;               // 支持力 N = G（垂直于水平面平衡）
  const centripetalForce = (mass * speed * speed) / radius; // F向 = mv²/r (N)
  const tension = centripetalForce;         // 绳子拉力 T = 向心力 (N)
  const centripetalAccel = speed * speed / radius; // 向心加速度 (m/s²)
  const period = (2 * Math.PI * radius) / speed;   // 周期 T = 2πr/v (s)
  const angularVelocity = speed / radius;           // 角速度 ω = v/r (rad/s)

  return {
    weight,
    normalForce,
    tension,
    centripetalForce,
    centripetalAccel,
    period,
    angularVelocity,
  };
};

// ─── 圆锥摆 ───────────────────────────────────────────────────────────────
/**
 * 圆锥摆受力计算
 * 场景：小球用绳子绑在固定点，在水平面做匀速圆周运动，绳子与竖直方向成角 θ
 *
 * @param mass 小球质量 (kg)
 * @param ropeLength 绳长 L (m)
 * @param halfAngleDeg 半锥角 θ（绳与竖直方向的夹角，度）
 * @returns 各力大小及运动参数
 */
export const calculateConicalPendulum = (
  mass: number,
  ropeLength: number,
  halfAngleDeg: number
) => {
  const theta = (halfAngleDeg * Math.PI) / 180;
  const weight = mass * G_ACCEL;

  // 竖直平衡：T·cosθ = mg  →  T = mg / cosθ
  const tension = weight / Math.cos(theta);

  // 向心力：F向 = T·sinθ = mg·tanθ
  const centripetalForce = tension * Math.sin(theta);

  // 旋转半径：r = L·sinθ
  const radius = ropeLength * Math.sin(theta);

  // 由 F向 = mv²/r 求速度：v = √(r · F向 / m) = √(g·r·tanθ/1)
  const speed = Math.sqrt(G_ACCEL * radius * Math.tan(theta));

  // 周期：T_period = 2π√(L·cosθ / g)
  const period = 2 * Math.PI * Math.sqrt((ropeLength * Math.cos(theta)) / G_ACCEL);

  const angularVelocity = speed / radius;
  const centripetalAccel = speed * speed / radius;

  return {
    weight,
    tension,
    centripetalForce,
    radius,
    speed,
    period,
    angularVelocity,
    centripetalAccel,
  };
};

// ─── 竖直圆周运动（最高点 / 最低点）─────────────────────────────────────
export type VerticalCircularPosition = 'top' | 'bottom';

/**
 * 竖直圆周运动受力计算
 * 场景：小球在竖直圆弧轨道（或绳拴）上做圆周运动
 *
 * @param mass 质量 (kg)
 * @param speed 该点速度 (m/s)
 * @param radius 圆周半径 (m)
 * @param position 'top' = 最高点 | 'bottom' = 最低点
 * @returns 各力大小及运动状态
 */
export const calculateVerticalCircular = (
  mass: number,
  speed: number,
  radius: number,
  position: VerticalCircularPosition
) => {
  const weight = mass * G_ACCEL;
  const centripetalForce = (mass * speed * speed) / radius; // F向 = mv²/r
  const centripetalAccel = speed * speed / radius;

  // 临界速度（最高点 N=0 时）：mg = mv²/r → v_min = √(gr)
  const minSpeedAtTop = Math.sqrt(G_ACCEL * radius);

  let normalForce: number;
  let isAboveMinSpeed: boolean;
  let statusText: string;

  if (position === 'top') {
    // 最高点：G + N = F向 → N = mv²/r - mg
    normalForce = centripetalForce - weight;
    isAboveMinSpeed = speed >= minSpeedAtTop - 1e-6;
    if (normalForce < 0) {
      normalForce = 0; // 实际 N 不能为负（飞离轨道）
      statusText = '速度不足，飞离轨道';
    } else if (Math.abs(normalForce) < 0.01) {
      statusText = '临界状态（N ≈ 0）';
    } else {
      statusText = '正常圆周运动';
    }
  } else {
    // 最低点：N - G = F向 → N = mv²/r + mg
    normalForce = centripetalForce + weight;
    isAboveMinSpeed = true;
    statusText = '超重状态（N > mg）';
  }

  return {
    weight,
    normalForce,
    centripetalForce,
    centripetalAccel,
    minSpeedAtTop,
    isAboveMinSpeed,
    statusText,
  };
};

// ─── 汽车过拱桥 ──────────────────────────────────────────────────────────
/**
 * 汽车过拱桥受力计算
 * 拱桥最高点：G - N = mv²/r → N = mg - mv²/r （N < mg，失重效果）
 *
 * @param mass 质量 (kg)
 * @param speed 过桥速度 (m/s)
 * @param radius 拱桥半径 (m)
 * @returns 支持力 N 及运动状态
 */
export const calculateArchBridge = (
  mass: number,
  speed: number,
  radius: number
) => {
  const weight = mass * G_ACCEL;
  const centripetalForce = (mass * speed * speed) / radius;

  // N = mg - mv²/r
  const normalForce = Math.max(0, weight - centripetalForce);

  // 临界速度：N=0 时 v_max = √(gr)
  const maxSafeSpeed = Math.sqrt(G_ACCEL * radius);
  const isFlying = speed > maxSafeSpeed + 1e-6;

  const weightRatio = normalForce / weight; // N/mg，越小失重越明显

  let statusText: string;
  if (isFlying) {
    statusText = '超速！已飞离桥面（N = 0）';
  } else if (Math.abs(normalForce) < 0.01) {
    statusText = '临界状态（N ≈ 0）';
  } else {
    statusText = '正常过桥（失重状态）';
  }

  return {
    weight,
    normalForce,
    centripetalForce,
    maxSafeSpeed,
    isFlying,
    weightRatio,
    statusText,
  };
};

// ─── 汽车过凹桥 ──────────────────────────────────────────────────────────
/**
 * 汽车过凹桥受力计算
 * 凹桥最低点：N - G = mv²/r → N = mg + mv²/r （N > mg，超重效果）
 *
 * @param mass 质量 (kg)
 * @param speed 过桥速度 (m/s)
 * @param radius 凹桥半径 (m)
 * @returns 支持力 N 及运动状态
 */
export const calculateConcaveBridge = (
  mass: number,
  speed: number,
  radius: number
) => {
  const weight = mass * G_ACCEL;
  const centripetalForce = (mass * speed * speed) / radius;

  // N = mg + mv²/r
  const normalForce = weight + centripetalForce;

  const weightRatio = normalForce / weight; // N/mg，越大超重越明显

  return {
    weight,
    normalForce,
    centripetalForce,
    weightRatio,
    statusText: '超重状态（N > mg）',
  };
};

// ─── 动态模拟：竖直圆周运动 ────────────────────────────────────────────────────────
export interface VerticalCircularState {
  angle: number; // 0 是最低点，逆时针为正
  angularVelocity: number;
  isDetached: boolean;
  x: number; // m (圆心为 0,0)
  y: number; // m (竖直向下为正)
  vx: number; // m/s
  vy: number; // m/s
  normalForce: number; // N
  trail: {x: number, y: number}[]; // 记录轨迹点（可选）
}

export const initVerticalCircularState = (v0: number, radius: number): VerticalCircularState => {
  return {
    angle: 0,
    angularVelocity: v0 / radius,
    isDetached: false,
    x: 0,
    y: radius,
    vx: v0,
    vy: 0,
    normalForce: 0,
    trail: [],
  };
};

export const stepVerticalCircular = (
  state: VerticalCircularState,
  dt: number,
  mass: number,
  radius: number
): VerticalCircularState => {
  const newTrail = [...state.trail];
  const lastPoint = newTrail[newTrail.length - 1];
  const distSq = lastPoint ? (state.x - lastPoint.x)**2 + (state.y - lastPoint.y)**2 : Infinity;
  
  // 每移动一定距离（例如 0.05m，即平方为 0.0025）记录一个点，保证轨迹平滑且不受帧率随机性影响
  if (distSq > 0.0025 || newTrail.length === 0) {
    newTrail.push({ x: state.x, y: state.y });
    // 圆周运动阶段保留较短拖尾，脱轨抛体阶段保留长轨迹
    const maxTrail = state.isDetached ? 80 : 25;
    if (newTrail.length > maxTrail) {
      newTrail.shift();
    }
  }

  if (state.isDetached) {
    // 脱轨后做平抛/斜抛运动
    const newX = state.x + state.vx * dt;
    const newY = state.y + state.vy * dt + 0.5 * G_ACCEL * dt * dt;
    const newVx = state.vx;
    const newVy = state.vy + G_ACCEL * dt;
    return {
      ...state,
      x: newX,
      y: newY,
      vx: newVx,
      vy: newVy,
      normalForce: 0,
      trail: newTrail,
    };
  }

  // 圆周运动阶段：使用辛欧拉法 (Symplectic Euler) 加多步细分，保证能量稳定
  const subSteps = 10;
  const subDt = dt / subSteps;
  
  let { angle, angularVelocity } = state;
  let detached = false;
  let nForce = 0;

  for (let i = 0; i < subSteps; i++) {
    const at = -G_ACCEL * Math.sin(angle);
    const alpha = at / radius;
    
    angularVelocity += alpha * subDt;
    angle += angularVelocity * subDt;
    
    // N = mg cosθ + m R ω²
    nForce = mass * G_ACCEL * Math.cos(angle) + mass * radius * angularVelocity * angularVelocity;
    
    // 脱轨条件：在上半圆 (cosθ < 0) 且 支持力 N <= 0
    if (Math.cos(angle) < 0 && nForce <= 0) {
      detached = true;
      break;
    }
  }
  
  // 保持角度在 -2π 到 2π 之间，防止过大
  if (angle > Math.PI * 4) angle -= Math.PI * 2;
  if (angle < -Math.PI * 4) angle += Math.PI * 2;

  const x = radius * Math.sin(angle);
  const y = radius * Math.cos(angle);
  const vx = radius * angularVelocity * Math.cos(angle);
  const vy = -radius * angularVelocity * Math.sin(angle);

  return {
    angle,
    angularVelocity,
    isDetached: detached,
    x,
    y,
    vx,
    vy,
    normalForce: Math.max(0, nForce),
    trail: newTrail,
  };
};
