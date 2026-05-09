import { describe, it, expect } from 'vitest';
import { evaluateRule } from '../judgingEngine';
import { StudentForce, JudgeRule, JudgingContext } from '../../data/types';

describe('judgingEngine - FORCE_PRESENT', () => {
  const context: JudgingContext = {
    expectedTarget: '受力图1',
    expectedStage: '加速阶段'
  };

  const baseRule: JudgeRule = {
    expect: '必须画出重力',
    hintWhenWrong: '漏画了重力',
    ruleType: 'FORCE_PRESENT',
    ruleParams: {
      forceType: 'Gravity'
    },
    appliesTo: '受力图1'
  };

  it('力存在且全部字段匹配 → passed', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Gravity',
        label: 'G',
        targetObject: 'A',
        stage: '加速阶段',
        angle: 270
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(true);
    expect(result.hint).toBeUndefined();
  });

  it('力的 type 匹配但 targetObject 不匹配 → failed', () => {
    const ruleWithTarget: JudgeRule = {
      ...baseRule,
      ruleParams: { forceType: 'Gravity', targetObject: 'B' }
    };
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Gravity',
        label: 'G',
        targetObject: 'A', // 不匹配 'B'
        stage: '加速阶段',
        angle: 270
      }
    ];
    const result = evaluateRule(ruleWithTarget, studentForces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('漏画了重力');
  });

  it('力的 type 匹配但 sourceObject 不匹配 → failed', () => {
    const ruleWithSource: JudgeRule = {
      ...baseRule,
      hintWhenWrong: '漏画了拉力',
      ruleParams: { forceType: 'Applied', sourceObject: 'B' }
    };
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Applied',
        label: 'F',
        targetObject: 'C',
        sourceObject: 'A', // 不匹配 'B'
        stage: '加速阶段',
        angle: 0
      }
    ];
    const result = evaluateRule(ruleWithSource, studentForces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('漏画了拉力');
  });

  it('studentForces 为空数组 → failed', () => {
    const studentForces: StudentForce[] = [];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('漏画了重力');
  });
});

describe('judgingEngine - FORCE_ABSENT', () => {
  const context: JudgingContext = {
    expectedTarget: '受力图1',
    expectedStage: '平衡阶段'
  };

  const baseRule: JudgeRule = {
    expect: '不能画出摩擦力',
    hintWhenWrong: '此时不应有摩擦力',
    ruleType: 'FORCE_ABSENT',
    ruleParams: {
      forceType: 'Friction',
      targetObject: 'B'
    },
    appliesTo: '受力图1'
  };

  it('该类型的力不存在 → passed', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Gravity',
        label: 'G',
        targetObject: 'B',
        stage: '平衡阶段',
        angle: 270
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(true);
    expect(result.hint).toBeUndefined();
  });

  it('该类型的力存在 → failed，返回 hintWhenWrong', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Friction',
        label: 'f',
        targetObject: 'B',
        stage: '平衡阶段',
        angle: 180
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('此时不应有摩擦力');
  });

  it('该类型的力存在但 targetObject 不匹配 → passed（不应误判）', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Friction',
        label: 'f',
        targetObject: 'A', // A 上有摩擦力，不影响判断 B
        stage: '平衡阶段',
        angle: 180
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(true);
    expect(result.hint).toBeUndefined();
  });
});

