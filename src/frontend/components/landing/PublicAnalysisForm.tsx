/**
 * PublicAnalysisForm — prévia estratégica da análise na landing pública.
 *
 * Estratégia de dados:
 *  ✅ Visível   → Contadores 4 métricas, Triângulo da Vida (bloqueio ou limpo),
 *                  Número de Destino, Número de Expressão
 *  🔒 Oculto   → Triângulos Pessoal / Social / Destino, análise textual, antídotos
 */

import { useState } from 'react';
import { RegistrationModal } from './RegistrationModal';
import { PDFFeedbackButton } from '../app/PDFFeedbackButton';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Bloqueio {
  codigo: string;
  titulo: string;
  descricao: string;
  triangulos?: string[];
  totalOcorrencias?: number;
}

interface LiveResult {
  score: { total: number };
  numeros: { expressao: number; destino: number; motivacao: number; missao: number; impressao: number };
  bloqueios: Bloqueio[];
  licoesCarmicas: unknown[];
  tendenciasOcultas: unknown[];
  debitosCarmicos: unknown[];
  compatibilidade: string;
  triangulos: {
    vida?: { linhas: number[][] };
    pessoal?: { linhas: number[][] };
    social?: { linhas: number[][] };
    destino?: { linhas: number[][] };
  };
}

