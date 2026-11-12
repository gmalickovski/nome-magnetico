import QRCode from 'qrcode';

const QR_OPTS = {
  errorCorrectionLevel: 'M' as const,
  margin: 1,
  width: 240,
  color: {
    dark: '#E5E2E1',
    light: '#1C1C1C',
  },
};

/** PNG data URL do QR para embed no @react-pdf/renderer. */
export async function buildPotencialCtaQrDataUrl(targetUrl: string): Promise<string> {
  return QRCode.toDataURL(targetUrl, QR_OPTS);
}

/** Fallback: módulos escuros sobre fundo branco (2 mm de margem visual no layout). */
export async function buildPotencialCtaQrDataUrlFallback(targetUrl: string): Promise<string> {
  return QRCode.toDataURL(targetUrl, {
    ...QR_OPTS,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}
