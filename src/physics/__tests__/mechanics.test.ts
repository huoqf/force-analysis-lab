import { describe, it, expect } from 'vitest';
import { calculateWeight, calculateInclineForces, calculateInclineAccel } from '../mechanics';

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
