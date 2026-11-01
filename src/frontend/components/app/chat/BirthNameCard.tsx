import React, { useState } from 'react';
import { Button } from '../../ui/Button.js';
import { Input } from '../../ui/Input.js';
import { DateInput } from '../../ui/DateInput.js';

export interface BirthNameCardProps {
  initialName?: string;
  initialDate?: string;
  onConfirm: (data: { nome: string; dataNascimento: string }) => void;
  disabled?: boolean;
}

export function BirthNameCard({
  initialName = '',
  initialDate = '',
  onConfirm,
  disabled = false,
}: BirthNameCardProps) {
  const hasInitial = Boolean(initialName && initialDate);
  const [isEditing, setIsEditing] = useState(!hasInitial);
  const [nome, setNome] = useState(initialName);
  const [dataNascimento, setDataNascimento] = useState(initialDate);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmedNome = nome.trim();
    if (!trimmedNome) {
      setError('Por favor, informe seu nome completo de nascimento.');
      return;
    }

    const words = trimmedNome.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      setError('Informe seu nome e pelo menos um sobrenome de nascimento.');
      return;
    }

    if (!dataNascimento || dataNascimento.length < 10) {
      setError('Informe sua data de nascimento completa (DD/MM/AAAA).');
      return;
    }

    onConfirm({ nome: trimmedNome, dataNascimento });
  };

  if (!isEditing && hasInitial) {
    return (
      <div className="w-full space-y-3">
        <p className="text-chat-ink text-sm sm:text-[15px] leading-relaxed">
          Para começar a sua análise, localizamos estes dados no seu cadastro. Estão corretos conforme sua certidão de nascimento?
        </p>

        <div className="rounded-xl bg-black/40 border border-white/10 p-3.5 space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm">
            <span className="text-chat-muted text-xs uppercase tracking-wider font-semibold">
              Nome de nascimento
            </span>
            <span className="font-medium text-gold">{nome}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm">
            <span className="text-chat-muted text-xs uppercase tracking-wider font-semibold">
              Data de nascimento
            </span>
            <span className="font-medium text-chat-ink">{dataNascimento}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={disabled}
            onClick={() => handleSubmit()}
            className="!rounded-full font-semibold"
          >
            Confirmar e começar
          </Button>
          <Button
            type="button"
            variant="outlined"
            size="sm"
            disabled={disabled}
            onClick={() => setIsEditing(true)}
            className="!rounded-full text-chat-muted hover:text-chat-ink hover:border-white/30"
          >
            Alterar dados
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <p className="text-chat-ink text-sm sm:text-[15px] leading-relaxed">
        Digite seu nome completo exatamente como consta na sua certidão de nascimento e sua data:
      </p>

      <div className="space-y-2.5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-chat-muted mb-1">
            Nome de certidão
          </label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Maria da Silva Souza"
            disabled={disabled}
            className="!bg-black/50 !text-chat-ink !border-white/10 focus:!border-gold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-chat-muted mb-1">
            Data de nascimento
          </label>
          <DateInput
            value={dataNascimento}
            onChangeValue={setDataNascimento}
            disabled={disabled}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-chat-ink focus:outline-none focus:border-gold transition"
          />
        </div>
      </div>

      {error && (
        <div className="text-brand-error text-xs p-2 rounded-lg bg-brand-error/10 border border-brand-error/20">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={disabled}
          className="!rounded-full font-semibold"
        >
          Continuar
        </Button>
      </div>
    </form>
  );
}

export default BirthNameCard;
