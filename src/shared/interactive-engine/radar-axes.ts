/**
 * Radar pentagonal do chat — Mapa de Alinhamento Vibracional.
 * Valores normalizados 0–1 para SVG (origem: motor-radar.ts, score v3 já calculado).
 */

import {
  computeMotorRadarAxes,
  type MotorRadarKey,
  MOTOR_RADAR_AXIS_ORDER,
  MOTOR_RADAR_LABELS,
} from './motor-radar';

export type RadarAxisKey = MotorRadarKey;

export interface RadarAxis {
  key: RadarAxisKey;
  label: string;
  value: number; // 0..1
  valuePercent?: number;
  description?: string;
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
  const nome = profile.nomeCompleto?.trim();
  const data = profile.dataNascimento?.trim();
  if (!nome || !data) {
    return MOTOR_RADAR_AXIS_ORDER.map((key) => ({
      key,
      label: MOTOR_RADAR_LABELS[key],
      value: 0.35,
      valuePercent: 35,
    }));
  }

  return computeMotorRadarAxes(nome, data, {
    areaFoco: profile.areaFoco,
    ondeAssinaRaw: profile.ondeVaiUsar,
  }).map((a) => ({
    key: a.key,
    label: a.label,
    value: a.value,
    valuePercent: a.valuePercent,
    description: a.description,
  }));
}
