import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** DEV-311 · todo componente usado no template de uma página demo precisa ter sido importado. */
const PAGINAS = ['demo-chat-scores.astro', 'demo-chat.astro'];

describe('DEV-311 · páginas demo sem componente não importado', () => {
  for (const arquivo of PAGINAS) {
    it(arquivo, () => {
      const src = readFileSync(path.join(process.cwd(), 'src', 'pages', arquivo), 'utf8');
      const partes = src.split('---');
      const frontmatter = partes[1] ?? '';
      const template = partes.slice(2).join('---');
      const importados = new Set(
        [...frontmatter.matchAll(/import\s+(?:\{([^}]*)\}|(\w+))/g)].flatMap((m) =>
          m[2] ? [m[2]] : (m[1] ?? '').split(',').map((x) => x.trim().split(/\s+as\s+/).pop()!.trim()),
        ),
      );
      const usados = new Set([...template.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]!));
      for (const nome of usados) assert.ok(importados.has(nome), `<${nome}> usado sem import em ${arquivo}`);
    });
  }
});
