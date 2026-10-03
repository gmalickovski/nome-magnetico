import { z } from 'zod';

export const PRODUCT_ENUM = z.enum(['nome_social', 'nome_bebe', 'nome_empresa']);

/** Vazio = vale para todos os produtos. */
export const productTypesSchema = z
  .array(PRODUCT_ENUM)
  .max(3)
  .default([])
  .transform((items) => [...new Set(items)]);

export const stateSchema = z.enum(['active', 'scheduled', 'expired', 'inactive']);

export const pageSchema = {
  page: z.coerce.number().int().min(1).max(10000).default(1),
  per_page: z.coerce.number().int().min(1).max(50).default(20),
};

export const toggleSchema = z.object({ is_active: z.boolean() }).strict();

export const discountSchema = z.object({
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.number().int().positive(),
});

/** Percentual de 1 a 100; valor fixo em centavos de BRL, até R$ 1.000,00. */
export function discountInRange(type: 'percent' | 'fixed', value: number): boolean {
  return type === 'percent' ? value <= 100 : value <= 100_000;
}

export function readQuery(url: URL, keys: readonly string[]): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const key of keys) {
    const value = url.searchParams.get(key);
    if (value) raw[key] = value;
  }
  return raw;
}
