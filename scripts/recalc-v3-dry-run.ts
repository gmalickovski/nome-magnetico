/**
 * DEV-185 · Recálculo agregado (somente leitura).
 * SELECT em analyses (analise_gratuita), score v1 vs v3 em memória — não grava nada.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { avaliarNome, calcularScoreV1SemOcorrenciasExtras } from '../src/backend/numerology/score.ts';
import { calcularTodosTriangulos, detectarBloqueios } from '../src/backend/numerology/triangle.ts';
import {
  calcularExpressao,
  calcularDestino,
  calcularMotivacao,
} from '../src/backend/numerology/numbers.ts';
import {
  detectarLicoesCarmicas,
  detectarTendenciasOcultas,
  calcularDebitosCarmicos,
} from '../src/backend/numerology/karmic.ts';
import { avaliarCompatibilidade } from '../src/backend/numerology/harmonization.ts';

dotenv.config();

function dbDateToPtBr(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function scoreV1Legado(nome: string, dataPt: string): number {
  const todos = calcularTodosTriangulos(nome, dataPt);
  const bloqueios = detectarBloqueios(todos);
  const expressao = calcularExpressao(nome);
  const destino = calcularDestino(dataPt);
  const motivacao = calcularMotivacao(nome);
  const licoes = detectarLicoesCarmicas(nome);
  const tendencias = detectarTendenciasOcultas(nome);
  const debitos = calcularDebitosCarmicos(dataPt, destino, motivacao, expressao);
  return calcularScoreV1SemOcorrenciasExtras({
    bloqueios,
    licoesCarmicas: licoes.length,
    tendenciasOcultas: tendencias.length,
    debitosCarmicos: debitos,
    compatibilidade: avaliarCompatibilidade(expressao, destino),
  });
}

function nivelCodigo(score: number): string {
  if (score >= 85) return 'N5';
  if (score >= 70) return 'N4';
  if (score >= 50) return 'N3';
  if (score >= 30) return 'N2';
  return 'N1';
}

async function main() {
  const url = process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Defina PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (somente leitura).');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('analyses')
    .select('nome_completo, data_nascimento')
    .eq('product_type', 'analise_gratuita')
    .eq('status', 'complete')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro SELECT:', error.message);
    process.exit(1);
  }

  const rows = data ?? [];
  const v3Scores: number[] = [];
  const niveis: Record<string, number> = { N1: 0, N2: 0, N3: 0, N4: 0, N5: 0 };
  let sobem = 0;
  let iguais = 0;
  let caem = 0;

  for (const row of rows) {
    const nome = row.nome_completo.trim();
    const dataPt = dbDateToPtBr(String(row.data_nascimento));
    const v1 = scoreV1Legado(nome, dataPt);
    const v3 = avaliarNome(nome, dataPt).score_v3;
    v3Scores.push(v3);
    niveis[nivelCodigo(v3)]! += 1;
    if (v3 > v1) sobem++;
    else if (v3 === v1) iguais++;
    else caem++;
  }

  v3Scores.sort((a, b) => a - b);
  const min = v3Scores[0] ?? 0;
  const max = v3Scores[v3Scores.length - 1] ?? 0;
  const mid = v3Scores.length
    ? v3Scores.length % 2 === 1
      ? v3Scores[(v3Scores.length - 1) / 2]!
      : Math.round((v3Scores[v3Scores.length / 2 - 1]! + v3Scores[v3Scores.length / 2]!) / 2)
    : 0;

  console.log(JSON.stringify({
    total: rows.length,
    min,
    max,
    mediana: mid,
    niveis,
    comparacao_v1_para_v3: { sobem, iguais, caem },
  }, null, 2));
}

main();
