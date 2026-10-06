export class OpsRegistryError extends Error {
  status: 404 | 409 | 503;

  constructor(status: 404 | 409 | 503, message: string) {
    super(message);
    this.name = 'OpsRegistryError';
    this.status = status;
  }
}

type PostgrestLikeError = { code?: string; message?: string } | null | undefined;

/** Tabela ou coluna ainda não criada (migrations 035/036). */
export function isMissingTable(error: PostgrestLikeError): boolean {
  return (
    error?.code === 'PGRST205' ||
    error?.code === '42P01' ||
    error?.code === '42703' ||
    Boolean(error?.message?.includes('does not exist'))
  );
}

export function isUniqueViolation(error: PostgrestLikeError): boolean {
  return error?.code === '23505';
}

export function assertRegistryReady(error: PostgrestLikeError): void {
  if (isMissingTable(error)) {
    throw new OpsRegistryError(503, 'Registro ainda não disponível no banco. Aplique as migrations 035 e 036.');
  }
}

export type RegistryState = 'active' | 'scheduled' | 'expired' | 'inactive';

export function registryState(row: {
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}, now = Date.now()): RegistryState {
  if (!row.is_active) return 'inactive';
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return 'scheduled';
  if (row.ends_at && new Date(row.ends_at).getTime() <= now) return 'expired';
  return 'active';
}
