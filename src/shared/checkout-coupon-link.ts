export function readLinkedCoupon(params: URLSearchParams): string {
  return (params.get('cupom')?.trim() || params.get('coupon')?.trim() || '').toUpperCase();
}

export function withLinkedCoupon(path: string, params: URLSearchParams): string {
  const code = readLinkedCoupon(params);
  if (!code) return path;
  const separator = path.includes('?') ? '&' : '?';
  return path + separator + new URLSearchParams({ cupom: code }).toString();
}
