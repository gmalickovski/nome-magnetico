/**
 * Lógica específica do produto Nome da Empresa.
 *
 * Fluxo:
 * 1. Calcular número de Destino do sócio principal (data de nascimento).
 * 2. Calcular número de Destino da empresa (data de fundação, se houver).
 * 3. Para cada nome candidato:
 *    - Calcular os 4 triângulos (usando data de fundação ou nascimento do sócio)
 *    - Verificar sequências negativas
 *    - Calcular compatibilidade Expressão × Destino do sócio
 *    - Calcular compatibilidade Expressão × Destino da empresa (se tiver data)
 *    - Verificar lições kármics e tendências ocultas
 * 4. Rankear por score total.
 */

import { calcularTodosTriangulos, detectarBloqueios, todasSequenciasNegativas } from '../triangle';
import { calcularExpressao, calcularDestino, calcularMotivacao, calcularMissao, calcularImpressao } from '../numbers';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos } from '../karmic';
import { avaliarCompatibilidade } from '../harmonization';
import { calcularScore, calcularScoreTeto } from '../score';
import type { LicaoCarmica, TendenciaOculta, DebitoCarmicoInfo } from '../karmic';
import type { Bloqueio } from '../triangle';
import type { DisponibilidadeNome } from '../../utils/availability';

// ── Pool Semântica por Categoria ─────────────────────────────────────────────
/**
 * Cada entrada tem categorias semânticas.
 * 'universal' = adequado para qualquer ramo.
 * Demais valores correspondem às chaves de POOLS_RAMO.
 */
interface EntradaPool {
  nome: string;
  lingua: string;
  significado: string;
  categorias: string[];
}

