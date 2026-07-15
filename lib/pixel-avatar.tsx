import { randomUUID } from "crypto";
import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type BrutalSize = "sm" | "md" | "lg" | "xl";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PALETTE = [
  "#FFD440",
  "#FE7DA8",
  "#27CCF3",
  "#F97264",
  "#BBAFE6",
  "#A9D877",
  "#141111",
  "transparent",
];

export function generatePixelGrid(seed: string): number[] {
  const h = hashString(seed);
  const grid: number[] = [];
  for (let i = 0; i < 64; i++) {
    grid.push((h >> i) % PALETTE.length);
  }
  return grid;
}

export function pixelAvatarSVG(
  seed: string,
  options: { size?: number; title?: string } = {}
): string {
  const size = options.size ?? 64;
  const title = options.title ?? seed;
  const grid = generatePixelGrid(seed);
  const cells = grid
    .map((idx, i) => {
      if (idx === PALETTE.length - 1) return "";
      const x = i % 8;
      const y = Math.floor(i / 8);
      return `<rect x="${x*8}" y="${y*8}" width="8" height="8" fill="${PALETTE[idx]}"/>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" style="display:block"><title>${title}</title><rect width="64" height="64" fill="#fff" rx="4" ry="4" stroke="#141111" stroke-width="2"/>${cells}</svg>`;
}

type PixelAvatarProps = HTMLAttributes<HTMLSpanElement> & {
  seed: string;
  name: string;
  size?: number;
  className?: string;
  rounded?: boolean;
};

export function PixelAvatar({
  seed,
  name,
  size = 40,
  className,
  rounded = true,
  ...props
}: PixelAvatarProps) {
  const svg = pixelAvatarSVG(seed, { size, title: name });
  return (
    <span
      className={clsx(className, "relative")}
      {...props}
    >
      <span
        style={{
          display: "inline-block",
          width: size,
          height: size,
          border: "2px solid #141111",
          borderRadius: rounded ? 6 : 0,
          overflow: "hidden",
          lineHeight: 0,
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </span>
  );
}

export { hashString, PALETTE };
