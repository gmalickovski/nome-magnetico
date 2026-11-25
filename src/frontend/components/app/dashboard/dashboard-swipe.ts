/** One horizontal touch gesture; a vertical scroll or multi-touch stays native. */
export function createDashboardSwipe() {
  const pointers = new Set<number>();
  let origin: { id: number; x: number; y: number } | null = null;
  let axis: 'x' | 'y' | null = null;
  let blocked = false;
  let suppressClick = false;
  return {
    start(id: number, x: number, y: number, eligible = true) {
      if (pointers.size === 0) { blocked = !eligible; axis = null; suppressClick = false; }
      pointers.add(id);
      if (pointers.size > 1) { blocked = true; origin = null; return; }
      origin = eligible ? { id, x, y } : null;
    },
    move(id: number, x: number, y: number): boolean {
      if (!origin || blocked || origin.id !== id) return false;
      const dx = Math.abs(x - origin.x), dy = Math.abs(y - origin.y);
      if (!axis && Math.max(dx, dy) >= 10) axis = dx > dy * 1.3 ? 'x' : 'y';
      return axis === 'x';
    },
    end(id: number, x: number, y: number): 'next' | 'prev' | null {
      pointers.delete(id);
      if (!origin || blocked || origin.id !== id) return null;
      const dx = x - origin.x, dy = y - origin.y;
      const horizontal = axis === 'x' && Math.abs(dx) > Math.abs(dy) * 1.3;
      suppressClick = axis === 'x';
      origin = null;
      return horizontal && Math.abs(dx) >= 48 ? (dx < 0 ? 'next' : 'prev') : null;
    },
    cancel(id: number) { pointers.delete(id); origin = null; blocked = true; suppressClick = false; },
    consumeClick(): boolean { const result = suppressClick; suppressClick = false; return result; },
  };
}
