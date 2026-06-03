import type { ReactNode } from "react";
import { BG } from "@/(desktop)/_constants/crt";

/**
 * Shared CRT viewport shell used by loading/login/desktop canvases.
 *
 * Why this exists:
 * - Centralizes sizing + clipping rules for all CRT screens
 * - Hides barrel-distortion corner artifacts with a small overscan bleed
 * - Keeps scene components focused on drawing, not layout scaffolding
 */

interface CRTScreenProps {
  children: ReactNode;
  /** Overscan bleed class. Defaults to landscape (desktop) values. */
  overscanClass?: string;
}

const ROOT_CLASS = "relative h-screen w-full overflow-hidden";

// Landscape default — wider bleed is horizontal.
const DEFAULT_OVERSCAN = "absolute -left-[4px] -right-[4px] -top-[2px] -bottom-[2px]";

export default function CRTScreen({ children, overscanClass = DEFAULT_OVERSCAN }: CRTScreenProps) {
  return (
    <div className={ROOT_CLASS} style={{ backgroundColor: BG }}>
      <div className={overscanClass}>{children}</div>
    </div>
  );
}
