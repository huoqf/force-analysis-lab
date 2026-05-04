import { G_ACCEL, calculateWeight } from './mechanics';

/**
 * 粗糙水平面双物体连接模型计算
 * 布局：B — 绳 — A ← F
 * 外力 F 拉最右侧物体A，A通过绳子拉B
 *
 * @param mA 物体A的质量 (kg)，最右侧受外力
 * @param mB 物体B的质量 (kg)，左侧
 * @param mu 动/静摩擦因数
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
    fA = weightB;
    accel = 0;
    tension = weightB;
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

/**
 * 粗糙水平面三物体连接模型计算
 * 布局：A — T2绳 — B — T1绳 — C ← F
 * 外力 F 拉最右侧物体C，C通过T1绳拉B，B通过T2绳拉A
 *
 * @param mA 物体A质量 (kg)，最左侧
 * @param mB 物体B质量 (kg)，中间
 * @param mC 物体C质量 (kg)，最右侧受外力
 * @param mu 动/静摩擦因数（三者相同）
 * @param F 外力 (N)，水平向右
 */
export const calculateConnectedTriple = (
  mA: number,
  mB: number,
  mC: number,
  mu: number,
  F: number
) => {
  const weightA = calculateWeight(mA);
  const weightB = calculateWeight(mB);
  const weightC = calculateWeight(mC);

  const fMaxA = mu * weightA;
  const fMaxB = mu * weightB;
  const fMaxC = mu * weightC;
  const fMaxTotal = fMaxA + fMaxB + fMaxC;
  const mTotal = mA + mB + mC;

  let status: 'static' | 'critical' | 'sliding' = 'static';
  if (Math.abs(F - fMaxTotal) < 1e-4) {
    status = 'critical';
  } else if (F > fMaxTotal) {
    status = 'sliding';
  }

  let fA = 0, fB = 0, fC = 0;
  let accel = 0;
  let T1 = 0; // C-B 之间的绳子张力
  let T2 = 0; // B-A 之间的绳子张力

  if (status === 'sliding') {
    fA = fMaxA;
    fB = fMaxB;
    fC = fMaxC;
    // 整体法求加速度
    accel = (F - fMaxTotal) / mTotal;
    // 隔离A求T2: T2 - fA = mA * a => T2 = mA*a + fA
    T2 = mA * accel + fA;
    // 隔离(A+B)整体求T1: T1 - fA - fB = (mA+mB)*a => T1 = (mA+mB)*a + fA + fB
    T1 = (mA + mB) * accel + fA + fB;
  } else {
    // 静止状态：静摩擦力按质量比例分配（教学示意）
    fA = F * (mA / mTotal);
    fB = F * (mB / mTotal);
    fC = F * (mC / mTotal);
    accel = 0;
    T2 = fA;       // 隔离A: T2 = fA（水平平衡）
    T1 = fA + fB;  // 隔离(A+B): T1 = fA + fB
  }

  return {
    weightA, weightB, weightC,
    fMaxA, fMaxB, fMaxC, fMaxTotal,
    fA, fB, fC,
    accel,
    T1,
    T2,
    status
  };
};
