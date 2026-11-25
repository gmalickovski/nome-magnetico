import React from 'react';
import { IconAnalises, IconGlossario, IconInicio, IconSuporte } from '../app/AppNavDockIcons';

type IconProps = { className?: string };

const STROKE = 1.5;

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function IconUsers({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function IconAssinaturas({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </Svg>
  );
}

function IconBilling({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </Svg>
  );
}

function IconPromocoes({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" />
    </Svg>
  );
}

function IconMonitor({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </Svg>
  );
}

function IconFaq({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

function IconBlog({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </Svg>
  );
}

function IconMensagens({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
  );
}

function IconAnalista({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </Svg>
  );
}

function IconConfig({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M21 4h-7" />
      <path d="M10 4H3" />
      <path d="M21 12h-9" />
      <path d="M8 12H3" />
      <path d="M21 20h-5" />
      <path d="M12 20H3" />
      <path d="M14 2v4" />
      <path d="M8 10v4" />
      <path d="M16 18v4" />
    </Svg>
  );
}

export function IconMais({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </Svg>
  );
}

export function IconSair({ className = 'h-5 w-5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Svg>
  );
}

const ICONS: Record<string, React.FC<IconProps>> = {
  '/': IconInicio,
  '/users': IconUsers,
  '/subscriptions': IconAssinaturas,
  '/billing': IconBilling,
  '/promocoes': IconPromocoes,
  '/glossario': IconGlossario,
  '/monitor': IconMonitor,
  '/faq': IconFaq,
  '/support': IconSuporte,
  '/blog': IconBlog,
  '/mensagens': IconMensagens,
  '/analise': IconAnalista,
  '/settings': IconConfig,
};

/** Ícone da rota do admin (mesma família Lucide e traço do `AppNavDockIcons`). */
export function OpsNavIcon({ href, className }: { href: string; className?: string }) {
  const Icon = ICONS[href] ?? IconAnalises;
  return <Icon className={className} />;
}
