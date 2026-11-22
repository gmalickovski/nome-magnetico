import React from 'react';
import { MOCKUP_THEMES, type MockupDevice, type MockupTheme } from './types.js';

export interface DeviceFrameProps {
  variant?: MockupDevice;
  theme?: MockupTheme;
  url?: string;
  /** Conteúdo específico da moldura de celular (usa `children` se omitido). */
  phoneContent?: React.ReactNode;
  /** Conteúdo específico da moldura de desktop (usa `children` se omitido). */
  desktopContent?: React.ReactNode;
  /** Conteúdo padrão quando não há separação entre desktop e celular. */
  children?: React.ReactNode;
  /** Texto alternativo resumido fora do bloco `aria-hidden`, para leitores de tela. */
  srSummary?: string;
  className?: string;
}

function PhoneChassis({
  theme,
  children,
  className = '',
  elevated = false,
}: {
  theme: MockupTheme;
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}) {
  const tokens = MOCKUP_THEMES[theme];

  return (
    <div
      className={`w-full aspect-[390/844] rounded-[2.45rem] bg-[#0b0b0b] p-[7px] sm:p-[8px] ring-1 ring-white/[0.12] ${
        elevated
          ? 'shadow-[0_26px_64px_rgba(0,0,0,0.82)]'
          : 'shadow-[0_20px_50px_rgba(0,0,0,0.65)]'
      } ${className}`}
    >
      <div
        className="relative flex flex-col w-full h-full rounded-[2rem] overflow-hidden ring-1 ring-white/[0.07]"
        style={{ backgroundColor: tokens.screenBgHex }}
      >
        {/* Brilho ambiente sutil do tema */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: tokens.ambientGlow }}
        />

        {/* Barra de status + notch suave */}
        <div className="relative z-10 shrink-0 px-4 pt-2.5 pb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-inter font-medium tracking-tight text-[#e5e2e1]/75 tabular-nums">
            9:41
          </span>
          <div className="h-[15px] w-[70px] rounded-full bg-[#070707] ring-1 ring-white/[0.06]" />
          <div className="flex items-center gap-1 text-[#e5e2e1]/65">
            <svg className="w-3 h-2.5" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
              <rect x="0" y="7" width="2.5" height="5" rx="0.8" />
              <rect x="4" y="5" width="2.5" height="7" rx="0.8" />
              <rect x="8" y="2.5" width="2.5" height="9.5" rx="0.8" />
              <rect x="12" y="0" width="2.5" height="12" rx="0.8" opacity="0.45" />
            </svg>
            <svg className="w-4 h-2.5" viewBox="0 0 20 11" fill="none" aria-hidden="true">
              <rect
                x="0.75"
                y="1"
                width="16"
                height="9"
                rx="2.2"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect x="2.3" y="2.5" width="11.5" height="6" rx="1" fill="currentColor" />
              <rect x="17.8" y="3.5" width="1.6" height="4" rx="0.8" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Tela interna */}
        <div className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </div>

        {/* Home indicator discreto */}
        <div className="relative z-10 shrink-0 py-1.5 flex justify-center">
          <div className="h-[3.5px] w-[80px] rounded-full bg-[#e5e2e1]/20" />
        </div>
      </div>
    </div>
  );
}

function DesktopBrowser({
  theme,
  url,
  children,
  className = '',
  shellHeightClass = 'min-h-[450px] sm:min-h-[485px]',
}: {
  theme: MockupTheme;
  url: string;
  children: React.ReactNode;
  className?: string;
  shellHeightClass?: string;
}) {
  const tokens = MOCKUP_THEMES[theme];

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden ring-1 ring-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.62)] flex flex-col ${shellHeightClass} ${className}`}
      style={{ backgroundColor: tokens.screenBgHex }}
    >
      {/* Barra superior do navegador (separada por degrau tonal, sem borda 1px sólida) */}
      <div className="shrink-0 bg-[#181818] px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#76746a]/65" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#bea5ff]/45" />
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-[#111111] px-3.5 py-1 text-[11px] font-inter text-[#e5e2e1]/75 ring-1 ring-white/[0.06] max-w-[240px] truncate">
          <svg
            className="w-3 h-3 shrink-0 opacity-70"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="3.2" y="7.2" width="9.6" height="6.8" rx="1.6" />
            <path d="M5.2 7.2V5.3a2.8 2.8 0 0 1 5.6 0v1.9" />
          </svg>
          <span className="truncate">{url}</span>
        </div>

        <span
          className="hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-inter font-medium shrink-0"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            color: tokens.accentHex,
          }}
        >
          {tokens.badgeLabel}
        </span>
      </div>

      {/* Área da página desktop */}
      <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: tokens.ambientGlow }}
        />
        <div className="relative z-10 flex-1 min-h-0 flex flex-col">{children}</div>
      </div>
    </div>
  );
}

/**
 * Moldura responsiva de celular (390x844), desktop ou composição combinada (`both`).
 * Abaixo de 768 px, o modo `both` exibe apenas o celular.
 */
export function DeviceFrame({
  variant = 'both',
  theme = 'social',
  url = 'nomemagnetico.com.br',
  phoneContent,
  desktopContent,
  children,
  srSummary,
  className = '',
}: DeviceFrameProps) {
  const resolvedPhone = phoneContent ?? children;
  const resolvedDesktop = desktopContent ?? children;

  return (
    <div className={`w-full min-w-0 ${className}`}>
      {srSummary ? <p className="sr-only">{srSummary}</p> : null}

      <div aria-hidden="true" className="select-none pointer-events-none w-full min-w-0">
        {variant === 'phone' ? (
          <div className="w-full max-w-[290px] sm:max-w-[308px] mx-auto">
            <PhoneChassis theme={theme}>{resolvedPhone}</PhoneChassis>
          </div>
        ) : null}

        {variant === 'desktop' ? (
          <div className="w-full max-w-[880px] mx-auto">
            <DesktopBrowser theme={theme} url={url}>
              {resolvedDesktop}
            </DesktopBrowser>
          </div>
        ) : null}

        {variant === 'both' ? (
          <>
            {/* Abaixo de 768 px: somente celular */}
            <div className="md:hidden w-full max-w-[290px] mx-auto">
              <PhoneChassis theme={theme}>{resolvedPhone}</PhoneChassis>
            </div>

            {/* >= 768 px: desktop atrás e celular deslocado à frente */}
            <div className="hidden md:block relative w-full max-w-[960px] mx-auto pb-10 lg:pb-12 pr-1">
              <div className="w-[82%] lg:w-[83%]">
                <DesktopBrowser
                  theme={theme}
                  url={url}
                  shellHeightClass="h-[472px] lg:h-[512px]"
                >
                  {resolvedDesktop}
                </DesktopBrowser>
              </div>

              <div className="absolute right-0 bottom-0 w-[212px] lg:w-[238px] z-10">
                <PhoneChassis theme={theme} elevated>
                  {resolvedPhone}
                </PhoneChassis>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default DeviceFrame;
