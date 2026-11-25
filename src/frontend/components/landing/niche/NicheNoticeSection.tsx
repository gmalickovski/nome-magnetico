import { landingSectionShellClass, landingSectionSpacingClass } from '../LandingSectionIntro.js';
import type { NichePageCopy } from './niche-types.js';

export interface NicheNoticeSectionProps {
  copy: NichePageCopy;
}

/**
 * Seção 6 das páginas de nicho: card informativo estático.
 * Renderizado apenas para Nome Artístico (contratos) e Nome do Bebê (registro sem prazos).
 */
export function NicheNoticeSection({ copy }: NicheNoticeSectionProps) {
  if (!copy.notice) return null;

  const isPastel = copy.id === 'bebe';
  const cardSurface = isPastel
    ? 'bg-gradient-to-br from-[#231d28] via-[#1c1b22] to-[#1a1f24]'
    : 'bg-[#1b1b20]';
  const eyebrowColor = isPastel ? 'text-[#f9a8d4]' : 'text-[#d7c6ff]';
  const bulletColor = isPastel ? 'bg-[#f9a8d4]' : 'bg-[#bea5ff]';

  return (
    <section id="aviso-nicho" className={`${landingSectionSpacingClass} bg-[#131313]`}>
      <div className={landingSectionShellClass}>
        <div
          className={`max-w-4xl mx-auto rounded-2xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.55)] ${cardSurface}`}
        >
          <p className={`text-xs uppercase tracking-[0.14em] font-semibold mb-3 ${eyebrowColor}`}>
            {copy.notice.eyebrow}
          </p>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#e5e2e1] mb-4">
            {copy.notice.title}
          </h2>
          <p className="text-base leading-relaxed text-[#c9c5c0] mb-6">{copy.notice.description}</p>
          <ul className="space-y-3">
            {copy.notice.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm sm:text-base text-[#e5e2e1]/90">
                <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${bulletColor}`} aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
