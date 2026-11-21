/**
 * Motor do caminho do bebê no chat (DEV-326).
 *
 * Separado do motor do Nome Social, do nome artístico e do `nome-bebe.ts` antigo: só
 * compartilha o avaliador neutro (`products/shared/avaliar-candidato.ts`).
 *
 * - Nomes dos pais (até 5) entram no ranking com a etiqueta "Seu nome", analisados mesmo
 *   quando não passam nas regras (a pessoa pediu para ver).
 * - Sugestões: zero bloqueio nos 4 triângulos, sem tensão vibracional e nota mínima de 70.
 * - Data prevista: cada nome é calculado em todos os dias da janela; ganha quem fica bom no
 *   maior número de dias ("Bom em X dos Y dias possíveis").
 * - Ordem dos sobrenomes: testa as permutações (até 3 sobrenomes) e usa a melhor.
 */

import {
  avaliarCandidatoLivre,
  candidatoOfertavel,
  type AvaliacaoCandidato,
} from '../shared/avaliar-candidato';
import { gerarJanelaDatas, parseDataPt, JANELA_PADRAO_DIAS } from './janela';
import {
  aderenciaEstilo,
  estilosValidos,
  poolPorSexo,
  type EstiloNome,
  type SexoBebe,
} from './pool';

export type SecaoBebe = 'seus_nomes' | 'sugestao';
export type GrupoBebe = 'menina' | 'menino' | 'neutro' | 'seu';

export interface EntradaNomesBebe {
  /** Sobrenomes do bebê, na ordem informada. */
  sobrenomes: string[];
  /** Data do nascimento (real, marcada ou prevista), dd/mm/aaaa. */
  data: string;
  /** "janela": data prevista, calcula os dias em volta. "exata": data real ou marcada. */
  modoData: 'exata' | 'janela';
  sexo: SexoBebe;
  estilos?: string[];
  /** Nomes que os pais já estão pensando (até 5). */
  nomesPais?: string[];
  evitar?: string[];
  /** Nomes já mostrados (para "Gerar outras opções"). */
  excluir?: string[];
  janelaDias?: number;
  /** Bebê já registrado: só analisa os nomes informados, sem sugerir outros. */
  apenasAnalisar?: boolean;
}

export interface NomeBebeSugerido extends AvaliacaoCandidato {
  secao: SecaoBebe;
  grupo: GrupoBebe;
  primeiroNome: string;
  /** Dias da janela em que o nome é bom (sem bloqueio, sem tensão e nota mínima). */
  diasBons: number;
  diasTotal: number;
  explicacao: string;
}

export interface ResultadoNomesBebe {
  seusNomes: NomeBebeSugerido[];
  sugestoes: NomeBebeSugerido[];
  /** Nomes dos pais ignorados por não serem válidos (texto com números, muito longos). */
  nomesPaisIgnorados: string[];
  semSugestoes: boolean;
  /**
   * Por que não saíram sugestões: `sobrenomes_bloqueiam` quando os sobrenomes escolhidos já formam
   * uma sequência em todos os nomes testados (nenhum primeiro nome resolve); `regras` nos demais casos.
   */
  motivoSemSugestoes: 'sobrenomes_bloqueiam' | 'regras' | 'data_invalida' | null;
  janela: { dias: number; centro: string } | null;
}

/** Fração mínima de dias bons da janela para sugerir um nome. */
export const FRACAO_MINIMA_DIAS_BONS = 0.5;
export const MAX_NOMES_PAIS = 5;
const MAX_SOBRENOMES_PERMUTADOS = 3;

