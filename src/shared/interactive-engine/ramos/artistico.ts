/**
 * Ramo artístico do chat do Nome Magnético (DEV-320 e DEV-321).
 *
 * Tudo que é específico de nome artístico mora aqui: opções das perguntas, rótulos,
 * aviso informativo, mapeamento para o motor e frases do palpite. O roteiro padrão
 * (`questionnaire-adaptive.ts`, `questionnaire-map.ts`, `chat-profile-copy.ts`) só
 * importa daqui, para que mudar o ramo artístico não mexa no Nome Social e vice-versa.
 *
 * Só imports de tipo dos módulos do roteiro padrão (sem dependência circular em runtime).
 */

import type { QuestionOption } from '../questionnaire-adaptive';
import type { QuestionnaireProfile, RankingOpcoesPatch } from '../questionnaire-map';

// ── Opções das perguntas ─────────────────────────────────────────────────────

export type AreaArtistica =
  | 'cantor'
  | 'ator'
  | 'personagem'
  | 'criador_conteudo'
  | 'escritor'
  | 'dj_produtor'
  | 'outra';

export const AREA_ARTISTICA_OPTIONS: QuestionOption[] = [
  { id: 'cantor', label: 'Cantor ou cantora' },
  { id: 'ator', label: 'Ator ou atriz' },
  { id: 'personagem', label: 'Personagem, drag ou humor' },
  { id: 'criador_conteudo', label: 'Criação de conteúdo' },
  { id: 'escritor', label: 'Escrita' },
  { id: 'dj_produtor', label: 'DJ ou produção musical' },
  // O id termina em `_outro`, que abre o campo de texto (até 60 caracteres).
  { id: 'area_artistica_outro', label: 'Outra área' },
];

export const DETALHE_ARTISTICO_BY_AREA: Partial<Record<AreaArtistica, QuestionOption[]>> = {
  cantor: [
    { id: 'pop', label: 'Pop' },
    { id: 'funk', label: 'Funk' },
    { id: 'sertanejo', label: 'Sertanejo' },
    { id: 'rap_trap', label: 'Rap ou trap' },
    { id: 'mpb_samba', label: 'MPB, samba ou pagode' },
    { id: 'gospel', label: 'Gospel' },
    { id: 'rock', label: 'Rock' },
    { id: 'eletronica', label: 'Eletrônica' },
  ],
  ator: [
    { id: 'drama', label: 'Drama e novela' },
    { id: 'comedia', label: 'Comédia' },
    { id: 'teatro_musical', label: 'Teatro e musical' },
    { id: 'publicidade_tv', label: 'Publicidade e apresentação' },
  ],
  personagem: [
    { id: 'drag', label: 'Drag' },
    { id: 'humor', label: 'Humor e stand-up' },
    { id: 'infantil', label: 'Personagem infantil' },
    { id: 'persona_digital', label: 'Persona digital' },
  ],
};

export const DETALHE_ARTISTICO_PROMPT: Partial<Record<AreaArtistica, string>> = {
  cantor: 'Qual estilo de música você faz?',
  ator: 'Em que tipo de trabalho você mais atua?',
  personagem: 'Qual é o estilo da persona?',
};

export const GENERO_PERSONA_OPTIONS: QuestionOption[] = [
  { id: 'feminino', label: 'Feminino' },
  { id: 'masculino', label: 'Masculino' },
  { id: 'neutro', label: 'Neutro ou ambíguo' },
];

export const IMAGEM_ARTISTICA_OPTIONS: QuestionOption[] = [
  { id: 'marcante', label: 'Marcante' },
  { id: 'sofisticada', label: 'Sofisticada' },
  { id: 'divertida', label: 'Divertida' },
  { id: 'misteriosa', label: 'Misteriosa' },
  { id: 'popular', label: 'Popular' },
];

export type TipoNomeArtistico = 'proximo' | 'diferente' | 'ambos';

export const TIPO_NOME_ARTISTICO_OPTIONS: QuestionOption[] = [
  { id: 'proximo', label: 'Próximo do meu nome' },
  { id: 'diferente', label: 'Totalmente diferente' },
  { id: 'ambos', label: 'As duas coisas' },
];

// ── Rótulos ──────────────────────────────────────────────────────────────────

export function labelAreaArtistica(id: string | null | undefined): string | null {
  return AREA_ARTISTICA_OPTIONS.find((o) => o.id === id)?.label ?? null;
}

export function labelDetalheArtistico(area: string | null | undefined, id: string): string | null {
  const opts = area ? DETALHE_ARTISTICO_BY_AREA[area as AreaArtistica] : undefined;
  return opts?.find((o) => o.id === id)?.label ?? null;
}

export function labelImagemArtistica(id: string): string | null {
  return IMAGEM_ARTISTICA_OPTIONS.find((o) => o.id === id)?.label ?? null;
}

/** Áreas que têm a pergunta de detalhe (gênero musical, tipo de papel ou estilo). */
export function areaTemDetalheArtistico(area: string | null | undefined): boolean {
  return Boolean(area && DETALHE_ARTISTICO_BY_AREA[area as AreaArtistica]);
}

// ── Aviso informativo (contratos e documentos) ───────────────────────────────

const USOS_COM_AVISO_ARTISTICO = ['contratos', 'documentos', 'registro_marca', 'empresa_cnpj'];

export function precisaAvisoArtisticoContratos(
  motivo: string | null | undefined,
  outrosUsos: readonly string[] | null | undefined,
): boolean {
  return motivo === 'artistico' && Boolean(outrosUsos?.some((u) => USOS_COM_AVISO_ARTISTICO.includes(u)));
}

