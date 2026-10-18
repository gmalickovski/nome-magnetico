/**
 * Formulário para análise de Nome Social (Motor NM v3 · DEV-190 / DEV-182 F6).
 * Envia para /api/analyze com product_type: 'nome_social'.
 *
 * Mudanças DEV-190 §6:
 * - Removidos `genero_preferido` (LGPD art. 6º III — minimização) e `estilo_preferido`.
 * - Objetivo e contexto unificados em um campo só (`objetivo_apresentacao`).
 * - Novos campos opcionais:
 *   1. "Como você assina hoje?" (`assinatura_atual` — linha de base)
 *   2. "Onde vai usar o novo nome?" (`onde_vai_usar` — múltipla escolha, entra no ranking)
 *   3. "Topa encurtar ou usar apelido?" (`aceita_encurtar_apelido` — libera a etapa 3 do gerador; padrão não)
 * - Microcopy de confiança do §6.
 */

import { useState } from 'react';
import { DateInput } from '../ui/DateInput';

export interface SocialNameFormState {
  nome_completo: string;
  data_nascimento: string;
  assinatura_atual: string;
  onde_vai_usar: string[];
  aceita_encurtar_apelido: boolean;
  objetivo_apresentacao: string;
  vibracoes_desejadas: string;
  nomes_candidatos: string;
}

export function buildSocialAnalyzePayload(form: SocialNameFormState): Record<string, unknown> {
  const nomeLimpo = form.nome_completo.trim();
  const candidatos = form.nomes_candidatos
    .split(/[,;\n]+/)
    .map(n => n.trim())
    .filter(n => n.length >= 2);

  const payload: Record<string, unknown> = {
    product_type: 'nome_social',
    nome_completo: nomeLimpo,
    data_nascimento: form.data_nascimento,
    aceita_encurtar_apelido: Boolean(form.aceita_encurtar_apelido),
    nome_ja_escolhido: false,
  };

  if (form.assinatura_atual.trim()) {
    payload.assinatura_atual = form.assinatura_atual.trim();
  }
  if (form.onde_vai_usar.length > 0) {
    payload.onde_vai_usar = form.onde_vai_usar;
  }
  if (form.objetivo_apresentacao.trim()) {
    payload.objetivo_apresentacao = form.objetivo_apresentacao.trim();
  }
  if (form.vibracoes_desejadas.trim()) {
    payload.vibracoes_desejadas = form.vibracoes_desejadas.trim();
  }
  if (candidatos.length > 0) {
    payload.nomes_candidatos = candidatos;
  }

  return payload;
}

interface Props {
  nomeInicial?: string;
  dataInicial?: string;
  onSuccess?: (analysisId: string) => void;
}

const ONDE_VAI_USAR_OPCOES = [
  { value: 'redes_sociais', label: 'Redes sociais (@perfil e bio)' },
  { value: 'profissional', label: ' Trabalho, e-mail e LinkedIn' },
  { value: 'documentos', label: 'Assinatura em documentos e contratos' },
  { value: 'artistico', label: 'Nome artístico ou marca pessoal' },
  { value: 'assinatura_diaria', label: 'Apresentação no dia a dia' },
];

const VIBRACOES_SUGESTOES = [
  'Autoridade',
  'Leveza',
  'Criatividade',
  'Espiritualidade',
  'Prosperidade',
  'Liderança',
  'Conexão',
  'Intuição',
  'Expansão',
];

