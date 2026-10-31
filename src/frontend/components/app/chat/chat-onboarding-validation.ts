/** Validações compartilhadas do onboarding conversacional (DEV-235 · 6D). */

export function validateBirthName(nome: string): string | null {
  const trimmed = nome.trim();
  if (!trimmed) {
    return 'Por favor, informe seu nome completo de nascimento.';
  }
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return 'Informe seu nome e pelo menos um sobrenome de nascimento.';
  }
  if (trimmed.length < 2) {
    return 'Por favor, informe seu nome completo de registro.';
  }
  return null;
}

export function validateBirthDate(dataNascimento: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento.trim())) {
    return 'Por favor, informe uma data de nascimento válida (DD/MM/AAAA).';
  }
  return null;
}

export function validateGender(gender: string): string | null {
  if (!gender || !['Masculino', 'Feminino', 'Neutro'].includes(gender)) {
    return 'Por favor, selecione o sexo / gênero.';
  }
  return null;
}
