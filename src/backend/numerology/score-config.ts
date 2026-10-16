/**
 * Configuração versionada do score v3 (motor NM v3 · DEV-185).
 * Nenhum peso ou teto deve ser duplicado em score.ts.
 */

export const SCORE_VERSION_V3 = 'v3' as const;

export const SCORE_CONFIG_V3 = Object.freeze({
  piso: 5,
  base: 100,

  sequenciasVida: Object.freeze({
    porCodigoDistinto: 15,
    porLinhaExtraMesmoCodigo: 2,
    maxExtraPorCodigo: 4,
    tetoCategoria: 45,
  }),

  compatibilidade: Object.freeze({
    favoravel: 0,
    neutro: 6,
    desfavoravel: 18,
    tetoCategoria: 18,
  }),

  debitos: Object.freeze({
    porFonteNome: 8,
    acentuada: 4,
    tetoCategoria: 20,
  }),

  tendenciasOcultas: Object.freeze({
    porItem: 3,
    tetoCategoria: 9,
  }),

  licoesCarmicas: Object.freeze({
    porItem: 2,
    tetoCategoria: 8,
  }),

  reflexos: Object.freeze({
    tetoCategoria: 0,
  }),

  arcanosDificeis: Object.freeze({
    tetoCategoria: 0,
  }),

  niveis: Object.freeze([
    { codigo: 'N5', min: 85, max: 100, rotulo: 'Harmonioso' },
    { codigo: 'N4', min: 70, max: 84, rotulo: 'Favorável' },
    { codigo: 'N3', min: 50, max: 69, rotulo: 'Equilíbrio Parcial' },
    { codigo: 'N2', min: 30, max: 49, rotulo: 'Pede Atenção' },
    { codigo: 'N1', min: 0, max: 29, rotulo: 'Em Tensão' },
  ] as const),
});

export type ScoreConfigV3 = typeof SCORE_CONFIG_V3;
