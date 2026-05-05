import React from 'react';

interface PulleyProps {
  cx: number;       // 圆心 x
  cy: number;       // 圆心 y
  radius?: number;  // 滑轮半径，默认 32
  type: 'fixed' | 'moving';
  highlight?: boolean;
}

/**
 * PulleySymbol — SVG 滑轮符号
 *
 * fixed:  定滑轮（带固定架标记）
 * moving: 动滑轮（带挂钩竖线）
 *
 * 在具体 lesson 页面的 SVG 内直接使用，绳子坐标由页面自行绘制。
 */
const PulleySymbol: React.FC<PulleyProps> = ({
  cx,
  cy,
  radius = 32,
  type,
  highlight = false,
}) => {
  const strokeColor = highlight ? '#60a5fa' : '#cbd5e1';
  const fillColor   = highlight ? 'rgba(96,165,250,0.12)' : 'rgba(203,213,225,0.08)';

  return (
    <g>
      {/* ── 定滑轮固定架（顶部横梁 + 斜线纹） ── */}
      {type === 'fixed' && (
        <>
          {/* 横梁 */}
          <line
            x1={cx - radius - 12} y1={cy - radius - 4}
            x2={cx + radius + 12} y2={cy - radius - 4}
            stroke={strokeColor} strokeWidth={5} strokeLinecap="round"
          />
          {/* 斜纹（固定端标识） */}
          {[-20, -8, 4, 16].map((dx) => (
            <line
              key={dx}
              x1={cx + dx} y1={cy - radius - 4}
              x2={cx + dx - 10} y2={cy - radius - 14}
              stroke={strokeColor} strokeWidth={2} strokeOpacity={0.5}
            />
          ))}
          {/* 连接销 */}
          <line
            x1={cx} y1={cy - radius - 4}
            x2={cx} y2={cy - radius + 2}
            stroke={strokeColor} strokeWidth={4}
          />
        </>
      )}

      {/* ── 动滑轮挂钩（底部竖线连接物体） ── */}
      {type === 'moving' && (
        <line
          x1={cx} y1={cy + radius}
          x2={cx} y2={cy + radius + 20}
          stroke={strokeColor} strokeWidth={4} strokeLinecap="round"
        />
      )}

      {/* ── 滑轮主体 ── */}
      {/* 外圆 */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill={fillColor}
        stroke={strokeColor} strokeWidth={3}
      />
      {/* 内圆（轮毂） */}
      <circle
        cx={cx} cy={cy} r={radius * 0.28}
        fill={strokeColor} fillOpacity={0.5}
        stroke={strokeColor} strokeWidth={1.5}
      />
      {/* 轮辐（3根） */}
      {[0, 120, 240].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={cx + radius * 0.28 * Math.cos(rad)}
            y1={cy + radius * 0.28 * Math.sin(rad)}
            x2={cx + radius * 0.8 * Math.cos(rad)}
            y2={cy + radius * 0.8 * Math.sin(rad)}
            stroke={strokeColor} strokeWidth={1.5} strokeOpacity={0.6}
          />
        );
      })}
    </g>
  );
};

export default PulleySymbol;
