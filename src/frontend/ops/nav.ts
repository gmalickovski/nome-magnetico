import { OPS_STAFF_ROUTES } from '../../shared/ops-routes';

const LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Usuários',
  '/subscriptions': 'Assinaturas',
  '/billing': 'Billing',
  '/promocoes': 'Promoções',
  '/monitor': 'Monitor',
  '/faq': 'FAQ',
  '/support': 'Suporte',
  '/blog': 'Blog',
  '/mensagens': 'Mensagens',
  '/settings': 'Configurações',
};

export const OPS_NAV = Object.keys(OPS_STAFF_ROUTES).map((href) => ({
  href,
  label: LABELS[href] ?? href,
}));
