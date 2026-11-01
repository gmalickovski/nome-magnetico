import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const layoutsDir = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(layoutsDir, '..');

describe('AppLayout.astro e unificação DEV-263', () => {
  it('importa AvatarMenu quando usado na sidebar desktop e define app-fixed-header sem links de navegação', () => {
    const file = path.join(layoutsDir, 'AppLayout.astro');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /import AvatarMenu/);
    assert.match(src, /<AvatarMenu/);
    assert.match(src, /app-fixed-header/);
    assert.match(src, /slot name="header-actions"/);
    // Não deve conter links de navegação no header desktop
    assert.doesNotMatch(src, /headerBackHref/);
    assert.doesNotMatch(src, /headerBackLabel/);
  });

  it('sidebar desktop e header usam left fixo (5rem) para overlay suave sem empurrar o layout', () => {
    const appLayoutFile = path.join(layoutsDir, 'AppLayout.astro');
    const appLayoutSrc = readFileSync(appLayoutFile, 'utf8');
    assert.match(appLayoutSrc, /left:\s*5rem/);
    assert.doesNotMatch(appLayoutSrc, /--sidebar-w/);

    const cssFile = path.join(srcRoot, 'styles', 'global.css');
    const cssSrc = readFileSync(cssFile, 'utf8');
    assert.match(cssSrc, /\.nm-chat-shell\s*\{\s*left:\s*5rem;\s*\}/);
    assert.doesNotMatch(cssSrc, /\.nm-chat-shell\s*\{\s*left:\s*var\(--sidebar-w/);
  });

  it('página de resultado usa ChatSidebarSection para Nome Social sem sugestões candidatas', () => {
    const file = path.join(srcRoot, 'pages', 'app', 'resultado', '[id].astro');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /<ChatSidebarSection/);
    assert.doesNotMatch(src, /<NomeSocialResultado/);
  });

  it('chat posiciona ChatPdfStickyDesktop no header superior (ChatProgress) sem link de voltar e reinicia conversa', () => {
    const file = path.join(srcRoot, 'frontend', 'components', 'app', 'chat', 'NomeSocialChat.tsx');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /onPdfSuccess:\s*resetChat/);
    assert.match(src, /trailing=\{[\s\S]*?<ChatPdfStickyDesktop/);
    assert.doesNotMatch(src, /leading=\{[\s\S]*?Minhas análises/);
  });

  it('ChatProgress usa container flex centralizado e ChatRestartButton usa IconRotateCcw com tons dourados', () => {
    const progressFile = path.join(srcRoot, 'frontend', 'components', 'app', 'chat', 'ChatProgress.tsx');
    const progressSrc = readFileSync(progressFile, 'utf8');
    assert.match(progressSrc, /flex-1 min-w-0 flex items-center justify-center/);
    assert.match(progressSrc, /max-w-2xl/);

    const restartFile = path.join(srcRoot, 'frontend', 'components', 'app', 'chat', 'ChatRestartButton.tsx');
    const restartSrc = readFileSync(restartFile, 'utf8');
    assert.match(restartSrc, /import \{ IconRotateCcw \} from '\.\/MobileChatDockIcons/);
    assert.match(restartSrc, /border-\[\#D4AF37\]/);
    assert.match(restartSrc, /text-\[\#D4AF37\]/);
  });
});