const POOL_SEMANTICO: EntradaPool[] = [
  // ── Latim — significados universais ──────────────────────────────────────
  { nome: 'Lux',      lingua: 'latim',  significado: 'luz',                    categorias: ['universal'] },
  { nome: 'Pax',      lingua: 'latim',  significado: 'paz, equilíbrio',        categorias: ['universal'] },
  { nome: 'Vis',      lingua: 'latim',  significado: 'força, vigor',           categorias: ['universal'] },
  { nome: 'Lumis',    lingua: 'latim',  significado: 'luminosidade',           categorias: ['universal'] },
  { nome: 'Orbis',    lingua: 'latim',  significado: 'mundo, esfera',          categorias: ['universal'] },
  { nome: 'Animus',   lingua: 'latim',  significado: 'espírito, alma',         categorias: ['universal'] },
  { nome: 'Fides',    lingua: 'latim',  significado: 'confiança, lealdade',    categorias: ['universal', 'juridico', 'financeiro', 'consultoria'] },
  { nome: 'Virtus',   lingua: 'latim',  significado: 'excelência, virtude',    categorias: ['universal'] },
  { nome: 'Nexum',    lingua: 'latim',  significado: 'conexão, vínculo',       categorias: ['universal', 'tecnologia', 'consultoria', 'marketing'] },
  { nome: 'Caelum',   lingua: 'latim',  significado: 'céu, elevação',          categorias: ['universal'] },
  { nome: 'Firmum',   lingua: 'latim',  significado: 'sólido, firme',          categorias: ['construcao', 'consultoria', 'financeiro', 'imobiliaria'] },
  { nome: 'Ignis',    lingua: 'latim',  significado: 'fogo, paixão',           categorias: ['marketing', 'tecnologia', 'gastronomia'] },
  { nome: 'Auris',    lingua: 'latim',  significado: 'ouro, precioso',         categorias: ['financeiro', 'moda', 'imobiliaria'] },
  { nome: 'Aevum',    lingua: 'latim',  significado: 'tempo eterno, legado',   categorias: ['universal', 'consultoria', 'financeiro'] },
  { nome: 'Solaris',  lingua: 'latim',  significado: 'solar, radiante',        categorias: ['universal', 'saude', 'educacao'] },
  // ── Latim — jurídico/institucional ───────────────────────────────────────
  { nome: 'Veritas',  lingua: 'latim',  significado: 'verdade',                categorias: ['juridico', 'educacao', 'consultoria'] },
  { nome: 'Iuris',    lingua: 'latim',  significado: 'do direito',             categorias: ['juridico'] },
  { nome: 'Legis',    lingua: 'latim',  significado: 'da lei',                 categorias: ['juridico'] },
  { nome: 'Actio',    lingua: 'latim',  significado: 'ação, processo',         categorias: ['juridico'] },
  { nome: 'Iustum',   lingua: 'latim',  significado: 'justiça',                categorias: ['juridico'] },
  { nome: 'Lexum',    lingua: 'latim',  significado: 'lei, ordem',             categorias: ['juridico'] },
  { nome: 'Fidelis',  lingua: 'latim',  significado: 'fiel, confiável',        categorias: ['juridico', 'financeiro', 'consultoria'] },
  // ── Latim — finanças/negócios ─────────────────────────────────────────────
  { nome: 'Aurum',    lingua: 'latim',  significado: 'ouro, riqueza',          categorias: ['financeiro'] },
  { nome: 'Lucrum',   lingua: 'latim',  significado: 'lucro, prosperidade',    categorias: ['financeiro'] },
  { nome: 'Finium',   lingua: 'latim',  significado: 'limites, precisão',      categorias: ['financeiro', 'consultoria'] },
  // ── Latim — construção/solidez ────────────────────────────────────────────
  { nome: 'Solida',   lingua: 'latim',  significado: 'sólido, robusto',        categorias: ['construcao'] },
  { nome: 'Structa',  lingua: 'latim',  significado: 'estrutura',              categorias: ['construcao'] },
  { nome: 'Arcus',    lingua: 'latim',  significado: 'arco, estrutura',        categorias: ['construcao', 'imobiliaria'] },
  { nome: 'Domis',    lingua: 'latim',  significado: 'lar, domicílio',         categorias: ['imobiliaria'] },
  { nome: 'Domus',    lingua: 'latim',  significado: 'casa, lar',              categorias: ['imobiliaria'] },
  { nome: 'Locus',    lingua: 'latim',  significado: 'lugar, localização',     categorias: ['imobiliaria', 'logistica'] },
  // ── Latim — logística/movimento ───────────────────────────────────────────
  { nome: 'Cursus',   lingua: 'latim',  significado: 'percurso, fluxo',        categorias: ['logistica'] },
  { nome: 'Velox',    lingua: 'latim',  significado: 'veloz, rápido',          categorias: ['logistica', 'tecnologia'] },
  { nome: 'Nexor',    lingua: 'latim',  significado: 'conector, elo',          categorias: ['logistica', 'tecnologia', 'consultoria'] },
  // ── Latim — saúde/vida ────────────────────────────────────────────────────
  { nome: 'Vita',     lingua: 'latim',  significado: 'vida',                   categorias: ['saude'] },
  { nome: 'Salus',    lingua: 'latim',  significado: 'saúde, bem-estar',       categorias: ['saude'] },
  { nome: 'Bios',     lingua: 'latim',  significado: 'vida orgânica',          categorias: ['saude'] },
  { nome: 'Sanus',    lingua: 'latim',  significado: 'são, saudável',          categorias: ['saude'] },
  { nome: 'Vitalis',  lingua: 'latim',  significado: 'vitalidade',             categorias: ['saude'] },
  { nome: 'Vivax',    lingua: 'latim',  significado: 'vivaz, pleno de vida',   categorias: ['saude'] },
  // ── Latim — educação/saber ────────────────────────────────────────────────
  { nome: 'Logos',    lingua: 'grego',  significado: 'razão, conhecimento',    categorias: ['educacao', 'consultoria', 'tecnologia'] },
  { nome: 'Cognis',   lingua: 'latim',  significado: 'conhecimento',           categorias: ['educacao', 'consultoria'] },
  { nome: 'Mentis',   lingua: 'latim',  significado: 'mente, intelecto',       categorias: ['educacao', 'consultoria'] },
  { nome: 'Sapiens',  lingua: 'latim',  significado: 'sábio, inteligente',     categorias: ['educacao', 'consultoria'] },
  // ── Grego — universal e filosófico ───────────────────────────────────────
  { nome: 'Arete',    lingua: 'grego',  significado: 'excelência, virtude',    categorias: ['universal'] },
  { nome: 'Kairos',   lingua: 'grego',  significado: 'momento certo, timing',  categorias: ['universal', 'consultoria', 'marketing'] },
  { nome: 'Ethos',    lingua: 'grego',  significado: 'ética, caráter',         categorias: ['consultoria', 'juridico', 'educacao'] },
  { nome: 'Telos',    lingua: 'grego',  significado: 'propósito, finalidade',  categorias: ['universal', 'consultoria', 'educacao'] },
  { nome: 'Gnosis',   lingua: 'grego',  significado: 'conhecimento profundo',  categorias: ['educacao', 'consultoria', 'tecnologia'] },
  { nome: 'Kratos',   lingua: 'grego',  significado: 'força, poder',           categorias: ['tecnologia', 'consultoria', 'construcao'] },
  { nome: 'Arkhe',    lingua: 'grego',  significado: 'origem, princípio',      categorias: ['universal', 'tecnologia', 'educacao'] },
  { nome: 'Helios',   lingua: 'grego',  significado: 'sol, energia solar',     categorias: ['universal', 'saude', 'marketing'] },
  { nome: 'Kinesis',  lingua: 'grego',  significado: 'movimento, dinâmica',    categorias: ['tecnologia', 'logistica', 'marketing'] },
  { nome: 'Synapse',  lingua: 'grego',  significado: 'conexão neuronal',       categorias: ['tecnologia', 'saude', 'educacao'] },
  { nome: 'Paideia',  lingua: 'grego',  significado: 'educação integral',      categorias: ['educacao'] },
  { nome: 'Episteme', lingua: 'grego',  significado: 'conhecimento científico', categorias: ['educacao', 'consultoria'] },
  { nome: 'Temis',    lingua: 'grego',  significado: 'deusa da justiça e lei', categorias: ['juridico'] },
  { nome: 'Arche',    lingua: 'grego',  significado: 'princípio fundador',     categorias: ['tecnologia', 'educacao', 'consultoria'] },
  // ── Italiano — elegância e estilo ─────────────────────────────────────────
  { nome: 'Forza',    lingua: 'italiano', significado: 'força, potência',      categorias: ['universal'] },
  { nome: 'Valore',   lingua: 'italiano', significado: 'valor, excelência',    categorias: ['universal', 'consultoria', 'financeiro'] },
  { nome: 'Grazia',   lingua: 'italiano', significado: 'graça, elegância',     categorias: ['moda', 'gastronomia', 'marketing'] },
  { nome: 'Luce',     lingua: 'italiano', significado: 'luz, clareza',         categorias: ['universal'] },
  { nome: 'Ardore',   lingua: 'italiano', significado: 'ardor, paixão',        categorias: ['gastronomia', 'marketing', 'moda'] },
  { nome: 'Veloce',   lingua: 'italiano', significado: 'veloz, ágil',          categorias: ['logistica', 'tecnologia'] },
  // ── Japonês — equilíbrio e natureza ──────────────────────────────────────
  { nome: 'Kaze',     lingua: 'japonês', significado: 'vento, leveza',         categorias: ['logistica', 'tecnologia', 'marketing'] },
  { nome: 'Hana',     lingua: 'japonês', significado: 'flor, beleza',          categorias: ['moda', 'saude', 'gastronomia'] },
  { nome: 'Koru',     lingua: 'maori',   significado: 'espiral de crescimento', categorias: ['universal', 'consultoria', 'educacao'] },
  { nome: 'Miru',     lingua: 'japonês', significado: 'visão, perspectiva',    categorias: ['tecnologia', 'consultoria', 'marketing'] },
  { nome: 'Sora',     lingua: 'japonês', significado: 'céu, infinito',         categorias: ['universal', 'tecnologia', 'marketing'] },
  { nome: 'Kodo',     lingua: 'japonês', significado: 'pulso, código, ritmo',  categorias: ['tecnologia', 'marketing'] },
  { nome: 'Shizen',   lingua: 'japonês', significado: 'natureza, orgânico',    categorias: ['saude', 'gastronomia'] },
  // ── Nórdico — resistência e clareza ──────────────────────────────────────
  { nome: 'Saga',     lingua: 'nórdico', significado: 'história épica, legado', categorias: ['universal', 'marketing', 'consultoria'] },
  { nome: 'Nord',     lingua: 'nórdico', significado: 'norte, direção clara',   categorias: ['universal', 'logistica', 'consultoria'] },
  { nome: 'Sterk',    lingua: 'nórdico', significado: 'forte, resistente',      categorias: ['construcao', 'consultoria'] },
  { nome: 'Ljus',     lingua: 'sueco',   significado: 'luz, claridade',         categorias: ['universal', 'saude', 'educacao'] },
  // ── Compostos modernos ────────────────────────────────────────────────────
  { nome: 'Lumnis',   lingua: 'moderno', significado: 'luz + mente (luminosidade intelectual)', categorias: ['universal', 'educacao', 'tecnologia'] },
  { nome: 'Nexlux',   lingua: 'moderno', significado: 'conexão + luz',                          categorias: ['tecnologia', 'marketing', 'consultoria'] },
  { nome: 'Vitapax',  lingua: 'moderno', significado: 'vida + paz',                             categorias: ['saude'] },
  { nome: 'Zenith',   lingua: 'inglês',  significado: 'ponto mais alto, auge',                  categorias: ['universal', 'consultoria', 'financeiro'] },
  { nome: 'Novaxis',  lingua: 'moderno', significado: 'novo eixo, nova direção',                categorias: ['tecnologia', 'consultoria', 'marketing'] },
  { nome: 'Verium',   lingua: 'moderno', significado: 'verdade + essência',                     categorias: ['universal', 'consultoria', 'educacao'] },
  { nome: 'Quantum',  lingua: 'inglês',  significado: 'salto quântico, disrupção',              categorias: ['tecnologia', 'consultoria', 'financeiro'] },
  { nome: 'Plenix',   lingua: 'moderno', significado: 'plenitude, completude',                  categorias: ['universal', 'saude', 'consultoria'] },
  { nome: 'Corus',    lingua: 'moderno', significado: 'núcleo + coração',                       categorias: ['universal', 'saude', 'tecnologia'] },
  // ── Gastronomia específico ────────────────────────────────────────────────
  { nome: 'Saveur',   lingua: 'francês', significado: 'sabor (fr.)',            categorias: ['gastronomia'] },
  { nome: 'Gusto',    lingua: 'italiano', significado: 'gosto, prazer',         categorias: ['gastronomia'] },
  { nome: 'Epicura',  lingua: 'latim',   significado: 'prazer refinado',        categorias: ['gastronomia', 'moda'] },
  { nome: 'Palatum',  lingua: 'latim',   significado: 'palato, paladar',        categorias: ['gastronomia'] },
  // ── Moda específico ───────────────────────────────────────────────────────
  { nome: 'Veste',    lingua: 'italiano', significado: 'vestimenta, traje',     categorias: ['moda'] },
  { nome: 'Forma',    lingua: 'latim',   significado: 'forma, design',          categorias: ['moda', 'marketing'] },
  { nome: 'Elega',    lingua: 'moderno', significado: 'elegância (síntese)',    categorias: ['moda'] },
  { nome: 'Coutu',    lingua: 'francês', significado: 'costura (couture)',      categorias: ['moda'] },
];

