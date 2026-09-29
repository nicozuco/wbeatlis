import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/atlis-mark.png"
      alt=""
      width={1254}
      height={1254}
      sizes="44px"
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/atlis-logo-white.png"
      alt="Atlis"
      width={2172}
      height={724}
      sizes="160px"
      className={cn("brand-logo h-auto shrink-0 object-contain", className)}
    />
  );
}
