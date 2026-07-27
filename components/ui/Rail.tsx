"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Horizontal scroller used by the showcase gallery and the comparison strip.
// Native scroll + snap does the work; this only adds the affordances the bare
// scrollbar was missing - arrows, edge fades and a progress bar.
export default function Rail({
  children,
  label,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [progress, setProgress] = useState(0);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= max - 2);
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  }, []);

  useEffect(() => {
    sync();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync]);

  // One card per click, so the snap points stay aligned.
  const step = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const by = first ? first.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * by, behavior: "smooth" });
  };

  const scrollable = !(atStart && atEnd);

  return (
    <div className={`rail ${className}`.trim()} data-start={atStart} data-end={atEnd}>
      <div className="rail-track" ref={ref} onScroll={sync} tabIndex={0} aria-label={label}>
        {children}
      </div>

      {scrollable && (
        <div className="rail-ctl">
          <div className="rail-prog" aria-hidden="true">
            <i style={{ transform: `scaleX(${Math.max(progress, 0.06)})` }} />
          </div>
          <div className="rail-btns">
            <button
              type="button"
              className="rail-btn"
              onClick={() => step(-1)}
              disabled={atStart}
              aria-label="Ver anteriores"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="m14 6-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              className="rail-btn"
              onClick={() => step(1)}
              disabled={atEnd}
              aria-label="Ver próximos"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="m10 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
