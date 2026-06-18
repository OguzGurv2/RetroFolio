import { getWindows, type WindowTemplate } from "@/_config/portfolio";
import { useLocale } from "@/_i18n/LocaleContext";
import Link from "next/link";
import { sendGAEvent } from "@next/third-parties/google";
import { glitchIdleStyle } from "@/(mobile)/_constants/ui";
import { div } from "three/tsl";

function SectionCard({ section, index }: { section: WindowTemplate["sections"][number]; index: number }) {
  const subtitleStyle = glitchIdleStyle(index + 1) as React.CSSProperties;
  return (
    <div className="cyber-card mb-2">
      <div className="cyber-card-second-layer">
        {section.subtitleLink ? (
          <Link
            href={section.subtitleLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sendGAEvent("event", "link_click", { url: section.subtitleLink!, label: section.subtitle })}
            className="cyber-label text-[15px] tracking-wider mb-1 block underline decoration-[rgba(0,255,133,0.4)] underline-offset-2 text-glitch-idle"
            style={subtitleStyle}
          >
            {section.subtitle} ↗
          </Link>
        ) : (
          <p className="cyber-label text-[15px] tracking-wider mb-1 text-glitch-idle" style={subtitleStyle}>{section.subtitle}</p>
        )}
        {section.body.map((line, i) => {
          const link = section.bodyLinks?.find((bl) => bl.lineIndex === i);
          return link ? (
            <Link
              key={i}
              href={link.url}
              target={link.url.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => sendGAEvent("event", "link_click", { url: link.url, label: line })}
              className="cyber-dim text-[14px] leading-relaxed block underline decoration-[rgba(0,200,140,0.4)] underline-offset-2"
            >
              {line}
            </Link>
          ) : (
            <p key={i} className="cyber-dim text-[14px] leading-relaxed">{line}</p>
          );
        })}
      </div>
    </div>
  );
}

export function WindowContent({ id }: { id: string }) {
  const { locale } = useLocale();
  const win = getWindows(locale).find((w) => w.id === id)!;
  return (
    <div className="cyber-panel mb-3">
      <div className="cyber-panel-header mb-2">
        <span
          className="cyber-label tracking-[0.25em] text-[16px] text-glitch-idle"
          style={glitchIdleStyle(0) as React.CSSProperties}
        >{win.title}</span>
      </div>
      {win.sections.map((section, i) => (
        <SectionCard key={section.subtitle} section={section} index={i} />
      ))}
      {win.seeMoreLink && (
        <div className="cyber-card mt-2">
          <Link
          href={win.seeMoreLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendGAEvent("event", "link_click", { url: win.seeMoreLink!, label: "see_more" })}
          >
            <div className="cyber-card-second-layer w-full flex items-center justify-between"> 
                <span className="cyber-label text-[13px] tracking-[0.25em]">SEE MORE</span>
                <i className="bi bi-arrow-right cyber-label text-[1rem]" />
            </div>
          </Link>
      </div>
      )}
    </div>
  );
}
