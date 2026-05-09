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

/**
 * 水平面受力与摩擦力状态计算
 * @param mass 质量 (kg)
 * @param mu 动摩擦因数
 * @param appliedForce 外力 (N，向右为正)
 * @returns 摩擦力, 支持力, 加速度等
 */
export const calculateHorizontalPhysics = (mass: number, mu: number, appliedForce: number) => {
  const weight = calculateWeight(mass);
  const normalForce = weight; // 纯水平受力，支持力等于重力
  
  // 为基础模型简化，设最大静摩擦力等于滑动摩擦力
  const maxFriction = mu * normalForce;
  
  let frictionForce = 0;
  let accel = 0;
  
  if (Math.abs(appliedForce) <= maxFriction) {
    // 静止状态
    frictionForce = -appliedForce; // 摩擦力抵消外力
    accel = 0;
  } else {
    // 滑动状态
    const direction = Math.sign(appliedForce);
    frictionForce = -direction * maxFriction; // 摩擦力方向与相对运动(即外力方向)相反
    accel = (appliedForce + frictionForce) / mass;
  }
  
  return {
    normalForce,
    frictionForce,
    maxFriction,
    accel,
    weight
  };
};

/**
 * 粗糙斜面受力与摩擦力状态计算
 * @param mass 质量 (kg)
 * @param angleDegrees 倾角 (度)
 * @param muStatic 静摩擦因数
 * @param muKinetic 动摩擦因数
 * @param hasInitialVelocity 是否有沿斜面向下的初速度
 */
export const calculateRoughInclinePhysics = (
  mass: number, 
  angleDegrees: number, 
  muStatic: number, 
  muKinetic: number,
  hasInitialVelocity: boolean = false
) => {
  const weight = calculateWeight(mass);
  const angleRad = (angleDegrees * Math.PI) / 180;
  
  const gParallel = weight * Math.sin(angleRad); // 下滑分力 G1
  const gNormal = weight * Math.cos(angleRad);   // 垂直分力 G2
  const normalForce = gNormal;                   // 支持力 N
  
  const maxStaticFriction = muStatic * normalForce;
  const kineticFriction = muKinetic * normalForce;
  
  let isSliding = false;
  let frictionForce = 0;
  let accel = 0;
  
  if (hasInitialVelocity) {
    // 有初速度，必然受到动摩擦力（假设方向沿斜面向下）
    isSliding = true;
    frictionForce = kineticFriction;
    accel = (gParallel - frictionForce) / mass;
  } else {
    // 初速度为0，看下滑力是否能突破最大静摩擦力
    // 临界点判断加入一个小容差处理浮点数问题
    if (gParallel > maxStaticFriction + 1e-6) {
      isSliding = true;
      frictionForce = kineticFriction; // 突破后变为动摩擦力
      accel = (gParallel - frictionForce) / mass;
    } else {
      isSliding = false;
      frictionForce = gParallel; // 静摩擦力等于下滑分力
      accel = 0;
    }
  }
  
  return {
    gParallel,
    gNormal,
    normalForce,
    maxStaticFriction,
    kineticFriction,
    frictionForce,
    isSliding,
    accel,
    weight
  };
};

export const calculateInclinePulleySystem = (params: Record<string, number>): Record<string, unknown> => {
  const { mA, mB, theta, mu } = params;
  const g = 9.8;
  const thetaRad = (theta * Math.PI) / 180;
  
  const pullForce = mB * g;
  const componentGravity = mA * g * Math.sin(thetaRad);
  const maxStaticFriction = mu * mA * g * Math.cos(thetaRad); // 简化处理

  let motionDirection: 'A_UP' | 'A_DOWN' | 'STATIC' = 'STATIC';
  
  if (pullForce > componentGravity + maxStaticFriction) {
    motionDirection = 'A_UP';
  } else if (componentGravity > pullForce + maxStaticFriction) {
    motionDirection = 'A_DOWN';
  } else {
    motionDirection = 'STATIC';
  }

  return { motionDirection };
};
