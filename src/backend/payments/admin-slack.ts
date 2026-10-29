/** Avisos admin no Slack via n8n (`admin.new_payment` e filtros em reembolso). */
export function shouldNotifyAdminSlackForProvider(
  paymentProvider: string | null | undefined,
): boolean {
  return paymentProvider !== 'test';
}
