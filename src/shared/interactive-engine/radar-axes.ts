/**
 * Eixos de Perfil para o Radar Pentagonal (DEV-235 · Spec 5.9).
 * Eixos exatos:
 * 1. Momento de vida
 * 2. Objetivo
 * 3. Uso da assinatura
 * 4. Apego ao sobrenome
 * 5. Urgência
 *
 * Cada eixo é normalizado de 0 a 1.
 */

export interface RadarAxis {
  key: 'momento' | 'objetivo' | 'uso' | 'apego_sobrenome' | 'urgencia';
  label: string;
  value: number; // 0..1
}

export interface ProfileInputForRadar {
  nomeCompleto?: string;
  dataNascimento?: string;
  areaFoco?: string | null;
  subfocoMomento?: string | null;
  ondeVaiUsar?: string[];
  sobrenomesObrigatorios?: string[];
  sobrenomesExcluidos?: string[];
  estiloPreferido?: string | null;
  objetivoTexto?: string;
  notaHoje?: number;
  potencial?: number;
  palpiteStatus?: 'acertou' | 'parcial' | 'nao' | null;
}

export function computeRadarAxes(profile: ProfileInputForRadar): RadarAxis[] {
  // 1. Momento de vida: calibrado pela presença de subfoco, confirmação do palpite e relato
  let momento = 0.2;
  if (profile.subfocoMomento) momento += 0.4;
  if (profile.palpiteStatus === 'acertou') momento += 0.3;
  else if (profile.palpiteStatus === 'parcial') momento += 0.2;
  if (profile.objetivoTexto && profile.objetivoTexto.trim().length > 15) momento += 0.1;
  momento = Math.min(1, Math.max(0.1, momento));

  // 2. Objetivo: calibrado pela definição da área de foco e detalhe do relato
  let objetivo = 0.25;
  if (profile.areaFoco) objetivo += 0.45;
  if (profile.objetivoTexto && profile.objetivoTexto.trim().length > 10) objetivo += 0.25;
  objetivo = Math.min(1, Math.max(0.1, objetivo));

  // 3. Uso da assinatura: proporção de canais de uso selecionados (1 a 4)
  const canaisCount = profile.ondeVaiUsar?.length ?? 0;
  let uso = 0.2;
  if (canaisCount > 0) {
    uso = Math.min(1, 0.35 + canaisCount * 0.18);
  }

  // 4. Apego ao sobrenome:
  // - Alto se marcou sobrenomes obrigatórios ou quer estilo ajuste_sutil
  // - Baixo se quer curto_direto ou excluiu muitos sobrenomes
  let apego = 0.5;
  const obrigatorios = profile.sobrenomesObrigatorios?.length ?? 0;
  const excluidos = profile.sobrenomesExcluidos?.length ?? 0;
  if (obrigatorios > 0) apego += Math.min(0.4, obrigatorios * 0.2);
  if (profile.estiloPreferido === 'sobrenome_forte') apego += 0.15;
  if (profile.estiloPreferido === 'ajuste_sutil') apego += 0.25;
  if (profile.estiloPreferido === 'curto_direto') apego -= 0.35;
  if (excluidos > 0) apego -= Math.min(0.3, excluidos * 0.15);
  apego = Math.min(1, Math.max(0.1, apego));

  // 5. Urgência: calibrado pelo gap entre nota civil atual e potencial
  let urgencia = 0.3;
  if (profile.notaHoje && profile.potencial) {
    const gap = profile.potencial - profile.notaHoje;
    if (gap > 40) urgencia = 0.9;
    else if (gap > 25) urgencia = 0.75;
    else if (gap > 10) urgencia = 0.55;
    else urgencia = 0.4;
  }
  if (profile.palpiteStatus === 'acertou') urgencia = Math.min(1, urgencia + 0.1);
  urgencia = Math.min(1, Math.max(0.1, urgencia));

  return [
    { key: 'momento', label: 'Momento de vida', value: Number(momento.toFixed(2)) },
    { key: 'objetivo', label: 'Objetivo', value: Number(objetivo.toFixed(2)) },
    { key: 'uso', label: 'Uso da assinatura', value: Number(uso.toFixed(2)) },
    { key: 'apego_sobrenome', label: 'Apego ao sobrenome', value: Number(apego.toFixed(2)) },
    { key: 'urgencia', label: 'Urgência', value: Number(urgencia.toFixed(2)) },
  ];
}
