"use client";

import { MOBILE_NAV_ITEMS } from "@/_config/portfolio";
import WindowIcon from "@/_components/WindowIcon";

interface BottomNavProps {
  activeId: string;
  onNavigate: (id: string) => void;
}

export function BottomNav({ activeId, onNavigate }: BottomNavProps) {
  return (
    <nav className="cyber-dock relative flex items-center justify-around px-2 pt-3 pb-8">
      <div className="cyber-scanlines pointer-events-none" />
      {MOBILE_NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.id)}
          className={`cyber-nav-btn flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer ${activeId === item.id ? "cyber-nav-btn--active" : ""}`}
          aria-label={item.label}
        >
          <WindowIcon icon={item.icon} size="text-[1.375rem]" />
        </button>
      ))}
    </nav>
  );
}