import React from 'react';
import { Pill } from '../../ui/Pill.js';

export interface ChatOptionPillItem {
  id: string;
  label: string;
  p?: number;
}

export interface ChatOptionPillsProps {
  options: ReadonlyArray<ChatOptionPillItem>;
  size?: 'lg' | 'sm';
  selectedIds?: ReadonlyArray<string>;
  disabled?: boolean;
  onSelect?: (option: ChatOptionPillItem) => void;
  /** Permite sobrepor indicador visual (ex.: toque falso no mockup) sem alterar o Pill real. */
  renderItemOverlay?: (option: ChatOptionPillItem, index: number) => React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

/** Pílulas de opção compartilhadas entre o chat real e os mockups da landing. */
export function ChatOptionPills({
  options,
  size = 'lg',
  selectedIds = [],
  disabled = false,
  onSelect,
  renderItemOverlay,
  ariaLabel = 'Opções rápidas',
  className = '',
}: ChatOptionPillsProps) {
  if (!options.length) return null;

  return (
    <div
      className={`flex flex-wrap gap-2 items-center w-full ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt, index) => {
        const selected = selectedIds.includes(opt.id);
        const pill = (
          <Pill
            key={opt.id}
            label={opt.label}
            size={size}
            selected={selected}
            disabled={disabled}
            onClick={onSelect ? () => onSelect(opt) : undefined}
          />
        );

        const overlay = renderItemOverlay ? renderItemOverlay(opt, index) : null;
        if (!overlay) return pill;

        return (
          <span key={opt.id} className="relative inline-flex items-center">
            {pill}
            {overlay}
          </span>
        );
      })}
    </div>
  );
}
