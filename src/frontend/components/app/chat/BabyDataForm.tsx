import React, { useState } from 'react';
import { Button } from '../../ui/Button.js';
import { ChatBackButton } from './ChatBackButton.js';
import {
  BEBE_MAX_NOMES_PAIS,
  dataPtValida,
  labelCampoDataBebe,
  mascararDataPt,
  parseNomesPais,
  parseSobrenomesBebe,
  type DadosBebe,
} from '../../../../shared/interactive-engine/ramos/bebe.js';

export interface BabyDataFormProps {
  situacao: string | null;
  dataTipo: string | null;
  disabled?: boolean;
  onSubmit: (dados: DadosBebe) => void;
  onBack?: () => void;
}

const campoClasse =
  'w-full rounded-2xl bg-[#1C1C1C] px-4 py-3 text-sm text-chat-ink placeholder:text-chat-muted ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/60';

/**
 * Formulário do caminho do bebê (DEV-326): data, sobrenomes e, para quem ainda escolhe, os nomes
 * que os pais já estão pensando (opcional). Para o bebê já registrado, pede o nome completo.
 */
export function BabyDataForm({ situacao, dataTipo, disabled = false, onSubmit, onBack }: BabyDataFormProps) {
  const registrado = situacao === 'nasceu_registrado';
  const [data, setData] = useState('');
  const [sobrenomes, setSobrenomes] = useState('');
  const [nomesPais, setNomesPais] = useState('');
  const [nomeRegistrado, setNomeRegistrado] = useState('');
  const [erro, setErro] = useState('');

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (!dataPtValida(data)) {
      setErro('Confira a data: use dia, mês e ano, por exemplo 12/05/2027.');
      return;
    }
    if (registrado) {
      const nome = nomeRegistrado.replace(/\s+/g, ' ').trim();
      if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' ]{4,80}$/.test(nome) || !nome.includes(' ')) {
        setErro('Escreva o nome completo do bebê, com nome e sobrenome, só com letras.');
        return;
      }
      setErro('');
      onSubmit({ data, sobrenomes: [], nomesPais: [], nomeRegistrado: nome });
      return;
    }
    const sob = parseSobrenomesBebe(sobrenomes);
    if (sob.itens.length === 0) {
      setErro('Informe pelo menos um sobrenome do bebê, só com letras. Separe vários por vírgula.');
      return;
    }
    if (sob.invalidos.length > 0) {
      setErro(`Não consegui ler o sobrenome: ${sob.invalidos.join(', ')}. Use só letras.`);
      return;
    }
    const pais = parseNomesPais(nomesPais);
    if (pais.invalidos.length > 0) {
      setErro(`Não consegui ler o nome: ${pais.invalidos.join(', ')}. Use só letras, separados por vírgula.`);
      return;
    }
    setErro('');
    onSubmit({ data, sobrenomes: sob.itens, nomesPais: pais.itens, nomeRegistrado: null });
  };

  return (
    <form onSubmit={enviar} className="mt-3 flex w-full flex-col gap-3" noValidate>
      <div className="flex items-center gap-2">
        {onBack && <ChatBackButton onClick={onBack} disabled={disabled} />}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="nm-caption text-chat-muted">{labelCampoDataBebe(situacao, dataTipo)}</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          value={data}
          maxLength={10}
          disabled={disabled}
          onChange={(e) => setData(mascararDataPt(e.target.value))}
          className={campoClasse}
        />
      </label>

      {registrado ? (
        <label className="flex flex-col gap-1.5">
          <span className="nm-caption text-chat-muted">Nome completo do bebê, como foi registrado</span>
          <input
            type="text"
            autoComplete="off"
            maxLength={80}
            value={nomeRegistrado}
            disabled={disabled}
            onChange={(e) => setNomeRegistrado(e.target.value)}
            className={campoClasse}
          />
        </label>
      ) : (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="nm-caption text-chat-muted">Sobrenomes do bebê (separe por vírgula)</span>
            <input
              type="text"
              autoComplete="off"
              placeholder="Ex.: Silva, Santos"
              maxLength={80}
              value={sobrenomes}
              disabled={disabled}
              onChange={(e) => setSobrenomes(e.target.value)}
              className={campoClasse}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="nm-caption text-chat-muted">
              Nomes que vocês já estão pensando (opcional, até {BEBE_MAX_NOMES_PAIS}, separados por vírgula)
            </span>
            <input
              type="text"
              autoComplete="off"
              placeholder="Ex.: Helena, Theo"
              maxLength={120}
              value={nomesPais}
              disabled={disabled}
              onChange={(e) => setNomesPais(e.target.value)}
              className={campoClasse}
            />
          </label>
        </>
      )}

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

export default BabyDataForm;
