/**
 * DEV-358: saudação dos e-mails transacionais.
 * `profiles.nome` guarda o nome completo; o e-mail usa só o primeiro nome.
 */
export function greetingFirstName(
  nome: string | null | undefined,
  email: string | null | undefined,
  fallback = 'Cliente',
): string {
  const first = nome?.trim().split(/\s+/)[0];
  if (first) return first;
  const local = email?.split('@')[0]?.trim();
  return local || fallback;
}