function InfoHint({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group/info">
      <button
        type="button"
        aria-label="Ver explicação"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[11px] font-bold text-[#D4AF37] ring-1 ring-[#D4AF37]/25 transition hover:bg-[#D4AF37]/20 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
      >
        !
      </button>
      <span className="pointer-events-none absolute left-1/2 top-7 z-30 w-72 -translate-x-1/2 rounded-2xl bg-[#111111] p-4 text-xs leading-relaxed text-gray-300 opacity-0 shadow-2xl shadow-black/50 ring-1 ring-[#D4AF37]/20 transition group-hover/info:opacity-100 group-focus-within/info:opacity-100">
        {text}
      </span>
    </span>
  );
}

function SectionTitle({
  number,
  title,
  info,
  optional = false,
}: {
  number: string;
  title: string;
  info: string;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/12 text-xs font-bold text-[#D4AF37] ring-1 ring-[#D4AF37]/25">
        {number}
      </span>
      <h3 className="font-cinzel text-lg font-bold text-[#D4AF37]">{title}</h3>
      <InfoHint text={info} />
      {optional && <span className="text-xs font-medium text-gray-500">Opcional</span>}
    </div>
  );
}

export default function SocialNameForm({ nomeInicial = '', dataInicial = '', onSuccess }: Props) {
  const hasSavedBirthData = Boolean(nomeInicial && dataInicial);
  const [form, setForm] = useState<SocialNameFormState>({
    nome_completo: nomeInicial,
    data_nascimento: dataInicial,
    assinatura_atual: '',
    onde_vai_usar: [],
    aceita_encurtar_apelido: false,
    objetivo_apresentacao: '',
    vibracoes_desejadas: '',
    nomes_candidatos: '',
  });

  const [editingBirthData, setEditingBirthData] = useState(!hasSavedBirthData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof SocialNameFormState>(field: K, value: SocialNameFormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  function toggleOndeVaiUsar(val: string) {
    setForm(prev => {
      const exists = prev.onde_vai_usar.includes(val);
      const next = exists
        ? prev.onde_vai_usar.filter(item => item !== val)
        : [...prev.onde_vai_usar, val];
      return { ...prev, onde_vai_usar: next };
    });
    setError('');
  }

  function toggleVibracao(v: string) {
    const current = form.vibracoes_desejadas;
    const already = current.toLowerCase().includes(v.toLowerCase());
    if (already) {
      set('vibracoes_desejadas', current.replace(new RegExp(`,?\\s*${v}`, 'i'), '').replace(/^,\s*/, '').trim());
    } else {
      set('vibracoes_desejadas', current ? `${current}, ${v}` : v);
    }
  }

  const candidatosCount = form.nomes_candidatos
    .split(/[,;\n]+/)
    .filter(n => n.trim().length >= 2).length;

  async function handleSubmitCriar(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const nomeLimpo = form.nome_completo.trim();
    if (!nomeLimpo || nomeLimpo.split(/\s+/).length < 3) {
      setError('Informe seu nome completo de nascimento, com pelo menos 3 palavras.');
      return;
    }

    if (!form.data_nascimento) {
      setError('Informe sua data de nascimento.');
      return;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.data_nascimento)) {
      setError('A data de nascimento deve estar no formato DD/MM/AAAA.');
      return;
    }

    const payload = buildSocialAnalyzePayload(form);

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao iniciar análise');

      setEditingBirthData(false);

      if (onSuccess) {
        onSuccess(data.analysisId);
      } else {
        window.location.href = `/app/resultado/${data.analysisId}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const chipClass = (selected: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
      selected
        ? 'bg-[#D4AF37] text-black shadow-[0_8px_24px_rgba(212,175,55,0.18)]'
        : 'bg-white/[0.04] text-gray-300 ring-1 ring-white/10 hover:bg-white/[0.07] hover:text-[#e5e2e1]'
    }`;

  return (
    <form onSubmit={handleSubmitCriar} className="space-y-5">
      <p className="px-1 text-sm leading-relaxed text-gray-400">
        Só a seção <strong className="text-[#D4AF37]">01</strong> é obrigatória. As demais são opcionais
        e servem para ajustar o ranking ao seu uso real, sem coletar dados desnecessários.
      </p>

      {/* SEÇÃO 01: DADOS DE NASCIMENTO */}
      <div className="rounded-2xl bg-[#202020]/80 p-5 ring-1 ring-[#D4AF37]/15 md:p-6">
        <div className="space-y-6">
          <SectionTitle
            number="01"
            title="Dados de nascimento"
            info="Use o nome civil completo de registro e a data correta. Eles são a base fixa do cálculo numerológico."
          />

          {hasSavedBirthData && !editingBirthData ? (
            <div className="rounded-2xl bg-[#131313]/80 p-4 ring-1 ring-[#D4AF37]/20">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Nome de nascimento</p>
                    <p className="mt-1 font-cinzel text-xl font-bold text-[#e5e2e1]">{form.nome_completo}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Data de nascimento</p>
                    <p className="mt-1 text-lg font-semibold text-[#D4AF37]">{form.data_nascimento}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBirthData(true)}
                  className="rounded-full border border-[#D4AF37]/40 px-5 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
                >
                  Editar dados
                </button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                Estes dados foram salvos na sua conta e serão usados como base fixa das suas harmonizações.
              </p>
            </div>
          ) : (
            <div className="grid items-start gap-6 md:grid-cols-[1fr_0.72fr]">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                  Nome completo de nascimento *
                  <InfoHint text="O diagnóstico exige o nome de registro civil completo, com nome e sobrenomes." />
                </label>
                <input
                  type="text"
                  value={form.nome_completo}
                  onChange={e => set('nome_completo', e.target.value)}
                  placeholder="Ex: Maria da Silva Santos"
                  className="input-dark w-full"
                  required
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                  Data de nascimento *
                  <InfoHint text="A data define o número de Destino, usado para medir a compatibilidade dos nomes candidatos." />
                </label>
                <DateInput
                  value={form.data_nascimento}
                  onChangeValue={v => set('data_nascimento', v)}
                  className="input-dark w-full"
                  required
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 02: LINHA DE BASE E PREFERÊNCIAS DO RANKING (DEV-190 §6) */}
      <div className="rounded-2xl bg-[#202020]/80 p-5 ring-1 ring-[#D4AF37]/15 md:p-6">
        <div className="space-y-6">
          <SectionTitle
            number="02"
            title="Sua assinatura hoje e como pretende usar"
            optional
            info="Essas informações calibram o gerador em 3 etapas e o desempate do ranking."
          />

          {/* Novo campo 1: Como você assina hoje? */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
              Como você assina ou se apresenta hoje?
              <InfoHint text="Serve como linha de base para compararmos sua assinatura atual com o nome de nascimento e com as sugestões harmonizadas." />
            </label>
            <input
              type="text"
              value={form.assinatura_atual}
              onChange={e => set('assinatura_atual', e.target.value)}
              placeholder="Ex: Maria Santos (deixe em branco se usa o nome completo)"
              maxLength={150}
              className="input-dark w-full"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Se preencher, calculamos a nota de como você já assina hoje para comparar com o potencial do ranking.
            </p>
          </div>

          {/* Novo campo 2: Onde vai usar o novo nome? (múltipla escolha) */}
          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-300">
              Onde vai usar o novo nome? <span className="text-xs font-normal text-gray-500">(pode marcar mais de um)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ONDE_VAI_USAR_OPCOES.map(opt => {
                const isSelected = form.onde_vai_usar.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleOndeVaiUsar(opt.value)}
                    className={chipClass(isSelected)}
                  >
                    {opt.label.trim()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Novo campo 3: Topa encurtar ou usar apelido? (padrão: Não) */}
          <div className="rounded-2xl bg-[#131313]/70 p-4 ring-1 ring-white/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 pr-2">
                <p className="text-sm font-medium text-[#e5e2e1]">
                  Topa encurtar o primeiro nome ou usar apelido?
                </p>
                <p className="text-xs leading-relaxed text-gray-400">
                  Por padrão priorizamos seu nome original com ajustes mínimos (sobrenomes ou acento sutil). Marque &ldquo;Sim&rdquo; apenas se quiser liberar variações curtas ou apelidos no ranking.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-pressed={!form.aceita_encurtar_apelido}
                  onClick={() => set('aceita_encurtar_apelido', false)}
                  className={chipClass(!form.aceita_encurtar_apelido)}
                >
                  Não (manter nome base)
                </button>
                <button
                  type="button"
                  aria-pressed={form.aceita_encurtar_apelido}
                  onClick={() => set('aceita_encurtar_apelido', true)}
                  className={chipClass(form.aceita_encurtar_apelido)}
                >
                  Sim, topo avaliar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 03: OBJETIVO + CONTEXTO UNIFICADOS E VIBRAÇÕES */}
      <div className="rounded-2xl bg-[#202020]/80 p-5 ring-1 ring-[#D4AF37]/15 md:p-6">
        <div className="space-y-5">
          <SectionTitle
            number="03"
            title="Objetivo, contexto e vibrações"
            optional
            info="Essas respostas orientam a leitura interpretativa do relatório sem alterar a matemática do cálculo."
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Qual é o seu momento atual e o que você busca com a nova assinatura?
            </label>
            <textarea
              value={form.objetivo_apresentacao}
              onChange={e => set('objetivo_apresentacao', e.target.value)}
              placeholder="Ex: Estou em transição profissional e quero uma assinatura com clareza, presença executiva e leveza para usar no trabalho e nas redes."
              rows={3}
              maxLength={500}
              className="input-dark w-full resize-none"
            />
            <p className="mt-1 text-xs text-gray-600">{form.objetivo_apresentacao.length}/500 caracteres</p>
          </div>

          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-300">
              Vibrações que mais combinam com essa fase
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {VIBRACOES_SUGESTOES.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleVibracao(v)}
                  className={chipClass(form.vibracoes_desejadas.toLowerCase().includes(v.toLowerCase()))}
                >
                  {v}
                </button>
              ))}
            </div>

            <textarea
              value={form.vibracoes_desejadas}
              onChange={e => set('vibracoes_desejadas', e.target.value)}
              placeholder="Ex: autoridade, expansão, liderança, clareza..."
              rows={2}
              maxLength={300}
              className="input-dark w-full resize-none"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 04: NOMES CANDIDATOS */}
      <div className="rounded-2xl bg-[#202020]/80 p-5 ring-1 ring-[#D4AF37]/15 md:p-6">
        <div className="space-y-5">
          <SectionTitle
            number="04"
            title="Nomes candidatos que você já tem em mente"
            optional
            info="Se você informar nomes, eles entram direto no ranking. Se deixar vazio, o motor calcula variações em 3 etapas com a menor mudança possível."
          />

          <textarea
            value={form.nomes_candidatos}
            onChange={e => set('nomes_candidatos', e.target.value)}
            placeholder="Ex: Maria Santos, Mariã Silva, Maria S. Santos..."
            rows={3}
            className="input-dark w-full resize-none"
          />

          {candidatosCount > 0 ? (
            <p className="text-xs text-gray-400">{candidatosCount} variação(ões) informada(s) para avaliar junto com as sugestões do sistema.</p>
          ) : (
            <p className="text-xs text-[#D4AF37]/80">
              Sem candidatos informados: o sistema gera automaticamente opções priorizando manter a identidade do seu nome.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/25">
          {error}
        </div>
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              Calculando nota hoje × potencial...
            </span>
          ) : (
            'Gerar Harmonização'
          )}
        </button>
        <p className="mt-3 text-center text-xs leading-relaxed text-gray-500">
          O resultado abre na hora, comparando sua nota hoje com o potencial máximo (N5), top 3 assinaturas explicadas e PDF completo.
        </p>
      </div>
    </form>
  );
}
