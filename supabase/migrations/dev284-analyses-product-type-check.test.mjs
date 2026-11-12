/**
 * DEV-284: garante que a migration de paridade da CHECK inclui todos os product_type gravados em analyses.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Espelha AnalysisProductType em src/backend/db/analyses.ts */
const ANALYSES_PRODUCT_TYPES = [
  'nome_social',
  'nome_bebe',
  'nome_empresa',
  'analise_gratuita',
];

const MIGRATION = join(__dirname, '058_dev284_analyses_product_type_analise_gratuita.sql');

test('migration DEV-284 recria analyses_product_type_check com todos os valores do código', () => {
  const sql = readFileSync(MIGRATION, 'utf8');
  assert.match(sql, /DROP CONSTRAINT IF EXISTS analyses_product_type_check/);
  assert.match(sql, /ADD CONSTRAINT analyses_product_type_check/);
  for (const value of ANALYSES_PRODUCT_TYPES) {
    assert.match(sql, new RegExp(`'${value}'`), `faltando valor ${value} na migration`);
  }
});
