export function truncateDisplayName(name: string, maxLen = 24): string {
  const t = name.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

export function scoreBucket(score: number | undefined | null): string {
  const s = score ?? 0;
  if (s >= 90) return '90_100';
  if (s >= 70) return '70_89';
  if (s >= 40) return '40_69';
  if (s >= 20) return '20_39';
  return '0_19';
}

export function buildNomeSocialCheckoutHref(): string {
  const params = new URLSearchParams({
    produto: 'nome_social',
    utm_source: 'app_chat',
    utm_campaign: 'card_pdf',
  });
  return `/comprar?${params.toString()}`;
}

export type PdfDevice = 'mobile' | 'desktop';

export type PdfSurface = 'dock' | 'sticky';
