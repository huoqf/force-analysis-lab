import React from 'react';

interface ParameterSliderProps {
  label: string;
  symbol: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label, symbol, unit, value, min, max, step = 1, onChange
}) => {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex justify-between items-center text-sm">
        <span className="text-white/70 font-medium">{label}</span>
        <span className="text-win11-blue font-bold">
          {symbol} = {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-win11-blue"
      />
      <div className="flex justify-between text-[10px] text-white/30 uppercase tracking-wider">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

export default ParameterSlider;
