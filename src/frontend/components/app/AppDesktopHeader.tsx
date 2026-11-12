import React, { type ReactNode } from 'react';
import AvatarMenu from './AvatarMenu.js';
import { useDesktopHeaderSnapshot } from '../../lib/desktop-header-store.js';
import { getScoreTierVisual } from '../landing/ProductResultFrame.js';

export interface AppDesktopHeaderProps {
  nome: string;
  isAdmin?: boolean;
  children?: ReactNode;
}

export function AppDesktopHeader({ nome, isAdmin, children }: AppDesktopHeaderProps) {
  const snapshot = useDesktopHeaderSnapshot();
  const hasProgress = Boolean(snapshot.progress);

  const percent = snapshot.progress
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (snapshot.progress.currentStep / Math.max(snapshot.progress.totalSteps, 1)) * 100
          )
        )
      )
    : 0;

  const displayPercent = percent === 0 ? 0 : Math.max(5, percent);
  const visual = getScoreTierVisual(displayPercent);

  return (
    <header className="app-fixed-header fixed top-0 right-0 left-20 z-40 hidden h-14 border-b border-[#D4AF37]/15 bg-[#111111]/95 backdrop-blur-md md:flex md:items-center px-4 md:px-5">
      <div className="relative flex w-full h-full items-center justify-between min-w-0">
        {/* Logotipo do Nome Magnético com transição suave entre centro e esquerda */}
        <a
          href="/app"
          className={`absolute top-1/2 -translate-y-1/2 flex items-center z-20 transition-all duration-500 ease-out hover:opacity-85 ${
            hasProgress ? 'left-4 md:left-5 translate-x-0' : 'left-1/2 -translate-x-1/2'
          }`}
          aria-label="Ir para Dashboard"
        >
          <img
            src="/logo-nm-header.svg"
            alt="Nome Magnético"
            className="h-8 md:h-9 w-auto select-none"
          />
        </a>

        {/* Espaçador dinâmico à esquerda que reserva espaço para o logo quando deslocado */}
        <div
          className="shrink-0 transition-all duration-500 ease-out pointer-events-none"
          style={{ width: hasProgress ? '185px' : '0px' }}
          aria-hidden="true"
        />

        {/* Barra de Progresso auto-ajustável (flex-1) */}
        <div className="flex-1 min-w-0 flex items-center justify-center px-2 md:px-4">
          <div
            className={`w-full max-w-2xl flex items-center gap-3 rounded-full bg-[#131313] border border-[#D4AF37]/25 px-3 sm:px-4 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out ${
              hasProgress
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 pointer-events-none -translate-y-2'
            }`}
            style={{ display: hasProgress ? 'flex' : 'none' }}
          >
            <span
              className="shrink-0 text-xs sm:text-sm font-semibold tabular-nums w-9 sm:w-10 text-right"
              style={{ color: visual.text }}
              aria-live="polite"
            >
              {percent}%
            </span>
            <div
              className="h-2.5 sm:h-3 min-w-0 flex-1 rounded-full bg-white/10 overflow-hidden"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso da análise"
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${visual.barGradient} transition-all duration-500 ease-out`}
                style={{ width: `${percent === 0 ? 0 : Math.max(displayPercent, 2)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bloco à direita: Ações acumuladas lado a lado e Avatar encostado na borda */}
        <div className="shrink-0 flex items-center gap-2.5 md:gap-3 z-20">
          {children ? <div className="flex items-center gap-2">{children}</div> : null}
          {snapshot.actions ? (
            <div className="flex items-center gap-2">{snapshot.actions}</div>
          ) : null}
          <div className="flex items-center">
            <AvatarMenu nome={nome} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppDesktopHeader;
