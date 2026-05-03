/**
 * 基础物理常数与计算逻辑
 */

export const G_ACCEL = 9.8; // 重力加速度 m/s^2

/**
 * 计算重力
 * @param mass 质量 (kg)
 * @returns 重力大小 (N)
 */
export const calculateWeight = (mass: number): number => {
  return mass * G_ACCEL;
};

/**
 * 斜面受力计算
 * @param mass 质量 (kg)
 * @param angleDegrees 倾角 (度)
 * @returns 分力情况 { gParallel, gNormal }
 */
export const calculateInclineForces = (mass: number, angleDegrees: number) => {
  const weight = calculateWeight(mass);
  const angleRad = (angleDegrees * Math.PI) / 180;
  
  return {
    gParallel: weight * Math.sin(angleRad), // 沿斜面向下分力
    gNormal: weight * Math.cos(angleRad),   // 垂直斜面分力
    weight
  };
};

/**
 * 无摩擦斜面加速度
 * @param angleDegrees 倾角 (度)
 * @returns 加速度 m/s^2
 */
export const calculateInclineAccel = (angleDegrees: number): number => {
  const angleRad = (angleDegrees * Math.PI) / 180;
  return G_ACCEL * Math.sin(angleRad);
};

/**
 * 格式化数值，保留两位小数
 */
export const formatPhysicsValue = (val: number): string => {
  return val.toFixed(2);
};
