import React from 'react';
import { MapDownloadIcon } from '../MapDownloadIcon.js';

const STROKE = 1.5;

type IconProps = { className?: string };

function Svg({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m15 18-6-6 6-6" />
    </Svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

export function IconScrollText(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 12h5" />
      <path d="M15 8h5" />
      <path d="M15 16h5" />
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" />
    </Svg>
  );
}

export function IconPanelBottomOpen(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 14h18" />
      <path d="M12 3v11" />
      <path d="m8 7 4-4 4 4" />
    </Svg>
  );
}

export function IconMoreHorizontal(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconPanelRight(props: IconProps) {
  return (
    <Svg {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
    </Svg>
  );
}

export function IconRotateCcw(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </Svg>
  );
}

export function IconSparkles(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </Svg>
  );
}

export const IconFileDown = MapDownloadIcon;

export function IconShare(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2v13" />
      <path d="m16 6-4-4-4 4" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    </Svg>
  );
}

export function IconLockOpen(props: IconProps) {
  return (
    <Svg {...props}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </Svg>
  );
}

export function dockIconFor(
  icon:
    | 'scroll-text'
    | 'panel-right'
    | 'rotate-ccw'
    | 'sparkles'
    | 'file-down'
    | 'share'
    | 'lock-open'
): React.FC<IconProps> {
  switch (icon) {
    case 'scroll-text':
      return IconScrollText;
    case 'panel-right':
      return IconPanelRight;
    case 'rotate-ccw':
      return IconRotateCcw;
    case 'sparkles':
      return IconSparkles;
    case 'file-down':
      return IconFileDown;
    case 'share':
      return IconShare;
    case 'lock-open':
      return IconLockOpen;
    default:
      return IconPanelRight;
  }
}
