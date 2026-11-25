/**
 * DEV-302 — Afinidades entre o perfil da entrevista e os números do nome.
 *
 * As respostas "como você quer ser percebido", "o que pede atenção agora" e o subfoco
 * apontam números preferidos de Expressão, Motivação e Impressão. A aderência só
 * DESEMPATA entre sugestões que já passaram em R1/R2 (zero bloqueio, nota mínima):
 * não muda nota, não cria candidato e não esconde a sugestão de maior nota.
 */

export interface AfinidadesPerfil {
  /** Ids de `estilo_presenca` (até 2). */
  estilo?: string[];
  /** Id de `area_foco`. */
  area?: string | null;
  /** Ids de subfoco, em ordem de toque (até 2). */
  subfocos?: string[];
}

export interface NumerosDoNome {
  expressao: number;
  motivacao: number;
  impressao: number;
}

export type OrigemAfinidade = 'area' | 'estilo' | 'subfoco';
export type DimensaoNumerica = 'Expressão' | 'Motivação' | 'Impressão';

export interface AfinidadeAtendida {
  origem: OrigemAfinidade;
  ref: string;
  dimensao: DimensaoNumerica;
  numero: number;
}

/** Foco que mais pede atenção agora (peso alto). */
export const AFINIDADE_AREA: Readonly<Record<string, readonly number[]>> = Object.freeze({
  prosperidade_financeira: [8, 4],
  carreira_negocios: [1, 8, 22],
  relacionamentos_harmonia: [2, 6],
  autoestima_expressao: [3, 5, 1],
});

/** Como a pessoa quer ser percebida (peso alto). */
export const AFINIDADE_ESTILO: Readonly<Record<string, readonly number[]>> = Object.freeze({
  firme_confiavel: [4, 8],
  leve_acolhimento: [2, 6],
  criatividade: [3, 5],
  elegancia_discreta: [7, 6],
});

/** Subfoco dentro da área (peso menor). */
export const AFINIDADE_SUBFOCO: Readonly<Record<string, readonly number[]>> = Object.freeze({
  reter_ganhos: [4, 8],
  aumentar_renda: [8, 1],
  organizar_estabilidade: [4],
  fechar_contratos: [4, 22],
  lideranca_promocao: [1, 8],
  novo_ciclo_profissional: [5, 1],
  foco_execucao: [4, 1],
  harmonia_afetiva: [2, 6],
  paz_familiar: [6],
  novas_conexoes: [3, 5],
  voz_seguranca: [3, 1],
  autoconfianca_identidade: [1, 3],
});

const PESO_ORIGEM: Readonly<Record<OrigemAfinidade, number>> = Object.freeze({
  area: 0.4,
  estilo: 0.4,
  subfoco: 0.2,
});

const PESO_DIMENSAO: ReadonlyArray<{ chave: keyof NumerosDoNome; rotulo: DimensaoNumerica; peso: number }> = [
  { chave: 'expressao', rotulo: 'Expressão', peso: 0.5 },
  { chave: 'motivacao', rotulo: 'Motivação', peso: 0.3 },
  { chave: 'impressao', rotulo: 'Impressão', peso: 0.2 },
];

/** Rótulos para o texto "por que este nome para você". */
const ROTULO_AREA: Readonly<Record<string, string>> = Object.freeze({
  prosperidade_financeira: 'o seu foco em dinheiro e prosperidade',
  carreira_negocios: 'o seu foco em carreira e negócios',
  relacionamentos_harmonia: 'o seu foco em relacionamentos',
  autoestima_expressao: 'o seu foco em autoestima e expressão',
});

const ROTULO_ESTILO: Readonly<Record<string, string>> = Object.freeze({
  firme_confiavel: 'a presença firme e confiável que você quer passar',
  leve_acolhimento: 'a leveza e o acolhimento que você quer passar',
  criatividade: 'a criatividade marcante que você quer passar',
  elegancia_discreta: 'a elegância discreta que você quer passar',
});

const ROTULO_SUBFOCO: Readonly<Record<string, string>> = Object.freeze({
  reter_ganhos: 'o desejo de fazer o dinheiro render',
  aumentar_renda: 'o desejo de ganhar mais',
  organizar_estabilidade: 'o desejo de organizar a estabilidade',
  fechar_contratos: 'o momento de fechar contratos',
  lideranca_promocao: 'a busca por reconhecimento',
  novo_ciclo_profissional: 'o momento de um novo ciclo profissional',
  foco_execucao: 'o foco em executar onde você está',
  harmonia_afetiva: 'o foco em harmonia afetiva',
  paz_familiar: 'o foco em paz na família',
  novas_conexoes: 'o desejo de novas conexões',
  voz_seguranca: 'o desejo de falar com segurança',
  autoconfianca_identidade: 'o desejo de mais confiança na sua identidade',
});

function listaDe(origem: OrigemAfinidade, ref: string): readonly number[] | undefined {
  if (origem === 'area') return AFINIDADE_AREA[ref];
  if (origem === 'estilo') return AFINIDADE_ESTILO[ref];
  return AFINIDADE_SUBFOCO[ref];
}

function rotuloDe(origem: OrigemAfinidade, ref: string): string | undefined {
  if (origem === 'area') return ROTULO_AREA[ref];
  if (origem === 'estilo') return ROTULO_ESTILO[ref];
  return ROTULO_SUBFOCO[ref];
}

