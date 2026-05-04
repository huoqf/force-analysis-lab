import { G_ACCEL, calculateWeight } from './mechanics';

/**
 * 粗糙水平面双物体连接模型计算
 * A在前被外力F拉动，B在后由轻绳连接A
 *
 * @param mA 物体A的质量 (kg)
 * @param mB 物体B的质量 (kg)
 * @param muK 动摩擦因数
 * @param F 外拉力 (N)
 */
export const calculateConnectedHorizontal = (
  mA: number,
  mB: number,
  mu: number,
  F: number
) => {
  const weightA = calculateWeight(mA);
  const weightB = calculateWeight(mB);
  
  const fMaxA = mu * weightA;
  const fMaxB = mu * weightB;
  const fMaxTotal = fMaxA + fMaxB;
  
  let status: 'static' | 'critical' | 'sliding' = 'static';
  if (Math.abs(F - fMaxTotal) < 1e-4) {
    status = 'critical';
  } else if (F > fMaxTotal) {
    status = 'sliding';
  }
  
  let fA = 0;
  let fB = 0;
  let accel = 0;
  let tension = 0;
  
  if (status === 'sliding') {
    fA = fMaxA;
    fB = fMaxB;
    accel = (F - fMaxTotal) / (mA + mB);
    // 隔离B: T - fB = mB * a => T = mB * a + fB
    tension = mB * accel + fB;
  } else {
    // 默认按照最大静摩擦力比例分配所需静摩擦力，作为教学示意
    fA = F * (mA / (mA + mB));
    fB = F * (mB / (mA + mB));
    accel = 0;
    tension = fB; // 隔离B: T - fB = 0
  }
  
  return {
    weightA,
    weightB,
    fMaxA,
    fMaxB,
    fMaxTotal,
    fA,
    fB,
    accel,
    tension,
    status
  };
};

/**
 * 桌面悬挂滑轮模型计算
 * A在粗糙桌面上，B悬挂
 *
 * @param mA 桌面物体A的质量 (kg)
 * @param mB 悬挂物体B的质量 (kg)
 * @param mu 桌面动/静摩擦因数
 */
export const calculateConnectedPulley = (
  mA: number,
  mB: number,
  mu: number
) => {
  const weightA = calculateWeight(mA);
  const weightB = calculateWeight(mB);
  
  const fMaxA = mu * weightA;
  
  let status: 'static' | 'sliding' = 'static';
  
  // 由于只有单向拉力（B的重力），且没有外力，只判断 B的重力 是否大于 A的最大静摩擦力
  if (weightB > fMaxA) {
    status = 'sliding';
  }
  
  let fA = 0;
  let accel = 0;
  let tension = 0;
  
  if (status === 'sliding') {
    fA = fMaxA;
    accel = (weightB - fA) / (mA + mB);
    tension = mB * (G_ACCEL - accel); // 隔离B: G_B - T = mB * a => T = mB(g - a)
  } else {
    // 静止状态
    fA = weightB; // 静摩擦力等于悬挂物重力
    accel = 0;
    tension = weightB; // T = G_B
  }
  
  return {
    weightA,
    weightB,
    fMaxA,
    fA,
    accel,
    tension,
    status
  };
};
