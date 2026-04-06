import Link from "next/link";
import { TrendingUp } from "lucide-react";

/**
 * 인증된 사용자용 헤더
 * Dark financial terminal aesthetic
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
          aria-label="핀로그 홈"
        >
          {/* Logo mark */}
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl
                        bg-primary/12 border border-primary/25
                        group-hover:bg-primary/18 group-hover:border-primary/40
                        transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>

          {/* Brand name */}
          <span className="font-display font-bold text-[17px] tracking-tight text-foreground">
            핀<span className="text-primary">로그</span>
          </span>
        </Link>

        {/* Subtle right spacer — future nav items can go here */}
        <div className="ml-auto" />
      </div>
    </header>
  );
}
