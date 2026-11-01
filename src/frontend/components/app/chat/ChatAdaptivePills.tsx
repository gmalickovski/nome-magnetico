import React, { useMemo, useState } from 'react';
import { Pill } from '../../ui/Pill.js';
import { Button } from '../../ui/Button.js';

export interface AdaptivePillOption {
  id: string;
  label: string;
}

export interface ChatAdaptivePillsProps {
  mode: 'single' | 'multi';
  options: AdaptivePillOption[];
  maxSelect?: number;
  minSelect?: number;
  allowOther?: boolean;
  otherMaxLength?: number;
  caption?: string;
  disabled?: boolean;
  onSubmitSingle: (optionId: string, label: string, otherText?: string) => void;
  onSubmitMulti: (ordered: AdaptivePillOption[], otherText?: string) => void;
  onToggleTrack?: (optionId: string, selected: boolean) => void;
  onLimitReached?: () => void;
}

export function ChatAdaptivePills({
  mode,
  options,
  maxSelect,
  minSelect = 1,
  allowOther = false,
  otherMaxLength = 60,
  caption,
  disabled = false,
  onSubmitSingle,
  onSubmitMulti,
  onToggleTrack,
  onLimitReached,
}: ChatAdaptivePillsProps) {
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [otherActive, setOtherActive] = useState(false);
  const [otherText, setOtherText] = useState('');

  const atLimit = mode === 'multi' && maxSelect != null && selectedOrder.length >= maxSelect;

  const toggle = (id: string) => {
    if (disabled) return;
    if (mode === 'single') {
      const opt = options.find((o) => o.id === id);
      if (!opt) return;
      if (id === 'nome_outro' || id.endsWith('_outro')) {
        setOtherActive(true);
        return;
      }
      onSubmitSingle(id, opt.label);
      return;
    }

    setSelectedOrder((prev) => {
      if (prev.includes(id)) {
        onToggleTrack?.(id, false);
        return prev.filter((x) => x !== id);
      }
      if (maxSelect != null && prev.length >= maxSelect) {
        onLimitReached?.();
        return prev;
      }
      onToggleTrack?.(id, true);
      return [...prev, id];
    });
  };

  const selectedOptions = useMemo(
    () =>
      selectedOrder
        .map((id) => options.find((o) => o.id === id))
        .filter(Boolean) as AdaptivePillOption[],
    [options, selectedOrder]
  );

  const canContinueMulti =
    selectedOptions.length >= minSelect ||
    (allowOther && otherActive && otherText.trim().length > 0);

  const pillLabel = (opt: AdaptivePillOption) => {
    if (mode !== 'multi') return opt.label;
    const idx = selectedOrder.indexOf(opt.id);
    if (idx === -1) return opt.label;
    return `${idx + 1} ${opt.label}`;
  };

  const showCheck = mode === 'multi';

  if (mode === 'single' && otherActive && allowOther) {
    return (
      <div className="mt-3 flex flex-col gap-3 w-full">
        <input
          type="text"
          maxLength={otherMaxLength}
          value={otherText}
          disabled={disabled}
          onChange={(e) => setOtherText(e.target.value.slice(0, otherMaxLength))}
          placeholder="Como te chamam?"
          className="w-full rounded-2xl bg-[#1C1C1C] border border-[#D4AF37]/40 px-4 py-3 text-chat-ink text-sm focus:outline-none focus:border-[#D4AF37]"
        />
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={disabled || otherText.trim().length < 1}
          className="w-full !rounded-full"
          onClick={() => onSubmitSingle('nome_outro', otherText.trim(), otherText.trim())}
        >
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-3 w-full">
      {caption && <p className="nm-caption text-chat-muted">{caption}</p>}

      <div className="flex flex-wrap gap-2 items-center w-full" role="group">
        {options.map((opt) => {
          const selected = selectedOrder.includes(opt.id);
          const dimmed = atLimit && !selected;
          return (
            <Pill
              key={opt.id}
              label={showCheck && selected ? `✓ ${pillLabel(opt)}` : pillLabel(opt)}
              size="lg"
              selected={selected}
              disabled={disabled || dimmed}
              onClick={() => toggle(opt.id)}
              className={dimmed ? '!opacity-40' : ''}
            />
          );
        })}
      </div>

      {mode === 'multi' && (
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={disabled || !canContinueMulti}
          className={`w-full !rounded-full transition-opacity ${
            canContinueMulti ? '' : '!opacity-30 !border-[#D4AF37]/30'
          }`}
          onClick={() =>
            onSubmitMulti(
              selectedOptions,
              allowOther && otherText.trim() ? otherText.trim() : undefined
            )
          }
        >
          Continuar ({selectedOptions.length})
        </Button>
      )}
    </div>
  );
}

export default ChatAdaptivePills;
