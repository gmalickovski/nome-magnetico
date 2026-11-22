/**
 * Nomes artísticos totalmente novos (DEV-321).
 *
 * Fonte principal: ideias da IA (`brain.generateArtisticNameIdeas`), validadas aqui.
 * Reserva determinística: banco de nomes de palco curtos por tom (feminino, masculino,
 * neutro) e palavras de sobrenome artístico. Nenhum nome sai daqui sem passar pelo
 * cálculo numerológico em `index.ts`.
 */

const FEMININOS = [
  'Aurora', 'Lumi', 'Kaya', 'Nara', 'Íris', 'Maya', 'Nina', 'Lia', 'Mel', 'Bela',
  'Liz', 'Duda', 'Yara', 'Ayla', 'Zara', 'Lana', 'Mia', 'Ravena', 'Selena', 'Valentina',
  'Celeste', 'Jade', 'Bia', 'Lola', 'Tainá', 'Kira', 'Elis', 'Malu', 'Nalu', 'Sereia',
];

const MASCULINOS = [
  'Theo', 'Kai', 'Zion', 'Enzo', 'Raí', 'Dante', 'Caio', 'Bento', 'Iago', 'Ravi',
  'Davi', 'Noah', 'Thor', 'Leon', 'Lucca', 'Rico', 'Téo', 'Joca', 'Duca', 'Vini',
  'Tom', 'Zeca', 'Nico', 'Gael', 'Otto', 'Bruno', 'Tito', 'Juca', 'Igor', 'Ian',
];

const NEUTROS = [
  'Sol', 'Lua', 'Céu', 'Rio', 'Mar', 'Íon', 'Kim', 'Ariel', 'Sasha', 'Ônix',
  'Jules', 'Nox', 'Alex', 'Lumen', 'Zen', 'Indie', 'Eco', 'Luz', 'Vega', 'Orion',
  'Nuvem', 'Brisa', 'Cristal', 'Neon', 'Safira', 'Jazz', 'Blue', 'Raio', 'Tao', 'Kalu',
];

/** Palavras que funcionam como sobrenome de palco, por imagem desejada. */
const SEGUNDAS_POR_IMAGEM: Record<string, string[]> = {
  marcante: ['Fogo', 'Raio', 'Black', 'Rubi', 'Trovão', 'Star'],
  sofisticada: ['Valle', 'Monteiro', 'Lírio', 'Diamante', 'Prado', 'Belle'],
  divertida: ['Doce', 'Sorriso', 'Festa', 'Cor', 'Arco-Íris', 'Bossa'],
  misteriosa: ['Noir', 'Lunar', 'Sombra', 'Eclipse', 'Nyx', 'Vênus'],
  popular: ['Brasil', 'Rios', 'Santos', 'Luz', 'Alegria', 'Sol'],
};
const SEGUNDAS_PADRAO = ['Luz', 'Vale', 'Rios', 'Mar', 'Prado', 'Star'];

export interface OpcoesNovos {
  generoPersona?: string | null;
  imagemArtistica?: string[];
}

/** Banco determinístico de candidatos novos (sem avaliar). */
export function gerarCandidatosNovosDeterministicos(opcoes: OpcoesNovos = {}): string[] {
  const base =
    opcoes.generoPersona === 'feminino'
      ? [...FEMININOS, ...NEUTROS]
      : opcoes.generoPersona === 'masculino'
        ? [...MASCULINOS, ...NEUTROS]
        : [...NEUTROS, ...FEMININOS.slice(0, 10), ...MASCULINOS.slice(0, 10)];
  const segundas = [
    ...new Set((opcoes.imagemArtistica ?? []).flatMap((i) => SEGUNDAS_POR_IMAGEM[i] ?? [])),
  ];
  const usarSegundas = segundas.length > 0 ? segundas : SEGUNDAS_PADRAO;
  const out: string[] = [...base];
  for (const n of base) for (const s of usarSegundas) out.push(`${n} ${s}`);
  return [...new Set(out)];
}

const NOME_VALIDO = /^[A-Za-zÀ-ÖØ-öø-ÿ' ]{2,30}$/;

/**
 * Limpa as ideias da IA: só letras, até 3 palavras, sem repetir e sem usar partes do
 * nome de nascimento (senão não é "totalmente diferente").
 */
export function filtrarIdeiasNovas(ideias: readonly string[], partesNascimento: readonly string[]): string[] {
  const proibidas = new Set(
    partesNascimento.map((p) => p.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase())
  );
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const bruto of ideias) {
    const nome = String(bruto ?? '').replace(/\s+/g, ' ').trim();
    if (!NOME_VALIDO.test(nome)) continue;
    const palavras = nome.split(' ');
    if (palavras.length > 3) continue;
    const usaNascimento = palavras.some((p) =>
      proibidas.has(p.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase())
    );
    if (usaNascimento) continue;
    const chave = nome.toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    out.push(palavras.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '));
  }
  return out;
}
