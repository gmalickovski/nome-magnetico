import type { APIRoute } from 'astro';
import { handleAccessLifecycle } from '../../../backend/lifecycle/access-lifecycle';

/**
 * POST /api/internal/notify-expiring
 *
 * Jornada de acesso (d+1, d+15, d-7, d-2, d0, d+7), 1x/dia pelo n8n.
 * Dry-run é o padrão: só envia com ACCESS_LIFECYCLE_SEND_ENABLED=true
 * e sem ?dry_run=1. Header X-Internal-Secret.
 * O mesmo POST está em /api/internal/access-lifecycle.
 */
export const POST: APIRoute = ({ request }) => handleAccessLifecycle(request);
