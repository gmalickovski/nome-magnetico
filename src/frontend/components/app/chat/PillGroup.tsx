import React from 'react';
import { Pill } from '../../ui/Pill.js';

export interface PillOption {
  id: string;
  label: string;
  p?: number;
}

export interface PillGroupProps {
  options: PillOption[];
  onSelect: (option: PillOption) => void;
  disabled?: boolean;
  className?: string;
}

export function PillGroup({
  options,
  onSelect,
  disabled = false,
  className = '',
}: PillGroupProps) {
  if (!options || options.length === 0) return null;

  // As 3 primeiras opções mais prováveis ficam na linha 1 em destaque (size="lg")
  const primaryOptions = options.slice(0, 3);
  // As opções subsequentes ficam na linha 2 em tamanho padrão (size="sm")
  const secondaryOptions = options.slice(3);

  return (
    <div className={`w-full flex flex-col gap-2 mt-2 pt-1 ${className}`}>
      {/* Linha 1: Top 3 opções mais prováveis */}
      <div className="flex flex-wrap gap-2 items-center">
        {primaryOptions.map((opt) => (
          <Pill
            key={opt.id}
            label={opt.label}
            size="lg"
            disabled={disabled}
            onClick={() => onSelect(opt)}
          />
        ))}
      </div>

      {/* Linha 2: Demais opções compactas */}
      {secondaryOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {secondaryOptions.map((opt) => (
            <Pill
              key={opt.id}
              label={opt.label}
              size="sm"
              disabled={disabled}
              onClick={() => onSelect(opt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PillGroup;
