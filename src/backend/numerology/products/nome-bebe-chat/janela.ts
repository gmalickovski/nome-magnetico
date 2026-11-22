/**
 * Janela de datas do nascimento (DEV-326).
 *
 * Quando o bebê ainda não nasceu e só há a data prevista, o Destino, os triângulos Pessoal,
 * Social e do Destino e as dívidas cármicas mudam a cada dia. Por isso cada nome é calculado
 * para todos os dias da janela em volta da data prevista.
 */

export const JANELA_PADRAO_DIAS = 14;
export const JANELA_MAXIMA_DIAS = 21;

export interface JanelaDatas {
  /** Datas em dd/mm/aaaa, em ordem, incluindo a data prevista. */
  datas: string[];
  /** Data prevista (centro). */
  centro: string;
}

const DATA_PT = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function parseDataPt(dataPt: string): Date | null {
  const m = DATA_PT.exec(dataPt.trim());
  if (!m) return null;
  const [d, mo, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(a, mo - 1, d));
  // Rejeita 31/02 e afins (o Date "rola" para o mês seguinte).
  if (dt.getUTCFullYear() !== a || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

export function formatDataPt(dt: Date): string {
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${dt.getUTCFullYear()}`;
}

/**
 * Datas de `diasAntes` antes até `diasDepois` depois da data prevista. A janela é limitada
 * a `JANELA_MAXIMA_DIAS` para cada lado. Data inválida devolve `null`.
 */
export function gerarJanelaDatas(
  dataPrevistaPt: string,
  diasAntes = JANELA_PADRAO_DIAS,
  diasDepois = JANELA_PADRAO_DIAS,
): JanelaDatas | null {
  const centro = parseDataPt(dataPrevistaPt);
  if (!centro) return null;
  const antes = Math.min(Math.max(0, Math.trunc(diasAntes)), JANELA_MAXIMA_DIAS);
  const depois = Math.min(Math.max(0, Math.trunc(diasDepois)), JANELA_MAXIMA_DIAS);
  const datas: string[] = [];
  for (let delta = -antes; delta <= depois; delta++) {
    datas.push(formatDataPt(new Date(centro.getTime() + delta * 86_400_000)));
  }
  return { datas, centro: formatDataPt(centro) };
}