const NOME_VALIDO = /^[A-Za-zÀ-ÖØ-öø-ÿ' ]{2,30}$/;

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function limparNome(bruto: string): string | null {
  const t = String(bruto ?? '').replace(/\s+/g, ' ').trim();
  if (!NOME_VALIDO.test(t)) return null;
  return t.split(' ').map(cap).join(' ');
}

function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Todas as ordens dos sobrenomes (até 3). Com mais, só a ordem informada. */
export function ordensDeSobrenomes(sobrenomes: readonly string[]): string[][] {
  const lista = sobrenomes.map((s) => s.trim()).filter(Boolean);
  if (lista.length <= 1 || lista.length > MAX_SOBRENOMES_PERMUTADOS) return [lista];
  const out: string[][] = [];
  const usa = (rest: string[], atual: string[]) => {
    if (rest.length === 0) {
      out.push(atual);
      return;
    }
    rest.forEach((s, i) => usa([...rest.slice(0, i), ...rest.slice(i + 1)], [...atual, s]));
  };
  usa(lista, []);
  return out;
}

function nomeCompleto(primeiro: string, sobrenomes: readonly string[]): string {
  return [primeiro, ...sobrenomes].filter(Boolean).join(' ');
}

interface MelhorOrdem {
  avaliacao: AvaliacaoCandidato;
  sobrenomes: string[];
}

/** Melhor ordem dos sobrenomes para um primeiro nome na data de referência. */
function melhorOrdem(primeiro: string, ordens: string[][], dataRef: string): MelhorOrdem {
  let melhor: MelhorOrdem | null = null;
  for (const ordem of ordens) {
    const a = avaliarCandidatoLivre(nomeCompleto(primeiro, ordem), dataRef);
    const pontos = (x: AvaliacaoCandidato) => (x.temBloqueio ? -1000 : 0) + x.score;
    if (!melhor || pontos(a) > pontos(melhor.avaliacao)) melhor = { avaliacao: a, sobrenomes: ordem };
  }
  return melhor!;
}

interface EstatisticaJanela {
  diasBons: number;
  diasTotal: number;
  mediaNota: number;
}

function estatisticaJanela(nome: string, datas: readonly string[]): EstatisticaJanela {
  let bons = 0;
  let soma = 0;
  for (const d of datas) {
    const a = avaliarCandidatoLivre(nome, d);
    if (candidatoOfertavel(a)) bons++;
    soma += a.score;
  }
  return { diasBons: bons, diasTotal: datas.length, mediaNota: datas.length > 0 ? soma / datas.length : 0 };
}

function textoDias(diasBons: number, diasTotal: number): string {
  if (diasTotal <= 1) return '';
  if (diasBons === 0) return `Não fica bom em nenhum dos ${diasTotal} dias possíveis para o nascimento.`;
  if (diasBons === diasTotal) return `Bom em todos os ${diasTotal} dias possíveis para o nascimento.`;
  return `Bom em ${diasBons} dos ${diasTotal} dias possíveis para o nascimento.`;
}

/** Quantas sugestões por grupo, conforme o sexo. */
export function quantidadePorGrupo(sexo: SexoBebe): Record<'menina' | 'menino' | 'neutro', number> {
  if (sexo === 'menina') return { menina: 4, menino: 0, neutro: 2 };
  if (sexo === 'menino') return { menina: 0, menino: 4, neutro: 2 };
  return { menina: 3, menino: 3, neutro: 2 };
}

function montar(
  primeiro: string,
  secao: SecaoBebe,
  grupo: GrupoBebe,
  ordem: MelhorOrdem,
  est: EstatisticaJanela,
  extra: string,
): NomeBebeSugerido {
  const dias = textoDias(est.diasBons, est.diasTotal);
  let explicacao = dias;
  if (secao === 'seus_nomes' && !candidatoOfertavel(ordem.avaliacao)) {
    const motivo = ordem.avaliacao.temBloqueio
      ? 'Este nome forma uma sequência que pede atenção no mapa.'
      : 'Este nome tem uma combinação que pede atenção com o mapa do bebê.';
    explicacao = [motivo, dias].filter(Boolean).join(' ');
  }
  if (extra) explicacao = [explicacao, extra].filter(Boolean).join(' ');
  return {
    ...ordem.avaliacao,
    secao,
    grupo,
    primeiroNome: primeiro,
    diasBons: est.diasBons,
    diasTotal: est.diasTotal,
    explicacao,
  };
}

export function gerarNomesBebe(entrada: EntradaNomesBebe): ResultadoNomesBebe {
  const janelaDatas =
    entrada.modoData === 'janela'
      ? gerarJanelaDatas(entrada.data, entrada.janelaDias ?? JANELA_PADRAO_DIAS, entrada.janelaDias ?? JANELA_PADRAO_DIAS)
      : null;
  if (!parseDataPt(entrada.data)) {
    return { seusNomes: [], sugestoes: [], nomesPaisIgnorados: [], semSugestoes: true, motivoSemSugestoes: 'data_invalida', janela: null };
  }
  const datas = janelaDatas?.datas ?? [entrada.data];
  const centro = janelaDatas?.centro ?? entrada.data;
  const ordens = ordensDeSobrenomes(entrada.sobrenomes);
  const excluir = new Set((entrada.excluir ?? []).map((n) => semAcento(n.trim())));
  const evitar = new Set((entrada.evitar ?? []).map((n) => semAcento(n.trim())).filter(Boolean));
  const estilos: EstiloNome[] = estilosValidos(entrada.estilos);

  // 1) Nomes dos pais: sempre analisados.
  const ignorados: string[] = [];
  const seusNomes: NomeBebeSugerido[] = [];
  const vistosPais = new Set<string>();
  for (const bruto of (entrada.nomesPais ?? []).slice(0, MAX_NOMES_PAIS)) {
    const nome = limparNome(bruto);
    if (!nome) {
      if (String(bruto ?? '').trim()) ignorados.push(String(bruto).trim().slice(0, 40));
      continue;
    }
    const chave = semAcento(nome);
    if (vistosPais.has(chave) || excluir.has(chave)) continue;
    vistosPais.add(chave);
    const ordem = melhorOrdem(nome, ordens, centro);
    const est = estatisticaJanela(nomeCompleto(nome, ordem.sobrenomes), datas);
    seusNomes.push(montar(nome, 'seus_nomes', 'seu', ordem, est, ''));
  }

  if (entrada.apenasAnalisar) {
    return { seusNomes, sugestoes: [], nomesPaisIgnorados: ignorados, semSugestoes: false, motivoSemSugestoes: null, janela: null };
  }

  // 2) Sugestões por grupo.
  const quantidades = quantidadePorGrupo(entrada.sexo);
  const pool = poolPorSexo(entrada.sexo).filter((p) => {
    const k = semAcento(p.nome);
    return !excluir.has(k) && !evitar.has(k) && !vistosPais.has(k);
  });

  const sugestoes: NomeBebeSugerido[] = [];
  let testados = 0;
  let testadosComBloqueio = 0;
  for (const grupo of ['menina', 'menino', 'neutro'] as const) {
    const quant = quantidades[grupo];
    if (quant <= 0) continue;
    const doGrupo = pool.filter((p) => p.grupo === grupo);
    // Se houver estilo escolhido e nomes suficientes, só os que combinam; senão, todos.
    const combinam = doGrupo.filter((p) => aderenciaEstilo(p, estilos) > 0);
    const candidatos = estilos.length > 0 && combinam.length >= quant * 2 ? combinam : doGrupo;

    // Fase 1: data de referência, melhor ordem de sobrenomes.
    const fase1 = candidatos
      .map((p) => {
        const ordem = melhorOrdem(p.nome, ordens, centro);
        testados++;
        if (ordem.avaliacao.temBloqueio) testadosComBloqueio++;
        return { p, ordem, pontos: ordem.avaliacao.score + 4 * aderenciaEstilo(p, estilos) };
      })
      .filter((x) => candidatoOfertavel(x.ordem.avaliacao))
      .sort((a, b) => b.pontos - a.pontos || a.p.nome.localeCompare(b.p.nome, 'pt-BR'))
      .slice(0, Math.max(quant * 3, quant));

    // Fase 2: janela inteira (só para os melhores da fase 1).
    const fase2 = fase1
      .map((x) => {
        const est = estatisticaJanela(nomeCompleto(x.p.nome, x.ordem.sobrenomes), datas);
        return { ...x, est };
      })
      .filter((x) => x.est.diasTotal <= 1 || x.est.diasBons / x.est.diasTotal >= FRACAO_MINIMA_DIAS_BONS)
      .sort(
        (a, b) =>
          b.est.diasBons - a.est.diasBons ||
          b.est.mediaNota + 4 * aderenciaEstilo(b.p, estilos) - (a.est.mediaNota + 4 * aderenciaEstilo(a.p, estilos)) ||
          a.p.nome.localeCompare(b.p.nome, 'pt-BR'),
      )
      .slice(0, quant);

    for (const x of fase2) {
      sugestoes.push(montar(x.p.nome, 'sugestao', grupo, x.ordem, x.est, ''));
    }
  }

  return {
    seusNomes,
    sugestoes,
    nomesPaisIgnorados: ignorados,
    semSugestoes: sugestoes.length === 0,
    motivoSemSugestoes:
      sugestoes.length > 0 ? null : testados > 0 && testadosComBloqueio === testados ? 'sobrenomes_bloqueiam' : 'regras',
    janela: janelaDatas ? { dias: janelaDatas.datas.length, centro: janelaDatas.centro } : null,
  };
}

/**
 * Bebê já registrado: leitura do nome completo escolhido, sem sugerir outros nomes.
 * Devolve `null` quando o texto não é um nome válido ou a data é inválida.
 */
export function analisarNomeRegistradoBebe(nomeCompletoRegistrado: string, dataPt: string): NomeBebeSugerido | null {
  const partes = String(nomeCompletoRegistrado ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' ]{2,80}$/.test(partes) || !parseDataPt(dataPt)) return null;
  const nome = partes.split(' ').map(cap).join(' ');
  const avaliacao = avaliarCandidatoLivre(nome, dataPt);
  let explicacao = '';
  if (!candidatoOfertavel(avaliacao)) {
    explicacao = avaliacao.temBloqueio
      ? 'Este nome forma uma sequência que pede atenção no mapa do bebê.'
      : 'Este nome tem uma combinação que pede atenção com o mapa do bebê.';
  }
  return {
    ...avaliacao,
    secao: 'seus_nomes',
    grupo: 'seu',
    primeiroNome: nome.split(' ')[0]!,
    diasBons: candidatoOfertavel(avaliacao) ? 1 : 0,
    diasTotal: 1,
    explicacao,
  };
}
