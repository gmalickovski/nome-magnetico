interface MarketingOptInFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function MarketingOptInField({
  checked,
  onChange,
  disabled = false,
  id = 'opt-in-marketing',
}: MarketingOptInFieldProps) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
      <input
        id={id}
        name="opt_in"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#d4af37]"
      />
      <span className="text-sm leading-relaxed text-[#e5e2e1]">
        Quero receber conteúdos e ofertas do Nome Magnético por e-mail.
      </span>
    </label>
  );
}
