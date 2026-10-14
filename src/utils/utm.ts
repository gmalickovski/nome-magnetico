/**
 * UTM dos links montados para e-mail (Brevo).
 * utm_campaign = "nm" + id, sem underline: 12 → nm12, nm_12 → nm12.
 */

/** Sequência de upsell da análise gratuita (templates marketing-free-analysis-upsell-*). */
export const EMAIL_CAMPAIGN_FREE_ANALYSIS = 'freeanalysis';

export function emailCampaignName(campaignId: string | number): string {
  const id = String(campaignId).trim().replace(/^nm/i, '').replace(/_/g, '');
  if (!id) {
    throw new Error('campaignId vazio');
  }
  return `nm${id}`;
}

/** Acrescenta utm_source, utm_medium e utm_campaign preservando a query existente. */
export function withEmailUtm(url: string, campaignId: string | number): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  parsed.searchParams.set('utm_source', 'brevo');
  parsed.searchParams.set('utm_medium', 'email');
  parsed.searchParams.set('utm_campaign', emailCampaignName(campaignId));
  return parsed.toString();
}
