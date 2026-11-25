import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { writeFileSync, mkdtempSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { NomeBebeChatPDF } from './NomeBebeChatPDF.tsx';
import { gerarNomesBebe } from '../../../backend/numerology/products/nome-bebe-chat/index.ts';
import { assertPdfOfflineHarnessReady } from './shared/pdfOfflinePrerequisites.ts';

const FORBIDDEN_BABY_SNIPPETS = [
  'motor v3',
  'motor v4',
  'regra n5',
  'regras ocultas',
  ' pts',
  'n4 ·',
  'n5 ·',
  '(n4)',
  '(n5)',
  'incompatível',
  'incompativel',
  'radiestesia',
  'pêndulo',
  'pendulo',
  '15 dias',
  '60 dias',
  '90 dias',
];

function inspectPdf(buf: Buffer): { pages: number; text: string } {
  const dir = mkdtempSync(join(tmpdir(), 'nm-bebe-pdf-'));
  const path = join(dir, 'bebe.pdf');
  writeFileSync(path, buf);
  const info = spawnSync('pdfinfo', [path], { encoding: 'utf8', timeout: 30_000 });
  const run = spawnSync('pdftotext', [path, '-'], { encoding: 'utf8', timeout: 60_000 });
  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }
  assert.equal(info.status, 0);
  assert.equal(run.status, 0);
  const pagesMatch = info.stdout.match(/Pages:\s+(\d+)/);
  return { pages: Number(pagesMatch?.[1] ?? 0), text: run.stdout };
}

function assertCleanBabyText(text: string): void {
  const lower = text.toLowerCase();
  for (const s of FORBIDDEN_BABY_SNIPPETS) {
    assert.equal(lower.includes(s), false, `Termo proibido encontrado no PDF do bebê: "${s}"`);
  }
}

