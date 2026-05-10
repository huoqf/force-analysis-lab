import React from 'react';
import ForceArrow from './ForceArrow';
import { StudentForce } from '../../data/types';

interface StudentForceLayerProps {
  /** 当前阶段的学生力列表 */
  studentForces: StudentForce[];
  /** 力箭头的 SVG 原点 X（物体中心） */
  originX: number;
  /** 力箭头的 SVG 原点 Y（物体中心） */
  originY: number;
  /** 力箭头颜色映射，按 ForceType */
  colorMap?: Record<string, string>;
  /** 箭头长度缩放倍数（默认 1.0 = 100px） */
  scale?: number;
}

/**
 * 引擎角度约定（数学坐标系）：0=右, 90=上, 180=左, 270=下
 * SVG 坐标系约定（Y 轴向下）：0=右, 90=下, 180=左, 270=上
 *
 * 转换：svgAngle = (360 - engineAngle) % 360
 * 但 ForceArrow 内部已处理 SVG 方向，这里统一用 "引擎角→SVG角" 做转换。
 */
function engineToSVGAngle(engineAngle: number): number {
  return (360 - engineAngle) % 360;
}

const DEFAULT_COLOR_MAP: Record<string, string> = {
  Gravity: '#ef4444',
  Normal: '#60a5fa',
  Tension: '#4ade80',
  Friction: '#f87171',
  Applied: '#fbbf24',
  Electrostatic: '#a78bfa',
  FakeForce: '#c084fc',
};

const StudentForceLayer: React.FC<StudentForceLayerProps> = ({
  studentForces,
  originX,
  originY,
  colorMap = {},
  scale = 1.0,
}) => {
  const mergedColors = { ...DEFAULT_COLOR_MAP, ...colorMap };

  return (
    <>
      {studentForces.map((force) => {
        const color = mergedColors[force.type] ?? '#ffffff';
        const svgAngle = engineToSVGAngle(force.angle);
        // magnitude 影响箭头长度；固定长度 50 * scale，让箭头视觉统一
        const magnitude = 50 * scale;

        return (
          <ForceArrow
            key={force.id}
            x={originX}
            y={originY}
            magnitude={magnitude}
            angle={svgAngle}
            color={color}
            label={force.label}
          />
        );
      })}
    </>
  );
};

export default StudentForceLayer;
