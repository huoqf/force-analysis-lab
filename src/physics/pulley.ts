import { G_ACCEL, calculateWeight } from './mechanics';

/**
 * 阿特伍德机计算
 *
 * 模型：m1 和 m2 通过轻绳跨定滑轮竖直悬挂。
 * 假设：轻绳不可伸长、定滑轮质量忽略（无摩擦、无转动惯量）。
 *
 * 整体法（以 m1 > m2 为例，m1 向下加速）：
 *   (m1 - m2)g = (m1 + m2)a  →  a = (m1 - m2)g / (m1 + m2)
 *
 * 隔离 m1：m1*g - T = m1*a  →  T = m1*(g - a) = 2*m1*m2*g / (m1 + m2)
 *
 * @param m1 左侧物体质量 (kg)
 * @param m2 右侧物体质量 (kg)
 * @returns 加速度、张力、各物体所受合力、状态
 */
export const calculateAtwood = (m1: number, m2: number) => {
  const weight1 = calculateWeight(m1);
  const weight2 = calculateWeight(m2);

  const totalMass = m1 + m2;

  // 约定 m1 向下为正方向
  // a > 0 → m1 下降 m2 上升；a < 0 → m1 上升 m2 下降；a = 0 → 平衡
  const accel = ((m1 - m2) * G_ACCEL) / totalMass;

  // 张力（两侧相同，轻绳+理想滑轮）
  const tension = (2 * m1 * m2 * G_ACCEL) / totalMass;

  // 各物体合力（正 = 实际加速方向）
  const netForce1 = weight1 - tension; // m1 向下合力
  const netForce2 = tension - weight2; // m2 向上合力

  // 状态描述
  const status: 'balanced' | 'moving' =
    Math.abs(m1 - m2) < 1e-9 ? 'balanced' : 'moving';

  return {
    weight1,
    weight2,
    accel,        // 加速度大小（正值代表 m1 向下）
    tension,      // 绳子张力 (N)
    netForce1,    // m1 所受合力 (N)，向下为正
    netForce2,    // m2 所受合力 (N)，向上为正
    status,
  };
};

/**
 * 动滑轮计算（理想情况）
 *
 * 模型：动滑轮轴连接物体，绳子一端固定、一端施加拉力 F。
 * 假设：轻绳、动滑轮质量忽略、无摩擦。
 *
 * 两段绳子各承受张力 T，T = F（轻绳张力相等）
 * 平衡：2T = mg  →  F = T = mg / 2
 *
 * @param m 被提升物体质量 (kg)
 * @returns 重力、绳端拉力、机械效益
 */
export const calculateMovingPulley = (m: number) => {
  const weight = calculateWeight(m);

  // 两段绳子共同承担重力（忽略动滑轮自重）
  const ropeForce = weight / 2; // 绳端拉力 F = G/2
  const tension = ropeForce;    // 每段绳张力相等

  // 机械效益（省力倍数）
  const mechanicalAdvantage = 2;

  return {
    weight,
    ropeForce,           // 绳端拉力 F (N)
    tension,             // 单段绳张力 T (N)
    mechanicalAdvantage, // 省力倍数（固定为 2）
  };
};
