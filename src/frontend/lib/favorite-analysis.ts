export const FAVORITE_ANALYSIS_STORAGE_PREFIX = 'nm:favorite-analysis:v1:';
export const FAVORITE_ANALYSIS_CHANGE_EVENT = 'nm:favorite-analysis-change';

export function favoriteAnalysisStorageKey(userId: string): string {
  return `${FAVORITE_ANALYSIS_STORAGE_PREFIX}${userId}`;
}

export function isFreeAnalysisRecord(item: {
  isFree?: boolean | null;
  is_free?: boolean | null;
  productType?: string | null;
  product_type?: string | null;
}): boolean {
  return Boolean(
    item.isFree === true ||
      item.is_free === true ||
      item.productType === 'analise_gratuita' ||
      item.product_type === 'analise_gratuita',
  );
}

export function getStoredFavoriteAnalysisId(userId?: string | null): string | null {
  if (!userId || typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(favoriteAnalysisStorageKey(userId));
    return raw && raw.trim().length > 0 ? raw.trim() : null;
  } catch {
    return null;
  }
}

export function setStoredFavoriteAnalysisId(userId: string, analysisId: string | null): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    const key = favoriteAnalysisStorageKey(userId);
    if (analysisId) {
      localStorage.setItem(key, analysisId);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore storage quota / privacy mode */
  }
  try {
    window.dispatchEvent(
      new CustomEvent(FAVORITE_ANALYSIS_CHANGE_EVENT, {
        detail: { userId, analysisId },
      }),
    );
  } catch {
    /* ignore */
  }
}

export async function persistFavoriteAnalysis(
  userId: string,
  analysisId: string | null,
): Promise<boolean> {
  setStoredFavoriteAnalysisId(userId, analysisId);
  try {
    const res = await fetch('/api/analyses/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ analysisId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function orderSlidesWithFavorite<T extends { id: string; isFree?: boolean }>(
  slides: readonly T[],
  favoriteId: string | null,
): T[] {
  if (!favoriteId || slides.length <= 1) return [...slides];
  const idx = slides.findIndex((s) => s.id === favoriteId && !s.isFree);
  if (idx <= 0) return [...slides];
  const fav = slides[idx];
  return [fav, ...slides.slice(0, idx), ...slides.slice(idx + 1)];
}
