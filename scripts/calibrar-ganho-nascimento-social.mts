#!/usr/bin/env npx tsx
/**
 * DEV-275 — Relatório de calibração (motor determinístico, fixtures sintéticas).
 */
import {
  calibrarDistribuicaoGanhoSobreNascimento,
  formatarTabelaCalibracaoGanho,
} from '../src/backend/numerology/suggestion-birth-calibration.ts';

process.env.SCORE_VERSION = process.env.SCORE_VERSION ?? 'v3';

const linhas = calibrarDistribuicaoGanhoSobreNascimento();
console.log(formatarTabelaCalibracaoGanho(linhas));
