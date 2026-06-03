"use client";

import { useEffect, useRef, useState } from "react";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  return now;
}

/** Randomly fires the glitch animation on the target element. */
function useRandomGlitch<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    let outerTimeout: ReturnType<typeof setTimeout>;
    let innerTimeout: ReturnType<typeof setTimeout>;

    function schedule() {
      const delay = 4000 + Math.random() * 10000;
      outerTimeout = setTimeout(() => {
        const el = ref.current;
        if (el) {
          el.classList.add("text-glitch-idle");
          innerTimeout = setTimeout(() => {
            el.classList.remove("text-glitch-idle");
            schedule();
          }, 8000);
        } else {
          schedule();
        }
      }, delay);
    }

    schedule();
    return () => {
      clearTimeout(outerTimeout);
      clearTimeout(innerTimeout);
    };
  }, []);
  return ref;
}

const DAYS   = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
function pad(n: number) { return String(n).padStart(2, "0"); }

export function Clock() {
  const now = useClock();
  const h = pad(now.getHours()), m = pad(now.getMinutes());
  const s = now.getSeconds();
  const dateRef = useRandomGlitch<HTMLSpanElement>();
  return (
    <div className="flex flex-col items-center gap-1 py-3">
      <div className="relative w-52 h-52">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0,255,133,0.08)" strokeWidth="4" />
          <circle
            cx="50" cy="50" r="44" fill="none"
            stroke="#00ff85" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${276 * (s / 60)} 276`}
            style={{ filter: "drop-shadow(0 0 4px #00ff85)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="cyber-label text-[2.72rem] tracking-[0.12em] leading-none">{h}:{m}</span>
          <span
            ref={dateRef}
            className="cyber-label text-[13px] tracking-[0.35em] mt-1"
            style={{ "--glow": "0 0 6px rgba(0,255,133,0.4)" } as React.CSSProperties}
          >
            {DAYS[now.getDay()]} {pad(now.getDate())} {MONTHS[now.getMonth()]}
          </span>
        </div>
      </div>
    </div>
  );
}