/** Aviso só informativo (sem orientação jurídica). Base: DEV-319. Sem travessão e sem promessa. */
export const AVISO_ARTISTICO_CONTRATOS_TEXT =
  'Uma informação importante sobre nome artístico: contratos, documentos e cadastros oficiais seguem o seu nome civil e o seu CPF. ' +
  'O nome artístico costuma aparecer junto, como "conhecido artisticamente como". ' +
  'Quem quer exclusividade sobre o nome pode registrá-lo como marca no INPI, e quem atua profissionalmente em artes cênicas costuma precisar do registro profissional (DRT). ' +
  'Mudar o nome no cartório tem regras próprias. Este aviso é só informativo: para decidir, converse com um advogado de sua confiança.';

// ── Mapeamento para o motor de nomes próximos (F1) ───────────────────────────

/** Imagem artística vira a afinidade de estilo que o motor já entende (DEV-302). */
const IMAGEM_PARA_ESTILO: Record<string, string> = {
  marcante: 'criatividade',
  sofisticada: 'elegancia_discreta',
  divertida: 'leve_acolhimento',
  misteriosa: 'elegancia_discreta',
  popular: 'leve_acolhimento',
};

/**
 * Forma curta, apelido e encurtamento liberados; sem teto de nível; sem restrição legal
 * (contratos seguem o nome civil, ver aviso). Zero bloqueio e nota mínima seguem valendo.
 * Usado pelo `decide-live` e pelo "Gerar outras opções" do chat. Os nomes artísticos
 * próximos e novos de verdade vêm do motor `products/nome-artistico` (DEV-321).
 */
export function profileToRankingOpcoesArtistico(
  profile: QuestionnaireProfile,
  extras?: Partial<RankingOpcoesPatch>
): RankingOpcoesPatch {
  const estilo = [
    ...new Set((profile.imagemArtistica ?? []).map((i) => IMAGEM_PARA_ESTILO[i]).filter(Boolean)),
  ];
  return {
    ondeVaiUsar: ['marca_autoria', 'presenca_digital'],
    sobrenomesObrigatorios:
      profile.sobrenomesObrigatorios.length > 0 ? profile.sobrenomesObrigatorios : undefined,
    sobrenomesExcluidos:
      profile.sobrenomesExcluidos.length > 0 ? profile.sobrenomesExcluidos : undefined,
    estiloPreferido: 'curto_direto',
    aceitaEncurtarOuApelido: true,
    assinaturaAtual: profile.nomeUsoBase?.trim() || undefined,
    restricaoDocumentosLegais: undefined,
    maxNivelGeracao: undefined,
    afinidades: {
      estilo: estilo.length > 0 ? estilo : undefined,
      area: 'autoestima_expressao',
      subfocos: ['voz_seguranca'],
    },
    manterPrimeiroNome: profile.preferenciasAssinatura?.includes('manter_primeiro_nome') || undefined,
    acentoNaAssinatura: profile.preferenciasAssinatura?.includes('sem_acento') ? 'prefere_sem' : undefined,
    prioridadeConflito: profile.tipoNomeArtistico === 'proximo' ? 'mudanca' : 'nota',
    ...extras,
  };
}

// ── Palpite ──────────────────────────────────────────────────────────────────

export interface PerfilArtisticoPalpite {
  areaArtistica?: string | null;
  areaArtisticaOutro?: string | null;
  detalheArtistico?: string[];
  generoPersona?: string | null;
  imagemArtistica?: string[];
  tipoNomeArtistico?: string | null;
}

function listaPt(itens: string[]): string {
  return itens.length <= 1 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

/** Frases do retrato artístico (sem números, sem travessão, sem jargão). */
export function buildArtisticoPalpiteLines(a: PerfilArtisticoPalpite): string[] {
  const lines: string[] = [];
  const area =
    a.areaArtistica === 'outra'
      ? a.areaArtisticaOutro?.trim() || 'artista'
      : (labelAreaArtistica(a.areaArtistica)?.toLowerCase() ?? 'artista');
  const detalhes = (a.detalheArtistico ?? [])
    .map((id) => labelDetalheArtistico(a.areaArtistica, id)?.toLowerCase())
    .filter((x): x is string => Boolean(x));
  lines.push(
    `Você busca um nome artístico para atuar como ${area}${detalhes.length > 0 ? `, no estilo ${listaPt(detalhes)}` : ''}.`
  );
  const imagens = (a.imagemArtistica ?? [])
    .map((id) => labelImagemArtistica(id)?.toLowerCase())
    .filter((x): x is string => Boolean(x));
  if (imagens.length > 0) lines.push(`Quer passar uma imagem ${listaPt(imagens)}.`);
  if (a.generoPersona === 'feminino') lines.push('O nome deve soar feminino.');
  else if (a.generoPersona === 'masculino') lines.push('O nome deve soar masculino.');
  else if (a.generoPersona === 'neutro') lines.push('O nome deve soar neutro ou ambíguo.');
  if (a.tipoNomeArtistico === 'proximo') lines.push('Aceita um nome próximo do seu.');
  else if (a.tipoNomeArtistico === 'diferente') lines.push('Aceita um nome totalmente diferente do seu.');
  else if (a.tipoNomeArtistico === 'ambos') {
    lines.push('Aceita tanto um nome próximo do seu quanto um totalmente diferente.');
  }
  return lines;
}