interface Props {
  isLoggedIn?: boolean;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// ── Mapas de dados estáticos ───────────────────────────────────────────────────

/** Missão profunda de cada número de Destino */
const DESTINO_MISSAO: Record<number, string> = {
  1: 'Você veio para liderar e abrir caminhos. Sua missão é ser pioneiro — iniciar o que outros ainda não tiveram coragem de começar. Independência, originalidade e força de vontade são seus maiores recursos.',
  2: 'Você veio para unir e mediar. Sua missão é criar harmonia onde há conflito, ser o elo invisível que mantém relacionamentos e projetos coesos. Sensibilidade e diplomacia são seus maiores poderes.',
  3: 'Você veio para inspirar e se comunicar. Sua missão é usar a palavra, a arte e o carisma para elevar quem está ao seu redor. Criatividade e alegria são a essência do seu propósito.',
  4: 'Você veio para construir e estruturar. Sua missão é criar bases sólidas — na vida, nos negócios, nas pessoas. Disciplina, método e confiabilidade são o seu legado natural.',
  5: 'Você veio para transformar e libertar. Sua missão é romper padrões, trazer movimento onde há estagnação e mostrar que a mudança é o único caminho real para o crescimento.',
  6: 'Você veio para cuidar e harmonizar. Sua missão é nutrir, proteger e criar equilíbrio nos ambientes em que você vive. Responsabilidade e amor são os pilares do seu propósito.',
  7: 'Você veio para descobrir e transmitir. Sua missão é ir fundo onde outros ficam na superfície — buscar verdades ocultas e compartilhá-las. Sabedoria e introspecção definem seu caminho.',
  8: 'Você veio para manifestar e liderar em escala. Sua missão é exercer poder com propósito, construir prosperidade real e deixar impacto concreto no mundo material.',
  9: 'Você veio para servir e encerrar ciclos. Sua missão é elevar a humanidade — com compaixão, generosidade e a sabedoria de quem já viveu muito. Seu legado é maior do que você imagina.',
  11: 'Você veio para iluminar. Como número mestre, sua missão é ser canal de inspiração — sua sensibilidade elevada e sua intuição são instrumentos para transformar vidas ao seu redor.',
  22: 'Você veio para construir o que parecia impossível. Como número mestre, sua missão é materializar grandes visões que beneficiam muitas pessoas — com visão prática e escala real.',
};

/** Como cada número de Expressão se manifesta na vida */
const EXPRESSAO_COMO: Record<number, string> = {
  1: 'Você se expressa com força, originalidade e determinação. Sua voz tem peso quando você assume o comando — as pessoas naturalmente olham para você quando precisam de direção.',
  2: 'Você se expressa com empatia, escuta e sensibilidade. Sua força está em perceber o que os outros não veem e criar conexões que outros não conseguem.',
  3: 'Você se expressa com criatividade, entusiasmo e carisma. Palavras, arte e comunicação são seus instrumentos naturais — você ilumina qualquer ambiente que entra.',
  4: 'Você se expressa com precisão, método e confiabilidade. As pessoas confiam em você para construir, organizar e entregar o que prometeu — e você raramente decepciona.',
  5: 'Você se expressa com versatilidade, curiosidade e energia contagiante. Sua presença traz movimento e renovação a qualquer ambiente — você não foi feito para a mesmice.',
  6: 'Você se expressa com cuidado, harmonia e responsabilidade. Sua voz tem o poder de acolher e equilibrar — as pessoas se sentem seguras perto de você.',
  7: 'Você se expressa com profundidade, análise e precisão. Suas palavras carregam substância — você não fala à toa, e quando fala, faz as pessoas pensarem.',
  8: 'Você se expressa com autoridade, visão e poder de execução. Sua presença inspira respeito — você foi feito para liderar e para gerar resultado em escala.',
  9: 'Você se expressa com humanidade, visão ampla e generosidade. Sua voz ressoa em muitas pessoas ao mesmo tempo — você tem o dom de falar para o coletivo.',
  11: 'Você se expressa com intuição aguçada e presença que transforma. Sua sensibilidade é rara — as pessoas saem diferentes depois de uma conversa com você.',
  22: 'Você se expressa com visão prática e escala. Você não apenas sonha grande — você sabe como fazer o grande acontecer. Pouquíssimas pessoas têm esse dom.',
};

/** Significado humano de cada sequência de bloqueio */
const BLOQUEIO_SIGNIFICADO: Record<string, string> = {
  '111': 'Dificuldade em se afirmar e tomar decisões com clareza',
  '222': 'Conflitos nos relacionamentos e instabilidade emocional constante',
  '333': 'Bloqueio na comunicação — dificuldade de se expressar e ser ouvido',
  '444': 'Estagnação financeira e resistência ao crescimento material',
  '555': 'Sensação de estar preso — medo de mudanças e falta de movimento',
  '666': 'Excesso de responsabilidade com os outros, dificuldade de receber',
  '777': 'Isolamento e solidão — dificuldade de confiar e se conectar',
  '888': 'Bloqueio de prosperidade e sabotagem inconsciente ao dinheiro',
  '999': 'Dificuldade em encerrar ciclos e soltar o que já passou',
  '1111': 'Confusão de propósito — sensação de não saber para onde ir',
  '2222': 'Indecisão crônica e necessidade constante de aprovação alheia',
  '3333': 'Criatividade travada — dificuldade de transformar ideias em ação',
  '4444': 'Travamento financeiro e físico de alta intensidade',
  '5555': 'Agitação interna constante que impede foco e resultado',
  '6666': 'Sobrecarga emocional que apaga a própria identidade',
  '7777': 'Excesso de análise que paralisa decisões e afasta as pessoas',
  '8888': 'Repulsa inconsciente à abundância — sabotagem financeira repetida',
  '9999': 'Apego ao passado que bloqueia qualquer recomeço',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function toDbDate(s: string) { const [d, m, y] = s.split('/'); return `${y}-${m}-${d}`; }

function fmtDate(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
}

/** Bloqueio do Triângulo da Vida (o mais importante na prévia) */
function bloqueioVida(bloqueios: Bloqueio[]): Bloqueio | null {
  return bloqueios.find(b => b.triangulos?.includes('vida')) ?? null;
}

/** Configuração visual baseada no score (mesma lógica de ScoreDisplay.tsx) */
function getScoreConfig(score: number) {
  if (score >= 80) return {
    label: '✦ Excelente',
    textColor: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
    bgClass: 'bg-emerald-500/5',
    barGradient: 'from-emerald-500 to-emerald-400',
  };
  if (score >= 60) return {
    label: '◐ Bom',
    textColor: 'text-[#D4AF37]',
    borderClass: 'border-[#D4AF37]/40',
    bgClass: 'bg-[#D4AF37]/5',
    barGradient: 'from-[#D4AF37] to-[#f2ca50]',
  };
  if (score >= 40) return {
    label: '◎ Aceitável',
    textColor: 'text-amber-400',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/5',
    barGradient: 'from-amber-500 to-amber-400',
  };
  if (score >= 20) return {
    label: '⚠ Não Recomendado',
    textColor: 'text-red-400',
    borderClass: 'border-red-400/40',
    bgClass: 'bg-red-500/5',
    barGradient: 'from-red-600 to-red-500',
  };
  return {
    label: '✗ Crítico',
    textColor: 'text-red-500',
    borderClass: 'border-red-600/50',
    bgClass: 'bg-red-900/5',
    barGradient: 'from-red-800 to-red-700',
  };
}

// ── Ícones SVG inline ──────────────────────────────────────────────────────────

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function GlossaryInfoLink({ href, label, className = '' }: { href: string; label: string; className?: string }) {
  return (
    <a
      href={href}
      className={`inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-bold leading-none opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current/30 ${className}`}
      title={`Ver no glossário: ${label}`}
      aria-label={`Ver no glossário: ${label}`}
    >
      !
    </a>
  );
}

function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ── Componente ─────────────────────────────────────────────────────────────────

export function PublicAnalysisForm({ isLoggedIn }: Props) {
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LiveResult | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [limitModal, setLimitModal] = useState<{ message: string; redirectUrl: string } | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [downloadAnalysisId, setDownloadAnalysisId] = useState<string | null>(null);
  const [existingAccountEmail, setExistingAccountEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) { setError('Informe a data no formato DD/MM/AAAA.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/analyze-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_candidato: nome.trim(), data_nascimento_db: toDbDate(data) }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === 'free_analysis_already_used' || json.code === 'public_rate_limit') {
          setLimitModal({
            message: json.error ?? 'Você atingiu o limite da análise gratuita.',
            redirectUrl: json.redirectUrl ?? '/app',
          });
          return;
        }
        throw new Error(json.error ?? 'Erro na análise.');
      }
      setResult(json as LiveResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCTA(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (isLoggedIn) {
      // Usuário já logado: gera e baixa a análise atual, sem reaproveitar PDF salvo.
      setError('');
      setCtaLoading(true);
      setDownloadAnalysisId(null);

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_type: 'analise_gratuita',
            nome_completo: nome.trim(),
            data_nascimento: data,
            nome_ja_escolhido: true,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          if (res.status === 403 || json.code === 'free_analysis_already_used') {
            setLimitModal({
              message: json.error ?? 'VocÃª atingiu o limite da anÃ¡lise gratuita.',
              redirectUrl: json.redirectUrl ?? '/app',
            });
            return;
          }
          throw new Error(json.error ?? 'Erro ao gerar o PDF da anÃ¡lise gratuita.');
        }

        const id = json.analysisId ?? json.id;
        if (!id) throw new Error('ID de anÃ¡lise nÃ£o retornado.');

        setDownloadAnalysisId(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro inesperado ao gerar o PDF.');
      } finally {
        setCtaLoading(false);
      }
      return;
    }

    if (!isValidEmail(email)) {
      setError('Informe um e-mail válido para baixar sua análise gratuita.');
      return;
    }

    setCtaLoading(true);
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erro ao validar e-mail.');

      if (json.exists) {
        setExistingAccountEmail(email.trim());
        return;
      }

      setRegistrationOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao validar e-mail.');
    } finally {
      setCtaLoading(false);
    }
  }

  // ── RESULTADO ──────────────────────────────────────────────────────────────
  if (result) {
    const { score, numeros, bloqueios, licoesCarmicas, tendenciasOcultas, debitosCarmicos } = result;
    const total = score?.total ?? 0;
    const nb = bloqueios?.length ?? 0;
    const nDebitos = (debitosCarmicos as unknown[])?.length ?? 0;
    const nLicoes = licoesCarmicas?.length ?? 0;
    const nTendencias = (tendenciasOcultas as unknown[])?.length ?? 0;

    const destino = numeros?.destino;
    const expressao = numeros?.expressao;
    const destinoMissao = DESTINO_MISSAO[destino] ?? null;
    const expressaoComo = EXPRESSAO_COMO[expressao] ?? null;

    const bloqueioV = bloqueioVida(bloqueios ?? []);
    const sc = getScoreConfig(total);

    // Bloqueios por triângulo (para colorir os cards individualmente)
    const bloqueiosPessoal = (bloqueios ?? []).filter(b => b.triangulos?.includes('pessoal'));
    const bloqueiosSocial  = (bloqueios ?? []).filter(b => b.triangulos?.includes('social'));
    const bloqueiosDestino = (bloqueios ?? []).filter(b => b.triangulos?.includes('destino'));

    const metricCards = [
      {
        label: 'BLOQUEIOS ENERGÉTICOS',
        value: nb > 0 ? `${nb} ${nb === 1 ? 'Ativo' : 'Ativos'}` : '0 Ativos',
        icon: <IconShield />,
        colorBg: nb > 0 ? 'bg-red-500/10' : 'bg-white/[0.03]',
        colorBorder: nb > 0 ? 'border-red-500/25' : 'border-emerald-500/30',
        colorIcon: nb > 0 ? 'text-red-400 bg-red-500/15' : 'text-emerald-400 bg-emerald-500/10',
        colorText: nb > 0 ? 'text-red-400' : 'text-emerald-400',
        colorValue: nb > 0 ? 'text-white' : 'text-gray-300',
        glossaryLink: '/glossario/bloqueio-energetico',
      },
      {
        label: 'DÉBITOS KÁRMICOS',
        value: nDebitos > 0 ? `${nDebitos} ${nDebitos === 1 ? 'Crítico' : 'Críticos'}` : '0 Críticos',
        icon: <IconClock />,
        colorBg: nDebitos > 0 ? 'bg-amber-500/10' : 'bg-white/5',
        colorBorder: nDebitos > 0 ? 'border-amber-500/25' : 'border-white/10',
        colorIcon: nDebitos > 0 ? 'text-amber-400 bg-amber-500/15' : 'text-gray-500 bg-white/5',
        colorText: nDebitos > 0 ? 'text-amber-400' : 'text-gray-500',
        colorValue: nDebitos > 0 ? 'text-white' : 'text-gray-400',
        glossaryLink: '/glossario/debitos-karmicos',
      },
      {
        label: 'TENDÊNCIAS OCULTAS',
        value: nTendencias > 0 ? `${nTendencias} Oculta${nTendencias !== 1 ? 's' : ''}` : '0 Ocultas',
        icon: <IconEyeOff />,
        colorBg: nTendencias > 0 ? 'bg-sky-500/10' : 'bg-white/5',
        colorBorder: nTendencias > 0 ? 'border-sky-500/25' : 'border-white/10',
        colorIcon: nTendencias > 0 ? 'text-sky-400 bg-sky-500/15' : 'text-gray-500 bg-white/5',
        colorText: nTendencias > 0 ? 'text-sky-400' : 'text-gray-500',
        colorValue: nTendencias > 0 ? 'text-white' : 'text-gray-400',
        glossaryLink: '/glossario/tendencias-ocultas',
      },
      {
        label: 'LIÇÕES KÁRMICAS',
        value: nLicoes > 0 ? `${nLicoes} Pendente${nLicoes !== 1 ? 's' : ''}` : '0 Pendentes',
        icon: <IconInfo />,
        colorBg: 'bg-white/5',
        colorBorder: 'border-white/10',
        colorIcon: nLicoes > 0 ? 'text-indigo-400 bg-indigo-500/15' : 'text-gray-500 bg-white/5',
        colorText: nLicoes > 0 ? 'text-indigo-400' : 'text-gray-500',
        colorValue: nLicoes > 0 ? 'text-white' : 'text-gray-400',
        glossaryLink: '/glossario/licoes-karmicas',
      },
    ];

    const triangleCards = [
      {
        key: 'vida',
        label: 'TRIÂNGULO DA VIDA',
        active: true,
        bloqueio: bloqueioV,
        hasBloqueio: !!bloqueioV,
        glossaryLink: '/glossario/triangulo-da-vida',
      },
      { key: 'pessoal', label: 'TRIÂNGULO PESSOAL',    active: false, bloqueio: null, hasBloqueio: bloqueiosPessoal.length > 0, glossaryLink: '/glossario/triangulo-pessoal' },
      { key: 'social',  label: 'TRIÂNGULO SOCIAL',     active: false, bloqueio: null, hasBloqueio: bloqueiosSocial.length > 0,  glossaryLink: '/glossario/triangulo-social' },
      { key: 'destino', label: 'TRIÂNGULO DE DESTINO', active: false, bloqueio: null, hasBloqueio: bloqueiosDestino.length > 0, glossaryLink: '/glossario/triangulo-de-destino' },
    ];

    return (
      <div className="space-y-5">

        {/* ── ① CARD: NOME COMPLETO + SCORE ─────────────────────────────────── */}
        <div className={`${sc.bgClass} ${sc.borderClass} border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6`}>
          {/* Lado esquerdo — nome */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
              Frequência Vibracional do Nome
            </p>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white leading-tight break-words">
              {nome.trim()}
            </h2>
            <p className="text-gray-600 text-xs mt-1">{data}</p>
          </div>
          {/* Lado direito — score gauge */}
          <div className="sm:w-52 flex-shrink-0">
            <div className="flex items-end justify-between mb-2">
              <span className={`font-cinzel font-bold text-3xl leading-none ${sc.textColor}`}>
                {total}
                <span className="text-sm font-normal text-gray-500 ml-0.5">/100</span>
              </span>
              <span className={`text-sm font-semibold ${sc.textColor}`}>{sc.label}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${sc.barGradient} transition-all duration-700`}
                style={{ width: `${Math.max(0, Math.min(100, total))}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── ② 4 Métricas ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metricCards.map((m) => (
            <div key={m.label} className={`${m.colorBg} ${m.colorBorder} border rounded-2xl p-4 flex flex-col items-center text-center gap-2`}>
              <div className={`${m.colorIcon} rounded-xl p-2 flex items-center justify-center`}>
                {m.icon}
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${m.colorText}`}>{m.label}</p>
                <GlossaryInfoLink href={m.glossaryLink} label={m.label} className={m.colorText} />
              </div>
              <p className={`font-cinzel text-xl font-bold leading-tight ${m.colorValue}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* ── ③ Status da Geometria de Nascimento ───────────────────────────── */}
        <div>
          <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest mb-3 px-1">
            Status da Geometria de Nascimento
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {triangleCards.map((t) => {
              if (t.active) {
                // Triângulo da Vida — fundo vermelho + borda vermelha se bloqueio; verde se limpo
                const temBloqueio = t.hasBloqueio;
                return (
                  <div
                    key={t.key}
                    className={`border rounded-2xl p-4 flex items-center gap-3 ${
                      temBloqueio
                        ? 'bg-red-500/10 border-red-500/40'
                        : 'bg-emerald-500/5 border-emerald-500/35'
                    }`}
                  >
                    <div className={`rounded-xl p-2.5 flex-shrink-0 ${
                      temBloqueio ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      <IconActivity />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-bold text-sm tracking-wide">{t.label}</p>
                        <GlossaryInfoLink href={t.glossaryLink} label={t.label} className={temBloqueio ? 'text-red-400' : 'text-emerald-400'} />
                      </div>
                      {temBloqueio ? (
                        <>
                          <p className="text-red-400 text-xs mt-0.5 font-semibold">
                            Sequência {t.bloqueio!.codigo} detectada
                          </p>
                          <p className="text-red-300/70 text-[10px] mt-1 leading-snug">
                            {BLOQUEIO_SIGNIFICADO[t.bloqueio!.codigo] ?? t.bloqueio!.titulo}
                          </p>
                        </>
                      ) : (
                        <p className="text-emerald-400 text-xs mt-0.5 font-semibold">Você não possui Bloqueios</p>
                      )}
                    </div>
                    <div className={`flex-shrink-0 ${temBloqueio ? 'text-red-400' : 'text-emerald-400'}`}>
                      {temBloqueio ? <IconAlert /> : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              }
              // Triângulos Ocultos (Pessoal / Social / Destino):
              //  - Com bloqueio → fundo vermelho + borda vermelha
              //  - Sem bloqueio → fundo neutro + borda verde
              const temBloqueioOculto = t.hasBloqueio;
              return (
                <div
                  key={t.key}
                  className={`border rounded-2xl p-4 flex items-center gap-3 ${
                    temBloqueioOculto
                      ? 'bg-red-500/8 border-red-500/35 opacity-70'
                      : 'bg-white/[0.02] border-emerald-500/25 opacity-55'
                  }`}
                >
                  <div className={`rounded-xl p-2.5 flex-shrink-0 ${
                    temBloqueioOculto ? 'bg-red-500/15 text-red-500/60' : 'bg-white/5 text-gray-600'
                  }`}>
                    <IconActivity />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm tracking-wide ${temBloqueioOculto ? 'text-gray-300' : 'text-gray-400'}`}>
                        {t.label}
                      </p>
                      <GlossaryInfoLink href={t.glossaryLink} label={t.label} className={temBloqueioOculto ? 'text-red-400/70' : 'text-[#2DD4BF]/80'} />
                    </div>
                    <p className={`text-xs mt-0.5 ${temBloqueioOculto ? 'text-red-400/60' : 'text-gray-600'}`}>
                      {temBloqueioOculto ? 'Bloqueio detectado — acesso bloqueado' : 'Dado Oculto (Apenas no PDF)'}
                    </p>
                  </div>
                  {/* Cadeado teal e visível */}
                  <div className="flex-shrink-0 text-[#2DD4BF]/80">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ③ Destino + Expressão ─────────────────────────────────────────── */}
        {/* Mobile: grid 1 col (mesma largura). Desktop: Destino 3/5 + Expressão 2/5 */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">

          {/* ── DESTINO — imutável, card principal ── */}
          <div className="sm:col-span-3 bg-[#D4AF37]/8 border-2 border-[#D4AF37]/40 rounded-2xl p-6 relative overflow-hidden">
            {/* Glow de fundo sutil */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

            {/* Badge imutável */}
            <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/35 rounded-full px-3 py-1 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-[#D4AF37]">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">Imutável</span>
            </div>

            {/* Número grande + label */}
            <div className="flex items-center gap-4 mb-4">
              <p className="font-cinzel font-bold text-8xl text-[#D4AF37] leading-none drop-shadow-sm">
                {destino ?? '—'}
              </p>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-[#D4AF37]/50 text-[10px] font-bold uppercase tracking-widest leading-none">Número de Destino</p>
                  <GlossaryInfoLink href="/glossario/numero-de-destino" label="Número de Destino" className="text-[#D4AF37]" />
                </div>
                <p className="text-white/50 text-xs">Sua Estrada</p>
              </div>
            </div>

            {/* Missão do número */}
            {destinoMissao && (
              <p className="text-gray-300 text-sm leading-relaxed">
                {destinoMissao}
              </p>
            )}
          </div>

          {/* ── EXPRESSÃO — secundário, reflexo do nome ── */}
          <div className="sm:col-span-2 bg-white/[0.06] border border-white/18 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center gap-4">
                <p className="font-cinzel font-bold text-6xl text-white/85 leading-none">
                  {expressao ?? '—'}
                </p>
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="bg-[#D4AF37]/12 text-[#D4AF37]/70 rounded-lg p-1.5 flex items-center justify-center flex-shrink-0">
                      <IconZap />
                    </div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-tight">Número de Expressão</p>
                    <GlossaryInfoLink href="/glossario/numero-de-expressao" label="Número de Expressão" className="text-[#D4AF37]" />
                  </div>
                  <p className="text-gray-500 text-xs">Sua Voz no Mundo</p>
                </div>
              </div>

              {/* Como o número se expressa */}
              {expressaoComo && (
                <p className="text-gray-300 text-xs leading-relaxed">
                  {expressaoComo}
                </p>
              )}
            </div>

            {/* Nota mutabilidade */}
            <p className="text-gray-600 text-[10px] mt-4 font-medium">
              Reflete as letras do nome — pode ser refinado
            </p>
          </div>

        </div>

        {/* ── ④ CTA — Dossiê Completo ───────────────────────────────────────── */}
        <div className="bg-[#0F766E] rounded-3xl p-7 sm:p-8">
          <h3 className="text-white font-cinzel font-bold text-2xl sm:text-3xl text-center mb-3">
            Leve sua análise com você.
          </h3>
          <p className="text-white/80 text-sm text-center leading-relaxed mb-4">
            Seu dossiê gratuito traz em PDF o significado dos seus <strong>5 números vibracionais</strong> e
            a análise completa do <strong>Triângulo da Vida</strong> — o arcano que rege sua frequência
            e o antídoto preciso do bloqueio detectado.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mb-6">
            {[
              '✦ 5 números com significados',
              '✦ Arcano Regente do Triângulo da Vida',
              '✦ Antídoto do bloqueio',
            ].map(item => (
              <span key={item} className="text-white/60 text-xs">{item}</span>
            ))}
          </div>
          {!isLoggedIn ? (
            <div>
              <p className="mb-2 text-center text-xs font-medium text-white/70 sm:text-left">
                Adicione seu e-mail para liberar o download da análise gratuita.
              </p>
              <form onSubmit={handleCTA} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="Seu melhor e-mail..."
                  className="flex-1 bg-white text-gray-800 placeholder-gray-400 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
                <button
                  type="submit"
                  disabled={ctaLoading || !isValidEmail(email)}
                  className="bg-white text-[#0F766E] font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-[#CCFBF1] transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                >
                  BAIXAR ANÁLISE GRATUITA <span className="text-base">›</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={() => handleCTA()}
                disabled={ctaLoading}
                className="bg-white text-[#0F766E] font-bold text-sm px-10 py-3.5 rounded-xl hover:bg-[#CCFBF1] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                GERAR MEU PDF GRATUITO ›
              </button>
            </div>
          )}
          <p className="text-white/45 text-xs text-center mt-3">
            Gratuito · Sem cartão · Os outros triângulos e a harmonização do nome estão no <span className="underline underline-offset-2">Nome Social</span>
          </p>
        </div>

        {!isLoggedIn && (
          <button
            onClick={() => { setResult(null); setError(''); setNome(''); setData(''); setEmail(''); }}
            className="w-full text-center text-gray-600 text-xs hover:text-gray-400 transition-colors py-1"
          >
            ← Analisar outro nome
          </button>
        )}

        <RegistrationModal
          open={registrationOpen}
          nomeCompleto={nome}
          dataNascimento={data}
          prefilledEmail={email}
          redirectUrl="/app?gen_free_pdf=1"
          onClose={() => setRegistrationOpen(false)}
        />

        {limitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/25 bg-[#111111] p-6 shadow-2xl shadow-black/60">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
                <IconAlert />
              </div>
              <h2 className="font-cinzel text-2xl font-bold text-[#e5e2e1]">Limite atingido</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                {limitModal.message}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={limitModal.redirectUrl}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#131313] transition hover:bg-[#f2ca50]"
                >
                  Ir para minha conta
                </a>
                <button
                  type="button"
                  onClick={() => setLimitModal(null)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {existingAccountEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/25 bg-[#111111] p-6 shadow-2xl shadow-black/60">
              <h2 className="font-cinzel text-2xl font-bold text-[#e5e2e1]">E-mail já cadastrado</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                Esse e-mail já possui uma conta. Faça login para acessar seu PDF gratuito no painel.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`/auth/login?email=${encodeURIComponent(existingAccountEmail)}&redirect=${encodeURIComponent('/app')}&msg=conta-existente`}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#131313] transition hover:bg-[#f2ca50]"
                >
                  Fazer login
                </a>
                <button
                  type="button"
                  onClick={() => setExistingAccountEmail(null)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {downloadAnalysisId && (
          <PDFFeedbackButton
            analysisId={downloadAnalysisId}
            productType="analise_gratuita"
            isFree={true}
            showFab={false}
            autoDownload={true}
            label="Baixar AnÃ¡lise Gratuita"
            className="hidden"
          />
        )}

      </div>
    );
  }

  // ── FORMULÁRIO ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {limitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/25 bg-[#111111] p-6 shadow-2xl shadow-black/60">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
              <IconAlert />
            </div>
            <h2 className="font-cinzel text-2xl font-bold text-[#e5e2e1]">Limite atingido</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              {limitModal.message}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={limitModal.redirectUrl}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#131313] transition hover:bg-[#f2ca50]"
              >
                Ir para minha conta
              </a>
              <button
                type="button"
                onClick={() => setLimitModal(null)}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Campos + botão em linha no desktop, empilhados no mobile */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {/* Nome */}
          <input
            id="pub-nome"
            type="text"
            value={nome}
            onChange={e => { setNome(e.target.value); setError(''); }}
            placeholder="Nome completo de nascimento"
            className="flex-1 bg-white/[0.06] border border-white/12 rounded-2xl px-5 py-4 text-white placeholder-gray-500 text-base focus:outline-none focus:border-[#2DD4BF]/50 focus:ring-1 focus:ring-[#2DD4BF]/30 transition-all"
            autoComplete="name"
            required
          />

          {/* Data */}
          <input
            id="pub-data"
            type="text"
            value={data}
            onChange={e => { setData(fmtDate(e.target.value)); setError(''); }}
            placeholder="DD/MM/AAAA"
            maxLength={10}
            inputMode="numeric"
            className="sm:w-44 bg-white/[0.06] border border-white/12 rounded-2xl px-5 py-4 text-white placeholder-gray-500 text-base focus:outline-none focus:border-[#2DD4BF]/50 focus:ring-1 focus:ring-[#2DD4BF]/30 transition-all"
            required
          />

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="sm:w-auto bg-[#0F766E] text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-[#0D9488] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#0F766E]/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-[#1A1A1A]/30 border-t-[#1A1A1A] rounded-full animate-spin" />
                Analisando…
              </span>
            ) : (
              'Ver Prévia Gratuita →'
            )}
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className="mt-3 rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Micro-copy */}
        <p className="text-center text-gray-600 text-xs mt-4">
          Análise instantânea · Sem criar conta · 100% gratuito
        </p>
      </form>
    </div>
  );
}
