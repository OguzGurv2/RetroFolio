"use client";

import { OS_BUILD_ID, OS_VERSION } from "@/_constants/version";
import { OWNER } from "@/_config/owner";

export function TopBar() {
  return (
    <div className="cyber-statusbar flex items-center justify-center text-[12px] tracking-widest">
      <span className="cyber-label">{OWNER.osName} v{OS_VERSION} [{OS_BUILD_ID}]</span>
    </div>
  );
}
