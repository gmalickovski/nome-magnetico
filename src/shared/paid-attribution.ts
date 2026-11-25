export const PAID_ATTRIBUTION_COOKIE = 'nm-paid-visitor';
export const PAID_ADS_PREFERENCE = 'nm-ad-measurement';
export const ATTRIBUTION_WINDOW_SECONDS = 7 * 24 * 60 * 60;

export const paidChannels = ['google_ads', 'meta_ads'] as const;
export const paidSources = ['google', 'facebook', 'instagram', 'meta'] as const;
export const paidMedia = ['cpc', 'ppc', 'paid_search', 'paid_social'] as const;
export const campaignCodePattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
export const numericIdPattern = /^\d{1,24}$/;
export const clickIdPattern = /^[a-zA-Z0-9_-]{6,256}$/;
export const gaClientIdPattern = /^\d{1,20}\.\d{1,20}$/;

export type PaidTouch = {
  channel: (typeof paidChannels)[number];
  campaign_id: string;
  ad_id?: string;
  utm_source: (typeof paidSources)[number];
  utm_medium: (typeof paidMedia)[number];
  utm_campaign?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
};

export function allowedPaidTouch(touch: PaidTouch): boolean {
  if (touch.channel === 'google_ads') {
    return touch.utm_source === 'google' && touch.utm_medium !== 'paid_social' && !touch.fbclid;
  }
  return touch.utm_source !== 'google' && touch.utm_medium !== 'paid_search' && !touch.gclid;
}

export function paidTouchFromSearch(search: string): PaidTouch | undefined {
  const params = new URLSearchParams(search);
  const source = paidSources.find((item) => item === params.get('utm_source')?.toLowerCase());
  const medium = paidMedia.find((item) => item === params.get('utm_medium')?.toLowerCase());
  const read = (key: string, pattern: RegExp) => {
    const value = params.get(key);
    return value && pattern.test(value) ? value : undefined;
  };
  const campaignId = read('utm_id', numericIdPattern);
  if (!source || !medium || !campaignId) return undefined;

  const channel = source === 'google' ? 'google_ads' : 'meta_ads';
  const touch: PaidTouch = {
    channel,
    campaign_id: campaignId,
    ad_id: read('ad_id', numericIdPattern),
    utm_source: source,
    utm_medium: medium,
    utm_campaign: read('utm_campaign', campaignCodePattern),
    utm_content: read('utm_content', campaignCodePattern),
    gclid: channel === 'google_ads' ? read('gclid', clickIdPattern) : undefined,
    fbclid: channel === 'meta_ads' ? read('fbclid', clickIdPattern) : undefined,
  };
  return allowedPaidTouch(touch) ? touch : undefined;
}
