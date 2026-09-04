import Image from "next/image";

/* The horizontal negative lockup: outlined symbol plus wordmark, white on
   transparent. It carries the brand name itself, so the topbar no longer sets
   "AutoMind" as separate type next to it — that would print the name twice.
   Sized by CSS (.topbar-logo) rather than by a prop, so the totem tiers can
   scale it the way they scale everything else. */
export function BrandMark() {
  return (
    <Image
      className="topbar-logo"
      src="/brand/automind-horizontal-white.png"
      alt="AutoMind"
      width={207}
      height={34}
      priority
    />
  );
}
