import Link from "next/link";
import { TrendingUp } from "lucide-react";

/**
 * 인증된 사용자용 헤더 컴포넌트
 */
export function Header() {

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6">
        {/* 로고 */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center size-7 rounded-md bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <TrendingUp className="size-4 text-primary" />
          </div>
          <span className="font-bold text-[15px] tracking-tight">InvestLog</span>
        </Link>

      </div>
    </header>
  );
}
