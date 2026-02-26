import Image from "next/image";

// ─── Logo oficial Lumio ───────────────────────────────────────────────────────
// Usa Lumio-sinFondo-Negro.png (isotipo negro sobre transparente)
// + wordmark "Lumio" en Space Grotesk Semibold alineado verticalmente.

type LogoSize = "sm" | "md" | "lg";

// Altura del isotipo en píxeles por tamaño
const imgHeight: Record<LogoSize, number> = { sm: 20, md: 24, lg: 30 };
// Ancho proporcional (el isotipo triangular es ligeramente más ancho que alto)
const imgWidth:  Record<LogoSize, number> = { sm: 24, md: 29, lg: 36 };

const wordSize: Record<LogoSize, string> = {
  sm: "text-[15px]",
  md: "text-[18px]",
  lg: "text-[21px]",
};

interface LumioLogoProps {
  size?: LogoSize;
  className?: string;
}

/** Logo completo: isotipo PNG + wordmark "Lumio" en Space Grotesk Semibold. */
export default function LumioLogo({ size = "md", className }: LumioLogoProps) {
  const h = imgHeight[size];
  const w = imgWidth[size];
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/Lumio-sinFondo-Negro.png"
        alt="Lumio"
        height={h}
        width={w}
        className="object-contain"
        priority
      />
      <span
        className={`font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] ${wordSize[size]} font-semibold leading-none tracking-[-0.03em] text-dominant`}
      >
        Lumio
      </span>
    </div>
  );
}

/** Solo el isotipo SVG — mantenido como named export para compatibilidad. */
export function LumioMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 6 40 35"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="m7.839 40.783 16.03-28.054L20 6 0 40.783h7.839Zm8.214 0H40L27.99 19.894l-4.02 7.032 3.976 6.914H20.02l-3.967 6.943Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
