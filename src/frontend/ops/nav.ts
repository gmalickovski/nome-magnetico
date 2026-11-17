import { OPS_STAFF_ROUTES } from '../../shared/ops-routes';

const LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Usuários',
  '/subscriptions': 'Assinaturas',
  '/billing': 'Billing',
  '/promocoes': 'Promoções',
  '/glossario': 'Glossário',
  '/monitor': 'Monitor',
  '/faq': 'FAQ',
  '/support': 'Suporte',
  '/blog': 'Blog',
  '/mensagens': 'Mensagens',
  '/analise': 'Área do Analista',
  '/settings': 'Configurações',
};

export interface OpsNavItem {
  href: string;
  label: string;
}

export const OPS_NAV: OpsNavItem[] = Object.keys(OPS_STAFF_ROUTES).map((href) => ({
  href,
  label: LABELS[href] ?? href,
}));

/** Itens fixos da dock mobile (DEV-309). O resto fica em "Mais". */
export const OPS_DOCK_PRIMARY_HREFS = ['/', '/users', '/subscriptions', '/promocoes', '/glossario'] as const;

/** Item ativo: "/" só casa com a raiz; os demais casam com a rota e as subrotas (ficha `/users/:id`). */
export function isOpsNavActive(current: string, href: string): boolean {
  if (href === '/') return current === '/';
  return current === href || current.startsWith(`${href}/`);
}

export function splitOpsNav(): { primary: OpsNavItem[]; more: OpsNavItem[] } {
  const primary = OPS_DOCK_PRIMARY_HREFS.map((href) => OPS_NAV.find((item) => item.href === href)).filter(
    (item): item is OpsNavItem => Boolean(item),
  );
  const more = OPS_NAV.filter((item) => !(OPS_DOCK_PRIMARY_HREFS as readonly string[]).includes(item.href));
  return { primary, more };
}

/** "Mais" fica ativo quando a rota atual é uma das que não estão na dock. */
export function isOpsMoreActive(current: string): boolean {
  return splitOpsNav().more.some((item) => isOpsNavActive(current, item.href));
}
