export interface StudentTask {
  label: string;
  target: string;
}

export type ForceType = 
  | 'Gravity'      // 重力
  | 'Normal'       // 支持力/弹力
  | 'Tension'      // 绳子拉力
  | 'Friction'     // 摩擦力
  | 'Applied'      // 外部推力/拉力
  | 'Electrostatic'// 静电力
  | 'FakeForce';   // 伪力或效果力（如向心力、运动力）

export type MagnitudeRelation = '=' | '>' | '<';

export type RuleType = 
  | 'FORCE_PRESENT'
  | 'FORCE_ABSENT'
  | 'NO_FAKE_FORCE'
  | 'INTERNAL_FORCE_ABSENT'
  | 'DIRECTION_CHECK'
  | 'DIRECTION_CONDITIONAL' // 动态判别方向 (例如 p08)
  | 'MAGNITUDE_RELATION'
  | 'COORDINATE_CHECK';

export interface StudentCoordinateSystem {
  xAxisAngle: number;
  yAxisAngle: number;
}

export interface StudentForce {
  id: string;
  type: ForceType;        
  label: string;          // 显示标签（如 G, N, T, f, F_AB 等）
  targetObject: string;   // 受力对象
  sourceObject?: string;  // 施力对象（用于判别内力）
  stage: string;          // 当前力所属的运动阶段
  // angle 约定：0° = 水平向右，90° = 竖直向上，180° = 水平向左，270° = 竖直向下
  // 顺时针为负，逆时针为正（标准数学坐标系）
  angle: number;
  isAlongSurface?: boolean; // 语义化标记：是否平行于接触面/斜面
  isPerpendicular?: boolean;// 语义化标记：是否垂直于接触面/斜面
  directionSense?: 1 | -1;  // 1 为正向（如沿斜面向上），-1 为反向
  magnitudeValue?: number;  // 标量大小（用于比对 T>mg 等）
}

export interface JudgingContext {
  expectedTarget: string;       // 当前题目要求画图的对象
  expectedStage: string;        // 当前题目要求的状态
  physicsParams?: Record<string, number>; // 题目的物理参数，如 { mA: 2, mB: 1, theta: 30, mu: 0.3 }
  studentCoords?: StudentCoordinateSystem; // 学生建立的坐标系
}

export interface RuleParams {
  forceType?: ForceType;
  forceType1?: ForceType;
  forceType2?: ForceType;
  targetObject?: string; // 针对哪一个受力物体（用于同一张图上有多个物体的情况）
  sourceObject?: string;
  fakeNames?: string[];
  systemObjects?: string[];
  expectedAngle?: number;
  relativeTo?: 'Surface' | 'String';
  directionSense?: 1 | -1;
  relation?: MagnitudeRelation;
  xAlign?: 'Surface';
  yAlign?: 'Normal';
  conditionalFn?: string; // 指定要调用的动态判别函数名，如 "calculateInclinePulleySystem"
  conditionalResultKey?: string; // 动态函数的返回值中用于判断的 key，如 "motionDirection"
}

export interface JudgeRule {
  expect: string;
  hintWhenWrong: string;
  ruleType: RuleType;
  ruleParams: RuleParams;
  appliesTo: string; // 对应 studentTasks[].target，标明此规则属于哪张受力图
}

export interface JudgeResult {
  passed: boolean;
  hint?: string; // 仅在 failed 时返回 hintWhenWrong
}

export interface ProblemSchema {
  id: string;
  title: string;
  source: string;
  scenario: string;
  studentTasks: StudentTask[];
  judgeRules: JudgeRule[];
  analysis: string;
  trainingTags: string[];
  difficultyLayer: 1 | 2 | 3;
}
