/**
 * Banco de nomes do caminho do bebê no chat (DEV-326).
 *
 * Cada nome tem etiquetas de estilo. Banco próprio deste caminho: o `nome-bebe.ts` antigo e o
 * Nome Social não dependem dele.
 */

export type EstiloNome = 'classico' | 'moderno' | 'curto' | 'biblico' | 'internacional';
export type SexoBebe = 'menina' | 'menino' | 'indefinido';

interface NomeComEstilo {
  nome: string;
  estilos: readonly EstiloNome[];
}

const n = (nome: string, ...estilos: EstiloNome[]): NomeComEstilo => ({ nome, estilos });

const MENINAS: NomeComEstilo[] = [
  n('Alice', 'classico', 'curto'), n('Helena', 'classico'), n('Laura', 'classico'),
  n('Maria', 'classico', 'biblico'), n('Sofia', 'classico', 'internacional'),
  n('Valentina', 'moderno', 'internacional'), n('Manuela', 'classico'), n('Isabella', 'classico', 'internacional'),
  n('Heloísa', 'classico'), n('Luiza', 'classico'), n('Lara', 'curto', 'moderno'), n('Mel', 'curto', 'moderno'),
  n('Lívia', 'classico'), n('Cecília', 'classico'), n('Eloá', 'moderno'), n('Júlia', 'classico'),
  n('Marina', 'classico'), n('Clara', 'classico', 'curto'), n('Beatriz', 'classico'), n('Lorena', 'moderno'),
  n('Antonella', 'internacional', 'moderno'), n('Yasmin', 'internacional'), n('Maitê', 'moderno'),
  n('Aurora', 'classico', 'moderno'), n('Esther', 'biblico'), n('Rebeca', 'biblico'), n('Sara', 'biblico', 'curto'),
  n('Raquel', 'biblico', 'classico'), n('Ana', 'classico', 'curto'), n('Eva', 'biblico', 'curto'),
  n('Lia', 'curto', 'biblico'), n('Bia', 'curto', 'moderno'), n('Luna', 'moderno', 'curto'), n('Nina', 'curto', 'internacional'),
  n('Olívia', 'internacional', 'classico'), n('Emma', 'internacional', 'curto'), n('Mia', 'internacional', 'curto'),
  n('Zoe', 'internacional', 'curto'), n('Gabriela', 'classico', 'biblico'), n('Rafaela', 'classico', 'biblico'),
  n('Isadora', 'classico'), n('Mariana', 'classico'), n('Carolina', 'classico'), n('Camila', 'classico'),
  n('Bianca', 'classico'), n('Alícia', 'moderno'), n('Elisa', 'classico'), n('Ayla', 'moderno', 'internacional'),
  n('Maya', 'internacional', 'curto'), n('Tainá', 'moderno'), n('Léa', 'curto', 'internacional'), n('Noa', 'curto', 'biblico'),
];

const MENINOS: NomeComEstilo[] = [
  n('Miguel', 'classico', 'biblico'), n('Arthur', 'classico', 'internacional'), n('Heitor', 'classico'),
  n('Theo', 'curto', 'moderno'), n('Davi', 'biblico', 'curto'), n('Gabriel', 'biblico', 'classico'),
  n('Bernardo', 'classico'), n('Samuel', 'biblico'), n('João', 'classico', 'curto'), n('Pedro', 'classico', 'biblico'),
  n('Lorenzo', 'internacional', 'moderno'), n('Matheus', 'biblico', 'classico'), n('Lucas', 'biblico', 'classico'),
  n('Benjamin', 'biblico', 'internacional'), n('Nicolas', 'internacional'), n('Guilherme', 'classico'),
  n('Rafael', 'biblico', 'classico'), n('Joaquim', 'classico'), n('Henrique', 'classico'), n('Gustavo', 'classico'),
  n('Murilo', 'classico'), n('Enzo', 'curto', 'moderno'), n('Isaac', 'biblico'), n('Noah', 'internacional', 'biblico', 'curto'),
  n('Ravi', 'curto', 'moderno'), n('Caio', 'curto', 'classico'), n('Léo', 'curto'), n('Igor', 'curto', 'classico'),
  n('Ian', 'curto', 'internacional'), n('Levi', 'biblico', 'curto'), n('Elias', 'biblico'), n('Daniel', 'biblico', 'classico'),
  n('Thomas', 'internacional'), n('Antônio', 'classico'), n('Francisco', 'classico'), n('Otávio', 'classico'),
  n('Vicente', 'classico'), n('Felipe', 'classico', 'biblico'), n('Bento', 'curto', 'classico'), n('Gael', 'curto', 'moderno'),
  n('Ryan', 'internacional', 'curto'), n('Liam', 'internacional', 'curto'), n('Oliver', 'internacional'),
  n('Rodrigo', 'classico'), n('Vitor', 'classico', 'curto'), n('Eduardo', 'classico'), n('Emanuel', 'biblico', 'classico'),
  n('Ítalo', 'moderno'), n('Kauê', 'moderno', 'curto'),
];

const NEUTROS: NomeComEstilo[] = [
  n('Ariel', 'biblico', 'internacional'), n('Alex', 'curto', 'internacional'), n('Sasha', 'curto', 'internacional'),
  n('Kai', 'curto', 'internacional'), n('Sol', 'curto', 'moderno'), n('Noa', 'curto', 'biblico'),
  n('Gael', 'curto', 'moderno'), n('Yuri', 'curto', 'internacional'), n('Dani', 'curto'), n('Lou', 'curto', 'internacional'),
  n('Jordan', 'internacional'), n('Dominique', 'internacional'), n('Eden', 'biblico', 'curto'), n('Maru', 'curto', 'moderno'),
];

const ESTILOS_VALIDOS: ReadonlySet<string> = new Set(['classico', 'moderno', 'curto', 'biblico', 'internacional']);

export function estilosValidos(estilos: readonly string[] | null | undefined): EstiloNome[] {
  return (estilos ?? []).filter((e): e is EstiloNome => ESTILOS_VALIDOS.has(e));
}

/**
 * Pool conforme o sexo. "Ainda não sei" mistura menina, menino e neutros, na mesma proporção,
 * para que as três listas apareçam.
 */
export function poolPorSexo(sexo: SexoBebe): Array<NomeComEstilo & { grupo: 'menina' | 'menino' | 'neutro' }> {
  const com = (lista: NomeComEstilo[], grupo: 'menina' | 'menino' | 'neutro') => lista.map((x) => ({ ...x, grupo }));
  if (sexo === 'menina') return [...com(MENINAS, 'menina'), ...com(NEUTROS, 'neutro')];
  if (sexo === 'menino') return [...com(MENINOS, 'menino'), ...com(NEUTROS, 'neutro')];
  return [...com(MENINAS, 'menina'), ...com(MENINOS, 'menino'), ...com(NEUTROS, 'neutro')];
}

/** Quantos estilos escolhidos o nome atende (para desempate e para o filtro). */
export function aderenciaEstilo(nome: { estilos: readonly EstiloNome[] }, escolhidos: readonly EstiloNome[]): number {
  if (escolhidos.length === 0) return 0;
  return nome.estilos.filter((e) => escolhidos.includes(e)).length;
}
