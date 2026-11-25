import { z } from 'zod';
import { supabase } from '../db/supabase';
import { readServerEnv } from '../env/runtime';
import {
  allowedPaidTouch, campaignCodePattern, clickIdPattern, gaClientIdPattern, numericIdPattern,
  PAID_ATTRIBUTION_COOKIE, paidChannels, paidMedia, paidSources,
} from '../../shared/paid-attribution';

const paidTouchSchema = z.object({
  channel: z.enum(paidChannels),
  campaign_id: z.string().regex(numericIdPattern),
  ad_id: z.string().regex(numericIdPattern).optional(),
  utm_source: z.enum(paidSources),
  utm_medium: z.enum(paidMedia),
  utm_campaign: z.string().regex(campaignCodePattern).optional(),
  utm_content: z.string().regex(campaignCodePattern).optional(),
  gclid: z.string().regex(clickIdPattern).optional(),
  fbclid: z.string().regex(clickIdPattern).optional(),
}).strict().refine(allowedPaidTouch, 'Origem de campanha inválida');

const gaIdentitySchema = z.object({
  client_id: z.string().regex(gaClientIdPattern),
  session_id: z.number().int().positive().max(9_999_999_999).optional(),
}).strict();

export const paidPreferencesSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('preferences'), analytics: z.boolean(), ads: z.boolean(), touch: paidTouchSchema.optional() }).strict(),
  z.object({ type: z.literal('observe'), touch: paidTouchSchema.optional(), ga: gaIdentitySchema.optional() }).strict(),
]);

export function paidAttributionEnabled(): boolean {
  return readServerEnv('PAID_ATTRIBUTION_ENABLED') === '1';
}

export function paidVisitorFromRequest(request: Request): string | undefined {
  const cookie = request.headers.get('cookie')?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${PAID_ATTRIBUTION_COOKIE}=`));
  const result = z.string().uuid().safeParse(cookie?.slice(PAID_ATTRIBUTION_COOKIE.length + 1));
  return result.success ? result.data : undefined;
}

export async function createPaidCheckoutReference(request: Request): Promise<string | undefined> {
  if (!paidAttributionEnabled()) return undefined;
  const visitorId = paidVisitorFromRequest(request);
  if (!visitorId) return undefined;
  try {
    const { data, error } = await supabase.rpc('nm_paid_checkout_snapshot', { p_visitor_id: visitorId });
    if (error) throw error;
    return typeof data === 'string' ? data : undefined;
  } catch {
    console.warn('[paid-attribution] Snapshot indisponível');
    return undefined;
  }
}

const clickSchema = z.object({ touch: paidTouchSchema, first_at: z.string() });

export function paidCampaignProperties(click: unknown): Record<string, string> {
  const parsed = clickSchema.safeParse(click);
  if (!parsed.success) return {};
  const { touch, first_at } = parsed.data;
  const account = touch.channel === 'google_ads' ? '3684371046' : '1566113224992478';
  return {
    paid_channel: touch.channel,
    paid_account_id: account,
    paid_campaign_id: touch.campaign_id,
    paid_click_at: first_at,
    paid_utm_source: touch.utm_source,
    paid_utm_medium: touch.utm_medium,
    ...(touch.ad_id ? { paid_ad_id: touch.ad_id } : {}),
  };
}

export async function readPaidCampaignProperties(request: Request): Promise<Record<string, string>> {
  const visitorId = paidVisitorFromRequest(request);
  if (!paidAttributionEnabled() || !visitorId) return {};
  try {
    const { data, error } = await supabase.rpc('nm_paid_active_click', { p_visitor_id: visitorId });
    if (error) throw error;
    return paidCampaignProperties(data);
  } catch {
    console.warn('[paid-attribution] Campanha indisponível');
    return {};
  }
}

export function readGaIdentity(value: unknown) {
  const result = gaIdentitySchema.safeParse(value);
  return result.success ? result.data : undefined;
}
