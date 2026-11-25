import React, { useState } from 'react';
import { Button } from '../../ui/Button.js';
import { ChatBackButton } from './ChatBackButton.js';
import {
  paisValidos,
  parseNomeCompletoPessoa,
  type DadosPais,
} from '../../../../shared/interactive-engine/ramos/bebe.js';

export interface BabyParentsFormProps {
  disabled?: boolean;
  onSubmit: (pais: DadosPais) => void;
  onBack?: () => void;
}

const campoClasse =
  'w-full rounded-2xl bg-[#1C1C1C] px-4 py-3 text-sm text-chat-ink placeholder:text-chat-muted ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/60';

/**
 * Nome de nascimento da mãe e do pai (DEV-326). Substitui a certidão do usuário no caminho do
 * bebê. Basta um dos dois (mães e pais solos): o outro campo pode ficar em branco.
 */
export function BabyParentsForm({ disabled = false, onSubmit, onBack }: BabyParentsFormProps) {
  const [mae, setMae] = useState('');
  const [pai, setPai] = useState('');
  const [erro, setErro] = useState('');

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    const m = mae.trim() ? parseNomeCompletoPessoa(mae) : null;
    const p = pai.trim() ? parseNomeCompletoPessoa(pai) : null;
    if (mae.trim() && !m) {
      setErro('Escreva o nome completo da mãe, com nome e sobrenome, só com letras.');
      return;
    }
    if (pai.trim() && !p) {
      setErro('Escreva o nome completo do pai, com nome e sobrenome, só com letras.');
      return;
    }
    const pais: DadosPais = { mae: m, pai: p };
    if (!paisValidos(pais)) {
      setErro('Informe pelo menos um dos dois nomes. Se houver só a mãe ou só o pai, tudo bem.');
      return;
    }
    setErro('');
    onSubmit(pais);
  };

  return (
    <form onSubmit={enviar} className="mt-3 flex w-full flex-col gap-3" noValidate>
      <div className="flex items-center gap-2">
        {onBack && <ChatBackButton onClick={onBack} disabled={disabled} />}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="nm-caption text-chat-muted">Nome completo de nascimento da mãe</span>
        <input
          type="text"
          autoComplete="off"
          maxLength={80}
          value={mae}
          disabled={disabled}
          onChange={(e) => setMae(e.target.value)}
          className={campoClasse}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="nm-caption text-chat-muted">Nome completo de nascimento do pai</span>
        <input
          type="text"
          autoComplete="off"
          maxLength={80}
          value={pai}
          disabled={disabled}
          onChange={(e) => setPai(e.target.value)}
          className={campoClasse}
        />
      </label>

      <p className="text-xs text-chat-muted">Se houver só a mãe ou só o pai, preencha apenas um dos campos.</p>

      {erro && (
        <p role="alert" className="text-xs text-red-300">
          {erro}
        </p>
      )}

      <Button type="submit" variant="primary" size="md" disabled={disabled} className="w-full !rounded-full">
        Continuar
      </Button>
    </form>
  );
}

export default BabyParentsForm;
