import type { SVGProps } from "react";

// Icônes de marque inlinées en `currentColor` pour pouvoir les teinter
// facilement (blanc sur Discord, or sur Google…).

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** Couleurs officielles Discord, partagées par tous les CTA de la marque. */
export const DISCORD_BUTTON_CLASS =
  "border-[#5865F2] bg-[#5865F2] bg-none text-[#fff] shadow-[0_8px_24px_-12px_rgba(88,101,242,0.9)] hover:border-[#4752C4] hover:bg-[#4752C4] hover:text-[#fff] focus-visible:ring-[#5865F2]/70";

/** X n'emploie que le noir et le blanc dans son kit de marque. */
export const X_BUTTON_CLASS =
  "border-white/30 bg-black bg-none text-white shadow-[0_8px_24px_-12px_rgba(255,255,255,0.35)] hover:border-white hover:bg-white hover:text-black focus-visible:ring-white/60";

/** Symbole Discord officiel : https://discord.com/branding */
export function DiscordIcon({ size = 16, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 59 44" fill="currentColor" aria-hidden className={className} {...props}>
      <path d="M37.1937 0C36.6265 1.0071 36.1172 2.04893 35.6541 3.11392C31.2553 2.45409 26.7754 2.45409 22.365 3.11392C21.9136 2.04893 21.3926 1.0071 20.8254 0C16.6928 0.70613 12.6644 1.94475 8.84436 3.69271C1.27372 14.9098 -0.775214 25.8374 0.243466 36.6146C4.67704 39.8906 9.6431 42.391 14.9333 43.9884C16.1256 42.391 17.179 40.6893 18.0819 38.9182C16.3687 38.2815 14.7133 37.4828 13.1274 36.5567C13.5442 36.2557 13.9493 35.9432 14.3429 35.6422C23.6384 40.0179 34.4039 40.0179 43.711 35.6422C44.1046 35.9663 44.5097 36.2789 44.9264 36.5567C43.3405 37.4943 41.6852 38.2815 39.9604 38.9298C40.8633 40.7009 41.9167 42.4025 43.109 44C48.3992 42.4025 53.3653 39.9137 57.7988 36.6377C59.0027 24.1358 55.7383 13.3007 49.1748 3.70429C45.3663 1.95633 41.3379 0.717706 37.2053 0.0231518L37.1937 0ZM19.3784 29.9816C16.5192 29.9816 14.1461 27.3886 14.1461 24.1821C14.1461 20.9755 16.4266 18.371 19.3669 18.371C22.3071 18.371 24.6455 20.9871 24.5992 24.1821C24.5529 27.377 22.2956 29.9816 19.3784 29.9816ZM38.6639 29.9816C35.7931 29.9816 33.4431 27.3886 33.4431 24.1821C33.4431 20.9755 35.7236 18.371 38.6639 18.371C41.6042 18.371 43.9309 20.9871 43.8846 24.1821C43.8383 27.377 41.581 29.9816 38.6639 29.9816Z" />
    </svg>
  );
}

/** Logo X officiel : https://about.x.com/en/who-we-are/brand-toolkit */
export function XIcon({ size = 16, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className} {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function GoogleIcon({ size = 16, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className} {...props}>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}

/** Rendu générique d'une marque connue. */
export function BrandIcon({ brand, size, className }: { brand: "discord" | "google" } & IconProps) {
  return brand === "discord" ? <DiscordIcon size={size} className={className} /> : <GoogleIcon size={size} className={className} />;
}
