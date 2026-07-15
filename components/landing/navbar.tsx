"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PixelAvatar } from "@/lib/pixel-avatar";

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 h-[62px] bg-brutal-yellow border-b-2 border-brutal-black flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <PixelAvatar seed="helm-logo" name="Helm" size={36} />
          <span className="font-display font-bold text-lg tracking-tight text-brutal-black">
            HELM
          </span>
        </Link>
        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="font-display font-bold text-xs uppercase tracking-wide text-brutal-black hover:text-brutal-pink-600">Features</Link>
          <Link href="#how" className="font-display font-bold text-xs uppercase tracking-wide text-brutal-black hover:text-brutal-pink-600">How</Link>
          <Link href="#pricing" className="font-display font-bold text-xs uppercase tracking-wide text-brutal-black hover:text-brutal-pink-600">Pricing</Link>
          <Link href="#faq" className="font-display font-bold text-xs uppercase tracking-wide text-brutal-black hover:text-brutal-pink-600">FAQ</Link>
        </nav>
        {/* Right */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] bg-brutal-black text-brutal-yellow px-2 py-1 border-2 border-brutal-black hidden sm:inline-block">ES</span>
          <Link href="/sign-in">
            <Button variant="ghost" className="h-8 px-3 font-display font-bold text-xs">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="h-8 px-3 bg-brutal-pink text-brutal-black border-2 border-brutal-black font-display font-bold text-xs shadow-brutal-sm hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
