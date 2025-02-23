import { useState } from 'react';

interface VASScaleProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  leftLabel?: string;
  rightLabel?: string;
}

export function VASScale({ 
  value, 
  onChange, 
  label, 
  leftLabel = "无", 
  rightLabel = "重度" 
}: VASScaleProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const newValue = Math.min(Math.max((x / width) * 10, 0), 10);
    onChange(Number(newValue.toFixed(1)));
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const newValue = Math.min(Math.max((x / width) * 10, 0), 10);
    onChange(Number(newValue.toFixed(1)));
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div
        className="relative h-12 select-none"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {/* 刻度线 */}
        <div className="absolute top-0 left-0 right-0 h-8 flex">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="relative flex-1 flex justify-center">
              <div className="absolute top-0 w-px h-3 bg-gray-300" />
              <div className="absolute top-4 text-xs text-gray-500">{i}</div>
            </div>
          ))}
        </div>

        {/* 主尺线 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300" />

        {/* 标记线 */}
        <div 
          className="absolute bottom-0 w-0.5 h-6 bg-blue-500 transition-all duration-150"
          style={{ left: `${value * 10}%` }}
        />

        {/* 左右标签 */}
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500">{leftLabel}</div>
        <div className="absolute -bottom-6 right-0 text-xs text-gray-500">{rightLabel}</div>
      </div>
    </div>
  );
}