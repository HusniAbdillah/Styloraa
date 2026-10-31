import Image from "next/image";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/stylora-logo.svg"
      alt="Stylora"
      width={162}
      height={54}
      className={className}
      unoptimized
    />
  );
}
