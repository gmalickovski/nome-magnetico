export const PRODUCT_TYPES = ['nome_social', 'nome_bebe', 'nome_empresa'] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_LABELS: Record<string, string> = {
  nome_social: 'Nome Social',
  nome_bebe: 'Nome de Bebê',
  nome_empresa: 'Nome Empresarial',
};
