/**
 * Motor do nome artístico (DEV-321).
 *
 * Separado do motor do Nome Social (`products/nome-social.ts`) e do bebê
 * (`products/nome-bebe.ts`): só compartilha o avaliador neutro
 * (`products/shared/avaliar-candidato.ts`) e o núcleo numerológico.
 *
 * Entrega até 3 nomes próximos do nascimento e até 3 totalmente novos, conforme o
 * tipo de nome aceito. Todo nome sugerido tem zero bloqueio nos 4 triângulos, sem
 * tensão vibracional com o Destino e nota mínima de 70. A afinidade número × área
 * só desempata.
 */

import {
  avaliarCandidatoLivre,
  candidatoOfertavel,
  NOTA_MINIMA_NOME_NOVO,
  type AvaliacaoCandidato,
} from '../shared/avaliar-candidato';
import { afinidadeExpressaoArea, explicarAfinidade } from './afinidade-area';
import { gerarCandidatosProximos, separarNome, type TecnicaProxima } from './proximos';
import { filtrarIdeiasNovas, gerarCandidatosNovosDeterministicos } from './novos';
import { labelAreaArtistica } from '../../../../shared/interactive-engine/ramos/artistico';

export type SecaoArtistica = 'proximo' | 'novo';

export interface PerfilArtisticoMotor {
  areaArtistica?: string | null;
  areaArtisticaOutro?: string | null;
  generoPersona?: string | null;
  imagemArtistica?: string[];
  tipoNomeArtistico?: string | null;
  sobrenomesExcluidos?: string[];
  manterPrimeiroNome?: boolean;
  semAcento?: boolean;
}

export interface NomeArtisticoSugerido extends AvaliacaoCandidato {
  secao: SecaoArtistica;
  tecnica: TecnicaProxima | 'ia' | 'banco';
  afinidade: number;
  explicacao: string;
}

export interface ResultadoNomesArtisticos {
  proximos: NomeArtisticoSugerido[];
  novos: NomeArtisticoSugerido[];
  /** O perfil pediu nomes novos, mas nenhum passou nas regras. */
  semNovos: boolean;
  /** O perfil pediu nomes próximos, mas nenhum passou nas regras. */
  semProximos: boolean;
}

export interface EntradaNomesArtisticos {
  nomeNascimento: string;
  dataNascimento: string;
  perfil: PerfilArtisticoMotor;
  /** Ideias da IA para nomes novos (já vindas pelo LoopGuard). */
  ideiasIA?: string[];
  /** Nomes já mostrados no chat (para "Gerar outras opções"). */
  excluir?: string[];
  quantidade?: number;
}

/** Penalidade de naturalidade: acento novo só como reserva. */
const AJUSTE_TECNICA: Record<NomeArtisticoSugerido['tecnica'], number> = {
  prenome: 4,
  sobrenome: 3,
  prenome_sobrenome: 2,
  apelido: 4,
  apelido_sobrenome: 2,
  grafia: 1,
  acento: -8,
  ia: 3,
  banco: 0,
};

function pontuar(s: NomeArtisticoSugerido): number {
  return s.score + 15 * s.afinidade + AJUSTE_TECNICA[s.tecnica];
}

function rotuloArea(perfil: PerfilArtisticoMotor): string {
  if (perfil.areaArtistica === 'outra' && perfil.areaArtisticaOutro?.trim()) return perfil.areaArtisticaOutro.trim();
  return (labelAreaArtistica(perfil.areaArtistica) ?? 'artista').toLowerCase();
}

function avaliar(
  nome: string,
  dataNascimento: string,
  perfil: PerfilArtisticoMotor,
  secao: SecaoArtistica,
  tecnica: NomeArtisticoSugerido['tecnica'],
): NomeArtisticoSugerido {
  const a = avaliarCandidatoLivre(nome, dataNascimento);
  return {
    ...a,
    secao,
    tecnica,
    afinidade: afinidadeExpressaoArea(a.expressao, perfil.areaArtistica),
    explicacao: explicarAfinidade(a.expressao, perfil.areaArtistica, rotuloArea(perfil)),
  };
}

function segundaPalavra(s: NomeArtisticoSugerido): string | null {
  return s.nomeCompleto.split(' ')[1]?.toLowerCase() ?? null;
}

