import { useEffect, useMemo, useState } from "react";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(end: number, durationMs: number = 1200) {
  const safeEnd = useMemo(() => (Number.isFinite(end) ? end : 0), [end]);
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const startTime = performance.now();
    const start = 0;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutCubic(progress);
      setValue(start + (safeEnd - start) * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    setValue(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [safeEnd, durationMs]);

  return value;
}

