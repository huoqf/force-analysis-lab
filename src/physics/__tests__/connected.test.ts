import { calculateConnectedHorizontal, calculateConnectedPulley } from '../connected';
import { G_ACCEL } from '../mechanics';

describe('Connected Bodies - Horizontal', () => {
  it('should calculate correct acceleration and tension when sliding', () => {
    const result = calculateConnectedHorizontal(2, 3, 0.2, 20);
    
    expect(result.status).toBe('sliding');
    expect(result.fMaxTotal).toBeCloseTo(9.8);
    expect(result.fA).toBeCloseTo(3.92);
    expect(result.fB).toBeCloseTo(5.88);
    expect(result.accel).toBeCloseTo(2.04);
    expect(result.tension).toBeCloseTo(12);
  });

  it('should handle non-sliding static state and distribute proportionally', () => {
    // mA = 2, mB = 3, mu = 0.5, F = 10
    // fMaxTotal = 24.5
    const result = calculateConnectedHorizontal(2, 3, 0.5, 10);
    
    expect(result.status).toBe('static');
    expect(result.accel).toBe(0);
    expect(result.fA).toBeCloseTo(4); // 10 * 2/5
    expect(result.fB).toBeCloseTo(6); // 10 * 3/5
    expect(result.tension).toBeCloseTo(6);
  });

  it('should handle critical state', () => {
    // mA = 2, mB = 3, mu = 0.2, F = 9.8
    const result = calculateConnectedHorizontal(2, 3, 0.2, 9.8);
    expect(result.status).toBe('critical');
    expect(result.accel).toBe(0);
  });
});

describe('Connected Bodies - Pulley', () => {
  it('should calculate correct values when sliding', () => {
    // mA = 2, mB = 3, mu = 0.2
    // weightA = 19.6, fMaxA = 3.92
    // weightB = 29.4
    // sliding because 29.4 > 3.92
    // accel = (29.4 - 3.92) / 5 = 5.096
    // tension = 3 * (9.8 - 5.096) = 14.112
    const result = calculateConnectedPulley(2, 3, 0.2);
    expect(result.status).toBe('sliding');
    expect(result.fA).toBeCloseTo(3.92);
    expect(result.accel).toBeCloseTo(5.096);
    expect(result.tension).toBeCloseTo(14.112);
  });

  it('should handle static state', () => {
    // mA = 10, mB = 1, mu = 0.5
    // weightA = 98, fMaxA = 49
    // weightB = 9.8
    // static because 9.8 <= 49
    const result = calculateConnectedPulley(10, 1, 0.5);
    expect(result.status).toBe('static');
    expect(result.accel).toBe(0);
    expect(result.tension).toBeCloseTo(9.8);
    expect(result.fA).toBeCloseTo(9.8);
  });
});

