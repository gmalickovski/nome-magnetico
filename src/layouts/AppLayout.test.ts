import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const layoutsDir = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(layoutsDir, '..');

describe('AppLayout.astro e unificação DEV-263', () => {
  it('importa AvatarMenu quando usado na sidebar desktop e define app-fixed-header unificado', () => {
    const file = path.join(layoutsDir, 'AppLayout.astro');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /import AvatarMenu/);
    assert.match(src, /<AvatarMenu/);
    assert.match(src, /app-fixed-header/);
    assert.match(src, /slot name="header-actions"/);
  });

  it('página de resultado usa ChatSidebarSection para Nome Social sem sugestões candidatas', () => {
    const file = path.join(srcRoot, 'pages', 'app', 'resultado', '[id].astro');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /<ChatSidebarSection/);
    assert.doesNotMatch(src, /<NomeSocialResultado/);
  });

  it('chat posiciona ChatPdfStickyDesktop no header superior (ChatProgress) e reinicia conversa após gerar PDF', () => {
    const file = path.join(srcRoot, 'frontend', 'components', 'app', 'chat', 'NomeSocialChat.tsx');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /onPdfSuccess:\s*resetChat/);
    assert.match(src, /trailing=\{[\s\S]*?<ChatPdfStickyDesktop/);
  });
});