describe('DEV-330 · NomeBebeChatPDF', () => {
  const realMotorPrevista = gerarNomesBebe({
    sobrenomes: ['Silva'],
    data: '15/06/2027',
    modoData: 'janela',
    sexo: 'menina',
    estilos: ['classico'],
    nomesPais: ['Laura'],
  });
  const escolhidoReal = realMotorPrevista.sugestoes[0]!;
  const seusNomesComBloqueio = [
    ...(realMotorPrevista.seusNomes.map((s) => ({
      nome: s.nomeCompleto,
      nota: s.score,
      expressao: s.expressao,
      bloqueios: s.bloqueios.length > 0 ? s.bloqueios.map((b) => b.codigo) : ['555'],
      diasBons: s.diasBons,
      diasTotal: s.diasTotal,
      grupo: 'seu' as const,
    }))),
  ];

  const fixtureMeninaPrevista = {
    id: 'bebe-1',
    user_id: 'u-1',
    nome_completo: escolhidoReal.nomeCompleto,
    data_nascimento: '2027-06-15',
    product_type: 'nome_social',
    status: 'complete',
    frequencias_numeros: {
      selectedNomeSocial: escolhidoReal.nomeCompleto,
      perfilChat: {
        motivo: 'bebe',
        bebeMae: 'Mariana Silva',
        bebePai: 'Rafael Costa',
        bebeSituacao: 'nao_nasceu',
        bebeDataTipo: 'prevista',
        bebeSexo: 'menina',
        bebeData: '15/06/2027',
        bebeSobrenomes: ['Silva'],
        bebeNomesPais: ['Laura'],
      },
      nomesBebe: {
        escolhido: escolhidoReal.nomeCompleto,
        seusNomes: seusNomesComBloqueio,
        sugestoes: realMotorPrevista.sugestoes.map((s) => ({
          nome: s.nomeCompleto,
          nota: s.score,
          expressao: s.expressao,
          bloqueios: s.bloqueios.map((b) => b.codigo),
          diasBons: s.diasBons,
          diasTotal: s.diasTotal,
          grupo: s.grupo === 'seu' ? 'menina' : s.grupo,
        })),
        janela: realMotorPrevista.janela,
      },
    },
  };

  it('menina + data prevista + 2 pais + bloqueio dos pais: gera 7 páginas com tira dos dias e sem termos proibidos', async () => {
    assertPdfOfflineHarnessReady();
    const buf = await renderToBuffer(
      React.createElement(NomeBebeChatPDF, {
        analysis: fixtureMeninaPrevista as any,
        magneticNames: [],
        userName: 'Mariana',
      }) as any,
    );
    assert.equal(buf.subarray(0, 5).toString('ascii'), '%PDF-');
    const { pages, text } = inspectPdf(buf);
    assert.equal(pages, 7);
    assertCleanBabyText(text);
    assert.ok(text.includes(escolhidoReal.nomeCompleto));
    assert.match(text, /Mariana/);
    assert.match(text, /Rafael/);
    assert.match(text, /Dias possíveis do parto/i);
    assert.match(text, /Tem bloqueio:/);
    assert.match(text, /Para guardar/);
  });

  it('menino + data exata + só mãe: gera 7 páginas sem "Dias possíveis do parto"', async () => {
    assertPdfOfflineHarnessReady();
    const fixtureMeninoExata = {
      id: 'bebe-2',
      user_id: 'u-2',
      nome_completo: 'Theo Souza',
      data_nascimento: '2026-10-10',
      product_type: 'nome_social',
      status: 'complete',
      frequencias_numeros: {
        selectedNomeSocial: 'Theo Souza',
        perfilChat: {
          motivo: 'bebe',
          bebeMae: 'Camila Souza',
          bebeSituacao: 'nasceu_sem_registro',
          bebeDataTipo: 'marcada',
          bebeSexo: 'menino',
          bebeData: '10/10/2026',
          bebeSobrenomes: ['Souza'],
        },
        nomesBebe: {
          escolhido: 'Theo Souza',
          seusNomes: [],
          sugestoes: [
            {
              nome: 'Theo Souza',
              nota: 89,
              expressao: 4,
              bloqueios: [],
              grupo: 'menino',
            },
          ],
          janela: null,
        },
      },
    };
    const buf = await renderToBuffer(
      React.createElement(NomeBebeChatPDF, {
        analysis: fixtureMeninoExata as any,
        magneticNames: [],
        userName: 'Camila',
      }) as any,
    );
    const { pages, text } = inspectPdf(buf);
    assert.equal(pages, 7);
    assertCleanBabyText(text);
    assert.equal(text.includes('Dias possíveis do parto'), false);
    assert.match(text, /Camila/);
    assert.match(text, /Querido Theo/);
  });

  it('indefinido (neutro) + bebê registrado sem nomes dos pais: gera 7 páginas com dados mínimos', async () => {
    assertPdfOfflineHarnessReady();
    const fixtureNeutro = {
      id: 'bebe-3',
      user_id: 'u-3',
      nome_completo: 'Alex Oliveira',
      data_nascimento: '2026-11-01',
      product_type: 'nome_social',
      status: 'complete',
      frequencias_numeros: {
        selectedNomeSocial: 'Alex Oliveira',
        perfilChat: {
          motivo: 'bebe',
          bebeSituacao: 'nasceu_registrado',
          bebeSexo: 'indefinido',
          bebeData: '01/11/2026',
          bebeNomeRegistrado: 'Alex Oliveira',
        },
      },
    };
    const buf = await renderToBuffer(
      React.createElement(NomeBebeChatPDF, {
        analysis: fixtureNeutro as any,
        magneticNames: [],
        userName: 'Família',
      }) as any,
    );
    const { pages, text } = inspectPdf(buf);
    assert.equal(pages, 7);
    assertCleanBabyText(text);
    assert.match(text, /Alex Oliveira/);
    assert.match(text, /Para a família/);
  });
});
