import { describe, it, expect } from 'vitest';
import { calculateWeight, calculateInclineForces, calculateInclineAccel, calculateHorizontalPhysics, calculateRoughInclinePhysics } from '../mechanics';

describe('Mechanics Calculations', () => {
  it('should calculate weight correctly', () => {
    expect(calculateWeight(10)).toBe(98);
  });

  it('should calculate incline forces for 30 degrees', () => {
    const { gParallel, gNormal } = calculateInclineForces(10, 30);
    // sin(30) = 0.5, cos(30) = 0.866
    expect(gParallel).toBeCloseTo(49, 1);
    expect(gNormal).toBeCloseTo(84.87, 1);
  });

  it('should calculate incline acceleration for 90 degrees', () => {
    // 垂直掉落加速度应为 g
    expect(calculateInclineAccel(90)).toBeCloseTo(9.8, 5);
  });

  it('should calculate incline acceleration for 0 degrees', () => {
    // 水平加速度应为 0
    expect(calculateInclineAccel(0)).toBe(0);
  });
});

describe('Horizontal Physics Calculations', () => {
  it('should remain static when applied force is less than max friction', () => {
    // mass = 10kg, weight = 98N, mu = 0.5, maxFriction = 49N
    // applied force = 30N
    const result = calculateHorizontalPhysics(10, 0.5, 30);
    expect(result.normalForce).toBe(98);
    expect(result.maxFriction).toBe(49);
    expect(result.frictionForce).toBe(-30);
    expect(result.accel).toBe(0);
  });

  it('should accelerate when applied force exceeds max friction', () => {
    // mass = 10kg, weight = 98N, mu = 0.5, maxFriction = 49N
    // applied force = 69N
    const result = calculateHorizontalPhysics(10, 0.5, 69);
    expect(result.frictionForce).toBe(-49);
    expect(result.accel).toBe((69 - 49) / 10); // 2.0
  });

  it('should handle negative applied force correctly', () => {
    // applied force = -69N
    const result = calculateHorizontalPhysics(10, 0.5, -69);
    expect(result.frictionForce).toBe(49);
    expect(result.accel).toBe((-69 + 49) / 10); // -2.0
  });
});

describe('Rough Incline Physics Calculations', () => {
  it('should remain static when angle is small (gParallel <= maxStaticFriction)', () => {
    // mass = 10, angle = 30, muStatic = 0.8 (tan30 ~ 0.577)
    // weight = 98, gParallel = 49, gNormal = 84.87, maxStatic = 67.89
    const result = calculateRoughInclinePhysics(10, 30, 0.8, 0.6, false);
    expect(result.isSliding).toBe(false);
    expect(result.accel).toBe(0);
    expect(result.frictionForce).toBeCloseTo(49, 1);
  });

  it('should start sliding when angle is large (gParallel > maxStaticFriction)', () => {
    // mass = 10, angle = 45, muStatic = 0.5, muKinetic = 0.4
    // tan45 = 1 > 0.5
    const result = calculateRoughInclinePhysics(10, 45, 0.5, 0.4, false);
    expect(result.isSliding).toBe(true);
    // friction should be kinetic friction
    // gNormal = 98 * cos45 = 69.3
    expect(result.frictionForce).toBeCloseTo(69.3 * 0.4, 1);
    expect(result.accel).toBeGreaterThan(0);
  });

  it('should continue sliding with negative accel if initial velocity is true but angle is too small for kinetic friction', () => {
    // mass = 10, angle = 30, muStatic = 0.8, muKinetic = 0.7
    // tan30 ~ 0.577 < 0.7. So it will decelerate.
    const result = calculateRoughInclinePhysics(10, 30, 0.8, 0.7, true);
    expect(result.isSliding).toBe(true);
    // gNormal = 84.87, kineticFriction = 59.4, gParallel = 49
    expect(result.accel).toBeLessThan(0);
    expect(result.frictionForce).toBeCloseTo(84.87 * 0.7, 1);
  });
});
