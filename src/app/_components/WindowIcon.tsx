import Image from "next/image";

/**
 * WindowIcon
 *
 * Renders a section icon from one of two sources:
 *
 *   Bootstrap Icons class  →  "bi-person-fill"
 *     Pass the class name directly. Browse icons at https://icons.getbootstrap.com
 *
 *   Custom image from /public  →  "/icons/my-icon.svg"
 *     Place your image inside the /public folder and pass the path starting with "/".
 *     Supports any format: SVG, PNG, WebP, etc.
 */

interface WindowIconProps {
  /** Bootstrap Icons class name (e.g. "bi-person-fill") OR a /public path (e.g. "/icons/star.svg") */
  icon: string;
  /** Tailwind font-size class applied to Bootstrap icons, e.g. "text-[2rem]" */
  size?: string;
  className?: string;
}

export default function WindowIcon({ icon, size = "text-[2rem]", className = "" }: WindowIconProps) {
  const isCustom = icon.startsWith("/");

  if (isCustom) {
    return (
      <Image
        src={icon}
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        className={`object-contain cyber-label-filter ${className}`}
        style={{
          filter: "drop-shadow(0 0 8px rgba(0,255,133,0.65)) brightness(0) saturate(100%) invert(78%) sepia(60%) saturate(400%) hue-rotate(95deg)",
        }}
      />
    );
  }

  return (
    <i
      className={`bi ${icon} ${size} cyber-label ${className}`}
      style={{ filter: "drop-shadow(0 0 8px rgba(0,255,133,0.65))" }}
    />
  );
}
