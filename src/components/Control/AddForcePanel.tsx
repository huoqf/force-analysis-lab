import React, { useState } from 'react';
import { Plus, ChevronRight, X } from 'lucide-react';
import { ForceType, StudentForce } from '../../data/types';

export interface DirectionOption {
  label: string;
  /** 引擎角度约定：0=右, 90=上, 180=左, 270=下 */
  angle: number;
  /** 是否平行斜面 */
  isAlongSurface?: boolean;
  /** 是否垂直斜面 */
  isPerpendicular?: boolean;
  /** 方向感：1=正向（沿斜面向上），-1=反向 */
  directionSense?: 1 | -1;
}

export interface ForceOption {
  type: ForceType;
  /** 面板显示标签，如"重力 G" */
  label: string;
  /** 力符号，用于标注箭头，如"G" */
  symbol: string;
  /** 箭头颜色 */
  color: string;
  /** 可选方向列表 */
  directions: DirectionOption[];
  /** 若 true，此力在受力图中只能添加一次（同 type 不能重复） */
  uniquePerStage?: boolean;
  /** 是否是干扰力（FakeForce）——显示时加警告样式 */
  isFake?: boolean;
}

interface AddForcePanelProps {
  availableForces: ForceOption[];
  /** 当前阶段已添加的力，用于置灰同类型力 */
  existingForces: StudentForce[];
  /** 确认添加时的回调，返回完整的 StudentForce（id 由父组件生成） */
  onConfirm: (force: Omit<StudentForce, 'id' | 'targetObject' | 'stage'>) => void;
}

type Step = 'select-type' | 'select-direction';

const AddForcePanel: React.FC<AddForcePanelProps> = ({
  availableForces,
  existingForces,
  onConfirm,
}) => {
  const [step, setStep] = useState<Step>('select-type');
  const [selectedForce, setSelectedForce] = useState<ForceOption | null>(null);

  const handleSelectType = (force: ForceOption) => {
    setSelectedForce(force);
    if (force.directions.length === 1) {
      // 只有一个方向时直接确认
      const dir = force.directions[0];
      onConfirm({
        type: force.type,
        label: force.symbol,
        angle: dir.angle,
        isAlongSurface: dir.isAlongSurface,
        isPerpendicular: dir.isPerpendicular,
        directionSense: dir.directionSense,
      });
      // 不切换步骤，保持在 select-type
    } else {
      setStep('select-direction');
    }
  };

  const handleSelectDirection = (dir: DirectionOption) => {
    if (!selectedForce) return;
    onConfirm({
      type: selectedForce.type,
      label: selectedForce.symbol,
      angle: dir.angle,
      isAlongSurface: dir.isAlongSurface,
      isPerpendicular: dir.isPerpendicular,
      directionSense: dir.directionSense,
    });
    setStep('select-type');
    setSelectedForce(null);
  };

  const handleCancel = () => {
    setStep('select-type');
    setSelectedForce(null);
  };

  // 判断某类型力是否已在当前阶段添加过（uniquePerStage 约束）
  const isAdded = (type: ForceType) =>
    existingForces.some((f) => f.type === type);

  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.7)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '1rem',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: '0.75rem',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(59,130,246,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={16} color="#60a5fa" />
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>
          {step === 'select-type' ? '添加力' : `选择方向 — ${selectedForce?.label}`}
        </span>
        {step === 'select-direction' && (
          <button
            onClick={handleCancel}
            style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Step 1：选择力类型 */}
      {step === 'select-type' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {availableForces.map((force) => {
            const added = isAdded(force.type);
            return (
              <button
                key={force.type}
                onClick={() => !added && handleSelectType(force)}
                disabled={added}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '0.6rem 0.8rem',
                  borderRadius: 8,
                  border: `1px solid ${added ? 'rgba(255,255,255,0.06)' : force.isFake ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  background: added
                    ? 'rgba(255,255,255,0.03)'
                    : force.isFake
                    ? 'rgba(168,85,247,0.08)'
                    : 'rgba(255,255,255,0.05)',
                  cursor: added ? 'not-allowed' : 'pointer',
                  opacity: added ? 0.4 : 1,
                  transition: 'all 0.15s',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!added) (e.currentTarget as HTMLButtonElement).style.background = force.isFake ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  if (!added) (e.currentTarget as HTMLButtonElement).style.background = force.isFake ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.05)';
                }}
              >
                {/* 颜色标识点 */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: force.color,
                    flexShrink: 0,
                    boxShadow: added ? 'none' : `0 0 6px ${force.color}88`,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: '0.875rem',
                    color: force.isFake ? 'rgba(192,132,252,0.9)' : 'rgba(255,255,255,0.85)',
                    fontWeight: 500,
                  }}
                >
                  {force.label}
                  {force.isFake && (
                    <span style={{ fontSize: '0.7rem', color: 'rgba(192,132,252,0.6)', marginLeft: 6 }}>
                      ⚠ 效果力
                    </span>
                  )}
                </span>
                {added ? (
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>已添加</span>
                ) : (
                  force.directions.length > 1 ? (
                    <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
                  ) : (
                    <Plus size={14} color="rgba(255,255,255,0.3)" />
                  )
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2：选择方向 */}
      {step === 'select-direction' && selectedForce && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {selectedForce.directions.map((dir, i) => (
            <button
              key={i}
              onClick={() => handleSelectDirection(dir)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0.65rem 0.85rem',
                borderRadius: 8,
                border: `1px solid ${selectedForce.color}44`,
                background: `${selectedForce.color}10`,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `${selectedForce.color}22`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `${selectedForce.color}10`;
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: selectedForce.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                }}
              >
                {dir.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddForcePanel;
