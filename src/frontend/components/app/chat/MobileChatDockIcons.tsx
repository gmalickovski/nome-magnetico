import React from 'react';

const STROKE = 1.75;

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

export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 18 6-6-6-6" />
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

export function IconFileDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M12 18v-6" />
      <path d="m9 15 3 3 3-3" />
    </Svg>
  );
}

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
    | 'panel-right'
    | 'rotate-ccw'
    | 'sparkles'
    | 'file-down'
    | 'share'
    | 'lock-open'
): React.FC<IconProps> {
  switch (icon) {
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
