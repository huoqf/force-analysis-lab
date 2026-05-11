import { StudentForce, JudgeRule, JudgingContext, JudgeResult } from '../data/types';
import { calculateInclinePulleySystem } from './mechanics';

const conditionalFnRegistry: Record<string, (params: Record<string, any>) => Record<string, any>> = {
  calculateInclinePulleySystem,
};

export function evaluateRule(
  rule: JudgeRule,
  studentForces: StudentForce[],
  context: JudgingContext
): JudgeResult {
  // 1. 过滤出当前阶段（stage）的力
  const forcesInStage = studentForces.filter(f => f.stage === context.expectedStage);

  // 2. 根据 ruleType 执行具体判别逻辑
  switch (rule.ruleType) {
    case 'FORCE_PRESENT': {
      const { forceType, targetObject, sourceObject } = rule.ruleParams;
      const found = forcesInStage.some(force => {
        if (force.type !== forceType) return false;
        if (targetObject && force.targetObject !== targetObject) return false;
        if (sourceObject && force.sourceObject !== sourceObject) return false;
        return true;
      });
      return { passed: found, hint: found ? undefined : rule.hintWhenWrong };
    }

    case 'FORCE_ABSENT': {
      const { forceType, targetObject, sourceObject } = rule.ruleParams;
      const found = forcesInStage.some(force => {
        if (force.type !== forceType) return false;
        if (targetObject && force.targetObject !== targetObject) return false;
        if (sourceObject && force.sourceObject !== sourceObject) return false;
        return true;
      });
      return { passed: !found, hint: !found ? undefined : rule.hintWhenWrong };
    }

    case 'NO_FAKE_FORCE': {
      const { fakeNames } = rule.ruleParams;
      const lowerFakeNames = fakeNames ? fakeNames.map(name => name.toLowerCase()) : [];
      const foundFake = forcesInStage.some(force => {
        if (force.type === 'FakeForce') return true;
        if (lowerFakeNames.includes(force.label.toLowerCase())) return true;
        return false;
      });
      return { passed: !foundFake, hint: !foundFake ? undefined : rule.hintWhenWrong };
    }

    case 'INTERNAL_FORCE_ABSENT': {
      const { systemObjects } = rule.ruleParams;
      if (!systemObjects || systemObjects.length === 0) {
        return { passed: true }; // 若未提供系统对象，则默认通过
      }
      const foundInternal = forcesInStage.some(force => {
        if (!force.sourceObject || !force.targetObject) return false;
        const isSourceInSystem = systemObjects.includes(force.sourceObject);
        const isTargetInSystem = systemObjects.includes(force.targetObject);
        return isSourceInSystem && isTargetInSystem;
      });
      return { passed: !foundInternal, hint: !foundInternal ? undefined : rule.hintWhenWrong };
    }

    case 'DIRECTION_CHECK': {
      const { forceType, targetObject, sourceObject, expectedAngle, relativeTo, isPerpendicular, isAlongSurface, directionSense } = rule.ruleParams;
      
      // 找到匹配的力
      const targetForce = forcesInStage.find(force => {
        if (force.type !== forceType) return false;
        if (targetObject && force.targetObject !== targetObject) return false;
        if (sourceObject && force.sourceObject !== sourceObject) return false;
        return true;
      });

      if (!targetForce) {
        return { passed: false, hint: rule.hintWhenWrong };
      }

      // 分支 1：relativeTo 未定义，使用 expectedAngle 固定角度判别
      if (!relativeTo) {
        if (expectedAngle === undefined) {
          return { passed: false, hint: '规则配置错误：未指定 expectedAngle' };
        }
        let diff = Math.abs(targetForce.angle - expectedAngle) % 360;
        if (diff > 180) diff = 360 - diff;
        const passed = diff <= 5;
        return { passed, hint: passed ? undefined : rule.hintWhenWrong };
      }

      // 分支 2：relativeTo === 'String'
      if (relativeTo === 'String') {
        // 绳子方向由 UI 层几何验证，引擎层跳过（或者仅作基础判断）
        const passed = targetForce.isAlongSurface !== true && targetForce.isPerpendicular !== true;
        return { passed, hint: passed ? undefined : rule.hintWhenWrong };
      }

      // 分支 3：relativeTo === 'Surface' 且 isPerpendicular === true
      if (relativeTo === 'Surface' && isPerpendicular === true) {
        const passed = targetForce.isPerpendicular === true;
        return { passed, hint: passed ? undefined : rule.hintWhenWrong };
      }

      // 分支 4：relativeTo === 'Surface' 且 isAlongSurface === true
      if (relativeTo === 'Surface' && isAlongSurface === true) {
        let passed = targetForce.isAlongSurface === true;
        if (passed && directionSense !== undefined) {
          passed = targetForce.directionSense === directionSense;
        }
        return { passed, hint: passed ? undefined : rule.hintWhenWrong };
      }

      return { passed: false, hint: rule.hintWhenWrong };
    }

    case 'MAGNITUDE_RELATION': {
      const { forceType1, forceType2, targetObject, relation } = rule.ruleParams;
      const force1 = forcesInStage.find(f => f.type === forceType1 && (!targetObject || f.targetObject === targetObject));
      const force2 = forcesInStage.find(f => f.type === forceType2 && (!targetObject || f.targetObject === targetObject));
      if (!force1 || !force2) {
        return { passed: false, hint: rule.hintWhenWrong };
      }
      const v1 = force1.magnitudeValue;
      const v2 = force2.magnitudeValue;
      if (v1 === undefined || v2 === undefined) {
        return { passed: false, hint: '未提供力的大小信息' };
      }
      let passed = false;
      if (relation === '=') {
        const maxV = Math.max(v1, v2);
        if (maxV === 0) {
          passed = Math.abs(v1 - v2) === 0;
        } else {
          passed = Math.abs(v1 - v2) / maxV <= 0.05;
        }
      } else if (relation === '>') {
        passed = v1 > v2;
      } else if (relation === '<') {
        passed = v1 < v2;
      }
      return { passed, hint: passed ? undefined : rule.hintWhenWrong };
    }

    case 'COORDINATE_CHECK': {
      const coords = context.studentCoords;
      if (!coords) {
        return { passed: false, hint: '未建立坐标系' };
      }
      const { xAlign, yAlign } = rule.ruleParams;
      let passed = true;
      if (xAlign === 'Surface') {
        // x 轴不是竖直方向（即模 180 不能为 90）
        const mod = Math.abs(coords.xAxisAngle % 180);
        if (Math.abs(mod - 90) < 0.1) {
          passed = false;
        }
      }
      if (yAlign === 'Normal') {
        // x 和 y 互相垂直（差值为 90 或 270）
        const diff = Math.abs(coords.yAxisAngle - coords.xAxisAngle) % 360;
        const isPerpendicular = Math.abs(diff - 90) < 0.1 || Math.abs(diff - 270) < 0.1;
        if (!isPerpendicular) {
          passed = false;
        }
      }
      return { passed, hint: passed ? undefined : rule.hintWhenWrong };
    }

    case 'DIRECTION_CONDITIONAL': {
      const { conditionalFn, forceType, targetObject } = rule.ruleParams;
      if (!conditionalFn || !conditionalFnRegistry[conditionalFn]) {
        return { passed: false, hint: `引擎未注册动态判断函数：${conditionalFn}` };
      }
      if (!context.physicsParams) {
        return { passed: false, hint: '未提供物理参数 physicsParams' };
      }
      const fn = conditionalFnRegistry[conditionalFn];
      const result = fn(context.physicsParams) as { motionDirection?: string };
      const { motionDirection } = result;
      if (!motionDirection) {
        return { passed: false, hint: `动态函数未返回 motionDirection` };
      }
      // STATIC 场景跳过引擎方向判别
      if (motionDirection === 'STATIC') {
        return { passed: true }; // 静止状态摩擦力方向由 UI 层处理
      }
      // 找到匹配的力
      const targetForce = forcesInStage.find(force => {
        if (force.type !== forceType) return false;
        if (targetObject && force.targetObject !== targetObject) return false;
        return true;
      });
      if (!targetForce) {
        return { passed: false, hint: rule.hintWhenWrong };
      }
      let expectedDirectionSense: 1 | -1;
      if (motionDirection === 'A_UP') {
        expectedDirectionSense = -1;
      } else if (motionDirection === 'A_DOWN') {
        expectedDirectionSense = 1;
      } else {
        return { passed: false, hint: `未知的 motionDirection：${motionDirection}` };
      }
      const passed = targetForce.directionSense === expectedDirectionSense;
      return { passed, hint: passed ? undefined : rule.hintWhenWrong };
    }

    // 后续 ruleType 的实现将陆续添加在此处
    default:
      return { passed: false, hint: `引擎尚未实现该判别类型：${rule.ruleType}` };
  }
}
