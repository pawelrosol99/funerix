
import React from 'react';

const COLORS = [
  '#32FFDC', // Urneo Mint
  '#FDD792', // Evening Glow Orange
  '#A581D4', // Purple
  '#FF6B6B', // Red
  '#AFB885', // Greenish
  '#84705B', // Brown
  '#232B32', // Dark
  '#F5F4ED', // Light
  '#60A5FA', // Blue
  '#F472B6', // Pink
];

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onSelect }) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLORS.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color ? 'border-[var(--color-text-main)] scale-110' : 'border-transparent'}`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};