/** Escolhe os melhores sem repetir a mesma forma de origem nem a mesma segunda palavra. */
function escolher<T extends NomeArtisticoSugerido>(
  lista: T[],
  quantidade: number,
  chave: (s: T) => string,
  /** Nomes novos: do mais próximo de 100 para baixo (a afinidade e a técnica só desempatam). */
  porNota = false,
): T[] {
  const ordenada = [...lista].sort((x, y) =>
    (porNota ? y.score - x.score : 0) ||
    pontuar(y) - pontuar(x) ||
    x.nomeCompleto.localeCompare(y.nomeCompleto, 'pt-BR'));
  const usadas = new Set<string>();
  const segundas = new Set<string>();
  const escolhidos: T[] = [];
  for (const s of ordenada) {
    if (escolhidos.length >= quantidade) break;
    const k = chave(s);
    const seg = segundaPalavra(s);
    if (usadas.has(k) || (seg && segundas.has(seg))) continue;
    usadas.add(k);
    if (seg) segundas.add(seg);
    escolhidos.push(s);
  }
  for (const s of ordenada) {
    if (escolhidos.length >= quantidade) break;
    if (!escolhidos.includes(s)) escolhidos.push(s);
  }
  return escolhidos;
}

export function querProximos(tipo: string | null | undefined): boolean {
  return tipo !== 'diferente';
}

export function querNovos(tipo: string | null | undefined): boolean {
  return tipo === 'diferente' || tipo === 'ambos';
}

export function gerarNomesArtisticos(entrada: EntradaNomesArtisticos): ResultadoNomesArtisticos {
  const { nomeNascimento, dataNascimento, perfil } = entrada;
  const quantidade = entrada.quantidade ?? 3;
  const excluir = new Set((entrada.excluir ?? []).map((n) => n.trim().toLowerCase()));
  const livre = (nome: string) => !excluir.has(nome.trim().toLowerCase());

  let proximos: NomeArtisticoSugerido[] = [];
  if (querProximos(perfil.tipoNomeArtistico)) {
    const candidatos = gerarCandidatosProximos(nomeNascimento, {
      sobrenomesExcluidos: perfil.sobrenomesExcluidos,
      manterPrimeiroNome: perfil.manterPrimeiroNome,
      semAcento: perfil.semAcento,
    }).filter((c) => livre(c.nome));
    const bases = new Map(candidatos.map((c) => [c.nome.toLowerCase(), c.base]));
    const validos = candidatos
      .map((c) => avaliar(c.nome, dataNascimento, perfil, 'proximo', c.tecnica))
      .filter((s) => candidatoOfertavel(s));
    const chaveBase = (s: NomeArtisticoSugerido) => bases.get(s.nomeCompleto.toLowerCase()) ?? s.nomeCompleto;
    // Acento novo só entra se as formas naturais não completarem a lista.
    proximos = escolher(validos.filter((s) => s.tecnica !== 'acento'), quantidade, chaveBase);
    if (proximos.length < quantidade) {
      const usadas = new Set(proximos.map(chaveBase));
      proximos = [
        ...proximos,
        ...escolher(
          validos.filter((s) => s.tecnica === 'acento' && !usadas.has(chaveBase(s))),
          quantidade - proximos.length,
          chaveBase,
        ),
      ];
    }
  }

  let novos: NomeArtisticoSugerido[] = [];
  if (querNovos(perfil.tipoNomeArtistico)) {
    const partes = separarNome(nomeNascimento);
    const ideias = filtrarIdeiasNovas(entrada.ideiasIA ?? [], partes).filter(livre);
    const daIA = ideias
      .map((n) => avaliar(n, dataNascimento, perfil, 'novo', 'ia'))
      .filter((s) => candidatoOfertavel(s, NOTA_MINIMA_NOME_NOVO));
    novos = escolher(daIA, quantidade, (s) => s.nomeCompleto.split(' ')[0]!.toLowerCase(), true);
    if (novos.length < quantidade) {
      const jaTem = new Set(novos.map((s) => s.nomeCompleto.toLowerCase()));
      const banco = filtrarIdeiasNovas(
        gerarCandidatosNovosDeterministicos({
          generoPersona: perfil.generoPersona,
          imagemArtistica: perfil.imagemArtistica,
        }),
        partes,
      )
        .filter((n) => livre(n) && !jaTem.has(n.toLowerCase()))
        .map((n) => avaliar(n, dataNascimento, perfil, 'novo', 'banco'))
        .filter((s) => candidatoOfertavel(s, NOTA_MINIMA_NOME_NOVO));
      const usados = new Set(novos.map((s) => s.nomeCompleto.split(' ')[0]!.toLowerCase()));
      const complemento = escolher(
        banco.filter((s) => !usados.has(s.nomeCompleto.split(' ')[0]!.toLowerCase())),
        quantidade - novos.length,
        (s) => s.nomeCompleto.split(' ')[0]!.toLowerCase(),
        true,
      );
      // Do mais próximo de 100 para baixo, também depois de juntar as ideias da IA com o banco.
      novos = [...novos, ...complemento].sort((a, b) => b.score - a.score || a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR'));
    }
  }

  return {
    proximos,
    novos,
    semProximos: querProximos(perfil.tipoNomeArtistico) && proximos.length === 0,
    semNovos: querNovos(perfil.tipoNomeArtistico) && novos.length === 0,
  };
}