/** 1 = número igual ao preferido; 0,75 = mestre ligado à raiz (11→2, 22→4); 0 = sem relação. */
function grauDeCasamento(numero: number, preferidos: readonly number[]): number {
  if (preferidos.includes(numero)) return 1;
  if (numero === 11 && preferidos.includes(2)) return 0.75;
  if (numero === 22 && preferidos.includes(4)) return 0.75;
  return 0;
}

function referenciasDe(afinidades: AfinidadesPerfil): Array<{ origem: OrigemAfinidade; refs: string[] }> {
  const grupos: Array<{ origem: OrigemAfinidade; refs: string[] }> = [];
  if (afinidades.area && AFINIDADE_AREA[afinidades.area]) {
    grupos.push({ origem: 'area', refs: [afinidades.area] });
  }
  const estilos = (afinidades.estilo ?? []).filter((id) => AFINIDADE_ESTILO[id]);
  if (estilos.length > 0) grupos.push({ origem: 'estilo', refs: estilos.slice(0, 2) });
  const subfocos = (afinidades.subfocos ?? []).filter((id) => AFINIDADE_SUBFOCO[id]);
  if (subfocos.length > 0) grupos.push({ origem: 'subfoco', refs: subfocos.slice(0, 2) });
  return grupos;
}

export function temAfinidades(afinidades?: AfinidadesPerfil | null): boolean {
  return Boolean(afinidades) && referenciasDe(afinidades!).length > 0;
}

/** Quanto do grupo (área, estilo ou subfoco) o nome atende: o melhor casamento entre as respostas. */
function aderenciaDoGrupo(numeros: NumerosDoNome, origem: OrigemAfinidade, refs: string[]): number {
  let melhor = 0;
  for (const ref of refs) {
    const preferidos = listaDe(origem, ref);
    if (!preferidos) continue;
    let soma = 0;
    for (const { chave, peso } of PESO_DIMENSAO) {
      soma += peso * grauDeCasamento(numeros[chave], preferidos);
    }
    if (soma > melhor) melhor = soma;
  }
  return melhor;
}

/**
 * Aderência do nome ao perfil, de 0 a 1. Sem afinidades informadas, 0.
 * Só mede coincidência de números; não altera a nota do nome.
 */
export function pontuarAderenciaPerfil(
  numeros: NumerosDoNome,
  afinidades?: AfinidadesPerfil | null,
): number {
  if (!afinidades) return 0;
  const grupos = referenciasDe(afinidades);
  if (grupos.length === 0) return 0;

  let total = 0;
  let pesoTotal = 0;
  for (const { origem, refs } of grupos) {
    total += PESO_ORIGEM[origem] * aderenciaDoGrupo(numeros, origem, refs);
    pesoTotal += PESO_ORIGEM[origem];
  }
  return pesoTotal > 0 ? total / pesoTotal : 0;
}

/** Afinidades realmente atendidas (casamento exato), na ordem área, estilo, subfoco. */
export function listarAfinidadesAtendidas(
  numeros: NumerosDoNome,
  afinidades?: AfinidadesPerfil | null,
): AfinidadeAtendida[] {
  if (!afinidades) return [];
  const atendidas: AfinidadeAtendida[] = [];
  for (const { origem, refs } of referenciasDe(afinidades)) {
    for (const ref of refs) {
      const preferidos = listaDe(origem, ref);
      if (!preferidos) continue;
      for (const { chave, rotulo } of PESO_DIMENSAO) {
        const numero = numeros[chave];
        if (preferidos.includes(numero)) {
          atendidas.push({ origem, ref, dimensao: rotulo, numero });
          break;
        }
      }
    }
  }
  return atendidas;
}

/**
 * Texto "por que este nome para você". Cita no máximo 2 afinidades, só as realmente
 * atendidas; sem nenhuma, devolve `undefined` (nada é inventado).
 */
export function explicarAderenciaPerfil(
  numeros: NumerosDoNome,
  afinidades?: AfinidadesPerfil | null,
): string | undefined {
  const atendidas = listarAfinidadesAtendidas(numeros, afinidades).slice(0, 2);
  const itens = atendidas
    .map((a) => ({ a, rotulo: rotuloDe(a.origem, a.ref) }))
    .filter((i): i is { a: AfinidadeAtendida; rotulo: string } => Boolean(i.rotulo));
  if (itens.length === 0) return undefined;

  const [primeiro, segundo] = itens;
  if (!segundo) return `${primeiro!.a.dimensao} ${primeiro!.a.numero} combina com ${primeiro!.rotulo}.`;

  // Mesmo número atendendo duas respostas: uma frase só, sem repetir o número.
  if (primeiro!.a.dimensao === segundo.a.dimensao && primeiro!.a.numero === segundo.a.numero) {
    return `${primeiro!.a.dimensao} ${primeiro!.a.numero} combina com ${primeiro!.rotulo} e com ${segundo.rotulo}.`;
  }
  return (
    `${primeiro!.a.dimensao} ${primeiro!.a.numero} combina com ${primeiro!.rotulo}; ` +
    `${segundo.a.dimensao} ${segundo.a.numero} combina com ${segundo.rotulo}.`
  );
}