describe('judgingEngine - NO_FAKE_FORCE', () => {
  const context: JudgingContext = {
    expectedTarget: '受力图1',
    expectedStage: '圆周运动阶段'
  };

  const baseRule: JudgeRule = {
    expect: '不能画向心力',
    hintWhenWrong: '向心力不是一种独立真实力',
    ruleType: 'NO_FAKE_FORCE',
    ruleParams: {
      fakeNames: ['向心力', 'CentripetalForce']
    },
    appliesTo: '受力图1'
  };

  it('没有伪力 → passed', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Gravity',
        label: 'G',
        targetObject: 'A',
        stage: '圆周运动阶段',
        angle: 270
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(true);
    expect(result.hint).toBeUndefined();
  });

  it('force.type === "FakeForce" → failed', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'FakeForce', // 直接使用了 FakeForce 类型
        label: '未知力', 
        targetObject: 'A',
        stage: '圆周运动阶段',
        angle: 0
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('向心力不是一种独立真实力');
  });

  it('force.label 在 fakeNames 里（大小写不同） → failed', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Applied', // 即使 type 是正常的
        label: 'centripetalFORCE', // 忽略大小写匹配了 CentripetalForce
        targetObject: 'A',
        stage: '圆周运动阶段',
        angle: 0
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('向心力不是一种独立真实力');
  });

  it('force.label 不在 fakeNames 里，type 也不是 FakeForce → passed', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Applied',
        label: 'F1',
        targetObject: 'A',
        stage: '圆周运动阶段',
        angle: 0
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(true);
    expect(result.hint).toBeUndefined();
  });
});

describe('judgingEngine - INTERNAL_FORCE_ABSENT', () => {
  const context: JudgingContext = {
    expectedTarget: '整体受力图',
    expectedStage: '加速阶段'
  };

  const baseRule: JudgeRule = {
    expect: '整体图中不应出现内部相互作用力',
    hintWhenWrong: '整体法中系统内部相互作用力不作为外力列入',
    ruleType: 'INTERNAL_FORCE_ABSENT',
    ruleParams: {
      systemObjects: ['A', 'B', 'C']
    },
    appliesTo: '整体受力图'
  };

  it('没有内力（sourceObject 不在 systemObjects 里）→ passed', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Gravity',
        label: 'G',
        targetObject: 'A',
        sourceObject: 'Earth', // 不在 ['A', 'B', 'C'] 中
        stage: '加速阶段',
        angle: 270
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(true);
    expect(result.hint).toBeUndefined();
  });

  it('sourceObject 和 targetObject 都在 systemObjects 里 → failed', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Applied',
        label: 'F_AB',
        targetObject: 'B', // 在系统中
        sourceObject: 'A', // 在系统中
        stage: '加速阶段',
        angle: 0
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('整体法中系统内部相互作用力不作为外力列入');
  });

  it('只有 sourceObject 在 systemObjects 里，targetObject 不在 → passed（外力不算内力）', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Applied',
        label: 'F',
        targetObject: 'Wall', // 不在系统中
        sourceObject: 'A',    // 在系统中
        stage: '加速阶段',
        angle: 0
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(true);
    expect(result.hint).toBeUndefined();
  });

  it('力没有 sourceObject 字段（undefined）→ passed（无施力方信息不判为内力）', () => {
    const studentForces: StudentForce[] = [
      {
        id: 'f1',
        type: 'Friction',
        label: 'f',
        targetObject: 'A',
        // sourceObject is undefined
        stage: '加速阶段',
        angle: 180
      }
    ];
    const result = evaluateRule(baseRule, studentForces, context);
    expect(result.passed).toBe(true);
    expect(result.hint).toBeUndefined();
  });
});

