/**
 * 圆周运动物理计算单元测试
 */
import { describe, it, expect } from 'vitest';
import {
  calculateHorizontalCircular,
  calculateConicalPendulum,
  calculateVerticalCircular,
  calculateArchBridge,
  calculateConcaveBridge,
} from '../circular';

const G = 9.8;

// ─── 水平圆周运动 ──────────────────────────────────────────────────────
describe('calculateHorizontalCircular', () => {
  it('绳子张力 = mv²/r', () => {
    const result = calculateHorizontalCircular(1, 2, 0.5);
    // F向 = 1 × 4 / 0.5 = 8 N
    expect(result.centripetalForce).toBeCloseTo(8, 4);
    expect(result.tension).toBeCloseTo(8, 4);
  });

  it('支持力等于重力（水平面竖直平衡）', () => {
    const result = calculateHorizontalCircular(2, 3, 1);
    expect(result.normalForce).toBeCloseTo(result.weight, 4);
    expect(result.weight).toBeCloseTo(2 * G, 4);
  });

  it('向心加速度 = v²/r', () => {
    const result = calculateHorizontalCircular(5, 4, 2);
    expect(result.centripetalAccel).toBeCloseTo(8, 4); // 16/2 = 8
  });

  it('周期 T = 2πr/v', () => {
    const r = 1, v = Math.PI * 2; // v = 2π → T = 1s
    const result = calculateHorizontalCircular(1, v, r);
    expect(result.period).toBeCloseTo(1, 3);
  });
});

// ─── 圆锥摆 ────────────────────────────────────────────────────────────
describe('calculateConicalPendulum', () => {
  it('张力竖直分量平衡重力：T·cosθ = mg', () => {
    const m = 1, L = 1, theta = 30;
    const result = calculateConicalPendulum(m, L, theta);
    const thetaRad = (30 * Math.PI) / 180;
    expect(result.tension * Math.cos(thetaRad)).toBeCloseTo(m * G, 3);
  });

  it('张力水平分量提供向心力：T·sinθ = mv²/r', () => {
    const m = 2, L = 0.5, theta = 45;
    const result = calculateConicalPendulum(m, L, theta);
    const thetaRad = (45 * Math.PI) / 180;
    const expectedCentripetal = result.tension * Math.sin(thetaRad);
    expect(result.centripetalForce).toBeCloseTo(expectedCentripetal, 3);
  });

  it('旋转半径 r = L·sinθ', () => {
    const L = 2, theta = 30;
    const result = calculateConicalPendulum(1, L, theta);
    const expectedR = L * Math.sin((30 * Math.PI) / 180);
    expect(result.radius).toBeCloseTo(expectedR, 5);
  });

  it('θ→0 时张力趋近于 mg', () => {
    const result = calculateConicalPendulum(1, 1, 1); // 1度接近竖直
    expect(result.tension).toBeCloseTo(G, 0); // 约等于 mg
  });
});

// ─── 竖直圆周运动 ──────────────────────────────────────────────────────
describe('calculateVerticalCircular', () => {
  it('最低点：N = mg + mv²/r（超重）', () => {
    const m = 1, v = 3, r = 1;
    const result = calculateVerticalCircular(m, v, r, 'bottom');
    expect(result.normalForce).toBeCloseTo(m * G + m * v * v / r, 3);
    expect(result.normalForce).toBeGreaterThan(result.weight);
  });

  it('最高点：N = mv²/r - mg（飞离前）', () => {
    const m = 1, r = 1;
    const vMin = Math.sqrt(G * r);
    const v = vMin * 2; // 速度是临界速度的2倍
    const result = calculateVerticalCircular(m, v, r, 'top');
    expect(result.normalForce).toBeCloseTo(m * v * v / r - m * G, 3);
  });

  it('最高点临界速度：v = √(gr) 时 N ≈ 0', () => {
    const m = 1, r = 2;
    const vMin = Math.sqrt(G * r);
    const result = calculateVerticalCircular(m, vMin, r, 'top');
    expect(result.normalForce).toBeCloseTo(0, 1);
  });

  it('最高点速度不足时 N = 0（飞离）', () => {
    const m = 1, r = 1;
    const v = 0.5; // 远小于临界速度 √9.8 ≈ 3.13
    const result = calculateVerticalCircular(m, v, r, 'top');
    expect(result.normalForce).toBe(0);
  });
});

// ─── 拱桥 ──────────────────────────────────────────────────────────────
describe('calculateArchBridge', () => {
  it('N = mg - mv²/r（正常过桥时）', () => {
    const m = 1000, v = 5, r = 50;
    const result = calculateArchBridge(m, v, r);
    expect(result.normalForce).toBeCloseTo(m * G - m * v * v / r, 3);
    expect(result.normalForce).toBeLessThan(result.weight);
  });

  it('临界速度 v_max = √(gr) 时 N ≈ 0', () => {
    const m = 1000, r = 50;
    const vMax = Math.sqrt(G * r);
    const result = calculateArchBridge(m, vMax, r);
    expect(result.normalForce).toBeCloseTo(0, 1);
    expect(result.isFlying).toBe(false);
  });

  it('超速后 isFlying = true, N = 0', () => {
    const m = 1000, r = 50;
    const vMax = Math.sqrt(G * r);
    const result = calculateArchBridge(m, vMax * 1.5, r);
    expect(result.isFlying).toBe(true);
    expect(result.normalForce).toBe(0);
  });
});

// ─── 凹桥 ──────────────────────────────────────────────────────────────
describe('calculateConcaveBridge', () => {
  it('N = mg + mv²/r（始终超重）', () => {
    const m = 1000, v = 10, r = 50;
    const result = calculateConcaveBridge(m, v, r);
    expect(result.normalForce).toBeCloseTo(m * G + m * v * v / r, 3);
    expect(result.normalForce).toBeGreaterThan(result.weight);
  });

  it('v=0 时 N = mg（静止）', () => {
    const m = 1000;
    const result = calculateConcaveBridge(m, 0, 50);
    expect(result.normalForce).toBeCloseTo(m * G, 3);
  });

  it('weightRatio 始终 >= 1', () => {
    for (const v of [0, 5, 10, 20, 30]) {
      const result = calculateConcaveBridge(1000, v, 100);
      expect(result.weightRatio).toBeGreaterThanOrEqual(1);
    }
  });
});