/**
 * Filtra o pool semântico por ramo de atividade e opcionalmente prioriza
 * entradas cuja descrição/significado combina com palavras-chave do negócio.
 */
function filtrarPoolSemantico(
  ramoAtividade: string | undefined,
  descricaoNegocio: string | undefined
): string[] {
  const ramoNorm = (ramoAtividade ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const ramoKey = ramoNorm
    ? (Object.keys(POOLS_RAMO).find(k => ramoNorm.includes(k)) ?? '')
    : '';

  const descNorm = (descricaoNegocio ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const palavrasDesc = descNorm.split(/\s+/).filter(w => w.length >= 4);

  // Filtra por categoria: mantém 'universal' + entradas do ramo específico
  const filtrados = POOL_SEMANTICO.filter(e =>
    e.categorias.includes('universal') ||
    (ramoKey && e.categorias.includes(ramoKey))
  );

  // Se há descrição, ordena priorizando entradas cujo significado bate com palavras-chave
  if (palavrasDesc.length > 0) {
    filtrados.sort((a, b) => {
      const sigA = a.significado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const sigB = b.significado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchA = palavrasDesc.filter(p => sigA.includes(p)).length;
      const matchB = palavrasDesc.filter(p => sigB.includes(p)).length;
      return matchB - matchA;
    });
  }

  return filtrados.map(e => e.nome);
}

// ── Pools por ramo de atividade ───────────────────────────────────────────────
const POOLS_RAMO: Record<string, string[]> = {
  tecnologia:   ['Nexis', 'Vertex', 'Helix', 'Vortex', 'Cipher', 'Codex', 'Nodus', 'Bitrix', 'Devix', 'Pixus', 'Systema', 'Quantum', 'Kinesis', 'Nexor', 'Arche', 'Corus', 'Synq', 'Kodo', 'Miru', 'Novaxis'],
  saude:        ['Vita', 'Salus', 'Bios', 'Sanus', 'Medix', 'Vivax', 'Sanitas', 'Clinix', 'Vitalis', 'Salutem', 'Orbis', 'Vitapax', 'Corus', 'Shizen', 'Plenix', 'Ljus'],
  educacao:     ['Cognis', 'Sapiens', 'Mentis', 'Logos', 'Paideia', 'Erudit', 'Gnosis', 'Episteme', 'Akademis', 'Lumnis', 'Arche', 'Verium', 'Koru'],
  consultoria:  ['Ratio', 'Pragma', 'Synth', 'Consilx', 'Praxis', 'Nexum', 'Stratex', 'Axion', 'Kairos', 'Telos', 'Ethos', 'Zenith', 'Verium', 'Koru', 'Saga', 'Novaxis'],
  gastronomia:  ['Saveur', 'Gusto', 'Nosh', 'Culis', 'Gourmo', 'Epicura', 'Gustos', 'Palatum', 'Culinax', 'Ardore', 'Grazia', 'Hana'],
  construcao:   ['Solida', 'Tegula', 'Arcus', 'Solidum', 'Fabrix', 'Structa', 'Edilix', 'Constrix', 'Firmum', 'Sterk'],
  juridico:     ['Veritas', 'Iuris', 'Legis', 'Actio', 'Fidelis', 'Lexum', 'Iustum', 'Advocatum', 'Temis', 'Ethos', 'Fides'],
  financeiro:   ['Aurum', 'Finium', 'Creditum', 'Fides', 'Lucrum', 'Pecunia', 'Capitum', 'Dividum', 'Zenith', 'Quantum', 'Valore'],
  moda:         ['Veste', 'Forma', 'Elega', 'Modus', 'Stylix', 'Coutu', 'Vestis', 'Modix', 'Coutura', 'Grazia', 'Epicura', 'Hana', 'Ardore'],
  imobiliaria:  ['Domis', 'Habitum', 'Locus', 'Fundis', 'Proprio', 'Vivenda', 'Domus', 'Realtix', 'Arcus', 'Firmum'],
  logistica:    ['Transix', 'Cursus', 'Rotum', 'Carrix', 'Velox', 'Transitum', 'Logistis', 'Nexor', 'Kaze', 'Veloce', 'Nord'],
  marketing:    ['Brandix', 'Imagix', 'Createm', 'Visix', 'Promotum', 'Publicis', 'Mediarum', 'Kairos', 'Saga', 'Nexlux', 'Kodo', 'Miru', 'Novaxis'],
};

// Sufixos neutros para combinar com sílabas dos sócios
const SUFIXOS_NEUTROS = ['is', 'us', 'ax', 'os', 'ix', 'um', 'ex', 'or'];

/**
 * Gera pool dinâmico de nomes baseado nos dados dos sócios e ramo de atividade.
 */
function gerarPoolDinamico(
  nomeSocioPrincipal: string,
  nomeSocio2: string | undefined,
  ramoAtividade: string | undefined,
  descricaoNegocio: string | undefined
): string[] {
  const pool: string[] = [];

  // 1. Derivados dos sócios — sílabas dos sobrenomes
  const extrairFragmentos = (nome: string): string[] => {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    const sobrenomes = partes.length > 1 ? partes.slice(1) : partes;
    const frags: string[] = [];
    for (const sob of sobrenomes) {
      const s = sob.replace(/[^a-zA-ZÀ-ú]/g, '');
      if (s.length >= 3) frags.push(s.slice(0, 3));
      if (s.length >= 4) frags.push(s.slice(0, 4));
    }
    return frags.map(f => f.charAt(0).toUpperCase() + f.slice(1).toLowerCase());
  };

  const frags1 = extrairFragmentos(nomeSocioPrincipal);
  const frags2 = nomeSocio2 ? extrairFragmentos(nomeSocio2) : [];

  // Sílaba + sufixo neutro
  for (const frag of [...frags1, ...frags2]) {
    for (const suf of SUFIXOS_NEUTROS) {
      const candidato = frag + suf;
      if (candidato.length >= 5 && candidato.length <= 9) pool.push(candidato);
    }
  }

  // Combinação de sílabas dos dois sócios
  for (const f1 of frags1) {
    for (const f2 of frags2) {
      if (f1.toLowerCase() !== f2.toLowerCase()) {
        const combo1 = f1 + f2.toLowerCase();
        const combo2 = f2 + f1.toLowerCase();
        if (combo1.length >= 5 && combo1.length <= 10) pool.push(combo1);
        if (combo2.length >= 5 && combo2.length <= 10) pool.push(combo2);
      }
    }
  }

  // Iniciais dos sobrenomes como prefixo + sufixo de ramo
  const iniciais = nomeSocioPrincipal.trim().split(/\s+/).slice(1)
    .map(s => s[0]?.toUpperCase() ?? '').join('');
  if (iniciais.length >= 2) {
    pool.push(iniciais + 'is', iniciais + 'ax', iniciais + 'us', iniciais + 'Group');
  }

  // 2. Pool específico do ramo
  const ramoNorm = (ramoAtividade ?? '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const ramoKey = Object.keys(POOLS_RAMO).find(k => ramoNorm.includes(k)) ?? '';
  pool.push(...(POOLS_RAMO[ramoKey] ?? []));

  // 3. Pool semântico filtrado (substitui POOL_MULTILINGUE genérico)
  pool.push(...filtrarPoolSemantico(ramoAtividade, descricaoNegocio));

  // Deduplicar, filtrar tamanho mínimo
  return [...new Set(pool.map(n => n.trim()).filter(n => n.length >= 3))];
}

export interface AnaliseNomeEmpresa {
  nomeEmpresa: string;
  expressao: number;
  motivacao: number;
  missao: number;
  impressao: number;
  destinoSocio: number;
  destinoEmpresa: number | null;  // null se não tiver data de fundação
  temBloqueio: boolean;
  bloqueios: Bloqueio[];
  sequenciasNegativas: string[];
  licoesCarmicas: LicaoCarmica[];
  tendenciasOcultas: TendenciaOculta[];
  debitosCarmicos: DebitoCarmicoInfo[];
  compatibilidadeSocio: 'favoravel' | 'neutro' | 'desfavoravel';
  compatibilidadeEmpresa: 'favoravel' | 'neutro' | 'desfavoravel' | null;
  score: number;
  /** Score máximo atingível para este sócio (100 - débitos fixos × 12). */
  scoreTeto: number;
  justificativa: string[];
  origemSugerida?: 'usuario' | 'ia';
  /** Disponibilidade de domínio .com, .com.br e perfil Instagram. */
  disponibilidade?: DisponibilidadeNome | null;
}

export interface ResultadoNomeEmpresa {
  nomeSocioPrincipal: string;
  dataNascimentoSocio: string;
  dataFundacao: string | null;
  destinoSocio: number;
  destinoEmpresa: number | null;
  nomesCandidatos: AnaliseNomeEmpresa[];
  melhorNome: AnaliseNomeEmpresa | null;
  // Sócio 2 (opcional)
  nomeSocio2?: string;
  dataNascimentoSocio2?: string;
  destinoSocio2?: number;
}

/**
 * Analisa um nome candidato para empresa.
 * Usa a data de fundação para os triângulos (ou data do sócio se não houver).
 */
export function analisarNomeEmpresa(
  nomeEmpresa: string,
  dataNascimentoSocio: string,
  dataFundacao: string | null
): AnaliseNomeEmpresa {
  // Para os triângulos, usar data de fundação preferencial, senão data do sócio
  const dataParaTriangulos = dataFundacao ?? dataNascimentoSocio;

  const todos = calcularTodosTriangulos(nomeEmpresa, dataParaTriangulos);
  const bloqueios = detectarBloqueios(todos);
  const sequencias = todasSequenciasNegativas(todos);
  const expressao = calcularExpressao(nomeEmpresa);
  const motivacao = calcularMotivacao(nomeEmpresa);
  const missao = calcularMissao(nomeEmpresa, dataNascimentoSocio);
  const impressao = calcularImpressao(nomeEmpresa);
  const destinoSocio = calcularDestino(dataNascimentoSocio);
  const destinoEmpresa = dataFundacao ? calcularDestino(dataFundacao) : null;
  const licoes = detectarLicoesCarmicas(nomeEmpresa);
  const tendencias = detectarTendenciasOcultas(nomeEmpresa);
  const debitos = calcularDebitosCarmicos(dataNascimentoSocio, destinoSocio, motivacao, expressao);
  const compatibilidadeSocio = avaliarCompatibilidade(expressao, destinoSocio);
  const compatibilidadeEmpresa = destinoEmpresa !== null
    ? avaliarCompatibilidade(expressao, destinoEmpresa)
    : null;

  const debitosFixosCount = debitos.filter(d => d.fixo).length;
  const score = calcularScore({
    bloqueios: bloqueios.length,
    licoesCarmicas: licoes.length,
    tendenciasOcultas: tendencias.length,
    debitosCarmicos: debitos.length,
    debitosCarmicoFixos: debitosFixosCount,
    compatibilidade: compatibilidadeSocio,
    compatibilidadeSecundaria: compatibilidadeEmpresa ?? undefined,
  });
  const scoreTeto = calcularScoreTeto(debitosFixosCount);

  const justificativa: string[] = [];

  if (bloqueios.length === 0) {
    justificativa.push('✓ Sem bloqueios em nenhum dos 4 triângulos');
  } else {
    justificativa.push(`✗ ${bloqueios.length} bloqueio(s): ${bloqueios.map(b => b.codigo).join(', ')}`);
  }

  justificativa.push(`Compatibilidade sócio: ${compatibilidadeSocio} (Destino ${destinoSocio})`);
  if (compatibilidadeEmpresa !== null && destinoEmpresa !== null) {
    justificativa.push(`Compatibilidade empresa: ${compatibilidadeEmpresa} (Destino ${destinoEmpresa})`);
  }
  justificativa.push(`~ Missão empresarial: ${missao} — número de expressão estrutural`);

  if (licoes.length > 0) justificativa.push(`~ ${licoes.length} lição(ões) kármica(s)`);
  if (debitos.length > 0) justificativa.push(`✗ ${debitos.length} débito(s) kármico(s): ${debitos.map(d => d.numero).join(', ')}`);

  const tendencia8 = tendencias.find(t => t.numero === 8);
  if (tendencia8) {
    justificativa.push(`~ Tendência oculta ao excesso do 8 (${tendencia8.frequencia}×) — risco de materialismo excessivo`);
  }

  return {
    nomeEmpresa,
    expressao,
    motivacao,
    missao,
    impressao,
    destinoSocio,
    destinoEmpresa,
    temBloqueio: bloqueios.length > 0,
    bloqueios,
    sequenciasNegativas: sequencias,
    licoesCarmicas: licoes,
    tendenciasOcultas: tendencias,
    debitosCarmicos: debitos,
    compatibilidadeSocio,
    compatibilidadeEmpresa,
    score,
    scoreTeto,
    justificativa,
    origemSugerida: 'usuario' as const,
  };
}

/**
 * Gera sugestões automáticas de nomes de empresa com score >= 80.
 * Usado quando todos os candidatos do usuário ficam abaixo de 80.
 */
function gerarSugestoesEmpresaIA(
  dataNascimentoSocio: string,
  dataFundacao: string | null,
  nomeSocioPrincipal: string,
  nomeSocio2: string | undefined,
  ramoAtividade: string | undefined,
  descricaoNegocio: string | undefined,
  maxSugestoes = 5
): AnaliseNomeEmpresa[] {
  const pool = gerarPoolDinamico(nomeSocioPrincipal, nomeSocio2, ramoAtividade, descricaoNegocio);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const sugestoes: AnaliseNomeEmpresa[] = [];
  const vistos = new Set<string>();

  // 1ª passagem: buscar score >= 80
  for (const nome of shuffled) {
    if (sugestoes.length >= maxSugestoes) break;
    const analise = analisarNomeEmpresa(nome, dataNascimentoSocio, dataFundacao);
    if (!vistos.has(nome.toLowerCase()) && analise.score >= 80) {
      sugestoes.push({ ...analise, origemSugerida: 'ia' });
      vistos.add(nome.toLowerCase());
    }
  }

  // 2ª passagem: se não atingiu o mínimo, pegar os melhores disponíveis
  if (sugestoes.length < 2) {
    const todos = shuffled
      .filter(n => !vistos.has(n.toLowerCase()))
      .map(n => ({ ...analisarNomeEmpresa(n, dataNascimentoSocio, dataFundacao), origemSugerida: 'ia' as const }))
      .sort((a, b) => b.score - a.score);

    for (const analise of todos) {
      if (sugestoes.length >= maxSugestoes) break;
      sugestoes.push(analise);
      vistos.add(analise.nomeEmpresa.toLowerCase());
    }
  }

  return sugestoes.sort((a, b) => b.score - a.score);
}

/**
 * Analisa múltiplos nomes candidatos para empresa e retorna ranqueados.
 * Se o melhor candidato do usuário tiver score < 80, gera sugestões automáticas.
 */
export function analisarNomesEmpresa(
  nomesCandidatos: string[],
  nomeSocioPrincipal: string,
  dataNascimentoSocio: string,
  dataFundacao: string | null,
  nomeSocio2?: string,
  dataNascimentoSocio2?: string,
  ramoAtividade?: string,
  descricaoNegocio?: string
): ResultadoNomeEmpresa {
  const destinoSocio = calcularDestino(dataNascimentoSocio);
  const destinoEmpresa = dataFundacao ? calcularDestino(dataFundacao) : null;
  const destinoSocio2 = dataNascimentoSocio2 ? calcularDestino(dataNascimentoSocio2) : undefined;

  const analises = nomesCandidatos
    .filter(n => n.trim().length >= 2)
    .map(n => analisarNomeEmpresa(n.trim(), dataNascimentoSocio, dataFundacao))
    .sort((a, b) => b.score - a.score);

  const melhorScoreUsuario = analises[0]?.score ?? 0;

  if (melhorScoreUsuario < 80) {
    const jaUsados = new Set(analises.map(a => a.nomeEmpresa.toLowerCase()));
    const sugestoesIA = gerarSugestoesEmpresaIA(
      dataNascimentoSocio, dataFundacao,
      nomeSocioPrincipal, nomeSocio2, ramoAtividade, descricaoNegocio, 5
    ).filter(s => !jaUsados.has(s.nomeEmpresa.toLowerCase()));
    analises.push(...sugestoesIA);
    analises.sort((a, b) => b.score - a.score);
  }

  return {
    nomeSocioPrincipal,
    dataNascimentoSocio,
    dataFundacao,
    destinoSocio,
    destinoEmpresa,
    nomesCandidatos: analises,
    melhorNome: analises[0] ?? null,
    ...(nomeSocio2 ? { nomeSocio2, dataNascimentoSocio2, destinoSocio2 } : {}),
  };
}
