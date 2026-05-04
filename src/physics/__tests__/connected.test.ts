import { calculateConnectedHorizontal, calculateConnectedPulley, calculateConnectedTriple } from '../connected';

describe('Connected Bodies - Horizontal', () => {
  it('should calculate correct acceleration and tension when sliding', () => {
    const result = calculateConnectedHorizontal(2, 3, 0.2, 20);
    expect(result.status).toBe('sliding');
    expect(result.fMaxTotal).toBeCloseTo(9.8);
    expect(result.accel).toBeCloseTo(2.04);
    expect(result.tension).toBeCloseTo(12);
  });

  it('should handle static state with proportional distribution', () => {
    const result = calculateConnectedHorizontal(2, 3, 0.5, 10);
    expect(result.status).toBe('static');
    expect(result.accel).toBe(0);
    expect(result.fA).toBeCloseTo(4);
    expect(result.fB).toBeCloseTo(6);
    expect(result.tension).toBeCloseTo(6);
  });

  it('should handle critical state', () => {
    const result = calculateConnectedHorizontal(2, 3, 0.2, 9.8);
    expect(result.status).toBe('critical');
    expect(result.accel).toBe(0);
  });
});

describe('Connected Bodies - Pulley', () => {
  it('should calculate correct values when sliding', () => {
    const result = calculateConnectedPulley(2, 3, 0.2);
    expect(result.status).toBe('sliding');
    expect(result.fA).toBeCloseTo(3.92);
    expect(result.accel).toBeCloseTo(5.096);
    expect(result.tension).toBeCloseTo(14.112);
  });

  it('should handle static state', () => {
    const result = calculateConnectedPulley(10, 1, 0.5);
    expect(result.status).toBe('static');
    expect(result.accel).toBe(0);
    expect(result.tension).toBeCloseTo(9.8);
    expect(result.fA).toBeCloseTo(9.8);
  });
});

describe('Connected Bodies - Triple', () => {
  it('should compute correct T1, T2 and accel when sliding', () => {
    // mA=2, mB=3, mC=5, mu=0.2, F=100
    // fMaxTotal = 0.2*(19.6+29.4+49) = 19.6
    // accel = (100-19.6)/10 = 8.04
    // T2 = 2*8.04+3.92 = 20
    // T1 = 5*8.04+9.8 = 50
    const r = calculateConnectedTriple(2, 3, 5, 0.2, 100);
    expect(r.status).toBe('sliding');
    expect(r.accel).toBeCloseTo(8.04);
    expect(r.T2).toBeCloseTo(20);
    expect(r.T1).toBeCloseTo(50);
  });

  it('T1 should always be greater than T2 when sliding', () => {
    const r = calculateConnectedTriple(3, 3, 4, 0.3, 200);
    expect(r.status).toBe('sliding');
    expect(r.T1).toBeGreaterThan(r.T2);
  });

  it('should handle static state with T2 < T1', () => {
    // fMaxTotal = 0.5*15*9.8 = 73.5 > 10, so static
    const r = calculateConnectedTriple(5, 5, 5, 0.5, 10);
    expect(r.status).toBe('static');
    expect(r.accel).toBe(0);
    expect(r.T2).toBeCloseTo(10 / 3);
    expect(r.T1).toBeCloseTo(20 / 3);
    expect(r.T1).toBeGreaterThan(r.T2);
  });
});
