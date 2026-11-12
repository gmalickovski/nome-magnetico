import { useEffect, useState } from 'react';

export function useViewportInnerWidth(): number {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 390
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}
