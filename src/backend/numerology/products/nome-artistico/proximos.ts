/**
 * Nomes artísticos próximos do nome de nascimento (DEV-321).
 *
 * Diferente do motor do Nome Social (que ajusta acentos e sobrenomes do nome completo),
 * aqui o nome vira nome de palco: prenome isolado, sobrenome como nome, apelido,
 * combinações curtas e grafia artística (dobrar consoante, y, k, th, w). Acento novo
 * fica por último, só como reserva.
 */

export type TecnicaProxima =
  | 'prenome'
  | 'sobrenome'
  | 'prenome_sobrenome'
  | 'apelido'
  | 'apelido_sobrenome'
  | 'grafia'
  | 'acento';

export interface CandidatoProximo {
  nome: string;
  tecnica: TecnicaProxima;
  /** Chave da forma de origem, para não mostrar três variações do mesmo nome. */
  base: string;
}

const PARTICULAS = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
const VOGAIS = 'aeiouáéíóúâêôãõà';

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function separarNome(nomeCompleto: string): string[] {
  return nomeCompleto
    .trim()
    .split(/\s+/)
    .filter((p) => p && !PARTICULAS.has(semAcento(p).toLowerCase()))
    .map(cap);
}

/** Apelidos curtos a partir do prenome: "Larissa" vira "Lari" e "Lary"; "Guilherme" vira "Gui". */
export function apelidosDe(prenome: string): string[] {
  const p = semAcento(prenome).toLowerCase();
  const out = new Set<string>();
  for (const n of [3, 4]) {
    if (p.length <= n + 1) continue;
    const corte = p.slice(0, n);
    const ultima = corte.charAt(corte.length - 1);
    if (!/[aeiou]/.test(corte)) continue;
    // Só corta em vogal: "Lari" e "Gui" soam como apelido; "Lar" e "Guil", não.
    if (VOGAIS.includes(ultima)) {
      out.add(cap(corte));
      if (ultima === 'i') out.add(cap(`${corte.slice(0, -1)}y`));
    }
  }
  return [...out].filter((a) => a.length >= 3);
}

/** Grafias artísticas de uma palavra (sem mudar o som principal). */
export function grafiasArtisticas(palavra: string): string[] {
  const w = palavra;
  const lower = w.toLowerCase();
  const out = new Set<string>();
  // Dobrar a primeira consoante simples depois da primeira vogal (Gustavo → Gusttavo).
  const m = /^([^aeiouáéíóúâêôãõ]*[aeiouáéíóúâêôãõ]+[^aeiouáéíóúâêôãõ]?)([bcdfgjklmnpqrstvz])([aeiouáéíóúâêôãõ])/i.exec(w);
  if (m && !/(.)\1/.test(w.slice(m[1]!.length - 1, m[1]!.length + 2))) {
    out.add(`${w.slice(0, m[1]!.length + 1)}${m[2]}${w.slice(m[1]!.length + 1)}`);
  }
  if (/i/.test(lower.slice(1))) out.add(w.charAt(0) + w.slice(1).replace(/i(?!.*i)/, 'y'));
  if (/^c[aou]/i.test(w)) out.add(`K${w.slice(1)}`);
  if (/^t[^h]/i.test(w)) out.add(`Th${w.slice(1)}`);
  if (/^v/i.test(w)) out.add(`W${w.slice(1)}`);
  if (/f/i.test(w)) out.add(w.replace(/f/, 'ph').replace(/^F/, 'Ph'));
  out.delete(w);
  return [...out].map(cap);
}

const ACENTO_AGUDO: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };

/** Um acento agudo na primeira vogal sem acento (reserva, depois das formas naturais). */
export function comAcento(palavra: string): string | null {
  const idx = [...palavra].findIndex((c) => ACENTO_AGUDO[c.toLowerCase()]);
  if (idx < 0) return null;
  const chars = [...palavra];
  const c = chars[idx]!;
  const acentuada = ACENTO_AGUDO[c.toLowerCase()]!;
  chars[idx] = c === c.toUpperCase() ? acentuada.toUpperCase() : acentuada;
  return chars.join('');
}

export interface OpcoesProximos {
  sobrenomesExcluidos?: string[];
  manterPrimeiroNome?: boolean;
  semAcento?: boolean;
}

/**
 * Lista ampla de candidatos próximos (sem avaliar). A avaliação numerológica e o corte
 * ficam em `index.ts`.
 */
export function gerarCandidatosProximos(nomeCompleto: string, opcoes: OpcoesProximos = {}): CandidatoProximo[] {
  const partes = separarNome(nomeCompleto);
  if (partes.length === 0) return [];
  const excluidos = new Set((opcoes.sobrenomesExcluidos ?? []).map((s) => semAcento(s).toLowerCase()));
  const [p1, ...resto] = partes;
  const prenomes = [p1!];
  const sobrenomes = resto.filter((s) => !excluidos.has(semAcento(s).toLowerCase()));
  // Segundo prenome: se o nome tem 3+ partes, a segunda costuma ser prenome (Ana Clara Souza).
  if (partes.length >= 3) prenomes.push(partes[1]!);

  const lista: CandidatoProximo[] = [];
  const add = (nome: string, tecnica: TecnicaProxima, base: string) => {
    const limpo = nome.replace(/\s+/g, ' ').trim();
    if (limpo.length < 3) return;
    lista.push({ nome: limpo, tecnica, base });
  };

  for (const p of prenomes) {
    add(p, 'prenome', p);
    for (const s of sobrenomes) if (s !== p) add(`${p} ${s}`, 'prenome_sobrenome', `${p} ${s}`);
  }
  if (!opcoes.manterPrimeiroNome) {
    for (const s of sobrenomes) if (s.length >= 4) add(s, 'sobrenome', s);
  }
  for (const a of apelidosDe(p1!)) {
    // "Lary" e "Lari" são o mesmo apelido: mesma base, para não ocupar dois lugares.
    const base = `apelido:${semAcento(a).toLowerCase().replace(/y$/, 'i')}`;
    add(a, 'apelido', base);
    for (const s of sobrenomes) add(`${a} ${s}`, 'apelido_sobrenome', base);
  }

  // Grafia artística das formas acima (na primeira palavra).
  const naturais = [...lista];
  for (const c of naturais) {
    const [primeira, ...demais] = c.nome.split(' ');
    for (const g of grafiasArtisticas(primeira!)) add([g, ...demais].join(' '), 'grafia', c.base);
  }

  // Acento como reserva (nunca em apelido, que perde o jeito de apelido).
  if (!opcoes.semAcento) {
    for (const c of naturais.filter((n) => n.tecnica !== 'apelido' && n.tecnica !== 'apelido_sobrenome')) {
      const [primeira, ...demais] = c.nome.split(' ');
      const ac = comAcento(primeira!);
      if (ac) add([ac, ...demais].join(' '), 'acento', c.base);
    }
  }

  const vistos = new Set<string>();
  const nascimento = semAcento(partes.join(' ')).toLowerCase();
  return lista.filter((c) => {
    const k = c.nome.toLowerCase();
    if (vistos.has(k) || semAcento(k) === nascimento && c.tecnica !== 'acento') return false;
    vistos.add(k);
    return true;
  });
}
