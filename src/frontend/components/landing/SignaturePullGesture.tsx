import React from 'react';

const GOLD = '#f2ca50';

interface SignaturePullGestureProps {
  /** Fire once when the product section enters the viewport */
  play: boolean;
  reducedMotion: boolean;
}

const DOTS = [
  { id: 'a', left: '18%', delay: '0ms' },
  { id: 'b', left: '50%', delay: '120ms' },
  { id: 'c', left: '82%', delay: '220ms' },
] as const;

/**
 * Quiet “pull” toward the signature: gap in a gold line closes once; faint dots meet the line.
 * Decorative only — no magnet icon, coin, or loop.
 */
export function SignaturePullGesture({ play, reducedMotion }: SignaturePullGestureProps) {
  const started = play && !reducedMotion;

  return (
    <div
      className="mt-5 md:mt-6 mb-1 w-full max-w-[min(100%,14rem)] sm:max-w-xs select-none mx-auto lg:mx-0"
      aria-hidden="true"
    >
      <style>
        {`
          @keyframes nm-sig-close-left {
            from { width: 42%; }
            to { width: 50%; }
          }
          @keyframes nm-sig-close-right {
            from { width: 42%; }
            to { width: 50%; }
          }
          @keyframes nm-sig-dot-settle {
            from {
              transform: translate(-50%, -11px);
              opacity: 0.12;
            }
            to {
              transform: translate(-50%, 0);
              opacity: 0.32;
            }
          }
          .nm-sig-left-animate {
            animation: nm-sig-close-left 900ms ease-out forwards;
          }
          .nm-sig-right-animate {
            animation: nm-sig-close-right 900ms ease-out forwards;
          }
          .nm-sig-dot-animate {
            animation: nm-sig-dot-settle 850ms ease-out forwards;
          }
        `}
      </style>

      <div className="relative h-8 w-full">
        {DOTS.map((dot) => (
          <span
            key={dot.id}
            className={`absolute top-[1.125rem] w-1 h-1 rounded-full -translate-x-1/2 ${
              reducedMotion
                ? 'opacity-[0.32]'
                : started
                  ? 'nm-sig-dot-animate opacity-[0.12]'
                  : 'opacity-[0.12] -translate-y-[11px]'
            }`}
            style={{
              left: dot.left,
              backgroundColor: GOLD,
              animationDelay: started ? dot.delay : undefined,
            }}
          />
        ))}

        <div className="absolute left-0 right-0 top-[1.125rem] h-px">
          <span
            className={`absolute left-0 top-0 h-px ${
              reducedMotion
                ? 'w-1/2'
                : started
                  ? 'nm-sig-left-animate w-[42%]'
                  : 'w-[42%]'
            }`}
            style={{ backgroundColor: GOLD }}
          />
          <span
            className={`absolute right-0 top-0 h-px ${
              reducedMotion
                ? 'w-1/2'
                : started
                  ? 'nm-sig-right-animate w-[42%]'
                  : 'w-[42%]'
            }`}
            style={{ backgroundColor: GOLD }}
          />
        </div>
      </div>
    </div>
  );
}
