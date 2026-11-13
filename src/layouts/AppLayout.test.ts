import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const layoutsDir = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(layoutsDir, '..');

describe('AppLayout.astro e unificação DEV-263 / DEV-282', () => {
  it('usa AppDesktopHeader no layout, move AvatarMenu e Logo da sidebar para o header', () => {
    const appLayoutFile = path.join(layoutsDir, 'AppLayout.astro');
    const appLayoutSrc = readFileSync(appLayoutFile, 'utf8');
    assert.match(appLayoutSrc, /import AppDesktopHeader/);
    assert.match(appLayoutSrc, /<AppDesktopHeader/);
    assert.match(appLayoutSrc, /slot name="header-actions"/);

    // Sidebar deve conter AppSidebarLogout e não deve conter Logo nem AvatarMenu
    const sidebarMatch = appLayoutSrc.match(/<aside id="app-sidebar"[\s\S]*?<\/aside>/);
    assert.ok(sidebarMatch, 'sidebar deve existir');
    const sidebarHtml = sidebarMatch[0];
    assert.match(sidebarHtml, /<AppSidebarLogout/);
    assert.doesNotMatch(sidebarHtml, /<AvatarMenu/);
    assert.doesNotMatch(sidebarHtml, /logo-nm-header\.svg/);

    // AppDesktopHeader deve importar AvatarMenu e ter classes de posicionamento
    const headerFile = path.join(srcRoot, 'frontend', 'components', 'app', 'AppDesktopHeader.tsx');
    const headerSrc = readFileSync(headerFile, 'utf8');
    assert.match(headerSrc, /import AvatarMenu/);
    assert.match(headerSrc, /<AvatarMenu/);
    assert.match(headerSrc, /app-fixed-header/);
    assert.match(headerSrc, /logo-nm-header\.svg/);

    // Não deve conter links de navegação no header desktop
    assert.doesNotMatch(appLayoutSrc, /headerBackHref/);
    assert.doesNotMatch(appLayoutSrc, /headerBackLabel/);
  });

  it('sidebar desktop expande sobreposta ao passar o mouse (z-50, hover:w-60) revelando rótulos sem empurrar página ou header', () => {
    const appLayoutFile = path.join(layoutsDir, 'AppLayout.astro');
    const appLayoutSrc = readFileSync(appLayoutFile, 'utf8');
    const sidebarMatch = appLayoutSrc.match(/<aside id="app-sidebar"[\s\S]*?<\/aside>/);
    assert.ok(sidebarMatch, 'sidebar deve existir');
    const sidebarHtml = sidebarMatch[0];

    assert.match(sidebarHtml, /hidden lg:flex fixed inset-y-0 left-0 z-50 w-20/);
    assert.match(sidebarHtml, /hover:w-60/);
    assert.match(sidebarHtml, /transition-\[width/);
    assert.match(sidebarHtml, /group-hover:opacity-100/);
    assert.doesNotMatch(sidebarHtml, /sr-only/);

    assert.match(appLayoutSrc, /lg:ml-20/);
    assert.doesNotMatch(appLayoutSrc, /--sidebar-w/);

    const cssFile = path.join(srcRoot, 'styles', 'global.css');
    const cssSrc = readFileSync(cssFile, 'utf8');
    assert.match(cssSrc, /@media \(min-width: 1024px\)[\s\S]*\.nm-chat-shell[\s\S]*left:\s*5rem/);
    assert.doesNotMatch(cssSrc, /\.nm-chat-shell\s*\{\s*left:\s*var\(--sidebar-w/);

    const desktopHeaderSrc = readFileSync(
      path.join(srcRoot, 'frontend', 'components', 'app', 'AppDesktopHeader.tsx'),
      'utf8'
    );
    assert.match(desktopHeaderSrc, /\bz-40\b/);
  });

  it('tablet (<lg) usa dock/header mobile; desktop (≥lg) usa sidebar + header fixo', () => {
    const appLayoutSrc = readFileSync(path.join(layoutsDir, 'AppLayout.astro'), 'utf8');
    const dockLayoutSrc = readFileSync(
      path.join(srcRoot, 'frontend', 'components', 'app', 'chat', 'mobile-dock-layout.ts'),
      'utf8'
    );
    const mobileHeaderSrc = readFileSync(
      path.join(srcRoot, 'frontend', 'components', 'app', 'AppMobileHeader.tsx'),
      'utf8'
    );
    const desktopHeaderSrc = readFileSync(
      path.join(srcRoot, 'frontend', 'components', 'app', 'AppDesktopHeader.tsx'),
      'utf8'
    );

    assert.match(dockLayoutSrc, /lg:hidden mobile-chat-dock-root/);
    assert.match(mobileHeaderSrc, /lg:hidden/);
    assert.match(desktopHeaderSrc, /lg:flex/);
    assert.match(desktopHeaderSrc, /lg:left-20/);
    assert.match(appLayoutSrc, /hidden lg:block h-14/);

    const cssSrc = readFileSync(path.join(srcRoot, 'styles', 'global.css'), 'utf8');
    assert.match(cssSrc, /@media \(max-width: 1023px\)[\s\S]*--nm-mobile-dock-clearance/);
  });

  it('página de resultado usa ChatSidebarSection para Nome Social sem sugestões candidatas', () => {
    const file = path.join(srcRoot, 'pages', 'app', 'resultado', '[id].astro');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /<ChatSidebarSection/);
    assert.doesNotMatch(src, /<NomeSocialResultado/);
  });

  it('chat posiciona ChatPdfStickyDesktop no header superior (ChatProgress) sem link de voltar e preserva conversa após PDF', () => {
    const file = path.join(srcRoot, 'frontend', 'components', 'app', 'chat', 'NomeSocialChat.tsx');
    const src = readFileSync(file, 'utf8');
    assert.match(src, /onPdfSuccess:\s*\(\)\s*=>\s*\{[^}]*flushChatSessionToStorage\(\)/);
    assert.doesNotMatch(src, /onPdfSuccess:\s*resetChat/);
    assert.match(src, /trailing=\{[\s\S]*?<ChatPdfStickyDesktop/);
    assert.doesNotMatch(src, /leading=\{[\s\S]*?Minhas análises/);
  });

  it('sidebar do cliente expõe só Início, Minhas análises, Glossário e Suporte (DEV-286)', () => {
    const appLayoutFile = path.join(layoutsDir, 'AppLayout.astro');
    const appLayoutSrc = readFileSync(appLayoutFile, 'utf8');
    const sidebarMatch = appLayoutSrc.match(/<aside id="app-sidebar"[\s\S]*?<\/aside>/);
    assert.ok(sidebarMatch, 'sidebar deve existir');
    const sidebarHtml = sidebarMatch[0];
    assert.match(sidebarHtml, /APP_CLIENT_NAV_LABELS\.inicio/);
    assert.match(sidebarHtml, /APP_CLIENT_NAV_LABELS\.glossario/);
    assert.doesNotMatch(sidebarHtml, /admin-analise/);
    assert.doesNotMatch(sidebarHtml, /Área do Analista/);
    const navMatch = sidebarHtml.match(/<nav class="flex flex-col gap-2"[\s\S]*?<\/nav>/);
    assert.ok(navMatch, 'nav principal deve existir');
    assert.doesNotMatch(navMatch[0], /\/blog/);
    assert.match(sidebarHtml, /href="\/blog"/);
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

  it('botões Nova Análise, Começar Agora e painel /app levam ao chat /app/analise/nome-social (mobile e desktop)', () => {
    const analisesFile = path.join(srcRoot, 'pages', 'app', 'analises', 'index.astro');
    const analisesSrc = readFileSync(analisesFile, 'utf8');
    const anchors = analisesSrc.match(/<a\b[\s\S]*?<\/a>/g) ?? [];
    const novaAnaliseAnchors = anchors.filter((a) => a.includes('+ Nova Análise'));
    const comecarAnchors = anchors.filter((a) => a.includes('Começar Agora'));

    assert.equal(novaAnaliseAnchors.length, 2, 'deve ter botão + Nova Análise no header e no mobile');
    for (const a of novaAnaliseAnchors) {
      assert.match(a, /href="\/app\/analise\/nome-social"/);
      assert.doesNotMatch(a, /href="\/app"/);
    }
    assert.ok(
      novaAnaliseAnchors.some((a) => a.includes('lg:hidden')),
      'botão mobile + Nova Análise deve usar lg:hidden para cobrir <1024px'
    );

    assert.equal(comecarAnchors.length, 1);
    assert.match(comecarAnchors[0], /href="\/app\/analise\/nome-social"/);
    assert.doesNotMatch(comecarAnchors[0], /href="\/app"/);

    const dashboardFile = path.join(srcRoot, 'frontend', 'components', 'app', 'dashboard', 'AppDashboard.tsx');
    const dashboardSrc = readFileSync(dashboardFile, 'utf8');
    assert.match(dashboardSrc, /href="\/app\/analise\/nome-social"/);

    const appIndexFile = path.join(srcRoot, 'pages', 'app', 'index.astro');
    const appIndexSrc = readFileSync(appIndexFile, 'utf8');
    assert.match(appIndexSrc, /slot="header-actions"[\s\S]{0,120}href="\/app\/analise\/nome-social"/);
  });

  it('chat não adiciona bolha de resumo ao selecionar opção e container de nomes usa largura total', () => {
    const chatFile = path.join(srcRoot, 'frontend', 'components', 'app', 'chat', 'NomeSocialChat.tsx');
    const chatSrc = readFileSync(chatFile, 'utf8');
    assert.doesNotMatch(chatSrc, /buildPostSuggestionChoiceBlock/);
    assert.match(chatSrc, /if \(msg\.id\.startsWith\('sug-choice-'\)\) return null;/);
    assert.match(chatSrc, /eyebrow="OPÇÕES HARMONIZADAS"\s+className="!max-w-full"/);
  });

  it('painel lateral desktop usa título Painel de análise e bolinha dourada condicional na seleção', () => {
    const chromeFile = path.join(srcRoot, 'frontend', 'components', 'app', 'chat', 'ChatSidebarPanelChrome.tsx');
    const chromeSrc = readFileSync(chromeFile, 'utf8');
    assert.match(chromeSrc, /hasSelection\s*=\s*false/);
    assert.match(chromeSrc, /\{hasSelection\s*&&\s*\(/);
    assert.match(chromeSrc, /data-nm-selection-dot="true"/);
    assert.match(chromeSrc, /Painel de análise/);
    assert.doesNotMatch(chromeSrc, /Painel de leitura/i);

    const chatFile = path.join(srcRoot, 'frontend', 'components', 'app', 'chat', 'NomeSocialChat.tsx');
    const chatSrc = readFileSync(chatFile, 'utf8');
    assert.match(chatSrc, /<ChatSidebarPanelChrome[\s\S]*?hasSelection=\{Boolean\(activeSuggestionId\)\}/);
  });

  it('seções do painel de análise usam textos introdutórios sem tile escuro e exibem quantidade = N nos títulos', () => {
    const topicSrc = readFileSync(path.join(srcRoot, 'frontend', 'components', 'app', 'chat', 'ReadingTopicCard.tsx'), 'utf8');
    assert.match(topicSrc, /typeof count === 'number'/);
    assert.match(topicSrc, /=\s*\{count\}/);

    const summarySrc = readFileSync(path.join(srcRoot, 'frontend', 'components', 'app', 'chat', 'ChatReadingSummaryPanel.tsx'), 'utf8');
    assert.match(summarySrc, /title="Bloqueios energéticos"[\s\S]*?count=\{bloqueios\.length\}/);
    assert.match(summarySrc, /title="Débitos kármicos"[\s\S]*?count=\{debitosCarmicos\.length\}/);
    assert.match(summarySrc, /title="Lições kármicas"[\s\S]*?count=\{licoesCarmicas\.length\}/);
    assert.match(summarySrc, /title="Tendências ocultas"[\s\S]*?count=\{tendenciasOcultas\.length\}/);
    assert.match(summarySrc, /Bloqueios energéticos são sequências de três ou mais números repetidos/);

    const debtsSrc = readFileSync(path.join(srcRoot, 'frontend', 'components', 'app', 'KarmicDebts.tsx'), 'utf8');
    assert.doesNotMatch(debtsSrc, /nm-floating-tile/);
    assert.match(debtsSrc, /Débitos Kármicos \(números 13, 14, 16 e 19\)/);

    const lessonsSrc = readFileSync(path.join(srcRoot, 'frontend', 'components', 'app', 'KarmicLessons.tsx'), 'utf8');
    assert.doesNotMatch(lessonsSrc, /\{licoes\.length\} \{licoes\.length === 1 \? 'Lição Kármica'/);
    assert.match(lessonsSrc, /Lições Kármicas correspondem aos números de 1 a 9 que estão ausentes/);

    const hiddenSrc = readFileSync(path.join(srcRoot, 'frontend', 'components', 'app', 'HiddenTendencies.tsx'), 'utf8');
    assert.doesNotMatch(hiddenSrc, /\{tendencias\.length\} tendência\(s\) oculta\(s\)/);
    assert.match(hiddenSrc, /Tendências Ocultas surgem quando um mesmo número de 1 a 9 aparece 4 ou mais vezes/);

    const triSrc = readFileSync(path.join(srcRoot, 'frontend', 'components', 'app', 'TriangleVisualization.tsx'), 'utf8');
    assert.doesNotMatch(triSrc, /nm-vida-intro-container/);
    assert.match(triSrc, /w-12 h-12 rounded-full[\s\S]*?Arcano Regente \{arcanoInfo\.numero\} — \{arcanoInfo\.nome\}/);
  });
});