describe('judgingEngine - DIRECTION_CHECK', () => {
  const context: JudgingContext = {
    expectedTarget: '图1',
    expectedStage: '运动阶段'
  };

  const getBaseForce = (): StudentForce => ({
    id: 'f1', type: 'Gravity', label: 'G', targetObject: 'A', stage: '运动阶段', angle: 0
  });

  // 分支 1
  it('分支 1：固定角度匹配（无容差） → passed', () => {
    const rule: JudgeRule = {
      expect: '重力向下', hintWhenWrong: '方向错误', ruleType: 'DIRECTION_CHECK',
      ruleParams: { forceType: 'Gravity', expectedAngle: 270 }, appliesTo: '图1'
    };
    const forces = [{ ...getBaseForce(), angle: 270 }];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(true);
  });

  it('分支 1：固定角度跨界容差（358 vs 0） → passed', () => {
    const rule: JudgeRule = {
      expect: '水平向右', hintWhenWrong: '方向错误', ruleType: 'DIRECTION_CHECK',
      ruleParams: { forceType: 'Applied', expectedAngle: 0 }, appliesTo: '图1'
    };
    const forces = [{ ...getBaseForce(), type: 'Applied' as const, angle: 358 }];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(true);
  });

  it('分支 1：固定角度不匹配 → failed', () => {
    const rule: JudgeRule = {
      expect: '重力向下', hintWhenWrong: '重力必须竖直向下', ruleType: 'DIRECTION_CHECK',
      ruleParams: { forceType: 'Gravity', expectedAngle: 270 }, appliesTo: '图1'
    };
    const forces = [{ ...getBaseForce(), angle: 180 }];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('重力必须竖直向下');
  });

  // 分支 2
  it('分支 2：relativeTo String → passed', () => {
    const rule: JudgeRule = {
      expect: '沿绳', hintWhenWrong: '方向不对', ruleType: 'DIRECTION_CHECK',
      ruleParams: { forceType: 'Tension', relativeTo: 'String' }, appliesTo: '图1'
    };
    const forces = [{ ...getBaseForce(), type: 'Tension' as const, isAlongSurface: undefined }];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(true);
  });

  it('分支 2：relativeTo String 但学生画成了沿斜面 → failed', () => {
    const rule: JudgeRule = {
      expect: '沿绳', hintWhenWrong: '方向不对', ruleType: 'DIRECTION_CHECK',
      ruleParams: { forceType: 'Tension', relativeTo: 'String' }, appliesTo: '图1'
    };
    const forces = [{ ...getBaseForce(), type: 'Tension' as const, isAlongSurface: true }];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('方向不对');
  });

  // 分支 3
  it('分支 3：垂直斜面匹配 → passed', () => {
    const rule: JudgeRule = {
      expect: '垂直斜面', hintWhenWrong: '需垂直', ruleType: 'DIRECTION_CHECK',
      ruleParams: { forceType: 'Normal', relativeTo: 'Surface', isPerpendicular: true }, appliesTo: '图1'
    };
    const forces = [{ ...getBaseForce(), type: 'Normal' as const, isPerpendicular: true }];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(true);
  });

  it('分支 3：垂直斜面不匹配 → failed', () => {
    const rule: JudgeRule = {
      expect: '垂直斜面', hintWhenWrong: '需垂直', ruleType: 'DIRECTION_CHECK',
      ruleParams: { forceType: 'Normal', relativeTo: 'Surface', isPerpendicular: true }, appliesTo: '图1'
    };
    const forces = [{ ...getBaseForce(), type: 'Normal' as const, isPerpendicular: false }];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(false);
  });

  // 分支 4
  it('分支 4：沿斜面匹配且 directionSense 匹配 → passed', () => {
    const rule: JudgeRule = {
      expect: '沿斜面向下', hintWhenWrong: '需向下', ruleType: 'DIRECTION_CHECK',
      ruleParams: { forceType: 'Friction', relativeTo: 'Surface', isAlongSurface: true, directionSense: -1 }, appliesTo: '图1'
    };
    const forces = [{ ...getBaseForce(), type: 'Friction' as const, isAlongSurface: true, directionSense: -1 as const }];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(true);
  });

  it('分支 4：沿斜面匹配但 directionSense 不匹配 → failed', () => {
    const rule: JudgeRule = {
      expect: '沿斜面向下', hintWhenWrong: '需向下', ruleType: 'DIRECTION_CHECK',
      ruleParams: { forceType: 'Friction', relativeTo: 'Surface', isAlongSurface: true, directionSense: -1 }, appliesTo: '图1'
    };
    const forces = [{ ...getBaseForce(), type: 'Friction' as const, isAlongSurface: true, directionSense: 1 as const }];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('需向下');
  });
  
  it('所有分支：找不到力 → failed', () => {
    const rule: JudgeRule = {
      expect: '重力向下', hintWhenWrong: '漏画重力或方向错', ruleType: 'DIRECTION_CHECK',
      ruleParams: { forceType: 'Gravity', expectedAngle: 270 }, appliesTo: '图1'
    };
    const result = evaluateRule(rule, [], context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('漏画重力或方向错');
  });
});

describe('judgingEngine - MAGNITUDE_RELATION', () => {
  const context: JudgingContext = {
    expectedTarget: '图1',
    expectedStage: '运动阶段'
  };

  const getBaseForce1 = (mag?: number): StudentForce => ({
    id: 'f1', type: 'Tension', label: 'T', stage: '运动阶段', angle: 90, magnitudeValue: mag
  });
  
  const getBaseForce2 = (mag?: number): StudentForce => ({
    id: 'f2', type: 'Gravity', label: 'G', stage: '运动阶段', angle: 270, magnitudeValue: mag
  });

  it('relation: "="，两力大小相等（在 5% 误差内）→ passed', () => {
    const rule: JudgeRule = {
      expect: '拉力等于重力', hintWhenWrong: '两者应相等', ruleType: 'MAGNITUDE_RELATION',
      ruleParams: { forceType1: 'Tension', forceType2: 'Gravity', relation: '=' }, appliesTo: '图1'
    };
    // 100 和 104，相对误差 4/104 = 0.038 < 0.05
    const forces = [getBaseForce1(104), getBaseForce2(100)];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(true);
    expect(result.hint).toBeUndefined();
  });

  it('relation: "="，两力大小明显不等 → failed', () => {
    const rule: JudgeRule = {
      expect: '拉力等于重力', hintWhenWrong: '两者应相等', ruleType: 'MAGNITUDE_RELATION',
      ruleParams: { forceType1: 'Tension', forceType2: 'Gravity', relation: '=' }, appliesTo: '图1'
    };
    // 100 和 110，相对误差 10/110 = 0.09 > 0.05
    const forces = [getBaseForce1(110), getBaseForce2(100)];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('两者应相等');
  });

  it('relation: ">"，v1 > v2 → passed', () => {
    const rule: JudgeRule = {
      expect: '拉力大于重力', hintWhenWrong: '拉力应大于重力', ruleType: 'MAGNITUDE_RELATION',
      ruleParams: { forceType1: 'Tension', forceType2: 'Gravity', relation: '>' }, appliesTo: '图1'
    };
    const forces = [getBaseForce1(101), getBaseForce2(100)];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(true);
    expect(result.hint).toBeUndefined();
  });

  it('relation: ">"，v1 < v2 → failed', () => {
    const rule: JudgeRule = {
      expect: '拉力大于重力', hintWhenWrong: '拉力应大于重力', ruleType: 'MAGNITUDE_RELATION',
      ruleParams: { forceType1: 'Tension', forceType2: 'Gravity', relation: '>' }, appliesTo: '图1'
    };
    const forces = [getBaseForce1(90), getBaseForce2(100)];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('拉力应大于重力');
  });

  it('其中一个力的 magnitudeValue 为 undefined → failed，hint 提示"未提供力的大小信息"', () => {
    const rule: JudgeRule = {
      expect: '拉力等于重力', hintWhenWrong: '两者应相等', ruleType: 'MAGNITUDE_RELATION',
      ruleParams: { forceType1: 'Tension', forceType2: 'Gravity', relation: '=' }, appliesTo: '图1'
    };
    const forces = [getBaseForce1(100), getBaseForce2(undefined)];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('未提供力的大小信息');
  });
});

describe('judgingEngine - COORDINATE_CHECK', () => {
  const baseRule: JudgeRule = {
    expect: '坐标轴应沿斜面和垂直斜面',
    hintWhenWrong: '坐标系建立错误',
    ruleType: 'COORDINATE_CHECK',
    ruleParams: { xAlign: 'Surface', yAlign: 'Normal' },
    appliesTo: '图1'
  };

  it('studentCoords 为 undefined → failed，hint 说明"未建立坐标系"', () => {
    const context: JudgingContext = { expectedTarget: '图1', expectedStage: '阶段1' }; // 无 studentCoords
    const result = evaluateRule(baseRule, [], context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('未建立坐标系');
  });

  it('x 轴沿斜面（如 xAxisAngle: 30），y 轴垂直斜面（yAxisAngle: 120，差值 90°）→ passed', () => {
    const context: JudgingContext = {
      expectedTarget: '图1', expectedStage: '阶段1',
      studentCoords: { xAxisAngle: 30, yAxisAngle: 120 }
    };
    const result = evaluateRule(baseRule, [], context);
    expect(result.passed).toBe(true);
    expect(result.hint).toBeUndefined();
  });

  it('x 轴是竖直方向（xAxisAngle: 90）→ failed', () => {
    const context: JudgingContext = {
      expectedTarget: '图1', expectedStage: '阶段1',
      studentCoords: { xAxisAngle: 90, yAxisAngle: 180 } // 差值也是 90，但 xAxisAngle 是竖直的
    };
    const result = evaluateRule(baseRule, [], context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('坐标系建立错误');
  });

  it('x 轴和 y 轴不互相垂直（差值不是 90°）→ failed', () => {
    const context: JudgingContext = {
      expectedTarget: '图1', expectedStage: '阶段1',
      studentCoords: { xAxisAngle: 30, yAxisAngle: 100 } // 差值 70
    };
    const result = evaluateRule(baseRule, [], context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('坐标系建立错误');
  });
});

describe('judgingEngine - DIRECTION_CONDITIONAL', () => {
  const rule: JudgeRule = {
    expect: '摩擦力方向应正确',
    hintWhenWrong: '摩擦力方向错误',
    ruleType: 'DIRECTION_CONDITIONAL',
    ruleParams: {
      conditionalFn: 'calculateInclinePulleySystem',
      forceType: 'Friction',
      targetObject: 'A'
    },
    appliesTo: '图1'
  };

  const getBaseForce = (sense: 1 | -1): StudentForce => ({
    id: 'f1', type: 'Friction', label: 'f', targetObject: 'A', stage: '运动阶段', angle: 0, directionSense: sense
  });

  it('A_UP 场景：学生摩擦力 directionSense: -1 → passed', () => {
    // 物理参数：mB 很大，拉力大于重力分力+最大静摩擦力 -> A_UP
    const context: JudgingContext = {
      expectedTarget: '图1', expectedStage: '运动阶段',
      physicsParams: { mA: 1, mB: 10, theta: 30, mu: 0.1 }
    };
    const forces = [getBaseForce(-1)];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(true);
  });

  it('A_UP 场景：学生摩擦力 directionSense: 1 → failed', () => {
    const context: JudgingContext = {
      expectedTarget: '图1', expectedStage: '运动阶段',
      physicsParams: { mA: 1, mB: 10, theta: 30, mu: 0.1 }
    };
    const forces = [getBaseForce(1)];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(false);
    expect(result.hint).toBe('摩擦力方向错误');
  });

  it('A_DOWN 场景：学生摩擦力 directionSense: 1 → passed', () => {
    // 物理参数：mA 很大，重力分力很大 -> A_DOWN
    const context: JudgingContext = {
      expectedTarget: '图1', expectedStage: '运动阶段',
      physicsParams: { mA: 10, mB: 1, theta: 60, mu: 0.1 }
    };
    const forces = [getBaseForce(1)];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(true);
  });

  it('STATIC 场景 → passed（引擎层跳过方向判别）', () => {
    // 物理参数：mB=mA, 且有摩擦力，处于静止范围
    const context: JudgingContext = {
      expectedTarget: '图1', expectedStage: '运动阶段',
      physicsParams: { mA: 1, mB: 1, theta: 30, mu: 0.8 } // 0.5 < 1 + 0.8 * 0.866
    };
    // 无论方向是 1 还是 -1 都会 passed
    const forces = [getBaseForce(1)];
    const result = evaluateRule(rule, forces, context);
    expect(result.passed).toBe(true);
  });
});
