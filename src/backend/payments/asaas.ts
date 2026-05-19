const BASE_URL = process.env.ASAAS_BASE_URL ?? 'https://api.asaas.com';
const API_KEY  = process.env.ASAAS_API_KEY ?? '';

function asaasHeaders() {
  return {
    'Content-Type': 'application/json',
    'access_token': API_KEY,
    'User-Agent': 'NomeMagnetico/1.0',
  };
}

async function asaasFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...asaasHeaders(), ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asaas ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Cria (ou reutiliza) um único customer "guarda-chuva" para todas as cobranças PIX.
// O rastreamento por usuário é feito via externalReference na cobrança, não no customer.
async function getOrCreateUmbrellaCustomer(): Promise<string> {
  const list = await asaasFetch<{ data: Array<{ id: string }> }>(
    '/v3/customers?externalReference=nomemagnetico-main&limit=1'
  );
  if (list.data.length > 0) return list.data[0].id;

  const cnpj    = (process.env.ASAAS_MEI_CNPJ ?? '').replace(/\D/g, '');
  const name    = process.env.ASAAS_COMPANY_NAME ?? 'Nome Magnético';
  const email   = process.env.ASAAS_COMPANY_EMAIL ?? 'financeiro@nomemagnetico.com.br';

  const customer = await asaasFetch<{ id: string }>('/v3/customers', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      cpfCnpj: cnpj,
      externalReference: 'nomemagnetico-main',
      notificationDisabled: true,
    }),
  });
  return customer.id;
}

export interface PixChargeResult {
  chargeId: string;
  pixCopiaECola: string;
  qrCodeImage: string;
  expirationDate: string;
}

export async function createPixCharge(params: {
  userId: string;
  productType: string;
  value: number;
  description: string;
  couponCode?: string | null;
  gaClientId?: string | null;
}): Promise<PixChargeResult> {
  const customerId = await getOrCreateUmbrellaCustomer();

  const d = new Date();
  const dueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const payment = await asaasFetch<{ id: string }>('/v3/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value: params.value,
      dueDate,
      description: params.description,
      externalReference: [
        'nomemagnetico',
        params.userId,
        params.productType,
        params.couponCode ? encodeURIComponent(params.couponCode) : '',
        params.gaClientId ? encodeURIComponent(params.gaClientId) : '',
      ].join(':'),
    }),
  });

  const qr = await asaasFetch<Record<string, unknown>>(
    `/v3/payments/${payment.id}/pixQrCode`
  );
  console.log('[asaas] pixQrCode response:', JSON.stringify(qr));

  return {
    chargeId:       payment.id,
    pixCopiaECola:  qr.payload        as string,
    qrCodeImage:    qr.encodedImage   as string,
    expirationDate: qr.expirationDate as string,
  };
}

export function verifyWebhookToken(token: string): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN ?? '';
  return expected.length > 0 && token === expected;
}
